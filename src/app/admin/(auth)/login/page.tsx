import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-navy-900 px-4 py-10">
      <div aria-hidden="true" className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-blue/30 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-lime" aria-hidden="true">
            <svg viewBox="0 0 64 64" className="h-6 w-6">
              <path d="M20 14v32h26" fill="none" stroke="#0a1433" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold text-white">Lakewood Admin</span>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
