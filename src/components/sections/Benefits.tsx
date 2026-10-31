import { benefits } from '@/config/site';
import Icon from '@/components/ui/Icon';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Benefits() {
  return (
    <section aria-labelledby="benefits-h" className="section bg-white">
      <div className="container-x">
        <SectionHeading
          id="benefits-h"
          eyebrow="Why join"
          title="What Can You Gain From This Masterclass?"
          subtitle="Clear learning goals for every session — your progress grows with your own practice."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <Reveal as="li" key={b.title} delay={(i % 3) * 0.08} className="group card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-brand-lime transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon name={b.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">{b.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{b.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
