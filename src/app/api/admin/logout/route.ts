import { audit } from '@/lib/server/audit';
import { endSession, getCurrentAdmin } from '@/lib/server/auth';
import { isSameOrigin, json, metaFrom } from '@/lib/server/request';

// Same-origin check only (no CSRF token needed): logging out must work even if the session already expired.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json(403, { error: 'forbidden' });
  const current = await getCurrentAdmin();
  await endSession();
  if (current) await audit(current.doc, 'logout', { target: current.admin.username, meta: metaFrom(req.headers) });
  return json(200, { ok: true });
}
