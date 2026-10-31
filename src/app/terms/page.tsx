import type { Metadata } from 'next';
import LegalDocument from '@/components/layout/LegalDocument';
import { legal, site } from '@/config/site';

export const metadata: Metadata = {
  title: `${legal.terms.title} | ${site.name}`,
  description: legal.terms.description,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalDocument page="terms" />;
}
