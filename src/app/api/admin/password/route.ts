import { z } from 'zod';
import { checkPassword } from '@/lib/password-policy';
import { audit } from '@/lib/server/audit';
import { adminApi, endAllSessions, startSession } from '@/lib/server/auth';
import { Admin } from '@/lib/server/models';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { isRateLimited } from '@/lib/server/rate-limit';
import { json } from '@/lib/server/request';

const Body = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(1).max(256) });

export const POST = adminApi(
  async (req, { doc, admin, meta }) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json(400, { error: 'validation', message: 'Please fill in both fields.' });
    const { currentPassword, newPassword } = parsed.data;

    if (await isRateLimited(`pwchange:${admin.id}`, 5, 15 * 60)) {
      return json(429, { error: 'rate_limited', message: 'Too many attempts. Please wait 15 minutes.' });
    }
    if (!(await verifyPassword(doc.passwordHash, currentPassword))) {
      await audit(doc, 'password_change_failed', { target: admin.username, meta });
      return json(400, { error: 'validation', field: 'currentPassword', message: 'Your current password is incorrect.' });
    }
    if (currentPassword === newPassword) {
      return json(400, { error: 'validation', field: 'newPassword', message: 'Choose a password different from your current one.' });
    }
    const check = checkPassword(newPassword, [admin.username, admin.email]);
    if (!check.ok) return json(400, { error: 'validation', field: 'newPassword', message: check.problems.join(' ') });

    await Admin.updateOne(
      { _id: doc._id },
      { $set: { passwordHash: await hashPassword(newPassword), mustChangePassword: false, passwordChangedAt: new Date() } },
    );
    // Sign out every session (including other devices), then issue a fresh one for this browser.
    await endAllSessions(doc._id);
    await startSession(doc._id, 'full', meta);
    await audit(doc, 'password_changed', { target: admin.username, meta });
    return json(200, { ok: true });
  },
  { allowMustChangePassword: true },
);
