import { AlertTriangle, ExternalLink, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, EmptyState, PageHeader, Panel, Table, btn, td } from '@/components/admin/ui';
import { batchesOverlap } from '@/lib/batch';
import { requireAdmin } from '@/lib/server/auth';
import { serializeBatch } from '@/lib/server/batches';
import { Batch, type BatchDoc } from '@/lib/server/models';
import { WEEKDAYS, formatClockTime, formatIst, istToDate } from '@/lib/time';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Batches' };

export default async function BatchesPage() {
  await requireAdmin();
  const batches = (await Batch.find().sort({ startDate: -1 }).lean<BatchDoc[]>()).map(serializeBatch);
  const active = batches.filter((b) => b.status !== 'closed');
  const clashes = new Set(active.flatMap((a) => active.filter((b) => a.id !== b.id && batchesOverlap(a, b)).map(() => a.id)));

  return (
    <>
      <PageHeader
        title="Batches"
        subtitle="Each batch has its own Zoom meeting, dates, price and seats."
        actions={
          <Link href="/admin/batches/new" className={btn.primary}>
            <Plus aria-hidden="true" className="h-4 w-4" /> New batch
          </Link>
        }
      />
      <Panel>
        {batches.length === 0 ? (
          <EmptyState>No batches yet. Create the first one to open registrations.</EmptyState>
        ) : (
          <Table head={['Batch', 'Status', 'Dates', 'Schedule (IST)', 'Seats', 'Price', 'Zoom meeting']}>
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className={td}>
                  <Link href={`/admin/batches/${b.id}`} className="font-semibold text-navy-900 hover:text-brand-ink hover:underline">
                    {b.name}
                  </Link>
                  {clashes.has(b.id) && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /> Time clash with another batch
                    </span>
                  )}
                </td>
                <td className={td}>
                  <Badge value={b.status} />
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {formatIst(istToDate(b.startDate), false)} – {formatIst(istToDate(b.endDate), false)}
                </td>
                <td className={td}>
                  {b.daysOfWeek.map((d) => WEEKDAYS[d]).join(', ')}
                  <span className="block text-xs text-slate-500">
                    {formatClockTime(b.classTime)} · {b.durationMinutes} min
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {b.seatsTaken} / {b.maxSeats}
                </td>
                <td className={td}>₹{b.priceInr}</td>
                <td className={td}>
                  {b.zoomMeetingId ? (
                    <a
                      href={`https://zoom.us/meeting/${b.zoomMeetingId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-brand-ink hover:underline"
                    >
                      {b.zoomMeetingId} <ExternalLink aria-hidden="true" className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Not set</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
