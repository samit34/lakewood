import 'server-only';
import { site } from '@/config/site';
import { describeBatch, type PaymentResult } from '@/lib/registration';
import { formatIst, istToDate } from '@/lib/time';
import { audit } from './audit';
import { connectDb } from './db';
import { esc, layout, sendAdminEmail, sendEmail } from './email';
import { env } from './env';
import { Batch, Registration, type BatchDoc, type RegistrationDoc } from './models';

/** Access runs from the batch's first day to the end of its last class (IST). */
export function accessWindow(b: Pick<BatchDoc, 'startDate' | 'endDate' | 'classTime' | 'durationMinutes'>) {
  const end = istToDate(b.endDate, b.classTime);
  return { accessStart: istToDate(b.startDate), accessEnd: new Date(end.getTime() + b.durationMinutes * 60_000) };
}

/** When the personal Zoom link is sent: N hours before the first class, or right away once that time has passed. */
export function linkSendTime(b: Pick<BatchDoc, 'startDate' | 'classTime'>) {
  const at = istToDate(b.startDate, b.classTime).getTime() - env.zoomRegisterHoursBefore * 3_600_000;
  return at > Date.now() ? new Date(at) : null;
}

export function summarise(reg: RegistrationDoc, batch: BatchDoc | null): PaymentResult {
  const paid = ['paid', 'scheduled', 'active', 'zoom_failed', 'expired', 'removed'].includes(reg.status);
  if (!paid) return { status: reg.status === 'cancelled' ? 'cancelled' : 'pending' };
  return {
    status: 'paid',
    batchName: batch?.name,
    startsAt: batch ? istToDate(batch.startDate, batch.classTime).toISOString() : undefined,
    linkAt: batch ? (linkSendTime(batch)?.toISOString() ?? null) : null,
    email: reg.email,
  };
}

/**
 * Marks a Razorpay order as paid. Safe to call any number of times and from both the checkout
 * callback and the webhook: only the first call changes anything and sends emails.
 */
export async function markPaid(input: { orderId: string; paymentId: string; amountPaise?: number; source: 'checkout' | 'webhook' }) {
  await connectDb();
  const reg = await Registration.findOne({ razorpayOrderId: input.orderId }).lean<RegistrationDoc>();
  if (!reg) return { ok: false as const, reason: 'unknown_order' };

  if (input.amountPaise !== undefined && input.amountPaise !== reg.amountPaise) {
    await audit('system', 'payment_amount_mismatch', { target: reg.email, after: { ...input, expected: reg.amountPaise } });
    return { ok: false as const, reason: 'amount_mismatch' };
  }

  const batch = await Batch.findById(reg.batchId).lean<BatchDoc>();
  if (!batch) return { ok: false as const, reason: 'batch_missing' };

  const before = await Registration.findOneAndUpdate(
    { _id: reg._id, status: { $in: ['pending', 'cancelled'] } },
    { $set: { status: 'paid', razorpayPaymentId: input.paymentId, paidAt: new Date(), holdExpiresAt: null, paymentError: null, ...accessWindow(batch) } },
  ).lean<RegistrationDoc>();

  const latest = (await Registration.findById(reg._id).lean<RegistrationDoc>())!;
  if (!before) return { ok: true as const, firstTime: false, summary: summarise(latest, batch) };

  // The hold had expired and its seat was given back, but the student still paid: take the seat again.
  if (before.status === 'cancelled') {
    const res = await Batch.findOneAndUpdate({ _id: batch._id }, { $inc: { seatsTaken: 1 } }, { returnDocument: 'after' }).lean<BatchDoc>();
    if (res && res.seatsTaken > res.maxSeats) {
      await audit('system', 'batch_overbooked', { target: batch.name, after: { seatsTaken: res.seatsTaken, maxSeats: res.maxSeats, email: reg.email } });
    }
  }

  await audit('system', 'payment_received', {
    target: `${reg.email} – ${batch.name}`,
    after: { orderId: input.orderId, paymentId: input.paymentId, amountInr: reg.amountPaise / 100, source: input.source },
  });

  await sendPaymentEmails(latest, batch);
  return { ok: true as const, firstTime: true, summary: summarise(latest, batch) };
}

async function sendPaymentEmails(reg: RegistrationDoc, batch: BatchDoc) {
  const { dates, when } = describeBatch(batch);
  const linkAt = linkSendTime(batch);
  const linkLine = linkAt
    ? `Your personal Zoom link will be emailed to you on ${formatIst(linkAt)} IST, ${env.zoomRegisterHoursBefore} hours before the first class.`
    : 'Your personal Zoom link will arrive in a separate email within a few minutes.';
  const amount = `₹${reg.amountPaise / 100}`;

  const sent = await sendEmail({
    to: reg.email,
    replyTo: site.contact.email,
    subject: `You're registered: ${batch.name}`,
    text: [
      `Hi ${reg.name},`,
      '',
      `We've received your payment of ${amount}. Your seat in the ${batch.name} batch is confirmed.`,
      '',
      `Dates: ${dates}`,
      `Classes: ${when}`,
      `Payment ID: ${reg.razorpayPaymentId}`,
      '',
      linkLine,
      'The link is personal to you – please do not share it.',
      '',
      `Questions? Call ${site.contact.phone} or reply to this email.`,
      '',
      site.name,
    ].join('\n'),
    html: layout(
      'Payment received – you’re registered!',
      `<p>Hi ${esc(reg.name)},</p>
<p>We've received your payment of <b>${esc(amount)}</b>. Your seat in the <b>${esc(batch.name)}</b> batch is confirmed.</p>
<table style="font-size:14px;border-collapse:collapse;margin:12px 0">
<tr><td style="padding:3px 12px 3px 0;color:#64748b">Dates</td><td><b>${esc(dates)}</b></td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#64748b">Classes</td><td><b>${esc(when)}</b></td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#64748b">Payment ID</td><td>${esc(reg.razorpayPaymentId ?? '')}</td></tr>
</table>
<p style="background:#f7fee7;border-left:4px solid #c6f432;padding:10px 12px">${esc(linkLine)}<br/>The link is personal to you – please do not share it.</p>
<p>Questions? Call <b>${esc(site.contact.phone)}</b> or reply to this email.</p>`,
    ),
  });
  if (sent) await Registration.updateOne({ _id: reg._id }, { $set: { lastEmailSentAt: new Date() } });

  await sendAdminEmail(`New registration: ${reg.name} – ${batch.name}`, [
    ['Name', reg.name],
    ['Phone', reg.phone],
    ['Email', reg.email],
    ['Batch', batch.name],
    ['Amount', amount],
    ['Payment ID', reg.razorpayPaymentId ?? ''],
    ['Seats taken', `${batch.seatsTaken} / ${batch.maxSeats}`],
  ]);
}
