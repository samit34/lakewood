'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Loader2, Lock, Mail, Users } from 'lucide-react';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { LEGAL_PATHS, masterclass, site } from '@/config/site';
import { track } from '@/lib/analytics';
import { GOAL_EVENT, type Goal } from '@/lib/events';
import {
  EnquiryInput,
  OrderInput,
  WaitlistInput,
  describeBatch,
  fieldErrors,
  type BatchesResponse,
  type FieldErrors,
  type OrderResponse,
  type PaymentResult,
} from '@/lib/registration';
import { refreshSeats } from '@/lib/seats';

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const PHONE = site.contact.phone;

type RazorpayInstance = { open(): void; on(event: 'payment.failed', cb: (r: { error?: { description?: string } }) => void): void };
type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
    turnstile?: { reset(): void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; data: { error?: string; message?: string; fields?: FieldErrors } };

async function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, status: res.status, data } : { ok: false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: `Network problem. Check your internet and try again, or call ${PHONE}.` } };
  }
}

const fmtIst = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts }).format(new Date(iso));

type Stage =
  | { kind: 'form' }
  | { kind: 'paying' }
  | { kind: 'confirming' }
  | { kind: 'paid'; result: PaymentResult }
  | { kind: 'done'; title: string; text: ReactNode };

type BatchesState = { status: 'loading' } | { status: 'error' } | ({ status: 'ready' } & BatchesResponse);

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-navy-900 placeholder:text-slate-400 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 aria-[invalid=true]:border-red-500';

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="mt-1.5 text-sm font-medium text-red-600">
      {msg}
    </p>
  ) : null;
}

export default function RegisterForm() {
  const [goal, setGoal] = useState<Goal>('spoken');
  const [values, setValues] = useState({ name: '', phone: '', email: '', consent: false });
  const [batchId, setBatchId] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: 'form' });
  const [batches, setBatches] = useState<BatchesState>({ status: 'loading' });
  const formRef = useRef<HTMLFormElement>(null);
  const failureRef = useRef<string | null>(null);

  const loadBatches = useCallback(() => {
    return fetch('/api/batches', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<BatchesResponse>) : Promise.reject()))
      .then((d) => {
        setBatches({ status: 'ready', ...d });
        setBatchId((current) => (d.batches.some((b) => b.id === current && b.seatsLeft > 0) ? current : (d.batches.find((b) => b.seatsLeft > 0)?.id ?? '')));
      })
      .catch(() => setBatches({ status: 'error' }));
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    const onGoal = (e: Event) => setGoal((e as CustomEvent<Goal>).detail);
    window.addEventListener(GOAL_EVENT, onGoal);
    return () => window.removeEventListener(GOAL_EVENT, onGoal);
  }, []);

  const list = batches.status === 'ready' ? batches.batches : [];
  const available = list.filter((b) => b.seatsLeft > 0);
  const waitlistMode = goal === 'spoken' && batches.status === 'ready' && available.length === 0;
  const paymentsOff = goal === 'spoken' && !waitlistMode && batches.status === 'ready' && !batches.paymentsEnabled;

  const set = (k: keyof typeof values) => (v: string | boolean) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function showErrors(next: FieldErrors) {
    setErrors(next);
    const first = (['name', 'phone', 'email', 'batchId', 'consent'] as const).find((k) => next[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  async function pollStatus(orderId: string) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/checkout/status?order=${encodeURIComponent(orderId)}`, { cache: 'no-store' }).catch(() => null);
      const data = res?.ok ? ((await res.json()) as PaymentResult) : null;
      if (data?.status === 'paid') return data;
    }
    return null;
  }

  async function onPaid(resp: RazorpayHandlerResponse, amount: number) {
    setStage({ kind: 'confirming' });
    const verified = await post<PaymentResult>('/api/checkout/verify', resp);
    const result = verified.ok && verified.data.status === 'paid' ? verified.data : await pollStatus(resp.razorpay_order_id);
    refreshSeats();
    if (result) {
      track('payment_success', { value: amount / 100, currency: 'INR' });
      setStage({ kind: 'paid', result });
    } else {
      setStage({
        kind: 'done',
        title: 'We’re confirming your payment',
        text: (
          <>
            This is taking longer than usual. You’ll get a confirmation email as soon as it’s done. If money was deducted and you don’t get an email within 30 minutes, call{' '}
            <a className="font-semibold underline" href={`tel:${PHONE.replace(/\s/g, '')}`}>
              {PHONE}
            </a>{' '}
            with your payment ID <b>{resp.razorpay_payment_id}</b>.
          </>
        ),
      });
    }
  }

  async function startCheckout(payload: Record<string, unknown>) {
    const [order, loaded] = await Promise.all([post<OrderResponse>('/api/checkout/order', payload), loadCheckout()]);
    if (!order.ok) {
      if (order.data.fields) return showErrors(order.data.fields);
      if (order.data.error === 'full' || order.data.error === 'batch_unavailable') loadBatches();
      return setErrors({ form: order.data.message ?? `Something went wrong. Please call ${PHONE}.` });
    }
    if (!loaded || !window.Razorpay) return setErrors({ form: `The payment window couldn't load. Check your internet or disable ad-blockers, then try again.` });

    const o = order.data;
    failureRef.current = null;
    track('payment_started', { value: o.amount / 100, currency: 'INR' });
    const rzp = new window.Razorpay({
      key: o.keyId,
      order_id: o.orderId,
      amount: o.amount,
      currency: o.currency,
      name: o.name,
      description: o.description,
      prefill: o.prefill,
      theme: { color: '#16296a' },
      timeout: o.holdMinutes * 60,
      retry: { enabled: true },
      handler: (resp: RazorpayHandlerResponse) => void onPaid(resp, o.amount),
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setStage({ kind: 'form' });
          setErrors({
            form: failureRef.current
              ? `Payment failed: ${failureRef.current}. You can try again – your seat is held for ${o.holdMinutes} minutes.`
              : `Payment was not completed. Your seat is held for ${o.holdMinutes} minutes – press Pay to try again.`,
          });
        },
      },
    });
    rzp.on('payment.failed', (r) => {
      failureRef.current = r.error?.description ?? 'the payment was declined';
    });
    setStage({ kind: 'paying' });
    rzp.open();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      ...values,
      website: String(fd.get('website') ?? ''),
      turnstileToken: (fd.get('cf-turnstile-response') as string | null) ?? undefined,
    };

    const schema = goal !== 'spoken' ? EnquiryInput : waitlistMode ? WaitlistInput : OrderInput;
    const body = goal !== 'spoken' ? { ...payload, goal } : waitlistMode ? payload : { ...payload, batchId };
    const check = schema.safeParse(body);
    if (!check.success) return showErrors(fieldErrors(check.error));

    setErrors({});
    setBusy(true);
    try {
      if (goal === 'spoken' && !waitlistMode) {
        await startCheckout(body);
      } else {
        const res = await post<{ ok: true }>(goal === 'spoken' ? '/api/waitlist' : '/api/enquiry', body);
        if (!res.ok) {
          if (res.data.fields) showErrors(res.data.fields);
          else setErrors({ form: res.data.message ?? `Something went wrong. Please call ${PHONE}.` });
        } else if (goal === 'spoken') {
          track('waitlist_joined');
          setStage({ kind: 'done', title: 'You’re on the waitlist', text: 'We’ll contact you as soon as seats open in the next batch.' });
        } else {
          track('enquiry_submitted', { goal });
          setStage({
            kind: 'done',
            title: 'Thanks – we’ve got your enquiry',
            text: `Our ${goal.toUpperCase()} counsellor will call you on the number you gave us, usually within one working day.`,
          });
        }
      }
    } finally {
      setBusy(false);
      window.turnstile?.reset();
    }
  }

  if (stage.kind === 'paid') return <PaidPanel result={stage.result} />;
  if (stage.kind === 'done') return <DonePanel title={stage.title}>{stage.text}</DonePanel>;

  const submitLabel = goal !== 'spoken' ? 'Request a call back' : waitlistMode ? 'Join the waitlist' : `Pay ₹${list.find((b) => b.id === batchId)?.priceInr ?? masterclass.priceInr} securely`;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby="reg-note">
      {TURNSTILE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />}

      <div>
        <label htmlFor="reg-goal" className="mb-1.5 block text-sm font-semibold text-navy-900">
          I’m interested in
        </label>
        <select id="reg-goal" value={goal} onChange={(e) => setGoal(e.target.value as Goal)} className={inputCls}>
          <option value="spoken">Spoken English (₹{masterclass.priceInr})</option>
          <option value="ielts">IELTS coaching</option>
          <option value="pte">PTE coaching</option>
        </select>
      </div>

      {goal === 'spoken' && <BatchPicker state={batches} batchId={batchId} onChange={(id) => { setBatchId(id); setErrors((e) => ({ ...e, batchId: undefined })); }} error={errors.batchId} onRetry={loadBatches} />}

      <div>
        <label htmlFor="reg-name" className="mb-1.5 block text-sm font-semibold text-navy-900">
          Full name
        </label>
        <input id="reg-name" data-field="name" name="name" autoComplete="name" value={values.name} onChange={(e) => set('name')(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} className={inputCls} placeholder="e.g. Priya Sharma" />
        <FieldError id="err-name" msg={errors.name} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-semibold text-navy-900">
            Mobile number
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-slate-500">
              +91
            </span>
            <input id="reg-phone" data-field="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={values.phone} onChange={(e) => set('phone')(e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'err-phone' : 'hint-phone'} className={`${inputCls} pl-14`} placeholder="98765 43210" />
          </div>
          {errors.phone ? <FieldError id="err-phone" msg={errors.phone} /> : <p id="hint-phone" className="mt-1.5 text-xs text-slate-500">WhatsApp number preferred</p>}
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-semibold text-navy-900">
            Email {goal !== 'spoken' && <span className="font-normal text-slate-500">(optional)</span>}
          </label>
          <input id="reg-email" data-field="email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => set('email')(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : goal === 'spoken' ? 'hint-email' : undefined} className={inputCls} placeholder="you@example.com" />
          {errors.email ? <FieldError id="err-email" msg={errors.email} /> : goal === 'spoken' && <p id="hint-email" className="mt-1.5 text-xs text-slate-500">Your Zoom link is sent here</p>}
        </div>
      </div>

      {/* Honeypot: invisible to people and screen readers; bots that fill it are rejected */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="reg-website">Website</label>
        <input id="reg-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" data-field="consent" checked={values.consent} onChange={(e) => set('consent')(e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'err-consent' : undefined} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#16296a]" />
          <span>
            I agree to the{' '}
            <a href={LEGAL_PATHS.privacy} target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">
              Privacy Policy
            </a>
            ,{' '}
            <a href={LEGAL_PATHS.terms} target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">
              Terms
            </a>{' '}
            and{' '}
            <a href={LEGAL_PATHS.refund} target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">
              Refund Policy
            </a>
            , and to be contacted about my enquiry.
          </span>
        </label>
        <FieldError id="err-consent" msg={errors.consent} />
      </div>

      {TURNSTILE_KEY && <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} data-theme="light" />}

      <div aria-live="polite">
        {errors.form && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</p>}
        {paymentsOff && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Online payment is being switched on. To reserve your seat now, call{' '}
            <a className="font-semibold underline" href={`tel:${PHONE.replace(/\s/g, '')}`}>
              {PHONE}
            </a>
            .
          </p>
        )}
      </div>

      <button type="submit" disabled={busy || stage.kind !== 'form' || paymentsOff || (goal === 'spoken' && batches.status !== 'ready')} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
        {busy || stage.kind !== 'form' ? (
          <>
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            {stage.kind === 'confirming' ? 'Confirming payment…' : stage.kind === 'paying' ? 'Complete payment in the Razorpay window…' : 'Please wait…'}
          </>
        ) : (
          <>
            {goal === 'spoken' && !waitlistMode && <Lock aria-hidden="true" className="h-4 w-4" />}
            {submitLabel}
          </>
        )}
      </button>

      <p id="reg-note" className="text-center text-xs text-slate-500">
        {goal === 'spoken' && !waitlistMode
          ? 'Secure payment by Razorpay (UPI, cards, net banking). We never see or store your card or UPI details.'
          : 'We only use your details to contact you about this enquiry.'}
      </p>
    </form>
  );
}

function BatchPicker({ state, batchId, onChange, error, onRetry }: { state: BatchesState; batchId: string; onChange: (id: string) => void; error?: string; onRetry: () => void }) {
  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500" role="status">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Loading batches…
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Couldn’t load batch dates.{' '}
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Try again
        </button>{' '}
        or call {PHONE}.
      </p>
    );
  }
  if (state.batches.length === 0) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">New batch dates will be announced soon. Join the waitlist and we’ll tell you first.</p>;
  }
  const allFull = state.batches.every((b) => b.seatsLeft === 0);

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-semibold text-navy-900">Choose your batch</legend>
      {allFull && <p className="mb-2 text-sm text-slate-600">All batches are full right now – join the waitlist below.</p>}
      <div className="space-y-2.5">
        {state.batches.map((b, i) => {
          const { dates, when } = describeBatch(b);
          const full = b.seatsLeft === 0;
          const low = !full && b.seatsLeft <= 10;
          return (
            <label key={b.id} className={`relative flex cursor-pointer gap-3 rounded-xl border p-3.5 transition has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50/60 has-[:checked]:ring-2 has-[:checked]:ring-brand-blue/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-blue ${full ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
              <input type="radio" name="batch" value={b.id} checked={batchId === b.id} disabled={full} onChange={() => onChange(b.id)} data-field={i === 0 ? 'batchId' : undefined} className="mt-1 h-4 w-4 shrink-0 accent-[#16296a]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-navy-900">{b.name}</span>
                  {b.started && !full && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">In progress – join now</span>}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                  <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" /> {dates}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600">{when}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-lg font-bold text-navy-900">₹{b.priceInr}</span>
                <span className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold ${full ? 'text-slate-500' : low ? 'text-orange-600' : 'text-emerald-700'}`}>
                  <Users aria-hidden="true" className="h-3.5 w-3.5" />
                  {full ? 'Full' : `${b.seatsLeft} left`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id="err-batch" msg={error} />
    </fieldset>
  );
}

function PaidPanel({ result }: { result: PaymentResult }) {
  const linkText = result.linkAt
    ? `on ${fmtIst(result.linkAt, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })} IST`
    : 'within a few minutes';
  return (
    <DonePanel title="Payment successful – you’re in!">
      <div className="mt-4 space-y-3 text-left">
        {result.batchName && (
          <p className="flex gap-3 rounded-xl bg-slate-50 p-3.5 text-sm">
            <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-ink" />
            <span>
              <b className="text-navy-900">{result.batchName}</b>
              {result.startsAt && <> · first class {fmtIst(result.startsAt, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST</>}
            </span>
          </p>
        )}
        <p className="flex gap-3 rounded-xl bg-lime-50 p-3.5 text-sm ring-1 ring-lime-200">
          <Mail aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-700" />
          <span>
            Your <b>personal Zoom link</b> will be emailed to <b>{result.email}</b> {linkText}. A payment confirmation is on its way now – check your spam folder if you don’t see it.
          </span>
        </p>
      </div>
    </DonePanel>
  );
}

function DonePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center" role="status" aria-live="polite">
        <CheckCircle2 aria-hidden="true" className="mx-auto h-14 w-14 text-emerald-500" />
        <h3 className="mt-3 font-display text-2xl font-bold text-navy-900">{title}</h3>
        <div className="mt-2 text-slate-600">{children}</div>
        <p className="mt-5 text-sm text-slate-500">
          Questions? Call{' '}
          <a className="font-semibold text-brand-ink underline" href={`tel:${PHONE.replace(/\s/g, '')}`}>
            {PHONE}
          </a>
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
