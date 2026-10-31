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
  // Registered business name exactly as on your Razorpay account / GST registration (used in the policies).
  legalName: 'Lakewood IELTS Institute',
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
  'Your personal joining link, valid for your whole batch',
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
    a: `Once your payment is verified, you receive an email with your personal ${s.platform} joining link, the class schedule and your access dates. The same link works for every session of your batch, from its start date to its end date. Please do not share it — it is personal to you.`,
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

// ---------------------------------------------------------------------------
// LEGAL PAGES (/privacy-policy, /terms, /refund-policy).
// These are drafts that describe how this website actually works. The institute must read and
// approve them (ideally with a legal professional) before taking live payments – especially the
// refund rules, which are a business decision.
// A body item that is a string is a paragraph; an array of strings is a bullet list.
// ---------------------------------------------------------------------------

export const legalUpdated = '23 October 2026';

type LegalSection = { heading?: string; body: (string | string[])[] };
export type LegalDoc = { title: string; description: string; sections: LegalSection[] };

const contactLine = `${site.contact.email} or ${site.contact.phone}`;

export const legal = {
  privacy: {
    title: 'Privacy Policy',
    description: `How ${site.name} collects, uses and protects your personal information.`,
    sections: [
      {
        body: [
          `This Privacy Policy explains how ${site.legalName} ("we", "us") handles your personal information when you use this website, register for a class or send us an enquiry.`,
        ],
      },
      {
        heading: 'Information we collect',
        body: [
          [
            'Your name, mobile number and email address.',
            'The course you are interested in and the batch you choose.',
            'Payment status and the order and payment reference numbers given to us by Razorpay.',
            'Technical information such as your IP address and browser type, used to keep the website secure and prevent misuse.',
          ],
          'We do not receive or store your card number, UPI PIN, bank login or other payment credentials. These are entered directly on Razorpay’s secure checkout.',
        ],
      },
      {
        heading: 'How we use your information',
        body: [
          [
            'To process your registration and confirm your payment.',
            'To send you your class schedule, your personal Zoom joining link and important updates about your batch.',
            'To remind you before your access ends, so you can join a new batch if you wish.',
            'To respond to your enquiries about our Spoken English, IELTS and PTE courses.',
            'To prevent fraud and misuse, and to meet our legal and accounting obligations.',
          ],
        ],
      },
      {
        heading: 'Who we share it with',
        body: [
          'We share only what is needed with service providers that help us run the classes:',
          [
            'Razorpay – to process your payment.',
            'Zoom – your name and email, to register you for your batch’s live class.',
            'Our email delivery provider – to send you confirmations and joining links.',
            'Our website hosting and database providers – to store your registration securely.',
          ],
          'We do not sell or rent your personal information. We may disclose it if required by law.',
        ],
      },
      {
        heading: 'Cookies and analytics',
        body: [
          'If analytics are switched on, we use Google Analytics and/or Meta Pixel to understand how visitors use the website and how our advertising performs. These services may set cookies in your browser. You can block or delete cookies in your browser settings.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep registration and payment records for as long as needed to provide your classes and as required by tax and accounting laws. Enquiries are kept until they are no longer needed, or until you ask us to delete them.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          `You can ask us to show, correct or delete the personal information we hold about you, or withdraw your consent to being contacted, by writing to ${contactLine}. Some records (for example payment records) may need to be kept to meet legal requirements.`,
        ],
      },
      {
        heading: 'Security',
        body: [
          'The website uses encrypted (HTTPS) connections, and access to student records is limited to authorised staff with protected accounts.',
        ],
      },
      {
        heading: 'Students under 18',
        body: ['If you are under 18, please register with the permission of a parent or guardian.'],
      },
      {
        heading: 'Changes and contact',
        body: [
          'We may update this policy from time to time. The date at the top shows when it was last changed.',
          `Questions or complaints about your privacy: ${contactLine}.`,
        ],
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    description: `Terms for registering for and attending ${site.name}’s live online classes.`,
    sections: [
      {
        body: [
          `These terms apply when you use this website or register for a class with ${site.legalName}. By registering and paying, you agree to them.`,
        ],
      },
      {
        heading: 'The masterclass',
        body: [
          `The ${masterclass.title} is a live online course taught on ${masterclass.schedule.platform} in batches. Each batch has its own dates, class days and class time (India Standard Time), shown when you register.`,
        ],
      },
      {
        heading: 'Registration and payment',
        body: [
          [
            'The fee is the amount shown for your chosen batch at checkout. Payment is collected securely by Razorpay.',
            'Your seat is confirmed only after your payment is verified. While you complete checkout, your seat is held for a short time; if payment is not completed, the seat is released.',
            'Seats in each batch are limited. If a batch is full, you can join the waitlist.',
            'Please enter your details correctly – your joining link is sent to the email address you give.',
          ],
        ],
      },
      {
        heading: 'Your access',
        body: [
          [
            'Your registration gives you access to the live classes of the batch you chose, from its start date to its end date.',
            'If you join after a batch has started, your access runs until that batch ends. Classes that took place before you joined are not repeated.',
            'Recordings are not included unless we tell you otherwise.',
            'To continue after your batch ends, you can register and pay for a new batch.',
          ],
        ],
      },
      {
        heading: 'Your joining link',
        body: [
          'Your Zoom joining link is personal to you and is sent by email before your batch starts. One registration allows one person to attend. Sharing your link, or letting others join with it, may lead to your access being removed without a refund.',
        ],
      },
      {
        heading: 'Behaviour in class',
        body: [
          'Please be respectful to the trainer and other learners. We may remove anyone who disrupts a class, behaves abusively or records and shares classes without permission, without a refund.',
        ],
      },
      {
        heading: 'Changes to classes',
        body: [
          'We may occasionally need to reschedule a class or change the trainer. We will let you know by email or phone. If we cancel a batch before it starts, you will be offered a full refund or a seat in another batch, as described in our Refund & Cancellation Policy.',
        ],
      },
      {
        heading: 'What you need',
        body: [
          'You need a phone or computer, a stable internet connection and the Zoom app. We are not responsible for classes missed because of problems with your own device or internet connection.',
        ],
      },
      {
        heading: 'Results',
        body: [
          'Our classes are designed to help you speak English with more confidence, but progress depends on your own practice. We do not guarantee any particular result, exam score or job outcome.',
        ],
      },
      {
        heading: 'Course content',
        body: [
          'Class content and materials are for your personal learning only. Please do not record, copy or redistribute them without our written permission.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'To the extent permitted by law, our total liability to you for any claim relating to a class is limited to the fee you paid for that batch.',
        ],
      },
      {
        heading: 'Governing law and contact',
        body: [
          'These terms are governed by the laws of India.',
          `Questions about these terms: ${contactLine}.`,
        ],
      },
    ],
  },

  refund: {
    title: 'Refund & Cancellation Policy',
    description: `When and how ${site.name} refunds class fees.`,
    sections: [
      {
        body: [
          `This policy explains when you can get a refund for a class fee paid to ${site.legalName} through Razorpay.`,
        ],
      },
      {
        heading: 'Cancelling before your batch starts',
        body: [
          'If you cancel before the first class of your batch, you will receive a full refund. Contact us with your name, the email you registered with and your Razorpay payment ID.',
        ],
      },
      {
        heading: 'After your batch has started',
        body: [
          'Once the first class of your batch has taken place, the fee is not refundable. This also applies if you join a batch that has already started.',
        ],
      },
      {
        heading: 'If we cancel or cannot run your batch',
        body: [
          'If we cancel a batch, or cannot provide your classes because of a problem on our side, you can choose a full refund or a seat in another batch.',
        ],
      },
      {
        heading: 'Duplicate or failed payments',
        body: [
          'If you were charged twice, or money was deducted but your registration was not confirmed, the extra or unconfirmed amount will be refunded in full. Failed payments are usually reversed automatically by your bank or Razorpay.',
        ],
      },
      {
        heading: 'No refund cases',
        body: [
          [
            'Classes missed because of your own schedule, device or internet connection.',
            'Access removed because a joining link was shared, or because of disruptive behaviour.',
          ],
        ],
      },
      {
        heading: 'How refunds are paid',
        body: [
          'Approved refunds are sent to the original payment method through Razorpay, usually within 5–7 working days after approval. Your bank may take a few extra days to show the amount.',
        ],
      },
      {
        heading: 'How to request a refund',
        body: [`Write to ${site.contact.email} or call ${site.contact.phone} with your name, registered email and Razorpay payment ID.`],
      },
    ],
  },
} satisfies Record<string, LegalDoc>;

export type LegalPage = keyof typeof legal;

export const LEGAL_PATHS: Record<LegalPage, string> = {
  privacy: '/privacy-policy',
  terms: '/terms',
  refund: '/refund-policy',
};
