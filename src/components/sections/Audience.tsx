import { PRICE_LABEL, audience } from '@/config/site';
import CtaLink from '@/components/ui/CtaLink';
import Icon from '@/components/ui/Icon';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Audience() {
  return (
    <section aria-labelledby="aud-h" className="section relative overflow-hidden bg-slate-50">
      <div aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="container-x relative">
        <SectionHeading id="aud-h" eyebrow="Your English learning journey starts here" title="Who Is This Masterclass For?" />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((a, i) => (
            <Reveal as="li" key={a.text} delay={i * 0.08} className="card relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-blue/10 text-brand-ink">
                <Icon name={a.icon} className="h-6 w-6" />
              </span>
              <p className="mt-5 font-display font-semibold leading-snug text-navy-900">{a.text}</p>
            </Reveal>
          ))}
        </ul>
        <Reveal className="mt-12 text-center">
          <CtaLink location="audience">Start Learning for {PRICE_LABEL}</CtaLink>
        </Reveal>
      </div>
    </section>
  );
}
