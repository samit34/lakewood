import { audit } from '@/lib/server/audit';
import { adminApi } from '@/lib/server/auth';
import { Batch, Enquiry, Registration, Waitlist } from '@/lib/server/models';
import { json } from '@/lib/server/request';

// Spreadsheet apps execute cells starting with these characters as formulas (CSV injection).
const cell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

export const GET = adminApi<{ kind: string }>(async (_req, { doc, meta }, { kind }) => {
  let csv: string;
  if (kind === 'students') {
    const [regs, batches] = await Promise.all([Registration.find().sort({ createdAt: -1 }).lean(), Batch.find().lean()]);
    const names = new Map(batches.map((b) => [String(b._id), b.name]));
    csv = toCsv(
      ['Name', 'Phone', 'Email', 'Batch', 'Status', 'Amount (INR)', 'Paid at', 'Access start', 'Access end', 'Registered on Zoom', 'Removed from Zoom', 'Razorpay order', 'Razorpay payment', 'Created'],
      regs.map((r) => [r.name, r.phone, r.email, names.get(String(r.batchId)) ?? '', r.status, (r.amountPaise ?? 0) / 100, r.paidAt, r.accessStart, r.accessEnd, r.registeredOnZoomAt, r.removedFromZoomAt, r.razorpayOrderId, r.razorpayPaymentId, r.createdAt]),
    );
  } else if (kind === 'enquiries') {
    const rows = await Enquiry.find().sort({ createdAt: -1 }).lean();
    csv = toCsv(['Name', 'Phone', 'Email', 'Goal', 'Created'], rows.map((r) => [r.name, r.phone, r.email, r.goal.toUpperCase(), r.createdAt]));
  } else if (kind === 'waitlist') {
    const rows = await Waitlist.find().sort({ createdAt: -1 }).lean();
    csv = toCsv(['Name', 'Phone', 'Email', 'Created'], rows.map((r) => [r.name, r.phone, r.email, r.createdAt]));
  } else {
    return json(404, { error: 'not_found' });
  }

  await audit(doc, 'csv_exported', { target: kind, meta });
  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lakewood-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
