import { z } from 'zod';
import { checkPassword } from '@/lib/password-policy';
import { audit } from '@/lib/server/audit';
import { adminApi } from '@/lib/server/auth';
import { Admin } from '@/lib/server/models';
import { hashPassword } from '@/lib/server/password';
import { json } from '@/lib/server/request';

const Body = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, 'Use 3–32 letters, numbers, dots, dashes or underscores.'),
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  role: z.enum(['owner', 'staff']),
  tempPassword: z.string().min(1).max(256),
});

// Owner only: create another admin with a temporary password they must change at first login.
export const POST = adminApi(
  async (req, { doc, meta }) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json(400, { error: 'validation', message: parsed.error.issues[0]?.message ?? 'Invalid input.' });
    const { username, email, role, tempPassword } = parsed.data;

    const check = checkPassword(tempPassword, [username, email]);
    if (!check.ok) return json(400, { error: 'validation', message: `Temporary password: ${check.problems.join(' ')}` });
    if (await Admin.exists({ username })) return json(409, { error: 'exists', message: 'That username is already taken.' });

    const created = await Admin.create({ username, email, role, passwordHash: await hashPassword(tempPassword), mustChangePassword: true });
    await audit(doc, 'admin_created', { target: username, after: { username, email, role }, meta });
    return json(201, { id: String(created._id) });
  },
  { owner: true },
);
