import { MessageCircle } from 'lucide-react';
import { PRICE_LABEL, site } from '@/config/site';

/** Renders only when site.contact.whatsappNumber is configured. */
export default function WhatsAppButton() {
  const n = site.contact.whatsappNumber.replace(/\D/g, '');
  if (n.length < 10) return null;
  const text = encodeURIComponent(`Hello ${site.name}, I have a question about the ${PRICE_LABEL} Spoken English Masterclass.`);
  return (
    <a
      href={`https://wa.me/${n}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105 md:bottom-6"
    >
      <MessageCircle aria-hidden="true" className="h-7 w-7" />
    </a>
  );
}
