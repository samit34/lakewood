import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import { Admin, type AdminDoc } from '@/lib/server/models';
import { isInFuture } from '@/lib/time';
import AdminsManager, { type AdminRow } from './AdminsManager';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Admins' };

export default async function AdminsPage() {
  await requireAdmin({ owner: true });
  const docs = await Admin.find().sort({ createdAt: 1 }).lean<(AdminDoc & { createdAt: Date })[]>();
  const rows: AdminRow[] = docs.map((a) => ({
    id: String(a._id),
    username: a.username,
    email: a.email,
    role: a.role as AdminRow['role'],
    disabled: !!a.disabled,
    locked: isInFuture(a.lockedUntil),
    totpEnabled: !!a.totpEnabled,
    mustChangePassword: !!a.mustChangePassword,
    lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeader title="Admins" subtitle="Only owners can see this page. New admins get a temporary password and must change it at first sign-in." />
      <Panel>
        <AdminsManager rows={rows} />
      </Panel>
    </>
  );
}
