import 'server-only';
import crypto from 'node:crypto';
import { Secret, TOTP } from 'otpauth';
import QRCode from 'qrcode';
import { decrypt, encrypt, sha256 } from './crypto';

const PERIOD = 30;

function totpFor(secretBase32: string, label: string) {
  return new TOTP({ issuer: 'Lakewood Admin', label, algorithm: 'SHA1', digits: 6, period: PERIOD, secret: Secret.fromBase32(secretBase32) });
}

/** New secret: returns the encrypted value to store and a QR code for the authenticator app. */
export async function newTotpSecret(username: string) {
  const secret = new Secret({ size: 20 });
  const uri = totpFor(secret.base32, username).toString();
  return { encrypted: encrypt(secret.base32), qrDataUrl: await QRCode.toDataURL(uri, { margin: 1, width: 220 }), manualKey: secret.base32 };
}

/**
 * Checks a 6-digit code (±1 step for clock drift). Returns the matched time step,
 * or null. Callers must reject steps <= the last accepted one (replay protection).
 */
export function verifyTotp(encryptedSecret: string, code: string, username: string, lastStep = 0) {
  if (!/^\d{6}$/.test(code)) return null;
  const totp = totpFor(decrypt(encryptedSecret), username);
  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) return null;
  const step = Math.floor(Date.now() / 1000 / PERIOD) + delta;
  return step > lastStep ? step : null;
}

const BACKUP_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function newBackupCodes(count = 10) {
  const codes = Array.from({ length: count }, () => {
    const chars = Array.from({ length: 8 }, () => BACKUP_ALPHABET[crypto.randomInt(BACKUP_ALPHABET.length)]).join('');
    return `${chars.slice(0, 4)}-${chars.slice(4)}`;
  });
  return { codes, hashes: codes.map((c) => sha256(c)) };
}

export const normaliseBackupCode = (code: string) => {
  const c = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : null;
};
