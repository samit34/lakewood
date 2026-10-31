import 'server-only';
import type { Types } from 'mongoose';
import type { PublicBatch } from '@/lib/registration';
import { istToDate, istToday } from '@/lib/time';
import { connectDb } from './db';
import { Batch, Registration, type BatchDoc } from './models';

/** How long a seat stays reserved while the student completes Razorpay checkout. */
export const HOLD_MINUTES = 15;

/** Batches that accept new students: open and not finished. Late joiners are allowed until the end date. */
export const enrollableFilter = () => ({ status: 'open', endDate: { $gte: istToday() } });

export function toPublicBatch(b: BatchDoc): PublicBatch {
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
    seatsLeft: Math.max(0, b.maxSeats - (b.seatsTaken ?? 0)),
    started: istToDate(b.startDate, b.classTime).getTime() <= Date.now(),
  };
}

export async function listEnrollableBatches() {
  await connectDb();
  await releaseExpiredHolds();
  const rows = await Batch.find(enrollableFilter()).sort({ startDate: 1, classTime: 1 }).lean<BatchDoc[]>();
  return rows.map(toPublicBatch);
}

/** Atomically reserves one seat. Returns null when the batch is full, closed or finished. */
export async function takeSeat(batchId: string | Types.ObjectId) {
  return Batch.findOneAndUpdate(
    { _id: batchId, ...enrollableFilter(), $expr: { $lt: ['$seatsTaken', '$maxSeats'] } },
    { $inc: { seatsTaken: 1 } },
    { returnDocument: 'after' },
  ).lean<BatchDoc>();
}

export async function releaseSeat(batchId: string | Types.ObjectId) {
  await Batch.updateOne({ _id: batchId, seatsTaken: { $gt: 0 } }, { $inc: { seatsTaken: -1 } });
}

/**
 * Gives back seats held by checkouts that were never paid. Each registration is flipped with a
 * conditional update, so a seat is released exactly once even if several requests run this together.
 */
export async function releaseExpiredHolds(limit = 100) {
  const now = new Date();
  const expired = await Registration.find({ status: 'pending', holdExpiresAt: { $lt: now } }, { _id: 1 }).limit(limit).lean();
  let released = 0;
  for (const { _id } of expired) {
    const reg = await Registration.findOneAndUpdate(
      { _id, status: 'pending', holdExpiresAt: { $lt: now } },
      { $set: { status: 'cancelled', holdExpiresAt: null } },
    ).lean();
    if (reg) {
      await releaseSeat(reg.batchId);
      released++;
    }
  }
  return released;
}
