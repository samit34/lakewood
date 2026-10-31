import type { ReactNode } from 'react';
import Reveal from './Reveal';

type Props = {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  dark?: boolean;
  align?: 'center' | 'left';
};

export default function SectionHeading({ id, eyebrow, title, subtitle, dark = false, align = 'center' }: Props) {
  const center = align === 'center';
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      {eyebrow && <p className={`eyebrow ${dark ? 'text-brand-lime' : 'text-brand-ink'}`}>{eyebrow}</p>}
      <h2
        id={id}
        className={`mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-navy-900'}`}
      >
        {title}
      </h2>
      {subtitle && <p className={`mt-4 text-base sm:text-lg ${dark ? 'text-white/75' : 'text-slate-600'}`}>{subtitle}</p>}
    </Reveal>
  );
}
