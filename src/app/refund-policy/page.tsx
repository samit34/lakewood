import type { Metadata } from 'next';
import LegalDocument from '@/components/layout/LegalDocument';
import { legal, site } from '@/config/site';

export const metadata: Metadata = {
  title: `${legal.refund.title} | ${site.name}`,
  description: legal.refund.description,
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return <LegalDocument page="refund" />;
}
