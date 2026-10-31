import type { Metadata } from 'next';
import { EmptyState, PageHeader, Panel, Select, Table, btn, td } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import { AuditLog } from '@/lib/server/models';
import { formatIst } from '@/lib/time';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Audit log' };

const short = (v: unknown) => (v == null ? '' : JSON.stringify(v).slice(0, 400));

export default async function AuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireAdmin({ owner: true });
  const { action: rawAction } = await searchParams;
  const actions: string[] = await AuditLog.distinct('action');
  const action = typeof rawAction === 'string' && actions.includes(rawAction) ? rawAction : '';
  const rows = await AuditLog.find(action ? { action } : {}).sort({ createdAt: -1 }).limit(300).lean();

  return (
    <>
      <PageHeader title="Audit log" subtitle="Logins, password changes, batch and student changes, and Zoom actions. Newest first (last 300)." />
      <Panel>
        <form className="mb-5 flex flex-wrap gap-3">
          <Select name="action" defaultValue={action} aria-label="Filter by action" className="max-w-xs">
            <option value="">All actions</option>
            {actions.sort().map((a) => (
              <option key={a} value={a}>
                {a.replaceAll('_', ' ')}
              </option>
            ))}
          </Select>
          <button type="submit" className={btn.secondary}>
            Filter
          </button>
        </form>
        {rows.length === 0 ? (
          <EmptyState>No entries yet.</EmptyState>
        ) : (
          <Table head={['When', 'Who', 'Action', 'Target', 'Details', 'IP']}>
            {rows.map((r) => (
              <tr key={String(r._id)} className="align-top">
                <td className={`${td} whitespace-nowrap text-xs`}>{formatIst(r.createdAt)}</td>
                <td className={`${td} font-semibold text-navy-900`}>{r.actor}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <span className={r.action.includes('failed') || r.action.includes('locked') ? 'font-semibold text-red-700' : ''}>{r.action.replaceAll('_', ' ')}</span>
                </td>
                <td className={td}>{r.target}</td>
                <td className={`${td} max-w-xs`}>
                  {(r.before != null || r.after != null) && (
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-brand-ink">Show</summary>
                      {r.before != null && <p className="mt-1 break-all font-mono text-[11px] text-slate-500">before: {short(r.before)}</p>}
                      {r.after != null && <p className="mt-1 break-all font-mono text-[11px] text-slate-700">after: {short(r.after)}</p>}
                    </details>
                  )}
                </td>
                <td className={`${td} whitespace-nowrap text-xs text-slate-500`}>{r.ip ?? ''}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
