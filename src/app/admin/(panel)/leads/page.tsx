import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import { DownloadLink, EmptyState, PageHeader, Panel, Table, btn, td } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import { Enquiry, Waitlist } from '@/lib/server/models';
import { formatIst } from '@/lib/time';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Enquiries & waitlist' };

export default async function LeadsPage() {
  await requireAdmin();
  const [enquiries, waitlist] = await Promise.all([
    Enquiry.find().sort({ createdAt: -1 }).limit(500).lean(),
    Waitlist.find().sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  return (
    <>
      <PageHeader title="Enquiries & waitlist" subtitle="IELTS/PTE enquiries and people waiting for the next batch." />
      <div className="space-y-6">
        <Panel
          title={`IELTS & PTE enquiries (${enquiries.length})`}
          actions={
            <DownloadLink href="/api/admin/export/enquiries" className={btn.small}>
              <Download aria-hidden="true" className="h-3.5 w-3.5" /> CSV
            </DownloadLink>
          }
        >
          {enquiries.length === 0 ? (
            <EmptyState>No enquiries yet.</EmptyState>
          ) : (
            <Table head={['Name', 'Phone', 'Email', 'Goal', 'Received']}>
              {enquiries.map((e) => (
                <tr key={String(e._id)}>
                  <td className={`${td} font-semibold text-navy-900`}>{e.name}</td>
                  <td className={td}>
                    <a href={`tel:+91${e.phone}`} className="text-brand-ink hover:underline">
                      {e.phone}
                    </a>
                  </td>
                  <td className={td}>{e.email ?? '—'}</td>
                  <td className={td}>{e.goal.toUpperCase()}</td>
                  <td className={`${td} whitespace-nowrap text-xs`}>{formatIst(e.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <div id="waitlist">
          <Panel
            title={`Waitlist (${waitlist.length})`}
            actions={
              <DownloadLink href="/api/admin/export/waitlist" className={btn.small}>
                <Download aria-hidden="true" className="h-3.5 w-3.5" /> CSV
              </DownloadLink>
            }
          >
            {waitlist.length === 0 ? (
              <EmptyState>Nobody on the waitlist.</EmptyState>
            ) : (
              <Table head={['Name', 'Phone', 'Email', 'Joined']}>
                {waitlist.map((w) => (
                  <tr key={String(w._id)}>
                    <td className={`${td} font-semibold text-navy-900`}>{w.name}</td>
                    <td className={td}>{w.phone}</td>
                    <td className={td}>{w.email ?? '—'}</td>
                    <td className={`${td} whitespace-nowrap text-xs`}>{formatIst(w.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
