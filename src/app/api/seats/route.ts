import { connection } from 'next/server';
import { masterclass } from '@/config/site';
import type { SeatsResponse } from '@/lib/seats';
import { json } from '@/lib/server/request';
import { listEnrollableBatches } from '@/lib/server/seats';

/** Seats for the next batch that still has room (or the next batch, if all are full). */
export async function GET() {
  await connection();
  const offline: SeatsResponse = { max: masterclass.maxSeats, taken: 0, left: masterclass.maxSeats, live: false };
  try {
    const batches = await listEnrollableBatches();
    const b = batches.find((x) => x.seatsLeft > 0) ?? batches[0];
    if (!b) return json(200, offline);
    const body: SeatsResponse = { max: b.maxSeats, taken: b.maxSeats - b.seatsLeft, left: b.seatsLeft, live: true };
    return json(200, body);
  } catch (e) {
    console.error('[seats]', e);
    return json(200, offline);
  }
}
