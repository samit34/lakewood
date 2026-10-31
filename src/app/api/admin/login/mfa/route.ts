import { z } from 'zod';
import { audit } from '@/lib/server/audit';
import { MFA_COOKIE, endSession, getMfaSession, startSession } from '@/lib/server/auth';
import { sha256 } from '@/lib/server/crypto';
import { connectDb } from '@/lib/server/db';
import { Admin } from '@/lib/server/models';
import { isRateLimited } from '@/lib/server/rate-limit';
import { isSameOrigin, json, metaFrom } from '@/lib/server/request';
import { normaliseBackupCode, verifyTotp } from '@/lib/server/totp';

const Body = z.object({ code: z.string().trim().min(6).max(20) });
const INVALID = { error: 'invalid', message: 'That code is not valid. Please try again.' };

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json(403, { error: 'forbidden' });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, INVALID);
  const meta = metaFrom(req.headers);

  await connectDb();
  const pending = await getMfaSession();
  if (!pending) return json(401, { error: 'expired', message: 'Your sign-in expired. Please enter your password again.' });
  const { admin, session } = pending;

  if ((await isRateLimited(`mfa:${session._id}`, 5, 5 * 60)) || (await isRateLimited(`login:ip:${meta.ip}`, 20, 15 * 60))) {
    await endSession(MFA_COOKIE);
    return json(429, { error: 'rate_limited', message: 'Too many attempts. Please sign in again.' });
  }

  const code = parsed.data.code.replace(/\s/g, '');
  let method: 'totp' | 'backup_code' | null = null;

  const step = admin.totpSecret ? verifyTotp(admin.totpSecret, code, admin.username, admin.totpLastStep ?? 0) : null;
  if (step !== null) {
    // Conditional update: a code can only be accepted once, even with concurrent requests
    const res = await Admin.updateOne({ _id: admin._id, totpLastStep: { $lt: step } }, { $set: { totpLastStep: step } });
    if (res.modifiedCount === 1) method = 'totp';
  } else {
    const backup = normaliseBackupCode(code);
    if (backup) {
      const res = await Admin.updateOne({ _id: admin._id, backupCodeHashes: sha256(backup) }, { $pull: { backupCodeHashes: sha256(backup) } });
      if (res.modifiedCount === 1) method = 'backup_code';
    }
  }

  if (!method) {
    await audit(admin, 'login_mfa_failed', { target: admin.username, meta });
    return json(401, INVALID);
  }

  await endSession(MFA_COOKIE);
  await startSession(admin._id, 'full', meta);
  await Admin.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
  await audit(admin, 'login_success', { target: admin.username, after: { method }, meta });
  return json(200, { ok: true });
}
