'use client';

import { useEffect, useState } from 'react';
import { PRICE_LABEL } from '@/config/site';
import CtaLink from '@/components/ui/CtaLink';

/** Sticky bottom CTA on phones. Hidden while the registration form itself is on screen. */
export default function MobileCtaBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const form = document.getElementById('register');
    if (!form) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.15 });
    io.observe(form);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-900/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          hidden ? 'translate-y-full' : 'translate-y-0'
        }`}
        aria-hidden={hidden}
        inert={hidden}
      >
        <CtaLink location="sticky_mobile" className="btn-primary w-full">
          Join the Masterclass — {PRICE_LABEL}
        </CtaLink>
      </div>
      <div className="h-20 md:hidden" aria-hidden="true" />
    </>
  );
}
