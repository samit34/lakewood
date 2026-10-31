'use client';

import { useMemo } from 'react';
import { checkPassword } from '@/lib/password-policy';

const LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const COLORS = ['bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-600'];

export default function PasswordStrength({ password, userInputs = [] }: { password: string; userInputs?: string[] }) {
  const result = useMemo(() => (password ? checkPassword(password, userInputs) : null), [password, userInputs]);
  if (!result) return <p className="mt-1.5 text-xs text-slate-500">At least 12 characters. A few unrelated words works well.</p>;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.max(1, result.score) ? COLORS[result.score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`mt-1.5 text-xs font-semibold ${result.ok ? 'text-emerald-700' : 'text-slate-700'}`}>
        Strength: {LABELS[result.score]}
        {result.ok && ' ✓'}
      </p>
      {!result.ok && (
        <ul className="mt-1 list-disc pl-4 text-xs text-slate-600">
          {result.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
