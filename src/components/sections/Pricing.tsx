import { Check, Lock } from 'lucide-react';
import { PRICE_LABEL, masterclass, priceBenefits } from '@/config/site';
import CtaLink from '@/components/ui/CtaLink';
import Reveal from '@/components/ui/Reveal';
import SeatMeter from '@/components/ui/SeatMeter';

export default function Pricing() {
  return (
    <section id="masterclass" aria-labelledby="price-h" className="section bg-slate-50">
      <div className="container-x">
        <Reveal className="relative mx-auto max-w-xl">
          <div aria-hidden="true" className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-br from-brand-lime/60 via-brand-blue/40 to-navy-700/30 blur-xl" />
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 p-7 text-white shadow-2xl sm:p-10">
            <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-60" />
            <div className="relative">
              <p className="eyebrow text-brand-lime">Live online</p>
              <h2 id="price-h" className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                Lakewood {masterclass.title}
              </h2>

              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold tracking-tight sm:text-7xl">{PRICE_LABEL}</span>
                <span className="text-white/70">one-time · {masterclass.accessDays} days access</span>
              </p>

              <ul className="mt-7 space-y-3">
                {priceBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-lime text-navy-900">
                      <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-white/90">{b}</span>
                  </li>
                ))}
              </ul>

              <SeatMeter />

              <CtaLink location="pricing" className="btn-primary mt-7 w-full">
                Reserve my seat — {PRICE_LABEL}
              </CtaLink>
              <p className="mt-4 text-center text-sm text-white/70">
                <Lock aria-hidden="true" className="mr-1.5 inline h-4 w-4 align-[-2px]" />
                Secure payment via Razorpay. Seat confirmed after payment verification.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
