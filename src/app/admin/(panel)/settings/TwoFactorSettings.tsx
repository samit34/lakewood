'use client';

import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAdmin, useAdminFetch } from '@/components/admin/AdminContext';
import { Field, Notice, TextInput, btn } from '@/components/admin/ui';

function BackupCodes({ codes }: { codes: string[] }) {
  return (
    <div className="space-y-3">
      <Notice kind="warning">
        Save these backup codes somewhere safe (password manager or printed). Each one works once if you lose your phone. They won’t be shown again.
      </Notice>
      <ul className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 font-mono text-sm text-navy-900">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <button type="button" className={btn.secondary} onClick={() => navigator.clipboard?.writeText(codes.join('\n'))}>
        Copy codes
      </button>
    </div>
  );
}

export default function TwoFactorSettings() {
  const { admin } = useAdmin();
  const api = useAdminFetch();
  const [enabled, setEnabled] = useState(admin.totpEnabled);
  const [setup, setSetup] = useState<{ qrDataUrl: string; manualKey: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call<T>(body: unknown) {
    setBusy(true);
    setError('');
    const res = await api<T>('/api/admin/mfa', 'POST', body);
    setBusy(false);
    if (!res.ok) setError(res.message);
    return res.ok ? res.data : null;
  }

  async function startSetup() {
    const data = await call<{ qrDataUrl: string; manualKey: string }>({ action: 'setup' });
    if (data) setSetup(data);
  }

  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code') ?? '');
    const data = await call<{ backupCodes: string[] }>({ action: 'enable', code });
    if (data) {
      setEnabled(true);
      setSetup(null);
      setCodes(data.backupCodes);
    }
  }

  async function withPassword(e: FormEvent<HTMLFormElement>, action: 'disable' | 'regenerate_backup_codes') {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get('password') ?? '');
    const data = await call<{ backupCodes?: string[] }>({ action, password });
    if (!data) return;
    form.reset();
    if (action === 'disable') {
      setEnabled(false);
      setCodes(null);
    } else if (data.backupCodes) setCodes(data.backupCodes);
  }

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-sm">
        <ShieldCheck aria-hidden="true" className={`h-5 w-5 ${enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
        Two-factor login is <strong className="text-navy-900">{enabled ? 'on' : 'off'}</strong>.
      </p>
      {error && <Notice kind="error">{error}</Notice>}
      {codes && <BackupCodes codes={codes} />}

      {!enabled && !setup && (
        <>
          <p className="text-sm text-slate-600">
            After your password, you’ll also enter a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy). Strongly recommended for the owner account.
          </p>
          <button type="button" onClick={startSetup} disabled={busy} className={btn.primary}>
            Turn on two-factor login
          </button>
        </>
      )}

      {!enabled && setup && (
        <form onSubmit={confirm} className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Open your authenticator app and add a new account.</li>
            <li>Scan this QR code (or type the key below).</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated on the server */}
          <img src={setup.qrDataUrl} alt="QR code for your authenticator app" width={200} height={200} className="rounded-xl border border-slate-200" />
          <p className="break-all text-xs text-slate-500">
            Key: <code className="font-mono text-navy-900">{setup.manualKey}</code>
          </p>
          <Field label="6-digit code">
            <TextInput name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className="max-w-[10rem]" />
          </Field>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={btn.primary}>
              Confirm and turn on
            </button>
            <button type="button" onClick={() => setSetup(null)} className={btn.secondary}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {enabled && (
        <div className="grid gap-5 sm:grid-cols-2">
          <form onSubmit={(e) => withPassword(e, 'regenerate_backup_codes')} className="space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-navy-900">New backup codes</p>
            <p className="text-xs text-slate-600">Replaces all existing backup codes.</p>
            <TextInput name="password" type="password" autoComplete="current-password" placeholder="Your password" aria-label="Your password" required />
            <button type="submit" disabled={busy} className={btn.secondary}>
              Generate new codes
            </button>
          </form>
          <form onSubmit={(e) => withPassword(e, 'disable')} className="space-y-3 rounded-xl border border-red-100 p-4">
            <p className="text-sm font-semibold text-navy-900">Turn off two-factor login</p>
            <p className="text-xs text-slate-600">Your account will be protected by password only.</p>
            <TextInput name="password" type="password" autoComplete="current-password" placeholder="Your password" aria-label="Your password" required />
            <button type="submit" disabled={busy} className={btn.danger}>
              Turn off
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
