import 'server-only';
import { env } from './env';

export type Email = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };

/**
 * Sends through Resend's REST API. Without RESEND_API_KEY (local development) the email is
 * skipped and only its subject is logged, so flows can be tested before email is set up.
 * Never throws: a failed email must not undo a payment.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const key = env.resendApiKey;
  if (!key) {
    console.info(`[email skipped – RESEND_API_KEY not set] "${email.subject}"`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.emailFrom,
        to: Array.isArray(email.to) ? email.to : [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] send failed', e instanceof Error ? e.message : e);
    return false;
  }
}

export async function sendAdminEmail(subject: string, lines: [label: string, value: string][]) {
  const to = env.adminEmail;
  if (!to) return false;
  const rows = lines.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('');
  return sendEmail({
    to,
    subject,
    html: layout(subject, `<table style="border-collapse:collapse;font-size:14px">${rows}</table>`),
    text: lines.map(([k, v]) => `${k}: ${v}`).join('\n'),
  });
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Simple, email-client-safe wrapper in the brand colours. `body` must already be escaped. */
export function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1e293b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#0a1433;padding:18px 24px;color:#ffffff;font-size:16px;font-weight:700">Lakewood IELTS Institute</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:20px;color:#0a1433">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:14px 24px;background:#f8fafc;color:#64748b;font-size:12px">This is an automated message from Lakewood IELTS Institute.</td></tr>
</table></td></tr></table></body></html>`;
}
