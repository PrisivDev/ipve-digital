/**
 * IPVE Digital — Auth Module
 * Barrel export for all auth utilities.
 */

export { authService } from './auth.service';
export type { SafeUser, LoginResult, LoginResult2FA, LoginResultSuccess } from './auth.service';
export { AuthError } from './auth.errors';
export {
  verifyAccessToken,
  isTokenBlacklisted,
  checkRateLimit,
  setAuthCookies,
  clearAuthCookies,
  hashPassword,
  verifyPassword,
} from './auth.utils';
export { extractAccessToken } from '../auth-helpers/route-auth';
export {
  hasPermission,
  hasResourcePermission,
  getUserPermissions,
  getUserPermissionEntries,
  getPermissionCount,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from './rbac.service';
export type { PermissionEntry, SystemRole } from './rbac.service';
export { initRBAC } from './rbac.service';
