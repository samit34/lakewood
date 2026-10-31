import { Suspense } from 'react';
import AdminChrome from '@/components/admin/AdminChrome';
import { AdminProvider } from '@/components/admin/AdminContext';
import { requireAdmin } from '@/lib/server/auth';
import ChangePasswordForm from './settings/ChangePasswordForm';

// Every admin navigation re-checks the session on the server, so a revoked session takes effect immediately.
export const instant = false;

// The session is read per request, so the whole panel streams in behind this boundary.
export default function PanelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading…</div>}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}

async function PanelShell({ children }: { children: React.ReactNode }) {
  const { admin, csrfToken } = await requireAdmin();
  return (
    <AdminProvider admin={admin} csrfToken={csrfToken}>
      <AdminChrome>
        {admin.mustChangePassword ? (
          <div className="mx-auto max-w-lg">
            <h1 className="font-display text-2xl font-bold text-navy-900">Set a new password</h1>
            <p className="mt-2 text-sm text-slate-600">You signed in with a temporary password. Choose your own password to continue.</p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <ChangePasswordForm />
            </div>
          </div>
        ) : (
          children
        )}
      </AdminChrome>
    </AdminProvider>
  );
}
