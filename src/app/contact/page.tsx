import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import { LEGAL_PATHS, site } from '@/config/site';

export const metadata: Metadata = {
  title: `Contact Us | ${site.name}`,
  description: `Phone, email and address for ${site.name}. Get help with registration, payments, refunds and classes.`,
  alternates: { canonical: '/contact' },
};

const rowClass = 'flex items-start gap-3 rounded-2xl border border-slate-200 p-4 sm:p-5';
const iconClass = 'mt-0.5 h-5 w-5 shrink-0 text-brand-blue';

export default function ContactPage() {
  const c = site.contact;

  return (
    <PageShell title="Contact Us" intro={<p>Questions about classes, registration, payments or refunds? We are happy to help.</p>}>
      <address className="grid gap-3 not-italic text-slate-700">
        <p className="font-display text-lg font-semibold text-navy-900">{site.legalName}</p>
        <a href={`tel:${c.phone.replace(/\s/g, '')}`} className={`${rowClass} hover:border-brand-blue/40`}>
          <Phone aria-hidden="true" className={iconClass} />
          <span>
            <span className="block text-sm text-slate-500">Phone</span>
            <span className="font-semibold text-navy-900">{c.phone}</span>
          </span>
        </a>
        <a href={`mailto:${c.email}`} className={`${rowClass} hover:border-brand-blue/40`}>
          <Mail aria-hidden="true" className={iconClass} />
          <span className="min-w-0">
            <span className="block text-sm text-slate-500">Email</span>
            <span className="break-all font-semibold text-navy-900">{c.email}</span>
          </span>
        </a>
        {c.whatsappNumber && (
          <a href={`https://wa.me/${c.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className={`${rowClass} hover:border-brand-blue/40`}>
            <MessageCircle aria-hidden="true" className={iconClass} />
            <span>
              <span className="block text-sm text-slate-500">WhatsApp</span>
              <span className="font-semibold text-navy-900">Chat with us</span>
            </span>
          </a>
        )}
        {c.address && (
          <div className={rowClass}>
            <MapPin aria-hidden="true" className={iconClass} />
            <span>
              <span className="block text-sm text-slate-500">Address</span>
              <span className="font-semibold text-navy-900">{c.address}</span>
            </span>
          </div>
        )}
        {c.hours && (
          <div className={rowClass}>
            <Clock aria-hidden="true" className={iconClass} />
            <span>
              <span className="block text-sm text-slate-500">Working hours</span>
              <span className="font-semibold text-navy-900">{c.hours}</span>
            </span>
          </div>
        )}
      </address>

      <div className="mt-8 space-y-3 text-[15px] leading-relaxed text-slate-700">
        <p>
          For payment or refund questions, please include your name, the email you registered with and your Razorpay payment ID. See our{' '}
          <Link href={LEGAL_PATHS.refund} className="font-semibold text-brand-ink underline">
            Refund &amp; Cancellation Policy
          </Link>
          .
        </p>
        <p>
          Ready to join?{' '}
          <Link href="/#register" className="font-semibold text-brand-ink underline">
            Reserve your seat
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
