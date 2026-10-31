'use client';

import { useState, type FormEvent } from 'react';
import { useAdmin, useAdminFetch } from '@/components/admin/AdminContext';
import PasswordStrength from '@/components/admin/PasswordStrength';
import { Field, Notice, TextInput, btn } from '@/components/admin/ui';
import { checkPassword } from '@/lib/password-policy';

export default function ChangePasswordForm() {
  const { admin } = useAdmin();
  const api = useAdminFetch();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (next !== repeat) return setError({ field: 'repeat', message: 'The new passwords do not match.' });
    const check = checkPassword(next, [admin.username, admin.email]);
    if (!check.ok) return setError({ field: 'newPassword', message: check.problems[0] });

    setBusy(true);
    const res = await api('/api/admin/password', 'POST', { currentPassword: current, newPassword: next });
    setBusy(false);
    if (!res.ok) return setError({ field: res.field, message: res.message });
    setDone(true);
    // The server signed out every session and issued a new one; reload to pick up the new CSRF token.
    setTimeout(() => window.location.reload(), 1200);
  }

  if (done) return <Notice kind="success">Password changed. All other devices have been signed out.</Notice>;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Current password" error={error?.field === 'currentPassword' ? error.message : undefined}>
        <TextInput type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </Field>
      <div>
        <Field label="New password" error={error?.field === 'newPassword' ? error.message : undefined}>
          <TextInput type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        <PasswordStrength password={next} userInputs={[admin.username, admin.email]} />
      </div>
      <Field label="Repeat new password" error={error?.field === 'repeat' ? error.message : undefined}>
        <TextInput type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
      </Field>
      {error && !['currentPassword', 'newPassword', 'repeat'].includes(error.field ?? '') && <Notice kind="error">{error.message}</Notice>}
      <button type="submit" disabled={busy} className={btn.primary}>
        {busy ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}
