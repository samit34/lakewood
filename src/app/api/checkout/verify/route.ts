import { z } from 'zod';
import { audit } from '@/lib/server/audit';
import { connectDb } from '@/lib/server/db';
import { Registration } from '@/lib/server/models';
import { markPaid } from '@/lib/server/payments';
import { CALL_US } from '@/lib/server/public-api';
import { capturePayment, fetchPayment, verifyCheckoutSignature } from '@/lib/server/razorpay';
import { isRateLimited } from '@/lib/server/rate-limit';
import { isSameOrigin, json, metaFrom } from '@/lib/server/request';

const Body = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

/**
 * Called by the browser after Razorpay checkout succeeds. The signature proves the payment belongs
 * to our order; the payment is then confirmed with Razorpay's API before the seat is marked paid.
 * The response never contains a Zoom link: that is only ever sent by email.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json(403, { error: 'forbidden' });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, { error: 'validation', message: 'Invalid payment details.' });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;
  const meta = metaFrom(req.headers);

  await connectDb();
  if (await isRateLimited(`verify:ip:${meta.ip}`, 20, 15 * 60)) return json(429, { error: 'rate_limited', message: CALL_US });

  if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
    await audit('system', 'payment_signature_invalid', { target: orderId, after: { paymentId }, meta });
    return json(400, { error: 'signature', message: `We couldn't verify this payment. ${CALL_US}` });
  }

  const reg = await Registration.findOne({ razorpayOrderId: orderId }, { amountPaise: 1 }).lean();
  if (!reg) return json(404, { error: 'unknown_order', message: CALL_US });

  try {
    let payment = await fetchPayment(paymentId);
    if (payment.order_id !== orderId) return json(400, { error: 'mismatch', message: CALL_US });
    // Accounts with manual capture: capture now so the money is actually collected.
    if (payment.status === 'authorized') payment = await capturePayment(paymentId, reg.amountPaise);
    if (payment.status !== 'captured') {
      return json(202, { status: 'pending', message: 'Your payment is being confirmed. This page will update in a moment.' });
    }
    const result = await markPaid({ orderId, paymentId, amountPaise: payment.amount, source: 'checkout' });
    if (!result.ok) return json(400, { error: result.reason, message: CALL_US });
    return json(200, result.summary);
  } catch (e) {
    console.error('[verify]', e instanceof Error ? e.message : e);
    // The webhook will still confirm the payment; the browser falls back to polling /api/checkout/status.
    return json(202, { status: 'pending', message: 'Your payment is being confirmed. This page will update in a moment.' });
  }
}
