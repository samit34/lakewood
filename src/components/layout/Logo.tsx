export default function Logo({ dark = false, href = '#home' }: { dark?: boolean; href?: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5"
      aria-label={href === '#home' ? 'Lakewood IELTS Institute — back to top' : 'Lakewood IELTS Institute — home page'}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-lime shadow-glow" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="h-6 w-6">
          <path d="M20 14v32h26" fill="none" stroke="#0a1433" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`font-display leading-none ${dark ? 'text-navy-900' : 'text-white'}`}>
        <span className="block text-lg font-bold tracking-tight">Lakewood</span>
        <span
          className={`mt-1 block whitespace-nowrap text-[9px] font-semibold tracking-[0.16em] sm:text-[10px] sm:tracking-[0.22em] ${dark ? 'text-slate-500' : 'text-white/70'}`}
        >
          IELTS INSTITUTE
        </span>
      </span>
    </a>
  );
}
