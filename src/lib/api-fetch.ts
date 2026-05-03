/**
 * IPVE Digital — Authenticated Fetch Wrapper
 *
 * All frontend API calls MUST go through this wrapper.
 * It automatically attaches the Authorization header from the auth store,
 * ensuring every request is authenticated with the current access token.
 */

import { useAuthStore } from '@/stores/auth.store';

/**
 * Authenticated fetch — adds Authorization header + credentials.
 * Use this in ALL React Query hooks and any client-side fetch calls.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const { getAuthHeaders } = useAuthStore.getState();
  const authHeaders = getAuthHeaders();

  const headers = new Headers(init?.headers);
  // Merge auth headers (don't override explicit Content-Type if set)
  for (const [key, value] of Object.entries(authHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
}

/**
 * Convenience: authenticated fetch that parses JSON response.
 * Rejects on non-ok responses with the parsed error body.
 */
export async function apiFetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(url, init);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    return Promise.reject(err);
  }

  return res.json();
}
