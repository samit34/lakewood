import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PRICE_LABEL } from '@/config/site';
import Footer from './Footer';
import Logo from './Logo';

/** Layout for standalone pages (policies, contact): simple header, content, site footer. */
export default function PageShell({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-navy-900"
      >
        Skip to content
      </a>
      <header className="bg-navy-900">
        <div className="container-x flex items-center justify-between gap-4 py-4">
          <Logo href="/" />
          <Link
            href="/#register"
            className="rounded-xl bg-brand-lime px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:brightness-95"
          >
            Register – {PRICE_LABEL}
          </Link>
        </div>
      </header>

      <main id="main" className="bg-white">
        <div className="container-x max-w-3xl py-10 sm:py-14">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to home
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</h1>
          {intro && <div className="mt-3 text-sm text-slate-600">{intro}</div>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
