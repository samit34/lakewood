import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Next.js injects small inline scripts, so 'unsafe-inline' is needed without per-request nonces
// (nonces would make the landing page dynamic and slower). Sources are still restricted to an allow-list.
const csp = (extra: { script?: string[]; connect?: string[]; frame?: string[] } = {}) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${(extra.script ?? []).join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' ${(extra.connect ?? []).join(' ')}`,
    `frame-src ${(extra.frame ?? ["'none'"]).join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

const publicCsp = csp({
  script: ['https://checkout.razorpay.com', 'https://*.razorpay.com', 'https://challenges.cloudflare.com', 'https://www.googletagmanager.com', 'https://connect.facebook.net'],
  connect: ['https://*.razorpay.com', 'https://challenges.cloudflare.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://www.facebook.com'],
  frame: ['https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://*.razorpay.com', 'https://challenges.cloudflare.com'],
});
const adminCsp = csp();

const common = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")' },
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  serverExternalPackages: ['@node-rs/argon2', 'mongoose'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      { source: '/((?!admin|api/admin).*)', headers: [...common, { key: 'Content-Security-Policy', value: publicCsp }] },
      { source: '/admin/:path*', headers: [...common, { key: 'Content-Security-Policy', value: adminCsp }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/admin', headers: [...common, { key: 'Content-Security-Policy', value: adminCsp }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/admin/:path*', headers: [...common, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
