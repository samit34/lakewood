'use client';

import { ArrowRight, Check } from 'lucide-react';
import { PRICE_LABEL, exams } from '@/config/site';
import { track } from '@/lib/analytics';
import { selectGoal } from '@/lib/events';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Exams() {
  return (
    <section id="exams" aria-labelledby="exam-h" className="section bg-slate-50">
      <div className="container-x">
        <SectionHeading
          id="exam-h"
          eyebrow="Beyond spoken English"
          title="Ready for Your Next English Goal?"
          subtitle={`IELTS and PTE preparation are separate courses and are not included in the ${PRICE_LABEL} masterclass. Send an enquiry and we’ll get in touch.`}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {(['ielts', 'pte'] as const).map((k, i) => (
            <Reveal key={k} delay={i * 0.1} className="card group relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8">
              <span aria-hidden="true" className="absolute -bottom-6 -right-3 font-display text-[6.5rem] font-bold leading-none text-slate-100 transition group-hover:text-brand-blue/10">
                {k.toUpperCase()}
              </span>
              <div className="relative">
                <h3 className="font-display text-xl font-bold text-navy-900">{exams[k].title}</h3>
                <ul className="mt-5 space-y-3 text-slate-600">
                  {exams[k].points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-outline mt-7"
                  onClick={() => {
                    track('cta_click', { location: `${k}_enquiry` });
                    selectGoal(k);
                  }}
                >
                  Enquire about {k.toUpperCase()} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
