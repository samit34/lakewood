import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import ChangePasswordForm from './ChangePasswordForm';
import TwoFactorSettings from './TwoFactorSettings';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { admin } = await requireAdmin();
  return (
    <>
      <PageHeader title="Settings" subtitle={`Signed in as ${admin.username} (${admin.email})`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Change password">
          <ChangePasswordForm />
        </Panel>
        <Panel title="Two-factor login">
          <TwoFactorSettings />
        </Panel>
      </div>
    </>
  );
}
