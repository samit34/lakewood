'use client';

import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { Field, Notice, TextInput, btn } from '@/components/admin/ui';

export default function LoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<'password' | 'mfa'>('password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { res, data: await res.json().catch(() => ({})) };
  }

  async function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const { res, data } = await post('/api/admin/login', { username: f.get('username'), password: f.get('password') });
      if (res.ok && data.mfa) {
        setStage('mfa');
        setTimeout(() => codeRef.current?.focus(), 50);
      } else if (res.ok) {
        router.replace('/admin');
      } else {
        setError(data.message || 'Invalid username or password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const { res, data } = await post('/api/admin/login/mfa', { code: f.get('code') });
      if (res.ok) router.replace('/admin');
      else {
        setError(data.message || 'That code is not valid.');
        if (res.status === 401 && data.error === 'expired') setStage('password');
        if (res.status === 429) setStage('password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <h1 className="flex items-center gap-2 font-display text-xl font-bold text-navy-900">
        <Lock aria-hidden="true" className="h-5 w-5 text-brand-ink" />
        {stage === 'password' ? 'Sign in' : 'Two-factor code'}
      </h1>

      {stage === 'password' ? (
        <form onSubmit={onPassword} className="mt-6 space-y-4" noValidate>
          <Field label="Username">
            <TextInput name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus />
          </Field>
          <Field label="Password">
            <TextInput name="password" type="password" autoComplete="current-password" required />
          </Field>
          {error && <Notice kind="error">{error}</Notice>}
          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={onCode} className="mt-6 space-y-4" noValidate>
          <p className="text-sm text-slate-600">
            {useBackup ? 'Enter one of your backup codes (e.g. abcd-2345). Each code works once.' : 'Open your authenticator app and enter the 6-digit code for Lakewood Admin.'}
          </p>
          <Field label={useBackup ? 'Backup code' : '6-digit code'}>
            <TextInput
              ref={codeRef}
              key={useBackup ? 'backup' : 'totp'}
              name="code"
              inputMode={useBackup ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              autoCapitalize="none"
              maxLength={useBackup ? 12 : 6}
              required
            />
          </Field>
          {error && <Notice kind="error">{error}</Notice>}
          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy ? 'Checking…' : 'Verify'}
          </button>
          <button type="button" onClick={() => setUseBackup((b) => !b)} className="w-full text-center text-sm font-semibold text-brand-ink hover:underline">
            {useBackup ? 'Use authenticator code instead' : 'Lost your phone? Use a backup code'}
          </button>
        </form>
      )}
    </div>
  );
}
