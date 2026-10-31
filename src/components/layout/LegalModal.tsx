'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { legal, type LegalPage } from '@/config/site';
import { LEGAL_EVENT } from '@/lib/events';

// Shareable URLs for Razorpay review: /#privacy-policy, /#terms, /#refund-policy
export const LEGAL_HASH: Record<LegalPage, string> = {
  privacy: 'privacy-policy',
  terms: 'terms',
  refund: 'refund-policy',
};

const pageFromHash = (hash: string) =>
  (Object.keys(LEGAL_HASH) as LegalPage[]).find((k) => `#${LEGAL_HASH[k]}` === hash) ?? null;

/** A native <dialog> gives us focus trapping, Escape-to-close and inert background for free. */
export default function LegalModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState<LegalPage | null>(null);

  const open = useCallback((p: LegalPage) => {
    setPage(p);
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  useEffect(() => {
    const onEvent = (e: Event) => open((e as CustomEvent<LegalPage>).detail);
    const onHash = () => {
      const p = pageFromHash(window.location.hash);
      if (p) open(p);
    };
    onHash();
    window.addEventListener(LEGAL_EVENT, onEvent);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener(LEGAL_EVENT, onEvent);
      window.removeEventListener('hashchange', onHash);
    };
  }, [open]);

  const onClose = () => {
    if (pageFromHash(window.location.hash)) history.replaceState(null, '', window.location.pathname + window.location.search);
    setPage(null);
  };

  const doc = page ? legal[page] : null;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="legal-title"
      className="m-auto w-[min(92vw,640px)] rounded-3xl outline-none bg-white p-0 text-slate-700 shadow-2xl backdrop:bg-navy-950/70 backdrop:backdrop-blur-sm"
    >
      {doc && (
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="legal-title" className="font-display text-2xl font-bold text-navy-900">
              {doc.title}
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-navy-900 hover:bg-slate-200"
              aria-label="Close"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Draft — replace with the institute’s approved policy before going live.
          </p>
          <div className="mt-5 space-y-4 leading-relaxed">
            {doc.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}
    </dialog>
  );
}
