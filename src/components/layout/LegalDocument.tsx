import Link from 'next/link';
import { legal, legalUpdated, type LegalPage } from '@/config/site';
import PageShell from './PageShell';

export default function LegalDocument({ page }: { page: LegalPage }) {
  const doc = legal[page];

  return (
    <PageShell title={doc.title} intro={<p>Last updated: {legalUpdated}</p>}>
      <div className="space-y-8 text-[15px] leading-relaxed text-slate-700">
        {doc.sections.map((section, i) => (
          <section key={section.heading ?? i}>
            {section.heading && <h2 className="font-display text-xl font-semibold text-navy-900">{section.heading}</h2>}
            <div className={`space-y-3 ${section.heading ? 'mt-3' : ''}`}>
              {section.body.map((item, j) =>
                typeof item === 'string' ? (
                  <p key={j}>{item}</p>
                ) : (
                  <ul key={j} className="list-disc space-y-1.5 pl-5">
                    {item.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
        Need help?{' '}
        <Link href="/contact" className="font-semibold text-brand-ink underline">
          Contact us
        </Link>
        .
      </p>
    </PageShell>
  );
}
