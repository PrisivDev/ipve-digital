/**
 * IPVE Digital — Auth Store (Zustand)
 * Manages authentication state, permissions, and actions.
 * No tokens stored in localStorage — uses httpOnly cookies.
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
}

// ---------------------------------------------------------------------------
// Internal: silent token refresh
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token via /api/auth/refresh.
 * Uses a singleton promise to prevent concurrent refresh calls.
 */
async function silentRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
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

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null, requires2FA: false, pending2FA: null });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

      // Login successful — tokens set as httpOnly cookies
      set({
        user: data.user,
        permissions: data.permissions ?? [],
        isAuthenticated: true,
        isLoading: false,
        loginError: null,
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
      await fetch('/api/auth/logout', { method: 'POST' });
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
    });
  },

  fetchUser: async () => {
    set({ isLoading: true });

    try {
      // First attempt
      let res = await fetch('/api/auth/me');

      // If 401, try silent refresh and retry once
      if (res.status === 401) {
        const refreshed = await silentRefresh();
        if (refreshed) {
          res = await fetch('/api/auth/me');
        }
      }

      if (!res.ok) {
        set({
          user: null,
          isAuthenticated: false,
          permissions: [],
          isLoading: false,
          isInitializing: false,
        });
        return;
      }

      const data = await res.json();

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
      });
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
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
