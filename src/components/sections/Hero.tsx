import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { PRICE_LABEL, masterclass } from '@/config/site';
import ChatIllustration from '@/components/ui/ChatIllustration';
import CtaLink from '@/components/ui/CtaLink';

const points = ['Live classes on Zoom', 'Personal joining link', `${masterclass.accessDays} days access`];

export default function Hero() {
  return (
    <section id="home" aria-labelledby="hero-h" className="relative overflow-hidden bg-navy-900 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div aria-hidden="true" className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-blue/35 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-navy-700 blur-3xl" />

      <div className="container-x relative grid items-center gap-14 pb-20 pt-10 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
        <div>
          <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[10px] tracking-[0.14em] text-brand-lime sm:text-xs sm:tracking-[0.2em]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-lime" aria-hidden="true" />
            Lakewood IELTS Institute presents
          </p>

          <h1 id="hero-h" className="mt-5 font-display text-[2.1rem] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Stop Hesitating. <span className="text-brand-lime">Start Speaking English</span> with Confidence!
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Join our live online Spoken English Masterclass and learn practical ways to improve everyday conversations, form
            better sentences, and express yourself more confidently.
          </p>

          <div className="glass mt-8 max-w-md rounded-3xl p-5 shadow-2xl sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-[11px] text-brand-lime">Live online masterclass</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold">{PRICE_LABEL}</span>
                  <span className="whitespace-nowrap text-sm text-white/70">one-time</span>
                </p>
              </div>
              <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 min-[400px]:flex">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-brand-lime" /> Razorpay secure
              </span>
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/85">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-brand-lime" /> {p}
                </li>
              ))}
            </ul>
            <CtaLink location="hero" className="btn-primary mt-5 w-full">
              Join the Masterclass — {PRICE_LABEL}
            </CtaLink>
          </div>

          <a href="#exams" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline">
            Explore our IELTS & PTE courses →
          </a>
        </div>

        <ChatIllustration />
      </div>
    </section>
  );
}
