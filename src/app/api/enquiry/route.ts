import { EnquiryInput, fieldErrors } from '@/lib/registration';
import { sendAdminEmail } from '@/lib/server/email';
import { Enquiry } from '@/lib/server/models';
import { CALL_US, publicPost } from '@/lib/server/public-api';
import { json } from '@/lib/server/request';

/** IELTS / PTE coaching enquiries: saved for the team to call back, and emailed to the admin. */
export async function POST(req: Request) {
  const guard = await publicPost(req, { bucket: 'enquiry', max: 8, windowSeconds: 15 * 60 });
  if (guard.error) return guard.error;

  const parsed = EnquiryInput.safeParse(guard.body);
  if (!parsed.success) return json(400, { error: 'validation', fields: fieldErrors(parsed.error) });
  const { name, phone, email, goal } = parsed.data;

  try {
    await Enquiry.create({ name, phone, email, goal });
  } catch (e) {
    console.error('[enquiry]', e);
    return json(500, { error: 'server', message: `Something went wrong. ${CALL_US}` });
  }
  await sendAdminEmail(`New ${goal.toUpperCase()} enquiry: ${name}`, [
    ['Name', name],
    ['Phone', phone],
    ['Email', email ?? '—'],
    ['Interested in', goal.toUpperCase()],
  ]);
  return json(200, { ok: true });
}
