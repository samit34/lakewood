import { isValidObjectId } from 'mongoose';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Notice, PageHeader, Panel } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/server/auth';
import { findOverlaps, serializeBatch } from '@/lib/server/batches';
import { Batch, Registration, type BatchDoc } from '@/lib/server/models';
import BatchForm from '../BatchForm';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'Edit batch' };

export default async function EditBatchPage({ params, searchParams }: PageProps<'/admin/batches/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!isValidObjectId(id)) notFound();
  const doc = await Batch.findById(id).lean<BatchDoc>();
  if (!doc) notFound();
  const b = serializeBatch(doc);
  const [overlaps, students] = await Promise.all([findOverlaps(b, doc._id), Registration.countDocuments({ batchId: doc._id })]);

  return (
    <>
      <Link href="/admin/batches" className="text-sm font-semibold text-brand-ink hover:underline">
        ← All batches
      </Link>
      <div className="mt-3">
        <PageHeader
          title={b.name}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <Badge value={b.status} /> {b.seatsTaken}/{b.maxSeats} seats taken ·{' '}
              <Link href={`/admin/students?batch=${b.id}`} className="font-semibold text-brand-ink hover:underline">
                {students} student record{students === 1 ? '' : 's'}
              </Link>
            </span>
          }
        />
      </div>
      <div className="space-y-4">
        {saved && <Notice kind="success">Batch created.</Notice>}
        {overlaps.length > 0 && (
          <Notice kind="warning">
            Class times clash with: {overlaps.join(', ')}. One Zoom licence can host only one meeting at a time, so change the time or use a different Zoom host.
          </Notice>
        )}
        <Panel>
          <BatchForm
            id={b.id}
            seatsTaken={b.seatsTaken}
            initial={{
              name: b.name,
              startDate: b.startDate,
              endDate: b.endDate,
              classTime: b.classTime,
              durationMinutes: b.durationMinutes,
              daysOfWeek: b.daysOfWeek,
              priceInr: b.priceInr,
              maxSeats: b.maxSeats,
              status: b.status,
              zoomMeetingId: b.zoomMeetingId,
              createZoomMeeting: false,
            }}
          />
        </Panel>
      </div>
    </>
  );
}
