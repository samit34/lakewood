import Image from 'next/image';
import { Award, BookMarked, Clock, GraduationCap, MapPin, User } from 'lucide-react';
import { about, site } from '@/config/site';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

const facts = [
  { Icon: User, label: 'Trainer', value: about.trainerName },
  { Icon: Clock, label: 'Teaching experience', value: about.experience },
  { Icon: GraduationCap, label: 'Qualifications', value: about.qualifications },
  { Icon: BookMarked, label: 'Teaching methodology', value: about.methodology },
  { Icon: MapPin, label: 'Location', value: about.location },
  { Icon: Award, label: 'Achievements', value: about.achievements },
];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-h" className="section bg-white">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal className="relative mx-auto w-full max-w-[280px] sm:max-w-sm lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-3 rotate-2 rounded-[2.2rem] bg-gradient-to-br from-brand-lime/50 to-brand-blue/30" />
          {site.images.trainer ? (
            <Image
              src={site.images.trainer}
              alt={about.trainerName ? `${about.trainerName}, trainer at ${site.name}` : `Trainer at ${site.name}`}
              width={600}
              height={700}
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="relative aspect-[6/7] w-full rounded-[2rem] object-cover shadow-lift"
            />
          ) : (
            <div
              role="img"
              aria-label="Trainer photo placeholder"
              className="relative grid aspect-[6/7] w-full place-items-center rounded-[2rem] bg-navy-900 text-center text-white/60 shadow-lift"
            >
              <span>
                <User aria-hidden="true" className="mx-auto h-16 w-16 text-white/30" />
                <span className="mt-3 block text-sm">Trainer photo — add in config/site.ts</span>
              </span>
            </div>
          )}
        </Reveal>

        <div>
          <SectionHeading
            id="about-h"
            align="left"
            eyebrow="About us"
            title={`Learn With ${site.name}`}
            subtitle={about.intro}
          />
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {facts.map(({ Icon, label, value }, i) => (
              <Reveal key={label} delay={i * 0.05} className="flex gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" />
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className={`mt-1 ${value ? 'font-medium text-navy-900' : 'italic text-slate-500'}`}>{value || 'To be added'}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
