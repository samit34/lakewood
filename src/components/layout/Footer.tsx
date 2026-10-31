import { Mail, MapPin, Phone } from 'lucide-react';
import { cacheLife } from 'next/cache';
import { site } from '@/config/site';
import Logo from './Logo';
import PolicyLinks from './PolicyLinks';

async function CopyrightYear() {
  'use cache';
  cacheLife('days');
  return <>{new Date().getFullYear()}</>;
}

export default function Footer() {
  const c = site.contact;
  const social = Object.entries(c.social).filter(([, url]) => url);

  return (
    <footer className="bg-navy-950 text-white/75">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Live online spoken English classes and IELTS & PTE guidance from {site.name}.
          </p>
        </div>

        <address className="space-y-3 text-sm not-italic">
          <p className="font-display font-semibold text-white">Contact</p>
          <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 hover:text-brand-lime">
            <Phone aria-hidden="true" className="h-4 w-4" /> {c.phone}
          </a>
          <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 break-all hover:text-brand-lime">
            <Mail aria-hidden="true" className="h-4 w-4 shrink-0" /> {c.email}
          </a>
          {c.address && (
            <p className="flex items-start gap-2.5">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> {c.address}
            </p>
          )}
          {c.hours && <p>{c.hours}</p>}
          {social.length > 0 && (
            <p className="flex gap-4 pt-1">
              {social.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="capitalize underline-offset-4 hover:underline">
                  {name}
                </a>
              ))}
            </p>
          )}
        </address>

        <PolicyLinks />
      </div>
      <div className="border-t border-white/10">
        <p className="container-x py-5 text-xs text-white/60">
          © <CopyrightYear /> {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
