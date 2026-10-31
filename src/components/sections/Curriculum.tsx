import { curriculum } from '@/config/site';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Curriculum() {
  return (
    <section id="learn" aria-labelledby="learn-h" className="section relative overflow-hidden bg-navy-900 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div aria-hidden="true" className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-brand-blue/25 blur-3xl" />

      <div className="container-x relative grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="learn-h"
            dark
            align="left"
            eyebrow="Curriculum"
            title="What You Will Learn"
            subtitle="A focus on practical spoken English you can use in daily life, at work and in interviews."
          />
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {curriculum.map((c, i) => (
            <Reveal
              as="li"
              key={c}
              delay={i * 0.05}
              className="glass group flex items-center gap-4 rounded-2xl p-4 transition duration-300 hover:border-brand-lime/40 hover:bg-white/10 sm:p-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-lime font-display font-bold text-navy-900 transition group-hover:scale-105">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-medium text-white/90">{c}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
