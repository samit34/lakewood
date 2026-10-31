'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { faqs, site } from '@/config/site';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-h" className="section bg-slate-50">
      <div className="container-x max-w-3xl">
        <SectionHeading id="faq-h" eyebrow="Got questions?" title="Frequently Asked Questions" />
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`rounded-2xl border bg-white transition-shadow duration-300 ${isOpen ? 'border-brand-blue/30 shadow-card' : 'border-slate-200/70'}`}
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-btn-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left font-display font-semibold text-navy-900 sm:p-6"
                  >
                    {f.q}
                    <span
                      aria-hidden="true"
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition duration-300 ${
                        isOpen ? 'rotate-45 bg-brand-lime text-navy-900' : 'bg-slate-100 text-navy-900'
                      }`}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-btn-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-6 leading-relaxed text-slate-600 sm:px-6">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-slate-600">
          Still have a question? Call{' '}
          <a className="font-semibold text-brand-ink underline-offset-4 hover:underline" href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>
            {site.contact.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
