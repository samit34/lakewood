import { z } from 'zod';

// Shared by the admin batch form (browser) and the batch API (server).

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.');

export const BatchInput = z
  .object({
    name: z.string().trim().min(3, 'Give the batch a name (min 3 characters).').max(80),
    startDate: date,
    endDate: date,
    classTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Pick a class time.'),
    durationMinutes: z.coerce.number().int().min(15, 'At least 15 minutes.').max(300, 'At most 300 minutes.'),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Pick at least one class day.'),
    priceInr: z.coerce.number().int().min(1, 'Price must be at least ₹1.').max(100000),
    maxSeats: z.coerce.number().int().min(1, 'At least 1 seat.').max(1000, 'At most 1000 seats.'),
    status: z.enum(['draft', 'open', 'closed']),
    zoomMeetingId: z
      .string()
      .trim()
      .transform((v) => v.replace(/\s/g, ''))
      .refine((v) => v === '' || /^\d{9,12}$/.test(v), 'A Zoom meeting ID is 9–12 digits.'),
    createZoomMeeting: z.boolean(),
  })
  .refine((b) => b.endDate >= b.startDate, { path: ['endDate'], message: 'End date must be on or after the start date.' });

export type BatchInputType = z.infer<typeof BatchInput>;

export type BatchTiming = { startDate: string; endDate: string; classTime: string; durationMinutes: number; daysOfWeek: number[] };

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** True if both batches have a class on the same day at overlapping times (one Zoom host can't run both). */
export function batchesOverlap(a: BatchTiming, b: BatchTiming) {
  if (a.endDate < b.startDate || b.endDate < a.startDate) return false;
  if (!a.daysOfWeek.some((d) => b.daysOfWeek.includes(d))) return false;
  const a0 = minutes(a.classTime);
  const b0 = minutes(b.classTime);
  return a0 < b0 + b.durationMinutes && b0 < a0 + a.durationMinutes;
}
