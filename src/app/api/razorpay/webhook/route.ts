import { audit } from '@/lib/server/audit';
import { sha256 } from '@/lib/server/crypto';
import { connectDb } from '@/lib/server/db';
import { env } from '@/lib/server/env';
import { Registration, WebhookEvent } from '@/lib/server/models';
import { markPaid } from '@/lib/server/payments';
import { verifyWebhookSignature, type RazorpayPayment } from '@/lib/server/razorpay';
import { json } from '@/lib/server/request';

type WebhookBody = {
  event: string;
  payload?: { payment?: { entity?: RazorpayPayment } };
};

/**
 * Razorpay → us. Confirms payments even if the student closed the browser before the checkout
 * callback ran. Configure in Razorpay Dashboard → Webhooks with events payment.captured,
 * order.paid and payment.failed.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  if (!env.razorpayWebhookConfigured) return json(503, { error: 'webhook_secret_missing' });
  if (!signature || !verifyWebhookSignature(raw, signature)) return json(400, { error: 'invalid_signature' });

  const body = JSON.parse(raw) as WebhookBody;
  const eventId = req.headers.get('x-razorpay-event-id') || sha256(raw);

  await connectDb();
  if (await WebhookEvent.exists({ eventId })) return json(200, { ok: true, duplicate: true });

  const payment = body.payload?.payment?.entity;
  if (payment?.order_id) {
    if ((body.event === 'payment.captured' || body.event === 'order.paid') && payment.status === 'captured') {
      const result = await markPaid({ orderId: payment.order_id, paymentId: payment.id, amountPaise: payment.amount, source: 'webhook' });
      // Unknown orders (e.g. payments from another site on the same account) are acknowledged and ignored.
      if (!result.ok && result.reason !== 'unknown_order') return json(500, { error: result.reason });
    } else if (body.event === 'payment.failed') {
      const reason = (payment.error_description ?? 'Payment failed').slice(0, 300);
      const reg = await Registration.findOneAndUpdate({ razorpayOrderId: payment.order_id, status: 'pending' }, { $set: { paymentError: reason } }).lean();
      if (reg) await audit('system', 'payment_failed', { target: reg.email, after: { orderId: payment.order_id, paymentId: payment.id, reason } });
    }
  }

  await WebhookEvent.create({ eventId, type: body.event }).catch(() => {});
  return json(200, { ok: true });
}
