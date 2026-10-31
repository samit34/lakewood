import 'server-only';
import crypto from 'node:crypto';
import { safeEqual } from './crypto';
import { env } from './env';

// Razorpay REST API, called directly (no SDK). Docs: razorpay.com/docs/api
const API = 'https://api.razorpay.com/v1';

export class RazorpayError extends Error {}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(API + path, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new RazorpayError(`Razorpay ${res.status}: ${data.error?.description ?? 'request failed'}`);
  return data;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string; receipt: string };
export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  email?: string;
  contact?: string;
  error_description?: string | null;
};

/** The amount always comes from our database, never from the browser. */
export function createOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
  return call<RazorpayOrder>('/orders', {
    method: 'POST',
    body: { amount: input.amountPaise, currency: 'INR', receipt: input.receipt, notes: input.notes },
  });
}

export const fetchPayment = (paymentId: string) => call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);

export const capturePayment = (paymentId: string, amountPaise: number) =>
  call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, { method: 'POST', body: { amount: amountPaise, currency: 'INR' } });

const hmac = (secret: string, data: string) => crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Checkout success callback: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  return safeEqual(hmac(env.razorpayKeySecret, `${orderId}|${paymentId}`), signature);
}

/** Webhooks: X-Razorpay-Signature = HMAC_SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  return safeEqual(hmac(env.razorpayWebhookSecret, rawBody), signature);
}
