import 'server-only';
import type { Types } from 'mongoose';
import { batchesOverlap, type BatchTiming } from '@/lib/batch';
import { Batch, type BatchDoc } from './models';

/** Names of active batches whose class times clash with this one. */
export async function findOverlaps(timing: BatchTiming, excludeId?: Types.ObjectId | string) {
  const others = await Batch.find({ status: { $ne: 'closed' }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).lean<BatchDoc[]>();
  return others.filter((o) => batchesOverlap(timing, o)).map((o) => o.name);
}

/** Plain, serialisable batch for pages and client components. */
export function serializeBatch(b: BatchDoc) {
  return {
    id: String(b._id),
    name: b.name,
    startDate: b.startDate,
    endDate: b.endDate,
    classTime: b.classTime,
    durationMinutes: b.durationMinutes,
    daysOfWeek: b.daysOfWeek,
    priceInr: b.priceInr,
    maxSeats: b.maxSeats,
    seatsTaken: b.seatsTaken ?? 0,
    status: b.status as 'draft' | 'open' | 'closed',
    zoomMeetingId: b.zoom?.meetingId ?? '',
    zoomCreatedAutomatically: !!b.zoom?.createdAutomatically,
  };
}
export type BatchView = ReturnType<typeof serializeBatch>;
