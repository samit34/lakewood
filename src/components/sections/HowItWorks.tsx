import { ClipboardList, CreditCard, Video } from 'lucide-react';
import { PRICE_LABEL, masterclass } from '@/config/site';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

const steps = [
  { Icon: ClipboardList, title: 'Register', text: 'Fill in the short form with your name, mobile number and email.' },
  { Icon: CreditCard, title: `Pay ${PRICE_LABEL}`, text: 'Pay securely with UPI, card, netbanking or wallet via Razorpay.' },
  {
    Icon: Video,
    title: 'Join the live class',
    text: `Get your personal ${masterclass.schedule.platform} link by email and join every session for ${masterclass.accessDays} days.`,
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-h" className="section bg-white">
      <div className="container-x">
        <SectionHeading id="how-h" eyebrow="Simple 3-step process" title="How the Masterclass Works" />
        <div className="relative mt-14">
          <div aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-8 hidden border-t-2 border-dashed border-slate-200 md:block" />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map(({ Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.12} className="relative text-center">
                <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-navy-900 text-brand-lime shadow-lift">
                  <Icon aria-hidden="true" className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-brand-lime font-display text-xs font-bold text-navy-900 ring-4 ring-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-600">{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
