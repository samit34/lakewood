import { z } from 'zod';
import { audit } from '@/lib/server/audit';
import { startSession } from '@/lib/server/auth';
import { connectDb } from '@/lib/server/db';
import { Admin, type AdminDoc } from '@/lib/server/models';
import { verifyPassword } from '@/lib/server/password';
import { clearRateLimit, isRateLimited } from '@/lib/server/rate-limit';
import { isSameOrigin, json, metaFrom } from '@/lib/server/request';

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const INVALID = { error: 'invalid', message: 'Invalid username or password.' };
const TOO_MANY = { error: 'rate_limited', message: 'Too many attempts. Please wait 15 minutes and try again.' };

const Body = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json(403, { error: 'forbidden' });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, INVALID);
  const { username, password } = parsed.data;
  const meta = metaFrom(req.headers);

  await connectDb();
  // Both limits apply whether or not the username exists, so responses never reveal valid usernames.
  if ((await isRateLimited(`login:ip:${meta.ip}`, 20, 15 * 60)) || (await isRateLimited(`login:user:${username}`, MAX_FAILS, 15 * 60))) {
    return json(429, TOO_MANY);
  }

  const admin = await Admin.findOne({ username }).lean<AdminDoc>();
  const passwordOk = await verifyPassword(admin?.passwordHash, password);
  const locked = !!admin?.lockedUntil && admin.lockedUntil.getTime() > Date.now();

  if (!admin || admin.disabled || !passwordOk || locked) {
    if (admin && !locked) {
      const fails = (admin.failedAttempts ?? 0) + 1;
      await Admin.updateOne(
        { _id: admin._id },
        fails >= MAX_FAILS ? { $set: { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } } : { $set: { failedAttempts: fails } },
      );
      if (fails >= MAX_FAILS) await audit(admin, 'account_locked', { target: username, meta });
    }
    await audit('system', 'login_failed', { target: username, meta });
    return locked ? json(429, TOO_MANY) : json(401, INVALID);
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { failedAttempts: 0, lockedUntil: null } });
  await clearRateLimit(`login:user:${username}`);

  if (admin.totpEnabled && admin.totpSecret) {
    await startSession(admin._id, 'mfa', meta);
    return json(200, { mfa: true });
  }

  await startSession(admin._id, 'full', meta);
  await Admin.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
  await audit(admin, 'login_success', { target: username, meta });
  return json(200, { ok: true });
}
