/**
 * IPVE Digital — Authenticated Fetch Wrapper
 *
 * All frontend API calls MUST go through this wrapper.
 * It automatically attaches the Authorization header from the auth store,
 * ensuring every request is authenticated with the current access token.
 *
 * Features:
 * - Auto-attaches Authorization Bearer header from in-memory store
 * - Sends credentials (cookies) for httpOnly cookie auth fallback
 * - Automatic token refresh on 401 responses (silent retry)
 * - Prevents concurrent refresh calls (singleton pattern)
 */

import { useAuthStore } from '@/stores/auth.store';

// ---------------------------------------------------------------------------
// Internal: silent token refresh (singleton)
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token via /api/auth/refresh.
 * Uses a singleton promise to prevent concurrent refresh calls.
 * Returns the new access token or null on failure.
 */
async function silentRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const newToken: string | undefined = data.accessToken;
        if (newToken) {
          // Store the new access token in memory
          useAuthStore.setState({ _accessToken: newToken });
          return newToken;
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// apiFetch
// ---------------------------------------------------------------------------

/**
 * Authenticated fetch — adds Authorization header + credentials.
 * Automatically retries on 401 after a silent token refresh.
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

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  // If 401, try silent refresh and retry once
  if (res.status === 401 && !url.includes('/api/auth/')) {
    const newToken = await silentRefresh();
    if (newToken) {
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (!retryHeaders.has('Content-Type') && init?.body && typeof init.body === 'string') {
        retryHeaders.set('Content-Type', 'application/json');
      }
      return fetch(url, {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// apiFetchJson
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// apiFetchData
// ---------------------------------------------------------------------------

/**
 * Convenience: authenticated fetch that unwraps `{ success, data, error }` responses.
 * Automatically adds Content-Type for JSON bodies.
 * Throws on !success with the server error message.
 *
 * This is the primary helper for CRUD operations in settings / admin components.
 */
export async function apiFetchData<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await apiFetch(url, { ...init, headers });
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || json.message || 'Erreur');
  }

  return json.data as T;
}
