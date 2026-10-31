import { NextResponse, type NextRequest } from 'next/server';

// First gate only: rejects requests that have no admin session cookie at all.
// Every admin page and /api/admin handler still validates the session against the database.
const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-lw_admin' : 'lw_admin';
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/api/admin/login', '/api/admin/login/mfa', '/api/admin/logout']);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
