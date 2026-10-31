import type { ComponentProps, ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className = '' }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  paid: 'bg-blue-50 text-blue-800',
  scheduled: 'bg-indigo-50 text-indigo-800',
  active: 'bg-emerald-50 text-emerald-800',
  expired: 'bg-slate-100 text-slate-600',
  removed: 'bg-slate-200 text-slate-700',
  zoom_failed: 'bg-red-50 text-red-700',
  refunded: 'bg-amber-50 text-amber-800',
  cancelled: 'bg-slate-100 text-slate-500',
  draft: 'bg-slate-100 text-slate-700',
  open: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
  owner: 'bg-navy-900 text-brand-lime',
  staff: 'bg-slate-100 text-slate-700',
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[value] ?? 'bg-slate-100 text-slate-700'}`}>
      {label ?? value.replace('_', ' ')}
    </span>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="block text-sm font-semibold text-navy-900">{label}</span>
        <span className="mt-1 block">{children}</span>
      </label>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-navy-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 aria-[invalid=true]:border-red-500 disabled:bg-slate-50';

export const TextInput = (p: ComponentProps<'input'>) => <input {...p} className={`${inputCls} ${p.className ?? ''}`} />;
export const Select = (p: ComponentProps<'select'>) => <select {...p} className={`${inputCls} ${p.className ?? ''}`} />;

export const btn = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-lime px-4 py-2.5 font-display text-sm font-bold text-navy-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60',
  danger:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60',
  small: 'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-50 disabled:opacity-60',
};

/** File download from an API route: must be a real navigation, not client-side routing. */
export function DownloadLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} download className={className}>
      {children}
    </a>
  );
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success' | 'warning'; children: ReactNode }) {
  const cls = {
    info: 'bg-blue-50 text-blue-900 ring-blue-200',
    error: 'bg-red-50 text-red-800 ring-red-200',
    success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ring-1 ${cls}`}>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            {head.map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-3 py-2.5 font-semibold first:pl-5 sm:first:pl-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export const td = 'px-3 py-3 align-top first:pl-5 sm:first:pl-3';
