import 'server-only';
import { connectDb } from './db';
import { RateLimit } from './models';

/**
 * Fixed-window counter stored in MongoDB, so limits hold across serverless instances.
 * Returns true when the caller is over the limit.
 */
export async function isRateLimited(key: string, max: number, windowSeconds: number) {
  await connectDb();
  const now = new Date();
  const doc = await RateLimit.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: 'after' },
  ).lean();
  if (doc) return doc.count > max;
  try {
    await RateLimit.updateOne(
      { key },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) } },
      { upsert: true },
    );
  } catch {
    // concurrent upsert on the same key; the other request created the window
  }
  return false;
}

export async function clearRateLimit(key: string) {
  await connectDb();
  await RateLimit.deleteOne({ key });
}
