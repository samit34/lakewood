// All class times are India Standard Time. IST has no daylight saving, so a fixed +05:30 offset is exact.
export const TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

/** 'YYYY-MM-DD' + 'HH:mm' in IST → UTC Date */
export function istToDate(date: string, time = '00:00') {
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

/** Today's date in IST as 'YYYY-MM-DD' */
export function istToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);
}

export function formatIst(d: Date | string | null | undefined, withTime = true) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(d));
}

/** '19:00' → '7:00 PM' */
export function formatClockTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const isOlderThan = (d: Date | string, ms: number) => Date.now() - new Date(d).getTime() > ms;

export const isInFuture = (d: Date | string | null | undefined) => !!d && new Date(d).getTime() > Date.now();

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
