import { BatchInput } from '@/lib/batch';
import { audit } from '@/lib/server/audit';
import { adminApi } from '@/lib/server/auth';
import { findOverlaps, serializeBatch } from '@/lib/server/batches';
import { Batch, type BatchDoc } from '@/lib/server/models';
import { json } from '@/lib/server/request';

export const POST = adminApi(async (req, { doc, meta }) => {
  const parsed = BatchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json(400, { error: 'validation', field: issue?.path[0], message: issue?.message ?? 'Invalid input.' });
  }
  const b = parsed.data;
  if (b.zoomMeetingId && (await Batch.exists({ 'zoom.meetingId': b.zoomMeetingId }))) {
    return json(409, { error: 'validation', field: 'zoomMeetingId', message: 'Another batch already uses this Zoom meeting. Each batch needs its own meeting.' });
  }

  // Automatic Zoom meeting creation is connected in step 5; until then the meeting ID is entered manually.
  const created = await Batch.create({
    name: b.name,
    startDate: b.startDate,
    endDate: b.endDate,
    classTime: b.classTime,
    durationMinutes: b.durationMinutes,
    daysOfWeek: [...new Set(b.daysOfWeek)].sort(),
    priceInr: b.priceInr,
    maxSeats: b.maxSeats,
    status: b.status,
    zoom: { meetingId: b.zoomMeetingId || null },
  });
  const view = serializeBatch(created.toObject() as BatchDoc);
  await audit(doc, 'batch_created', { target: `${view.name} (${view.id})`, after: view, meta });
  return json(201, { batch: view, overlaps: await findOverlaps(b, created._id) });
});
