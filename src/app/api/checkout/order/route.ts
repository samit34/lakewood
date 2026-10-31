import { site } from '@/config/site';
import { OrderInput, fieldErrors, type OrderResponse } from '@/lib/registration';
import { audit } from '@/lib/server/audit';
import { env } from '@/lib/server/env';
import { Batch, PAID_STATUSES, Registration, type BatchDoc, type RegistrationDoc } from '@/lib/server/models';
import { CALL_US, publicPost } from '@/lib/server/public-api';
import { createOrder } from '@/lib/server/razorpay';
import { isRateLimited } from '@/lib/server/rate-limit';
import { json } from '@/lib/server/request';
import { HOLD_MINUTES, enrollableFilter, releaseExpiredHolds, releaseSeat, takeSeat } from '@/lib/server/seats';

/**
 * Starts checkout: reserves a seat for HOLD_MINUTES and creates a Razorpay order for the batch's
 * price as stored in the database. The browser never decides the amount.
 */
export async function POST(req: Request) {
  const guard = await publicPost(req, { bucket: 'order', max: 10, windowSeconds: 15 * 60 });
  if (guard.error) return guard.error;

  const parsed = OrderInput.safeParse(guard.body);
  if (!parsed.success) return json(400, { error: 'validation', fields: fieldErrors(parsed.error) });
  const { name, phone, email, batchId } = parsed.data;

  if (!env.razorpayConfigured) {
    return json(503, { error: 'payments_off', message: `Online payment isn't switched on yet. Please call ${site.contact.phone} to reserve your seat.` });
  }
  if (await isRateLimited(`order:email:${email}`, 6, 60 * 60)) {
    return json(429, { error: 'rate_limited', message: `Too many attempts for this email. ${CALL_US}` });
  }

  await releaseExpiredHolds();
  const batch = await Batch.findOne({ _id: batchId, ...enrollableFilter() }).lean<BatchDoc>();
  if (!batch) return json(409, { error: 'batch_unavailable', message: 'This batch is no longer taking registrations. Please choose another batch.' });

  const paid = await Registration.exists({ batchId: batch._id, email, status: { $in: PAID_STATUSES } });
  if (paid) {
    return json(409, {
      error: 'already_registered',
      message: `This email is already registered for this batch – check your inbox (and spam folder) for the confirmation. Need help? Call ${site.contact.phone}.`,
    });
  }

  const respond = (reg: RegistrationDoc, orderId: string): Response => {
    const body: OrderResponse = {
      keyId: env.razorpayKeyId,
      orderId,
      amount: reg.amountPaise,
      currency: 'INR',
      name: site.name,
      description: batch.name,
      prefill: { name: reg.name, email: reg.email, contact: reg.phone },
      holdMinutes: HOLD_MINUTES,
    };
    return json(200, body);
  };

  // Re-opened checkout (closed the popup, double click): reuse the live hold instead of taking a second seat.
  const open = await Registration.findOneAndUpdate(
    { batchId: batch._id, email, status: 'pending', holdExpiresAt: { $gt: new Date() }, razorpayOrderId: { $type: 'string' } },
    { $set: { name, phone } },
    { returnDocument: 'after' },
  ).lean<RegistrationDoc>();
  if (open?.razorpayOrderId) return respond(open, open.razorpayOrderId);

  const seat = await takeSeat(batch._id);
  if (!seat) return json(409, { error: 'full', message: 'Sorry, this batch just filled up. Join the waitlist and we’ll contact you for the next batch.' });

  const reg = await Registration.create({
    batchId: batch._id,
    name,
    phone,
    email,
    status: 'pending',
    amountPaise: Math.round(batch.priceInr * 100),
    holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
  });

  try {
    const order = await createOrder({
      amountPaise: reg.amountPaise,
      receipt: String(reg._id),
      notes: { registrationId: String(reg._id), batchId: String(batch._id), batch: batch.name.slice(0, 200) },
    });
    reg.razorpayOrderId = order.id;
    await reg.save();
    return respond(reg.toObject() as RegistrationDoc, order.id);
  } catch (e) {
    await Registration.deleteOne({ _id: reg._id });
    await releaseSeat(batch._id);
    const message = e instanceof Error ? e.message : String(e);
    console.error('[order]', message);
    await audit('system', 'razorpay_order_failed', { target: email, after: { error: message }, meta: guard.meta });
    return json(502, { error: 'gateway', message: `We couldn't start the payment. ${CALL_US}` });
  }
}
