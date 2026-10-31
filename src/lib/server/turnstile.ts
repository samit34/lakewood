import 'server-only';
import { env } from './env';

/** Cloudflare Turnstile check. Always passes when TURNSTILE_ENABLED is not "true". */
export async function passesTurnstile(token: string | undefined, ip: string) {
  if (!env.turnstileEnabled) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.turnstileSecret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
