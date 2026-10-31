'use client';

import { useSyncExternalStore } from 'react';

export type SeatsResponse = {
  max: number;
  taken: number;
  left: number;
  // false until the database is connected; the UI then avoids showing a seat count
  live: boolean;
};

export type SeatsState =
  | { status: 'loading' }
  | { status: 'error' }
  | ({ status: 'ready'; full: boolean } & SeatsResponse);

const LOADING: SeatsState = { status: 'loading' };
let current: SeatsState = LOADING;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(s: SeatsState) {
  current = s;
  listeners.forEach((l) => l());
}

/** Re-fetches the seat count (e.g. after a payment) and updates every subscriber. */
export function refreshSeats() {
  inflight = fetch('/api/seats', { cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error('seats');
      return r.json() as Promise<SeatsResponse>;
    })
    .then((d) => emit({ status: 'ready', ...d, full: d.live && d.left <= 0 }))
    .catch(() => emit({ status: 'error' }));
  return inflight;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!inflight) refreshSeats();
  return () => {
    listeners.delete(cb);
  };
}

/** Shared seat count: one request per page load, shared by every component. */
export function useSeats(): SeatsState {
  return useSyncExternalStore(subscribe, () => current, () => LOADING);
}
