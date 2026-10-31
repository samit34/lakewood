'use client';

import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { useSeats } from '@/lib/seats';

type Props = {
  location: string;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
};

/** The single lime call-to-action. Switches to a waitlist label when the batch is full. */
export default function CtaLink({ location, children, className = 'btn-primary', arrow = true }: Props) {
  const seats = useSeats();
  const full = seats.status === 'ready' && seats.full;
  return (
    <a href="#register" className={className} onClick={() => track('cta_click', { location, full })}>
      {full ? 'Batch full – join the waitlist' : children}
      {arrow && <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
    </a>
  );
}
