import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { checkPassword } from '@/lib/password-policy';
import { audit } from '@/lib/server/audit';
import { adminApi, endAllSessions } from '@/lib/server/auth';
import { Admin, type AdminDoc } from '@/lib/server/models';
import { hashPassword } from '@/lib/server/password';
import { json } from '@/lib/server/request';

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('reset_password'), tempPassword: z.string().min(1).max(256) }),
  z.object({ action: z.literal('unlock') }),
  z.object({ action: z.literal('reset_mfa') }),
  z.object({ action: z.literal('set_role'), role: z.enum(['owner', 'staff']) }),
  z.object({ action: z.literal('set_disabled'), disabled: z.boolean() }),
]);

// Owner only: manage another admin account.
export const PATCH = adminApi<{ id: string }>(
  async (req, { doc, admin, meta }, { id }) => {
    if (!isValidObjectId(id)) return json(404, { error: 'not_found' });
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json(400, { error: 'validation', message: 'Invalid request.' });
    const body = parsed.data;

    const target = await Admin.findById(id).lean<AdminDoc>();
    if (!target) return json(404, { error: 'not_found' });
    if (String(target._id) === admin.id) {
      return json(400, { error: 'validation', message: 'Use Settings to change your own account.' });
    }
    if (target.role === 'owner' && (body.action === 'set_role' || (body.action === 'set_disabled' && body.disabled))) {
      const otherOwners = await Admin.countDocuments({ role: 'owner', disabled: { $ne: true }, _id: { $ne: target._id } });
      if (otherOwners === 0) return json(400, { error: 'validation', message: 'There must always be at least one active owner.' });
    }

    let update: Record<string, unknown>;
    let logout = false;
    switch (body.action) {
      case 'reset_password': {
        const check = checkPassword(body.tempPassword, [target.username, target.email]);
        if (!check.ok) return json(400, { error: 'validation', message: `Temporary password: ${check.problems.join(' ')}` });
        update = { passwordHash: await hashPassword(body.tempPassword), mustChangePassword: true, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() };
        logout = true;
        break;
      }
      case 'unlock':
        update = { failedAttempts: 0, lockedUntil: null };
        break;
      case 'reset_mfa':
        update = { totpEnabled: false, totpSecret: null, totpPendingSecret: null, backupCodeHashes: [] };
        break;
      case 'set_role':
        update = { role: body.role };
        break;
      case 'set_disabled':
        update = { disabled: body.disabled };
        logout = body.disabled;
        break;
    }

    await Admin.updateOne({ _id: target._id }, { $set: update });
    if (logout) await endAllSessions(target._id);
    await audit(doc, `admin_${body.action}`, {
      target: target.username,
      before: body.action === 'set_role' ? { role: target.role } : body.action === 'set_disabled' ? { disabled: !!target.disabled } : null,
      after: body.action === 'set_role' ? { role: body.role } : body.action === 'set_disabled' ? { disabled: body.disabled } : null,
      meta,
    });
    return json(200, { ok: true });
  },
  { owner: true },
);
