import { connection } from 'next/server';
import { connectDb } from '@/lib/server/db';
import { Batch, Registration, type BatchDoc, type RegistrationDoc } from '@/lib/server/models';
import { summarise } from '@/lib/server/payments';
import { isRateLimited } from '@/lib/server/rate-limit';
import { json, metaFrom } from '@/lib/server/request';

/** Polled by the browser while waiting for the webhook to confirm a payment. Returns status only. */
export async function GET(req: Request) {
  await connection();
  const orderId = new URL(req.url).searchParams.get('order') ?? '';
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) return json(400, { error: 'validation' });

  await connectDb();
  if (await isRateLimited(`status:ip:${metaFrom(req.headers).ip}`, 120, 15 * 60)) return json(429, { error: 'rate_limited' });

  const reg = await Registration.findOne({ razorpayOrderId: orderId }).lean<RegistrationDoc>();
  if (!reg) return json(404, { error: 'not_found' });
  const batch = await Batch.findById(reg.batchId).lean<BatchDoc>();
  return json(200, summarise(reg, batch));
}
