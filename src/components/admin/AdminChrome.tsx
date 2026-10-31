'use client';

import { CalendarRange, ClipboardList, Gauge, LogOut, Menu, Settings, ShieldCheck, UserCog, Users, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAdmin } from './AdminContext';

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: Gauge },
  { href: '/admin/batches', label: 'Batches', Icon: CalendarRange },
  { href: '/admin/students', label: 'Students', Icon: Users },
  { href: '/admin/leads', label: 'Enquiries & waitlist', Icon: ClipboardList },
  { href: '/admin/audit', label: 'Audit log', Icon: ShieldCheck, owner: true },
  { href: '/admin/admins', label: 'Admins', Icon: UserCog, owner: true },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
];

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-lime" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="h-5 w-5">
          <path d="M20 14v32h26" fill="none" stroke="#0a1433" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-display leading-none text-white">
        <span className="block font-bold">Lakewood</span>
        <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.2em] text-white/60">ADMIN</span>
      </span>
    </Link>
  );
}

export default function AdminChrome({ children }: { children: ReactNode }) {
  const { admin, csrfToken } = useAdmin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.owner || admin.role === 'owner');
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', headers: { 'x-csrf-token': csrfToken } }).catch(() => {});
    // Full reload so no admin data stays in the client router cache after sign-out
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/admin/login';
  }

  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={isActive(href) ? 'page' : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
            isActive(href) ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Icon aria-hidden="true" className={`h-5 w-5 ${isActive(href) ? 'text-brand-lime' : ''}`} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate px-3 text-sm font-semibold text-white">{admin.username}</p>
      <p className="truncate px-3 text-xs capitalize text-white/60">{admin.role}</p>
      <button type="button" onClick={logout} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
        <LogOut aria-hidden="true" className="h-5 w-5" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-navy-900 p-5 lg:flex">
        <div className="space-y-8">
          <Brand />
          {nav}
        </div>
        {account}
      </aside>

      <header className="sticky top-0 z-30 bg-navy-900 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10"
          >
            {open ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div id="admin-mobile-nav" className="space-y-4 border-t border-white/10 px-4 pb-4 pt-3">
            {nav}
            {account}
          </div>
        )}
      </header>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
