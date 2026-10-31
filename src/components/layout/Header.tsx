'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PRICE_LABEL } from '@/config/site';
import CtaLink from '@/components/ui/CtaLink';
import Logo from './Logo';

const links = [
  ['Home', 'home'],
  ['Masterclass', 'masterclass'],
  ["What You'll Learn", 'learn'],
  ['About Us', 'about'],
  ['IELTS & PTE', 'exams'],
  ['FAQs', 'faq'],
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const burger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the nav item for the section currently in view
  useEffect(() => {
    const els = links.map(([, id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        burger.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled || open ? 'bg-navy-900/90 shadow-lg shadow-navy-950/20 backdrop-blur-xl' : 'bg-navy-900'
      }`}
    >
      <nav aria-label="Main" className="container-x flex h-16 items-center justify-between gap-3 md:h-[72px]">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map(([label, id]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? 'true' : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active === id ? 'bg-white/10 text-white' : 'text-white/75 hover:text-white'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <CtaLink location="header" arrow={false} className="btn-primary min-h-[44px] whitespace-nowrap px-4 py-2 text-sm sm:px-5">
            Join for {PRICE_LABEL}
          </CtaLink>
          <button
            ref={burger}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/10 lg:hidden"
          >
            <ul className="container-x py-3">
              {links.map(([label, id]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-xl px-3 font-medium text-white/90 hover:bg-white/10"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
