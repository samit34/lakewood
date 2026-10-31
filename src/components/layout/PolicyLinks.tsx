import Link from 'next/link';
import { LEGAL_PATHS, legal, type LegalPage } from '@/config/site';

export default function PolicyLinks() {
  return (
    <nav aria-label="Policies" className="space-y-3 text-sm">
      <p className="font-display font-semibold text-white">Policies</p>
      {(Object.keys(LEGAL_PATHS) as LegalPage[]).map((p) => (
        <Link key={p} href={LEGAL_PATHS[p]} className="block hover:text-brand-lime">
          {legal[p].title}
        </Link>
      ))}
      <Link href="/contact" className="block hover:text-brand-lime">
        Contact Us
      </Link>
    </nav>
  );
}
