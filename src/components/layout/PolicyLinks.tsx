'use client';

import { legal, type LegalPage } from '@/config/site';
import { LEGAL_EVENT } from '@/lib/events';
import { LEGAL_HASH } from './LegalModal';

export default function PolicyLinks() {
  return (
    <nav aria-label="Policies" className="space-y-3 text-sm">
      <p className="font-display font-semibold text-white">Policies</p>
      {(Object.keys(legal) as LegalPage[]).map((p) => (
        <a
          key={p}
          href={`#${LEGAL_HASH[p]}`}
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(LEGAL_EVENT, { detail: p }));
          }}
          className="block hover:text-brand-lime"
        >
          {legal[p].title}
        </a>
      ))}
    </nav>
  );
}
