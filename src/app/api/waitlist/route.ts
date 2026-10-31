import { WaitlistInput, fieldErrors } from '@/lib/registration';
import { sendAdminEmail } from '@/lib/server/email';
import { Batch, Waitlist, type BatchDoc } from '@/lib/server/models';
import { CALL_US, publicPost } from '@/lib/server/public-api';
import { json } from '@/lib/server/request';

export async function POST(req: Request) {
  const guard = await publicPost(req, { bucket: 'waitlist', max: 8, windowSeconds: 15 * 60 });
  if (guard.error) return guard.error;

  const parsed = WaitlistInput.safeParse(guard.body);
  if (!parsed.success) return json(400, { error: 'validation', fields: fieldErrors(parsed.error) });
  const { name, phone, email, batchId } = parsed.data;

  try {
    const batch = batchId ? await Batch.findById(batchId, { name: 1 }).lean<BatchDoc>() : null;
    // One entry per email (and batch); joining twice just refreshes the details.
    await Waitlist.updateOne(
      { email, batchId: batch?._id ?? null },
      { $set: { name, phone }, $setOnInsert: { email, batchId: batch?._id ?? null } },
      { upsert: true },
    );
    await sendAdminEmail(`Waitlist: ${name}`, [
      ['Name', name],
      ['Phone', phone],
      ['Email', email],
      ['Batch', batch?.name ?? 'Next available'],
    ]);
  } catch (e) {
    console.error('[waitlist]', e);
    return json(500, { error: 'server', message: `Something went wrong. ${CALL_US}` });
  }
  return json(200, { ok: true });
}
