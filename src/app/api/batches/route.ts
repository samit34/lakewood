import { connection } from 'next/server';
import type { BatchesResponse } from '@/lib/registration';
import { env } from '@/lib/server/env';
import { json } from '@/lib/server/request';
import { listEnrollableBatches } from '@/lib/server/seats';

export async function GET() {
  await connection();
  try {
    const body: BatchesResponse = { batches: await listEnrollableBatches(), paymentsEnabled: env.razorpayConfigured };
    return json(200, body);
  } catch (e) {
    console.error('[batches]', e);
    return json(503, { error: 'unavailable' });
  }
}
