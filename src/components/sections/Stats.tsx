'use client';

import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { PRICE_LABEL, masterclass, stats } from '@/config/site';

type Stat = { value: string; label: string; count?: number; suffix?: string };

const items: Stat[] = [
  ...(stats.learnersCount > 0 ? [{ value: `${stats.learnersCount}+`, count: stats.learnersCount, suffix: '+', label: 'learners joined' }] : []),
  { value: 'Live', label: `online classes on ${masterclass.schedule.platform}` },
  { value: PRICE_LABEL, label: 'one-time fee' },
  { value: `${masterclass.accessDays}`, count: masterclass.accessDays, suffix: ' days', label: 'of access' },
  { value: `${masterclass.maxSeats}`, count: masterclass.maxSeats, label: 'seats per batch' },
];

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(to);

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration: 1.2, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section aria-label="Masterclass at a glance" className="relative z-10 -mt-10 px-5">
      <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-lift ring-1 ring-slate-200 md:auto-cols-fr md:grid-flow-col md:grid-cols-none">
        {items.map((s) => (
          <li key={s.label} className="bg-white px-4 py-5 text-center odd:last:col-span-2 sm:py-6 md:odd:last:col-span-1">
            <p className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">
              {s.count ? <CountUp to={s.count} suffix={s.suffix} /> : s.value}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">{s.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
