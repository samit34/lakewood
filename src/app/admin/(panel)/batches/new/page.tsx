import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, Panel } from '@/components/admin/ui';
import { masterclass } from '@/config/site';
import { requireAdmin } from '@/lib/server/auth';
import BatchForm from '../BatchForm';

// Admin data is per-session and always read on the server.
export const instant = false;

export const metadata: Metadata = { title: 'New batch' };

export default async function NewBatchPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/batches" className="text-sm font-semibold text-brand-ink hover:underline">
        ← All batches
      </Link>
      <div className="mt-3">
        <PageHeader title="New batch" />
      </div>
      <Panel>
        <BatchForm
          initial={{
            name: '',
            startDate: '',
            endDate: '',
            classTime: '19:00',
            durationMinutes: 60,
            daysOfWeek: [1, 2, 3, 4, 5],
            priceInr: masterclass.priceInr,
            maxSeats: masterclass.maxSeats,
            status: 'draft',
            zoomMeetingId: '',
            createZoomMeeting: false,
          }}
        />
      </Panel>
    </>
  );
}
