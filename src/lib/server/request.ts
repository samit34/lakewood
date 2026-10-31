import 'server-only';
import { headers } from 'next/headers';

export type RequestMeta = { ip: string; userAgent: string };

export function metaFrom(h: Headers): RequestMeta {
  const ip = h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return { ip, userAgent: (h.get('user-agent') || '').slice(0, 300) };
}

export async function requestMeta() {
  return metaFrom(await headers());
}

/** State-changing requests must come from our own pages (CSRF defence in depth). */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
