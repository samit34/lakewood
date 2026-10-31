import 'server-only';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

/** Unset, or still the placeholder copied from .env.example. */
const isUnset = (v: string | undefined) => !v || /x{6,}/i.test(v);

export const env = {
  get mongodbUri() {
    return required('MONGODB_URI');
  },
  /** 32-byte key for AES-256-GCM (TOTP secrets). */
  get encryptionKey() {
    const key = Buffer.from(required('ADMIN_ENCRYPTION_KEY'), 'base64');
    if (key.length !== 32) throw new Error('ADMIN_ENCRYPTION_KEY must be 32 random bytes, base64-encoded.');
    return key;
  },
  get cronSecret() {
    return required('CRON_SECRET');
  },

  get razorpayConfigured() {
    return !isUnset(process.env.RAZORPAY_KEY_ID) && !isUnset(process.env.RAZORPAY_KEY_SECRET);
  },
  get razorpayKeyId() {
    return required('RAZORPAY_KEY_ID');
  },
  get razorpayKeySecret() {
    return required('RAZORPAY_KEY_SECRET');
  },
  get razorpayWebhookConfigured() {
    return !isUnset(process.env.RAZORPAY_WEBHOOK_SECRET);
  },
  get razorpayWebhookSecret() {
    return required('RAZORPAY_WEBHOOK_SECRET');
  },

  get resendApiKey() {
    return isUnset(process.env.RESEND_API_KEY) ? null : process.env.RESEND_API_KEY!;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || 'Lakewood IELTS Institute <onboarding@resend.dev>';
  },
  get adminEmail() {
    return process.env.ADMIN_EMAIL || null;
  },

  /** Students are added to the batch's Zoom meeting this many hours before it starts. */
  get zoomRegisterHoursBefore() {
    const n = Number(process.env.ZOOM_REGISTER_HOURS_BEFORE_START ?? 24);
    return Number.isFinite(n) && n >= 0 ? n : 24;
  },

  get turnstileEnabled() {
    return process.env.TURNSTILE_ENABLED === 'true';
  },
  get turnstileSecret() {
    return required('TURNSTILE_SECRET_KEY');
  },

  isProd: process.env.NODE_ENV === 'production',
};
