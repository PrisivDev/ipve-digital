'use client';

/**
 * IPVE Digital — useAuth Hook
 * Provides a clean interface to the auth store for components.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    permissions,
    isLoading,
    isInitializing,
    loginError,
    requires2FA,
    login,
    verify2FA,
    logout,
    fetchUser,
    changePassword,
    checkPermission,
    checkResourcePermission,
    clearError,
  } = useAuthStore();

  // Fetch user on mount (check existing cookies)
  useEffect(() => {
    if (isInitializing) {
      fetchUser();
    }
  }, [isInitializing, fetchUser]);

  return {
    user,
    isAuthenticated,
    permissions,
    isLoading,
    isInitializing,
    loginError,
    requires2FA,
    login,
    verify2FA,
    logout,
    changePassword,
    hasPermission: checkPermission,
    hasResourcePermission: checkResourcePermission,
    clearError,
  };
}

/**
 * Check if the current user has a specific permission.
 *
 * @example
 * const canCreate = usePermission('students', 'create');
 * // Returns true if user has students.*.create permission
 */
export function usePermission(module: string, action: string): boolean {
  const { permissions } = useAuthStore();

  return permissions.some((key) => {
    const parts = key.split('.');
    if (parts.length >= 3) {
      return parts[0] === module && parts[2] === action;
    }
    return false;
  });
}

/**
 * Check if the current user has a specific resource-level permission.
 *
 * @example
 * const canCreateGrade = useResourcePermission('grades', 'grades', 'create');
 * // Returns true if user has grades.grades.create permission
 */
export function useResourcePermission(
  module: string,
  resource: string,
  action: string,
): boolean {
  const { permissions } = useAuthStore();
  const targetKey = `${module}.${resource}.${action}`;
  return permissions.includes(targetKey);
}
