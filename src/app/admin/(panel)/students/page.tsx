import { Download } from 'lucide-react';
import { isValidObjectId } from 'mongoose';
import type { Metadata } from 'next';
import { Badge, DownloadLink, EmptyState, PageHeader, Panel, Select, Table, TextInput, btn, td } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import { Batch, REGISTRATION_STATUSES, Registration } from '@/lib/server/models';
import { formatIst } from '@/lib/time';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Students' };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async function StudentsPage({ searchParams }: PageProps<'/admin/students'>) {
  await requireAdmin();
  const sp = await searchParams;
  const batch = typeof sp.batch === 'string' && isValidObjectId(sp.batch) ? sp.batch : '';
  const status = typeof sp.status === 'string' && (REGISTRATION_STATUSES as readonly string[]).includes(sp.status) ? sp.status : '';
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 60) : '';

  const filter: Record<string, unknown> = {};
  if (batch) filter.batchId = batch;
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [rows, batches] = await Promise.all([
    Registration.find(filter).sort({ createdAt: -1 }).limit(500).lean(),
    Batch.find().sort({ startDate: -1 }).select('name').lean(),
  ]);
  const batchName = new Map(batches.map((b) => [String(b._id), b.name]));

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Everyone who started a registration. Actions (resend link, retry Zoom, refund, change access) arrive with payments and Zoom."
        actions={
          <DownloadLink href="/api/admin/export/students" className={btn.secondary}>
            <Download aria-hidden="true" className="h-4 w-4" /> Export CSV
          </DownloadLink>
        }
      />
      <Panel>
        <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]" role="search">
          <Select name="batch" defaultValue={batch} aria-label="Batch">
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={String(b._id)} value={String(b._id)}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={status} aria-label="Status">
            <option value="">All statuses</option>
            {REGISTRATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
          <TextInput name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search" />
          <button type="submit" className={btn.primary}>
            Filter
          </button>
        </form>

        {rows.length === 0 ? (
          <EmptyState>No students match. Registrations appear here once payments are live (step 4).</EmptyState>
        ) : (
          <Table head={['Student', 'Batch', 'Status', 'Access', 'On Zoom', 'Last email']}>
            {rows.map((r) => (
              <tr key={String(r._id)} className="hover:bg-slate-50">
                <td className={td}>
                  <span className="font-semibold text-navy-900">{r.name}</span>
                  <span className="block text-xs text-slate-500">{r.email}</span>
                  <span className="block text-xs text-slate-500">{r.phone}</span>
                </td>
                <td className={td}>{batchName.get(String(r.batchId)) ?? '—'}</td>
                <td className={td}>
                  <Badge value={r.status} />
                </td>
                <td className={`${td} whitespace-nowrap text-xs`}>
                  {formatIst(r.accessStart, false)} →<br />
                  {formatIst(r.accessEnd, false)}
                </td>
                <td className={`${td} text-xs`}>
                  {r.registeredOnZoomAt && !r.removedFromZoomAt ? 'Yes' : 'No'}
                  {r.removedFromZoomAt && <span className="block text-slate-500">removed {formatIst(r.removedFromZoomAt, false)}</span>}
                </td>
                <td className={`${td} text-xs`}>{formatIst(r.lastEmailSentAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
