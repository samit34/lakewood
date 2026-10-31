'use client';

import { createContext, use, useCallback, type ReactNode } from 'react';

export type AdminInfo = {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'staff';
  mustChangePassword: boolean;
  totpEnabled: boolean;
};

const Ctx = createContext<{ admin: AdminInfo; csrfToken: string } | null>(null);

export function AdminProvider({ admin, csrfToken, children }: { admin: AdminInfo; csrfToken: string; children: ReactNode }) {
  return <Ctx value={{ admin, csrfToken }}>{children}</Ctx>;
}

export function useAdmin() {
  const v = use(Ctx);
  if (!v) throw new Error('useAdmin must be used inside AdminProvider');
  return v;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string; field?: string };

/** JSON fetch for /api/admin/* that sends the CSRF token and handles expired sessions. */
export function useAdminFetch() {
  const { csrfToken } = useAdmin();
  return useCallback(
    async <T = Record<string, unknown>,>(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<ApiResult<T>> => {
      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch {
        return { ok: false, status: 0, message: 'Network error. Check your connection and try again.' };
      }
      if (res.status === 401) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- drop cached admin data
        window.location.href = '/admin/login';
        return { ok: false, status: 401, message: 'Your session expired. Please sign in again.' };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'password_change_required') window.location.reload();
        return { ok: false, status: res.status, message: data.message || 'Something went wrong. Please try again.', field: data.field };
      }
      return { ok: true, data: data as T };
    },
    [csrfToken],
  );
}
