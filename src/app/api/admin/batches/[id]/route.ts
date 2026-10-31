import { isValidObjectId } from 'mongoose';
import { BatchInput } from '@/lib/batch';
import { audit } from '@/lib/server/audit';
import { adminApi } from '@/lib/server/auth';
import { findOverlaps, serializeBatch } from '@/lib/server/batches';
import { Batch, Registration, type BatchDoc } from '@/lib/server/models';
import { json } from '@/lib/server/request';

export const PATCH = adminApi<{ id: string }>(async (req, { doc, meta }, { id }) => {
  if (!isValidObjectId(id)) return json(404, { error: 'not_found' });
  const parsed = BatchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json(400, { error: 'validation', field: issue?.path[0], message: issue?.message ?? 'Invalid input.' });
  }
  const b = parsed.data;
  const existing = await Batch.findById(id).lean<BatchDoc>();
  if (!existing) return json(404, { error: 'not_found' });

  if (b.maxSeats < (existing.seatsTaken ?? 0)) {
    return json(400, { error: 'validation', field: 'maxSeats', message: `${existing.seatsTaken} seats are already taken; seats can't go below that.` });
  }
  if (b.zoomMeetingId && (await Batch.exists({ 'zoom.meetingId': b.zoomMeetingId, _id: { $ne: existing._id } }))) {
    return json(409, { error: 'validation', field: 'zoomMeetingId', message: 'Another batch already uses this Zoom meeting. Each batch needs its own meeting.' });
  }

  const before = serializeBatch(existing);
  const updated = await Batch.findByIdAndUpdate(
    id,
    {
      $set: {
        name: b.name,
        startDate: b.startDate,
        endDate: b.endDate,
        classTime: b.classTime,
        durationMinutes: b.durationMinutes,
        daysOfWeek: [...new Set(b.daysOfWeek)].sort(),
        priceInr: b.priceInr,
        maxSeats: b.maxSeats,
        status: b.status,
        'zoom.meetingId': b.zoomMeetingId || null,
      },
    },
    { returnDocument: 'after' },
  ).lean<BatchDoc>();
  const after = serializeBatch(updated!);
  await audit(doc, 'batch_updated', { target: `${after.name} (${after.id})`, before, after, meta });
  return json(200, { batch: after, overlaps: await findOverlaps(b, existing._id) });
});

export const DELETE = adminApi<{ id: string }>(async (_req, { doc, meta }, { id }) => {
  if (!isValidObjectId(id)) return json(404, { error: 'not_found' });
  const existing = await Batch.findById(id).lean<BatchDoc>();
  if (!existing) return json(404, { error: 'not_found' });
  if (await Registration.exists({ batchId: existing._id })) {
    return json(400, { error: 'validation', message: 'This batch has registrations, so it can’t be deleted. Set its status to Closed instead.' });
  }
  await Batch.deleteOne({ _id: existing._id });
  await audit(doc, 'batch_deleted', { target: `${existing.name} (${id})`, before: serializeBatch(existing), meta });
  return json(200, { ok: true });
});
