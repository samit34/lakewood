import { Lock, Mail, Users } from 'lucide-react';
import { PRICE_LABEL, masterclass } from '@/config/site';
import RegisterForm from './RegisterForm';

const points = [
  { icon: Lock, text: 'Secure payment by Razorpay' },
  { icon: Mail, text: 'Personal Zoom link by email' },
  { icon: Users, text: `Max ${masterclass.maxSeats} seats per batch` },
];

export default function Register() {
  return (
    <section id="register" aria-labelledby="reg-h" className="section scroll-mt-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container-x">
        <div className="card relative mx-auto max-w-2xl p-5 sm:p-10">
          <p className="eyebrow text-brand-ink">Registration</p>
          <h2 id="reg-h" className="mt-2 font-display text-2xl font-bold text-navy-900 sm:text-3xl">
            Reserve your seat — {PRICE_LABEL}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="h-4 w-4 text-brand-ink" /> {text}
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <RegisterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
