import 'server-only';
import type { Types } from 'mongoose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { randomToken, safeEqual, sha256 } from './crypto';
import { connectDb } from './db';
import { env } from './env';
import { Admin, AdminSession, type AdminDoc } from './models';
import { isSameOrigin, json, metaFrom, type RequestMeta } from './request';

// __Host- prefix: cookie is Secure, host-only and path=/ — it can't be set by subdomains or over http.
export const SESSION_COOKIE = env.isProd ? '__Host-lw_admin' : 'lw_admin';
export const MFA_COOKIE = env.isProd ? '__Host-lw_admin_mfa' : 'lw_admin_mfa';

const IDLE_MS = 8 * 60 * 60 * 1000; // sliding expiry
const ABSOLUTE_MS = 24 * 60 * 60 * 1000; // hard cap, even with activity
const MFA_MS = 5 * 60 * 1000;
const TOUCH_EVERY_MS = 60 * 1000;

export type SafeAdmin = {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'staff';
  mustChangePassword: boolean;
  totpEnabled: boolean;
};

export const toSafeAdmin = (a: AdminDoc): SafeAdmin => ({
  id: String(a._id),
  username: a.username,
  email: a.email,
  role: a.role as SafeAdmin['role'],
  mustChangePassword: !!a.mustChangePassword,
  totpEnabled: !!a.totpEnabled,
});

const cookieOptions = (maxAgeSeconds?: number) => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  path: '/',
  ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
});

export async function startSession(adminId: Types.ObjectId, stage: 'mfa' | 'full', meta: RequestMeta) {
  await connectDb();
  const token = randomToken();
  const now = Date.now();
  const ttl = stage === 'mfa' ? MFA_MS : IDLE_MS;
  await AdminSession.create({
    tokenHash: sha256(token),
    adminId,
    stage,
    csrfToken: randomToken(24),
    expiresAt: new Date(now + ttl),
    absoluteExpiresAt: new Date(now + (stage === 'mfa' ? MFA_MS : ABSOLUTE_MS)),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  const jar = await cookies();
  if (stage === 'mfa') {
    jar.set(MFA_COOKIE, token, cookieOptions(MFA_MS / 1000));
  } else {
    jar.delete(MFA_COOKIE);
    jar.set(SESSION_COOKIE, token, cookieOptions()); // browser-session cookie; expiry enforced server-side
  }
  return token;
}

export async function endSession(cookieName = SESSION_COOKIE) {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) {
    await connectDb();
    await AdminSession.deleteOne({ tokenHash: sha256(token) });
  }
  jar.delete(cookieName);
}

/** Logs the admin out everywhere (password change, reset, disable). */
export async function endAllSessions(adminId: Types.ObjectId | string, exceptTokenHash?: string) {
  await connectDb();
  await AdminSession.deleteMany({ adminId, ...(exceptTokenHash ? { tokenHash: { $ne: exceptTokenHash } } : {}) });
}

async function loadSession(token: string | undefined, stage: 'mfa' | 'full') {
  if (!token) return null;
  // Cookie reads alone can still be prerendered (runtime prefetch); session checks must run per request.
  await connection();
  await connectDb();
  const tokenHash = sha256(token);
  const s = await AdminSession.findOne({ tokenHash, stage }).lean();
  const now = Date.now();
  if (!s || s.expiresAt.getTime() < now || s.absoluteExpiresAt.getTime() < now) return null;
  const admin = await Admin.findById(s.adminId).lean<AdminDoc>();
  if (!admin || admin.disabled) return null;
  if (stage === 'full' && now - new Date(s.lastSeenAt ?? 0).getTime() > TOUCH_EVERY_MS) {
    await AdminSession.updateOne(
      { _id: s._id },
      { $set: { lastSeenAt: new Date(now), expiresAt: new Date(Math.min(now + IDLE_MS, s.absoluteExpiresAt.getTime())) } },
    );
  }
  return { session: s, admin, tokenHash };
}

export async function getMfaSession() {
  return loadSession((await cookies()).get(MFA_COOKIE)?.value, 'mfa');
}

/** Current admin for this request (deduplicated across components in one render). */
export const getCurrentAdmin = cache(async () => {
  const found = await loadSession((await cookies()).get(SESSION_COOKIE)?.value, 'full');
  if (!found) return null;
  return { admin: toSafeAdmin(found.admin), csrfToken: found.session.csrfToken, doc: found.admin, tokenHash: found.tokenHash };
});

/** For admin pages: redirects to the login page when there is no valid session. */
export async function requireAdmin(opts: { owner?: boolean } = {}) {
  const current = await getCurrentAdmin();
  if (!current) redirect('/admin/login');
  if (opts.owner && current.admin.role !== 'owner') redirect('/admin');
  return current;
}

type ApiContext = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>> & { meta: RequestMeta };

/**
 * Wraps every /api/admin/* handler: verifies the session, and for state-changing
 * requests the Origin header and the per-session CSRF token.
 */
export function adminApi<P = unknown>(
  handler: (req: Request, ctx: ApiContext, params: P) => Promise<Response>,
  opts: { owner?: boolean; allowMustChangePassword?: boolean } = {},
) {
  return async (req: Request, route: { params: Promise<P> }) => {
    const current = await getCurrentAdmin();
    if (!current) return json(401, { error: 'unauthorized' });

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const token = req.headers.get('x-csrf-token') || '';
      if (!isSameOrigin(req) || !safeEqual(token, current.csrfToken)) return json(403, { error: 'csrf' });
    }
    if (opts.owner && current.admin.role !== 'owner') return json(403, { error: 'forbidden' });
    if (current.admin.mustChangePassword && !opts.allowMustChangePassword) return json(403, { error: 'password_change_required' });

    try {
      return await handler(req, { ...current, meta: metaFrom(req.headers) }, (await route.params) as P);
    } catch (e) {
      console.error('admin api error', req.url, e);
      return json(500, { error: 'server_error', message: 'Something went wrong. Please try again.' });
    }
  };
}
