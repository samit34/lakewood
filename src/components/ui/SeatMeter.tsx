'use client';

import { motion } from 'framer-motion';
import { masterclass } from '@/config/site';
import { useSeats } from '@/lib/seats';

/** Seats-left bar. Only shows a number when it comes from the live database count. */
export default function SeatMeter() {
  const seats = useSeats();
  const live = seats.status === 'ready' && seats.live;
  const pct = live ? Math.min(100, Math.round((seats.taken / seats.max) * 100)) : 0;

  return (
    <div className="mt-7 min-h-[52px] rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      {live ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white">{seats.full ? 'Batch full' : `${seats.left} seats left`}</span>
            <span className="text-white/70">of {seats.max}</span>
          </div>
          <div
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Seats filled"
            aria-valuemin={0}
            aria-valuemax={seats.max}
            aria-valuenow={seats.taken}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-lime to-emerald-300"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(pct, 3)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-white/80">Limited to {masterclass.maxSeats} seats per batch.</p>
      )}
    </div>
  );
}
