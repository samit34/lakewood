'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAdminFetch } from '@/components/admin/AdminContext';
import { Field, Notice, Select, TextInput, btn } from '@/components/admin/ui';
import { BatchInput, type BatchInputType } from '@/lib/batch';
import { WEEKDAYS } from '@/lib/time';

export type BatchFormValues = Omit<BatchInputType, 'durationMinutes' | 'priceInr' | 'maxSeats'> & {
  durationMinutes: number | string;
  priceInr: number | string;
  maxSeats: number | string;
};

export default function BatchForm({ id, initial, seatsTaken = 0 }: { id?: string; initial: BatchFormValues; seatsTaken?: number }) {
  const router = useRouter();
  const api = useAdminFetch();
  const [v, setV] = useState<BatchFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'warning'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof BatchFormValues>(k: K, val: BatchFormValues[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };
  const toggleDay = (d: number) => set('daysOfWeek', v.daysOfWeek.includes(d) ? v.daysOfWeek.filter((x) => x !== d) : [...v.daysOfWeek, d]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMessage(null);
    const parsed = BatchInput.safeParse(v);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setBusy(true);
    const res = await api<{ batch: { id: string }; overlaps: string[] }>(id ? `/api/admin/batches/${id}` : '/api/admin/batches', id ? 'PATCH' : 'POST', parsed.data);
    setBusy(false);
    if (!res.ok) {
      if (res.field) setErrors({ [res.field]: res.message });
      else setMessage({ kind: 'error', text: res.message });
      return;
    }
    const clash = res.data.overlaps.length
      ? ` Warning: class times clash with ${res.data.overlaps.join(', ')}. One Zoom licence can only host one meeting at a time.`
      : '';
    if (!id) {
      router.push(`/admin/batches/${res.data.batch.id}?saved=1`);
      return;
    }
    setMessage({ kind: clash ? 'warning' : 'success', text: `Saved.${clash}` });
    router.refresh();
  }

  async function onDelete() {
    if (!id || !window.confirm('Delete this batch? This cannot be undone.')) return;
    setBusy(true);
    const res = await api(`/api/admin/batches/${id}`, 'DELETE');
    setBusy(false);
    if (!res.ok) return setMessage({ kind: 'error', text: res.message });
    router.push('/admin/batches');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Batch name" error={errors.name} hint="Also used as the Zoom meeting topic, e.g. “Spoken English – Nov 2026 Evening”.">
            <TextInput value={v.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
          </Field>
        </div>
        <Field label="Start date" error={errors.startDate}>
          <TextInput type="date" value={v.startDate} onChange={(e) => set('startDate', e.target.value)} aria-invalid={!!errors.startDate} />
        </Field>
        <Field label="End date" error={errors.endDate}>
          <TextInput type="date" value={v.endDate} onChange={(e) => set('endDate', e.target.value)} aria-invalid={!!errors.endDate} />
        </Field>
        <Field label="Class time (IST)" error={errors.classTime}>
          <TextInput type="time" value={v.classTime} onChange={(e) => set('classTime', e.target.value)} aria-invalid={!!errors.classTime} />
        </Field>
        <Field label="Duration (minutes)" error={errors.durationMinutes}>
          <TextInput type="number" min={15} max={300} inputMode="numeric" value={v.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} aria-invalid={!!errors.durationMinutes} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">Class days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d, i) => {
            const on = v.daysOfWeek.includes(i);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(i)}
                className={`min-h-11 min-w-14 rounded-xl border px-3 text-sm font-semibold transition ${on ? 'border-navy-900 bg-navy-900 text-brand-lime' : 'border-slate-300 bg-white text-navy-900 hover:bg-slate-50'}`}
              >
                {d}
              </button>
            );
          })}
        </div>
        {errors.daysOfWeek && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.daysOfWeek}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (₹)" error={errors.priceInr} hint="Changes apply to new payments only.">
          <TextInput type="number" min={1} inputMode="numeric" value={v.priceInr} onChange={(e) => set('priceInr', e.target.value)} aria-invalid={!!errors.priceInr} />
        </Field>
        <Field label="Seats" error={errors.maxSeats} hint={seatsTaken ? `${seatsTaken} already taken` : 'Zoom Pro: up to 100'}>
          <TextInput type="number" min={1} inputMode="numeric" value={v.maxSeats} onChange={(e) => set('maxSeats', e.target.value)} aria-invalid={!!errors.maxSeats} />
        </Field>
        <Field label="Status" hint="Only “Open” batches appear on the website.">
          <Select value={v.status} onChange={(e) => set('status', e.target.value as BatchFormValues['status'])}>
            <option value="draft">Draft (hidden)</option>
            <option value="open">Open for registration</option>
            <option value="closed">Closed</option>
          </Select>
        </Field>
      </div>

      <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-sm font-semibold text-navy-900">Zoom meeting</legend>
        <label className="flex items-start gap-3 text-sm text-slate-500">
          <input type="checkbox" checked={false} disabled className="mt-0.5 h-5 w-5" />
          <span>
            Create Zoom meeting automatically <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">available in step 5</span>
            <span className="mt-0.5 block text-xs">Once Zoom is connected, the site creates a recurring meeting with registration, waiting room and auto-approval.</span>
          </span>
        </label>
        <Field label="Zoom meeting ID (manual)" error={errors.zoomMeetingId} hint="Optional. Must be a meeting used by this batch only.">
          <TextInput inputMode="numeric" placeholder="e.g. 812 3456 7890" value={v.zoomMeetingId} onChange={(e) => set('zoomMeetingId', e.target.value)} aria-invalid={!!errors.zoomMeetingId} />
        </Field>
      </fieldset>

      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? 'Saving…' : id ? 'Save changes' : 'Create batch'}
        </button>
        {id && (
          <button type="button" onClick={onDelete} disabled={busy} className={btn.danger}>
            Delete batch
          </button>
        )}
      </div>
    </form>
  );
}
