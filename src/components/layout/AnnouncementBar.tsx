'use client';

import { Sparkles } from 'lucide-react';
import { PRICE_LABEL, masterclass } from '@/config/site';
import { useSeats } from '@/lib/seats';

export default function AnnouncementBar() {
  const seats = useSeats();

  let text = `Live online Spoken English Masterclass — limited to ${masterclass.maxSeats} seats per batch`;
  if (seats.status === 'ready' && seats.live) {
    text = seats.full
      ? 'This batch is full — join the waitlist for the next one'
      : `Only ${seats.left} of ${seats.max} seats left in this batch — join for ${PRICE_LABEL}`;
  }

  return (
    <div className="bg-brand-lime text-navy-900">
      <a
        href="#register"
        className="container-x flex min-h-10 items-center justify-center gap-2 py-2 text-center text-[13px] font-semibold sm:text-sm"
      >
        <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span aria-live="polite">{text}</span>
      </a>
    </div>
  );
}
