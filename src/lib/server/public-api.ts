import 'server-only';
import { site } from '@/config/site';
import { connectDb } from './db';
import { isRateLimited } from './rate-limit';
import { isSameOrigin, json, metaFrom, type RequestMeta } from './request';
import { passesTurnstile } from './turnstile';

export const CALL_US = `Please try again, or call ${site.contact.phone}.`;

/**
 * Shared checks for public form endpoints: same-origin only (no cross-site posts), JSON body,
 * per-IP rate limit, honeypot and optional Turnstile. Returns a Response to send on failure.
 */
export async function publicPost(req: Request, opts: { bucket: string; max: number; windowSeconds: number }) {
  if (!isSameOrigin(req)) return { error: json(403, { error: 'forbidden', message: 'Request blocked.' }) };
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return { error: json(400, { error: 'validation', message: 'Invalid request.' }) };
  const meta: RequestMeta = metaFrom(req.headers);

  await connectDb();
  if (await isRateLimited(`${opts.bucket}:ip:${meta.ip}`, opts.max, opts.windowSeconds)) {
    return { error: json(429, { error: 'rate_limited', message: `Too many attempts. Please wait a few minutes. ${CALL_US}` }) };
  }
  if (typeof body.website === 'string' && body.website.length > 0) {
    return { error: json(400, { error: 'validation', message: 'Invalid request.' }) };
  }
  if (!(await passesTurnstile(typeof body.turnstileToken === 'string' ? body.turnstileToken : undefined, meta.ip))) {
    return { error: json(400, { error: 'captcha', message: 'Please complete the “I am human” check and try again.' }) };
  }
  return { body, meta };
}
