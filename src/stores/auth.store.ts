/**
 * IPVE Digital — Auth Store (Zustand)
 * Manages authentication state, permissions, and actions.
 * Tokens stored in memory (not localStorage) + sent via Authorization header.
 * Also sets httpOnly cookies as fallback for same-origin contexts.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roleName: string;
  totpEnabled: boolean;
};

interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  permissions: string[];
  isLoading: boolean;
  isInitializing: boolean;
  loginError: string | null;
  requires2FA: boolean;
  pending2FA: {
    userId: string;
    tempToken: string;
  } | null;
  // Tokens (in-memory only, never persisted)
  _accessToken: string | null;
  _refreshToken: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  checkPermission: (module: string, action: string) => boolean;
  checkResourcePermission: (module: string, resource: string, action: string) => boolean;
  clearError: () => void;
  setInitializing: (value: boolean) => void;
  /** Get auth headers for API calls */
  getAuthHeaders: () => Record<string, string>;
}

// ---------------------------------------------------------------------------
// Internal: silent token refresh
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshPromise: Promise<{ success: boolean; newAccessToken?: string } | null> | null = null;

/**
 * Attempt to refresh the access token via /api/auth/refresh.
 * Uses a singleton promise to prevent concurrent refresh calls.
 */
async function silentRefresh(refreshToken: string | null): Promise<{ success: boolean; newAccessToken?: string } | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      // Send refresh token via Authorization header
      if (refreshToken) {
        headers['Authorization'] = `Bearer ${refreshToken}`;
      }
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const newAccessToken: string | undefined = data.accessToken;
        if (newAccessToken) {
          // Update in-memory access token
          useAuthStore.setState({ _accessToken: newAccessToken });
        }
        return { success: true, newAccessToken };
      }
      return { success: false };
    } catch {
      return { success: false };
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  permissions: [],
  isLoading: false,
  isInitializing: true,
  loginError: null,
  requires2FA: false,
  pending2FA: null,
  _accessToken: null,
  _refreshToken: null,

  // Auth headers helper
  getAuthHeaders: () => {
    const { _accessToken } = get();
    const headers: Record<string, string> = {};
    if (_accessToken) {
      headers['Authorization'] = `Bearer ${_accessToken}`;
    }
    return headers;
  },

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null, requires2FA: false, pending2FA: null });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ loginError: data.message ?? data.error ?? 'Erreur de connexion', isLoading: false });
        return;
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        set({
          requires2FA: true,
          pending2FA: { userId: data.userId, tempToken: data.tempToken },
          isLoading: false,
        });
        return;
      }

      // Login successful — store tokens in memory
      set({
        user: data.user,
        permissions: data.permissions ?? [],
        isAuthenticated: true,
        isLoading: false,
        loginError: null,
        _accessToken: data.accessToken ?? null,
        _refreshToken: data.refreshToken ?? null,
      });
    } catch (error) {
      set({
        loginError: 'Erreur de connexion au serveur',
        isLoading: false,
      });
    }
  },

  verify2FA: async (code: string) => {
    const { pending2FA } = get();
    if (!pending2FA) return;

    set({ isLoading: true, loginError: null });

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pending2FA.userId,
          totpCode: code,
          tempToken: pending2FA.tempToken,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        set({ loginError: data.message ?? data.error ?? 'Code invalide', isLoading: false });
        return;
      }

      set({
        user: data.user,
        permissions: data.permissions ?? [],
        isAuthenticated: true,
        isLoading: false,
        loginError: null,
        requires2FA: false,
        pending2FA: null,
        _accessToken: data.accessToken ?? null,
        _refreshToken: data.refreshToken ?? null,
      });
    } catch (error) {
      set({
        loginError: 'Erreur de connexion au serveur',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      const { _accessToken } = get();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
      await fetch('/api/auth/logout', { method: 'POST', headers, credentials: 'include' });
    } catch {
      // Silently fail — clear local state regardless
    }

    set({
      user: null,
      isAuthenticated: false,
      permissions: [],
      loginError: null,
      requires2FA: false,
      pending2FA: null,
      _accessToken: null,
      _refreshToken: null,
    });
  },

  fetchUser: async () => {
    set({ isLoading: true });

    try {
      const { _accessToken, _refreshToken } = get();

      const makeAuthHeaders = (token: string | null): Record<string, string> => {
        const h: Record<string, string> = {};
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
      };

      // First attempt with current token
      let res = await fetch('/api/auth/me', {
        headers: makeAuthHeaders(_accessToken),
        credentials: 'include',
      });

      // If 401, try silent refresh and retry once
      if (res.status === 401) {
        const refreshResult = await silentRefresh(_refreshToken);
        if (refreshResult?.success && refreshResult.newAccessToken) {
          // Update stored access token
          set({ _accessToken: refreshResult.newAccessToken });
          res = await fetch('/api/auth/me', {
            headers: makeAuthHeaders(refreshResult.newAccessToken),
            credentials: 'include',
          });
        }
      }

      if (!res.ok) {
        set({
          user: null,
          isAuthenticated: false,
          permissions: [],
          isLoading: false,
          isInitializing: false,
          _accessToken: null,
          _refreshToken: null,
        });
        return;
      }

      const data = await res.json();

      // If we refreshed the token, store it
      // Also trigger a background refresh to ensure we have a fresh token
      if (!get()._accessToken && get()._refreshToken) {
        silentRefresh(get()._refreshToken).catch(() => {});
      }

      set({
        user: data.user,
        permissions: data.permissions ?? [],
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        permissions: [],
        isLoading: false,
        isInitializing: false,
        _accessToken: null,
        _refreshToken: null,
      });
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const { _accessToken } = get();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? 'Erreur lors du changement de mot de passe');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  checkPermission: (module: string, action: string): boolean => {
    const { permissions } = get();
    return permissions.some((key) => {
      const parts = key.split('.');
      if (parts.length >= 3) {
        return parts[0] === module && parts[2] === action;
      }
      return false;
    });
  },

  checkResourcePermission: (module: string, resource: string, action: string): boolean => {
    const { permissions } = get();
    const targetKey = `${module}.${resource}.${action}`;
    return permissions.includes(targetKey);
  },

  clearError: () => set({ loginError: null }),

  setInitializing: (value: boolean) => set({ isInitializing: value }),
}));
