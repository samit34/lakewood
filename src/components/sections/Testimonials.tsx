import { Quote } from 'lucide-react';
import { testimonials } from '@/config/site';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

const placeholders = Array.from({ length: 3 }, () => ({
  name: 'Student name',
  role: 'Placeholder',
  text: 'Genuine student feedback will appear here once collected, with the student’s permission.',
}));

export default function Testimonials() {
  const real = testimonials.length > 0;
  const items = real ? testimonials : placeholders;

  return (
    <section aria-labelledby="t-h" className="section bg-white">
      <div className="container-x">
        <SectionHeading id="t-h" eyebrow="Student voices" title="What Students Say" />
        {!real && (
          <p className="mx-auto mt-4 w-fit rounded-full bg-amber-50 px-4 py-1.5 text-center text-sm font-semibold text-amber-800">
            Placeholders — replace with genuine, permitted feedback before launch
          </p>
        )}
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal
              as="li"
              key={i}
              delay={i * 0.08}
              className={`card flex flex-col p-7 ${real ? '' : 'border-dashed bg-slate-50/60 shadow-none'}`}
            >
              <Quote aria-hidden="true" className="h-8 w-8 text-brand-blue/40" />
              <blockquote className={`mt-4 flex-1 leading-relaxed ${real ? 'text-slate-700' : 'italic text-slate-500'}`}>
                “{t.text}”
              </blockquote>
              <footer className="mt-6 flex items-center gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-navy-900 font-display text-sm font-bold text-brand-lime">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block font-display font-semibold text-navy-900">{t.name}</span>
                  {t.role && <span className="block text-sm text-slate-500">{t.role}</span>}
                </span>
              </footer>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
