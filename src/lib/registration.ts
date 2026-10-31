import { z } from 'zod';
import { WEEKDAYS, formatClockTime, istToDate } from './time';

// Shared by the registration form (instant feedback) and the API routes (enforcement).

/** Indian mobile: 10 digits starting 6–9, optionally prefixed with +91 / 91 / 0. */
const PHONE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;

export const normalisePhone = (raw: string) => {
  const digits = raw.replace(/[\s()-]/g, '');
  return PHONE_RE.test(digits) ? `+91${digits.slice(-10)}` : null;
};

const name = z
  .string()
  .trim()
  .min(2, { error: 'Please enter your full name.' })
  .max(80, { error: 'Name is too long.' })
  .regex(/^[\p{L}\p{M} .'-]+$/u, { error: 'Please use letters only.' });

const phone = z
  .string()
  .trim()
  .refine((v) => normalisePhone(v) !== null, { error: 'Enter a valid 10-digit Indian mobile number.' })
  .transform((v) => normalisePhone(v)!);

const email = z.string().trim().toLowerCase().max(254).pipe(z.email({ error: 'Enter a valid email address.' }));
const optionalEmail = z.union([z.literal(''), email]).optional().transform((v) => v || null);

const consent = z.literal(true, { error: 'Please agree to continue.' });

const common = {
  name,
  phone,
  consent,
  /** Honeypot: hidden from people, bots fill it in. */
  website: z.string().max(0).optional(),
  turnstileToken: z.string().max(4096).optional(),
};

export const objectId = z.string().regex(/^[a-f0-9]{24}$/, { error: 'Please choose a batch.' });

export const OrderInput = z.object({ ...common, email, batchId: objectId });
export const EnquiryInput = z.object({ ...common, email: optionalEmail, goal: z.enum(['ielts', 'pte']) });
export const WaitlistInput = z.object({ ...common, email, batchId: objectId.optional() });

export type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'consent' | 'batchId' | 'form', string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = (issue.path[0] as keyof FieldErrors | undefined) ?? 'form';
    if (key === ('website' as string)) continue;
    out[key] ??= issue.message;
  }
  return out;
}

// ---------------------------------------------------------------- Batches shown on the website

export type PublicBatch = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  classTime: string;
  durationMinutes: number;
  daysOfWeek: number[];
  priceInr: number;
  maxSeats: number;
  seatsLeft: number;
  started: boolean;
};

export type BatchesResponse = { batches: PublicBatch[]; paymentsEnabled: boolean };

export type OrderResponse = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: 'INR';
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  holdMinutes: number;
};

/** What the browser learns after paying. Deliberately has no Zoom link. */
export type PaymentResult = {
  status: 'paid' | 'pending' | 'cancelled' | 'failed';
  batchName?: string;
  startsAt?: string;
  linkAt?: string | null;
  email?: string;
  message?: string;
};

const fmtDate = (ymd: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' }).format(istToDate(ymd));

/** e.g. "Mon–Fri" or "Mon, Wed, Fri" */
export function formatDays(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b);
  const consecutive = sorted.length > 2 && sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (sorted.length === 7) return 'Every day';
  return consecutive ? `${WEEKDAYS[sorted[0]]}–${WEEKDAYS[sorted.at(-1)!]}` : sorted.map((d) => WEEKDAYS[d]).join(', ');
}

export function describeBatch(b: Pick<PublicBatch, 'startDate' | 'endDate' | 'classTime' | 'durationMinutes' | 'daysOfWeek'>) {
  return {
    dates: `${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}`,
    when: `${formatDays(b.daysOfWeek)} · ${formatClockTime(b.classTime)} IST · ${b.durationMinutes} min`,
  };
}
