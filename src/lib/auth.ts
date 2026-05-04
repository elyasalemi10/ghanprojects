// src/lib/auth.ts
// Client-side auth helpers backed by cookie session.

export type Role = 'OWNER' | 'ADMIN' | 'LENDER';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  borrowerId: string | null;
  permissions: Record<string, string[]> | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const API_URL = (import.meta as any).env?.PROD ? '' : 'http://localhost:3001';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json() as Promise<{ success: true; user: { id: string; email: string; name: string; role: Role }; redirect: string }>;
}

export async function logout() {
  await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function fetchMe(): Promise<SessionUser | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export function hasPermission(user: SessionUser | null, resource: string, action: string): boolean {
  if (!user) return false;
  if (user.role === 'OWNER') return true;
  if (user.role === 'ADMIN') {
    const perms = user.permissions?.[resource] || [];
    return perms.includes(action);
  }
  return false;
}

// Authenticated fetch wrapper that always sends cookies.
export async function authFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) {
    // session expired or missing — bounce
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}
