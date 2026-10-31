import { z } from 'zod';
import { audit } from '@/lib/server/audit';
import { adminApi } from '@/lib/server/auth';
import { Admin } from '@/lib/server/models';
import { verifyPassword } from '@/lib/server/password';
import { isRateLimited } from '@/lib/server/rate-limit';
import { json } from '@/lib/server/request';
import { newBackupCodes, newTotpSecret, verifyTotp } from '@/lib/server/totp';

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('setup') }),
  z.object({ action: z.literal('enable'), code: z.string().trim().max(10) }),
  z.object({ action: z.literal('disable'), password: z.string().min(1).max(256) }),
  z.object({ action: z.literal('regenerate_backup_codes'), password: z.string().min(1).max(256) }),
]);

export const POST = adminApi(async (req, { doc, admin, meta }) => {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: 'validation', message: 'Invalid request.' });
  const body = parsed.data;

  if (await isRateLimited(`mfa-settings:${admin.id}`, 10, 15 * 60)) {
    return json(429, { error: 'rate_limited', message: 'Too many attempts. Please wait 15 minutes.' });
  }

  switch (body.action) {
    case 'setup': {
      if (doc.totpEnabled) return json(400, { error: 'validation', message: 'Two-factor login is already on.' });
      const s = await newTotpSecret(admin.username);
      await Admin.updateOne({ _id: doc._id }, { $set: { totpPendingSecret: s.encrypted } });
      return json(200, { qrDataUrl: s.qrDataUrl, manualKey: s.manualKey });
    }
    case 'enable': {
      if (!doc.totpPendingSecret) return json(400, { error: 'validation', message: 'Start the setup again.' });
      const step = verifyTotp(doc.totpPendingSecret, body.code, admin.username);
      if (step === null) return json(400, { error: 'validation', message: 'That code is not valid. Check your phone’s time and try again.' });
      const { codes, hashes } = newBackupCodes();
      await Admin.updateOne(
        { _id: doc._id },
        { $set: { totpEnabled: true, totpSecret: doc.totpPendingSecret, totpPendingSecret: null, totpLastStep: step, backupCodeHashes: hashes } },
      );
      await audit(doc, 'mfa_enabled', { target: admin.username, meta });
      return json(200, { backupCodes: codes });
    }
    case 'disable':
    case 'regenerate_backup_codes': {
      if (!(await verifyPassword(doc.passwordHash, body.password))) {
        return json(400, { error: 'validation', message: 'Your password is incorrect.' });
      }
      if (body.action === 'disable') {
        await Admin.updateOne({ _id: doc._id }, { $set: { totpEnabled: false, totpSecret: null, totpPendingSecret: null, backupCodeHashes: [] } });
        await audit(doc, 'mfa_disabled', { target: admin.username, meta });
        return json(200, { ok: true });
      }
      const { codes, hashes } = newBackupCodes();
      await Admin.updateOne({ _id: doc._id }, { $set: { backupCodeHashes: hashes } });
      await audit(doc, 'mfa_backup_codes_regenerated', { target: admin.username, meta });
      return json(200, { backupCodes: codes });
    }
  }
});
