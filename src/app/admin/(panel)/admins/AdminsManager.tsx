'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAdmin, useAdminFetch } from '@/components/admin/AdminContext';
import PasswordStrength from '@/components/admin/PasswordStrength';
import { Badge, Field, Notice, Select, TextInput, btn } from '@/components/admin/ui';
import { formatIst } from '@/lib/time';

export type AdminRow = {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'staff';
  disabled: boolean;
  locked: boolean;
  totpEnabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

export default function AdminsManager({ rows }: { rows: AdminRow[] }) {
  const { admin: me } = useAdmin();
  const api = useAdminFetch();
  const router = useRouter();
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'staff', tempPassword: '' });

  async function act(id: string, body: Record<string, unknown>, success: string) {
    setBusy(true);
    setMsg(null);
    const res = await api(`/api/admin/admins/${id}`, 'PATCH', body);
    setBusy(false);
    setMsg(res.ok ? { kind: 'success', text: success } : { kind: 'error', text: res.message });
    if (res.ok) router.refresh();
  }

  function resetPassword(row: AdminRow) {
    const temp = window.prompt(`New temporary password for ${row.username} (min 12 characters, hard to guess). Share it with them privately; they must change it at next sign-in.`);
    if (temp) act(row.id, { action: 'reset_password', tempPassword: temp }, `Temporary password set for ${row.username}. They have been signed out everywhere.`);
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await api('/api/admin/admins', 'POST', newUser);
    setBusy(false);
    if (!res.ok) return setMsg({ kind: 'error', text: res.message });
    setMsg({ kind: 'success', text: `Admin ${newUser.username} created. Share the temporary password privately.` });
    setNewUser({ username: '', email: '', role: 'staff', tempPassword: '' });
    setShowAdd(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <ul className="divide-y divide-slate-100">
        {rows.map((r) => {
          const self = r.id === me.id;
          return (
            <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-900">
                  {r.username} {self && <span className="text-xs font-normal text-slate-500">(you)</span>}
                  <Badge value={r.role} />
                  {r.disabled && <Badge value="closed" label="disabled" />}
                  {r.locked && <Badge value="zoom_failed" label="locked" />}
                  {r.mustChangePassword && <Badge value="pending" label="temp password" />}
                  {r.totpEnabled && <Badge value="active" label="2FA on" />}
                </p>
                <p className="text-sm text-slate-600">{r.email}</p>
                <p className="text-xs text-slate-500">Last sign-in: {formatIst(r.lastLoginAt)}</p>
              </div>
              {!self && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className={btn.small} onClick={() => resetPassword(r)}>
                    Reset password
                  </button>
                  {r.locked && (
                    <button type="button" disabled={busy} className={btn.small} onClick={() => act(r.id, { action: 'unlock' }, `${r.username} unlocked.`)}>
                      Unlock
                    </button>
                  )}
                  {r.totpEnabled && (
                    <button
                      type="button"
                      disabled={busy}
                      className={btn.small}
                      onClick={() => window.confirm(`Turn off two-factor login for ${r.username}?`) && act(r.id, { action: 'reset_mfa' }, `Two-factor login reset for ${r.username}.`)}
                    >
                      Reset 2FA
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    className={btn.small}
                    onClick={() => act(r.id, { action: 'set_role', role: r.role === 'owner' ? 'staff' : 'owner' }, `${r.username} is now ${r.role === 'owner' ? 'staff' : 'an owner'}.`)}
                  >
                    Make {r.role === 'owner' ? 'staff' : 'owner'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={btn.small}
                    onClick={() =>
                      (r.disabled || window.confirm(`Disable ${r.username}? They will be signed out immediately.`)) &&
                      act(r.id, { action: 'set_disabled', disabled: !r.disabled }, `${r.username} ${r.disabled ? 'enabled' : 'disabled'}.`)
                    }
                  >
                    {r.disabled ? 'Enable' : 'Disable'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {showAdd ? (
        <form onSubmit={add} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-display font-semibold text-navy-900">Add admin</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username">
              <TextInput value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} autoCapitalize="none" required />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            </Field>
            <Field label="Role" hint="Owners can manage admins and see the audit log.">
              <Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </Select>
            </Field>
            <div>
              <Field label="Temporary password">
                <TextInput type="text" autoComplete="off" value={newUser.tempPassword} onChange={(e) => setNewUser({ ...newUser, tempPassword: e.target.value })} required />
              </Field>
              <PasswordStrength password={newUser.tempPassword} userInputs={[newUser.username, newUser.email]} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={btn.primary}>
              Create admin
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className={btn.secondary}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className={btn.primary}>
          Add admin
        </button>
      )}
    </div>
  );
}
