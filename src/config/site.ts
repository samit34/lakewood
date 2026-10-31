// ===========================================================================
// CENTRAL CONFIG — edit this file to change prices, dates, trainer facts,
// testimonials, FAQs and contact details. No component changes needed.
//
// Rule of thumb: leave a value empty ('' / 0 / []) if it is not confirmed.
// The page then shows a neutral placeholder or hides that element.
// Never put invented facts, reviews or ratings here.
// ===========================================================================

export const site = {
  name: 'Lakewood IELTS Institute',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  description:
    'Live online Spoken English Masterclass on Zoom for just ₹99. Build speaking confidence, form better sentences and practise everyday conversations with Lakewood IELTS Institute.',

  contact: {
    phone: '+91 97794 40704',
    email: 'lakewoodieltsinstitute@gmail.com',
    address: '', // shown in the footer only when filled
    hours: '', // e.g. 'Mon–Sat, 10am–6pm'
    // Digits with country code, e.g. '919779440704'. Floating WhatsApp button appears only when set.
    whatsappNumber: '',
    social: { instagram: '', facebook: '', youtube: '' } as Record<string, string>,
  },

  images: {
    // Put files in /public/images and reference like '/images/trainer.webp'. Empty = styled placeholder.
    trainer: '',
  },
};

export const masterclass = {
  title: 'Spoken English Masterclass',
  priceInr: 99,
  accessDays: 30,
  maxSeats: 100, // Zoom Pro limit
  renewalReminderDaysBefore: 3,
  // Shown in the FAQ, emails and the confirmation screen. Leave empty until confirmed.
  schedule: {
    startDate: '', // e.g. '3 November 2026'
    days: '', // e.g. 'Monday to Friday'
    time: '', // e.g. '7:00 PM – 8:00 PM'
    timezone: 'IST',
    platform: 'Zoom',
  },
};

export const PRICE_LABEL = `₹${masterclass.priceInr}`;

// Social-proof strip under the hero. Only add numbers you can stand behind.
// Set learnersCount to a real number (e.g. 50) to show "50+ learners"; 0 hides it.
export const stats = {
  learnersCount: 0,
};

export type IconName =
  | 'chat' | 'puzzle' | 'mic' | 'book' | 'search' | 'calendar'
  | 'student' | 'briefcase' | 'building' | 'sprout';

export const benefits: { icon: IconName; title: string; text: string }[] = [
  { icon: 'chat', title: 'Everyday English Conversations', text: 'Learn useful expressions for common, real-life situations.' },
  { icon: 'puzzle', title: 'Sentence Formation', text: 'Practise building clearer, more natural English sentences.' },
  { icon: 'mic', title: 'Speaking Confidence', text: 'Reduce hesitation through guided, supportive speaking practice.' },
  { icon: 'book', title: 'Useful Vocabulary', text: 'Pick up practical words and expressions for daily communication.' },
  { icon: 'search', title: 'Common Speaking Mistakes', text: 'Understand frequent grammar and sentence-formation errors — and fix them.' },
  { icon: 'calendar', title: 'A Practical Learning Routine', text: 'Discover simple ways to keep practising English consistently.' },
];

export const audience: { icon: IconName; text: string }[] = [
  { icon: 'student', text: 'Students who hesitate while speaking English.' },
  { icon: 'briefcase', text: 'Job seekers preparing for interviews.' },
  { icon: 'building', text: 'Working professionals who want stronger communication skills.' },
  { icon: 'sprout', text: 'Beginners who understand some English but struggle to speak.' },
];

// Do not add durations, session counts, certificates or materials unless confirmed.
export const curriculum = [
  'Everyday conversation practice',
  'Basic grammar for speaking',
  'Sentence formation',
  'Vocabulary and useful expressions',
  'Speaking exercises',
  'Common pronunciation challenges',
  'Practical communication scenarios',
];

export const priceBenefits = [
  'Live online classes on Zoom',
  'Practical spoken English learning',
  'Everyday conversation guidance',
  'Sentence formation practice',
  'Speaking confidence exercises',
  `Your personal joining link, valid for ${masterclass.accessDays} days`,
];

export const exams = {
  ielts: {
    title: 'IELTS Preparation',
    points: [
      'Academic and General Training options, if offered',
      'Speaking, listening, reading and writing preparation',
      'Practice tests and feedback, if available',
    ],
  },
  pte: {
    title: 'PTE Preparation',
    points: [
      'PTE Academic preparation, if offered',
      'Speaking, writing, reading and listening practice',
      'Exam-oriented practice, if available',
    ],
  },
};

// Trainer / institute — REAL, verifiable information only. Empty fields show "To be added".
export const about = {
  intro:
    'Lakewood IELTS Institute helps learners build practical English communication skills through live online teaching.',
  trainerName: '',
  experience: '',
  qualifications: '',
  methodology: '',
  location: '',
  achievements: '',
};

// Add ONLY genuine feedback, with the student's permission.
// While this list is empty, clearly-labelled placeholder cards are shown instead.
export const testimonials: { name: string; role?: string; text: string }[] = [];

const s = masterclass.schedule;
const scheduleText =
  s.startDate || s.days || s.time
    ? [s.startDate && `Starts ${s.startDate}`, s.days, s.time && `${s.time} ${s.timezone}`].filter(Boolean).join(' · ') + '.'
    : 'The schedule will be announced soon. It is included in your confirmation email once published.';

export const faqs: { q: string; a: string }[] = [
  {
    q: `What is the ${PRICE_LABEL} Spoken English Masterclass?`,
    a: 'It is a live online class from Lakewood IELTS Institute focused on practical spoken English: everyday conversations, sentence formation, vocabulary and speaking confidence.',
  },
  { q: 'Is this a live online class?', a: `Yes. Classes are held live on ${s.platform}, so you can join from your phone or laptop wherever you are.` },
  { q: 'Who can join the masterclass?', a: 'Students, job seekers, working professionals and beginners who want to speak English more confidently.' },
  {
    q: 'Is it suitable for beginners?',
    a: 'Yes, it is designed for learners who understand some English but hesitate to speak. If you are unsure about your level, contact us before registering.',
  },
  { q: 'When will the class take place?', a: scheduleText },
  {
    q: `How do I pay the ${PRICE_LABEL} registration fee?`,
    a: 'Fill in the registration form and pay securely through Razorpay using UPI, cards, netbanking or wallets. Your seat is confirmed only after the payment is verified.',
  },
  {
    q: 'How will I receive joining instructions?',
    a: `Once your payment is verified, you receive an email with your personal ${s.platform} joining link, the class schedule and your access dates. The same link works for every session during your ${masterclass.accessDays}-day access. Please do not share it — it is personal to you.`,
  },
  {
    q: 'Does the masterclass include IELTS or PTE preparation?',
    a: `No. The ${PRICE_LABEL} masterclass focuses on spoken English. IELTS and PTE preparation are separate courses — you can send an enquiry using the form on this page.`,
  },
  {
    q: 'How can I contact Lakewood IELTS Institute?',
    a: `Call ${site.contact.phone} or email ${site.contact.email}.`,
  },
];

// Legal text — replace with policies approved by the institute / a legal professional.
// Separate paragraphs with a blank line.
export const legal = {
  privacy: {
    title: 'Privacy Policy',
    body: `Lakewood IELTS Institute collects your name, mobile number and email address only to process your registration, send you class joining details, and respond to your enquiries.

Payments are processed by Razorpay. We never see or store your card, UPI or bank details.

To give you access to live classes, your name and email are shared with Zoom when you are registered for the class.

Replace this placeholder with your approved Privacy Policy.`,
  },
  terms: {
    title: 'Terms & Conditions',
    body: `Your registration fee gives you access to the live online Spoken English Masterclass for ${masterclass.accessDays} days from the date of payment.

Your joining link is personal. Sharing it may lead to your access being removed.

Replace this placeholder with your approved Terms & Conditions.`,
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    body: `Replace this placeholder with your approved Refund & Cancellation Policy (for example: eligibility for refunds, the time window, and how refunds are processed through Razorpay).

For any payment issue, contact ${site.contact.email} or ${site.contact.phone}.`,
  },
} as const;

export type LegalPage = keyof typeof legal;
