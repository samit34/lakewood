'use client';

import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PRICE_LABEL, masterclass } from '@/config/site';
import { usePrefersReducedMotion } from '@/lib/use-reduced-motion';

const messages = [
  { from: 'trainer', text: 'Hi! How was your day?' },
  { from: 'student', text: 'It was great, thank you! I spoke confidently in my meeting today.' },
  { from: 'trainer', text: 'Excellent sentence! Let’s practise a few more together.' },
  { from: 'student', text: 'Yes, I’m ready!' },
] as const;

const STEP_MS = 1700;
const HOLD_MS = 3200;

export default function ChatIllustration() {
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-80px' });
  const [step, setStep] = useState(1);
  // Reduced motion: show the whole conversation, no looping
  const shown = reduce ? messages.length : step;
  const typing = !reduce && inView && shown < messages.length;

  useEffect(() => {
    if (reduce || !inView) return;
    const done = step >= messages.length;
    const t = setTimeout(() => setStep(done ? 0 : step + 1), done ? HOLD_MS : step === 0 ? 500 : STEP_MS);
    return () => clearTimeout(t);
  }, [step, inView, reduce]);

  const nextFrom = messages[shown]?.from;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[420px]">
      <div aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-blue/40 via-brand-blue/10 to-brand-lime/20 blur-2xl" />

      <figure
        aria-label="Illustration: a trainer and a student chatting in English during a live class"
        className="glass relative overflow-hidden rounded-[2rem] p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-lime font-display text-sm font-bold text-navy-900" aria-hidden="true">
            LW
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-white">Spoken English Class</p>
            <p className="flex items-center gap-1.5 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" /> Live now
            </p>
          </div>
          <Video aria-hidden="true" className="ml-auto h-5 w-5 text-white/70" />
        </div>

        {/* Fixed height prevents layout shift while messages animate in */}
        <ul className="flex h-[300px] flex-col justify-end gap-3 pt-4" aria-hidden="true">
          <AnimatePresence initial={false}>
            {messages.slice(0, shown).map((m, i) => (
              <motion.li
                key={i}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm font-medium leading-snug shadow-lg ${
                  m.from === 'trainer'
                    ? 'self-start rounded-bl-md bg-white text-navy-900'
                    : 'self-end rounded-br-md bg-brand-lime text-navy-900'
                }`}
              >
                {m.text}
              </motion.li>
            ))}
            {typing && nextFrom && (
              <motion.li
                key="typing"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex gap-1 rounded-2xl px-4 py-3.5 ${nextFrom === 'trainer' ? 'self-start bg-white/90' : 'self-end bg-brand-lime/90'}`}
              >
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-navy-900/60"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </motion.li>
            )}
          </AnimatePresence>
        </ul>
      </figure>

      <div aria-hidden="true" className="absolute -left-4 top-24 hidden animate-float rounded-2xl bg-white px-3.5 py-2.5 shadow-lift sm:block">
        <p className="font-display text-xs font-bold text-navy-900">Live on {masterclass.schedule.platform}</p>
      </div>
      <div aria-hidden="true" className="absolute -bottom-8 -right-3 animate-float rounded-2xl bg-navy-900 px-4 py-3 shadow-lift ring-1 ring-white/15 [animation-delay:1.5s]">
        <p className="font-display text-lg font-bold leading-none text-brand-lime">{PRICE_LABEL}</p>
        <p className="mt-1 text-[11px] text-white/75">{masterclass.accessDays} days access</p>
      </div>
    </div>
  );
}
