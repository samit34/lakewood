import { AlertTriangle, CalendarRange, ClipboardList, Clock, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, EmptyState, Notice, PageHeader, Panel } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import { Batch, CronRun, Enquiry, Registration, Waitlist } from '@/lib/server/models';
import { daysAgo, formatIst, isOlderThan, istToDate, istToday } from '@/lib/time';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Dashboard' };

const ACTIVE = ['paid', 'scheduled', 'active'];

export default async function DashboardPage() {
  const { admin } = await requireAdmin();
  const endOfTodayIst = istToDate(istToday(), '23:59');
  const weekAgo = daysAgo(7);

  const [openBatches, activeStudents, zoomFailed, dueToday, enquiries7d, waitlist, lastRun, lastFailedRun] = await Promise.all([
    Batch.countDocuments({ status: 'open' }),
    Registration.countDocuments({ status: { $in: ACTIVE } }),
    Registration.find({ status: 'zoom_failed' }).sort({ updatedAt: -1 }).limit(10).lean(),
    Registration.find({ status: { $in: ACTIVE }, accessEnd: { $lte: endOfTodayIst } }).sort({ accessEnd: 1 }).limit(20).lean(),
    Enquiry.countDocuments({ createdAt: { $gte: weekAgo } }),
    Waitlist.countDocuments(),
    CronRun.findOne({ job: 'cleanup' }).sort({ startedAt: -1 }).lean(),
    CronRun.findOne({ job: 'cleanup', 'failures.0': { $exists: true } }).sort({ startedAt: -1 }).lean(),
  ]);

  const stats = [
    { label: 'Open batches', value: openBatches, href: '/admin/batches', Icon: CalendarRange },
    { label: 'Paid / active students', value: activeStudents, href: '/admin/students', Icon: Users },
    { label: 'Enquiries (7 days)', value: enquiries7d, href: '/admin/leads', Icon: ClipboardList },
    { label: 'Waitlist', value: waitlist, href: '/admin/leads#waitlist', Icon: Clock },
  ];
  const cronStale = lastRun && isOlderThan(lastRun.startedAt, 60 * 60 * 1000);

  return (
    <>
      <PageHeader title={`Hello, ${admin.username}`} subtitle="Overview of batches, students and background jobs." />

      {!admin.totpEnabled && admin.role === 'owner' && (
        <div className="mb-6">
          <Notice kind="warning">
            Two-factor login is off for your owner account.{' '}
            <Link href="/admin/settings" className="font-semibold underline">
              Turn it on in Settings
            </Link>
            .
          </Notice>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, href, Icon }) => (
          <li key={label}>
            <Link href={href} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-blue/40 sm:p-5">
              <Icon aria-hidden="true" className="h-5 w-5 text-brand-ink" />
              <p className="mt-3 font-display text-2xl font-bold text-navy-900 sm:text-3xl">{value}</p>
              <p className="text-xs font-medium text-slate-600 sm:text-sm">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Cleanup job health">
          {lastRun ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Last run</dt>
                <dd className="font-semibold text-navy-900">{formatIst(lastRun.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Errors in last run</dt>
                <dd className="font-semibold text-navy-900">{lastRun.failures?.length ?? 0}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Last run with errors</dt>
                <dd className="font-semibold text-navy-900">{lastFailedRun ? formatIst(lastFailedRun.startedAt) : 'None'}</dd>
              </div>
              {cronStale && (
                <div className="col-span-2">
                  <Notice kind="warning">The cleanup job hasn’t run in over an hour. Check the scheduler.</Notice>
                </div>
              )}
            </dl>
          ) : (
            <EmptyState>No runs yet. The 15-minute cleanup job is connected in step 6.</EmptyState>
          )}
        </Panel>

        <Panel title="Failed Zoom registrations">
          {zoomFailed.length === 0 ? (
            <EmptyState>None. Every paid student who is due has a Zoom link.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {zoomFailed.map((r) => (
                <li key={String(r._id)} className="flex items-start justify-between gap-3 py-2.5">
                  <span>
                    <span className="font-semibold text-navy-900">{r.name}</span>
                    <span className="block text-xs text-slate-500">{r.email}</span>
                    {r.zoomLastError && <span className="block text-xs text-red-700">{r.zoomLastError}</span>}
                  </span>
                  <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-red-600" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Access ending today" className="lg:col-span-2">
          {dueToday.length === 0 ? (
            <EmptyState>No students are due for removal today.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {dueToday.map((r) => (
                <li key={String(r._id)} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <span className="font-semibold text-navy-900">{r.name}</span> <span className="text-slate-500">· {r.email}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    Ends {formatIst(r.accessEnd)} <Badge value={r.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
