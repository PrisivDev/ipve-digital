/**
 * IPVE Digital — Auth Service
 * Complete authentication service with TOTP 2FA support.
 * Server-side only module.
 *
 * Uses:
 *   - jose for JWT (access: 15min, refresh: 30d)
 *   - bcryptjs for password hashing
 *   - otpauth for TOTP 2FA
 *   - In-memory blacklist (no Redis required)
 */

import { db } from '@/lib/db';
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  verifyPassword,
  hashPassword,
} from './auth.utils';
import { getUserPermissions } from './rbac.service';
import { AuthError } from './auth.errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SafeUser = {
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

export type LoginResult2FA = {
  requires2FA: true;
  userId: string;
  tempToken: string;
};

export type LoginResultSuccess = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  permissions: string[];
};

export type LoginResult = LoginResult2FA | LoginResultSuccess;

type Verify2FAResult = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  permissions: string[];
};

type RefreshResult = {
  accessToken: string;
};

type GetMeResult = {
  user: SafeUser;
  permissions: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSafeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  role?: { name: string } | null;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    roleName: user.role?.name ?? 'UNKNOWN',
    totpEnabled: user.totpEnabled,
  };
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

async function auditLog(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId ?? null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch {
    // Audit logging should never block the auth flow
  }
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------

export const authService = {
  /**
   * Login with email and password.
   * If TOTP is enabled for the user, returns a 2FA challenge instead of tokens.
   */
  async login(
    request: Request,
    email: string,
    password: string,
  ): Promise<LoginResult> {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true },
    });

    if (!user) {
      throw new AuthError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new AuthError('ACCOUNT_INACTIVE', 'Ce compte est désactivé');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect');
    }

    // If TOTP is enabled, require 2FA before issuing real tokens
    if (user.totpEnabled) {
      // Create a short-lived temp token for the 2FA step
      const tempToken = await createAccessToken({
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
      });
      return { requires2FA: true, userId: user.id, tempToken };
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Audit log
    await auditLog(user.id, 'LOGIN', 'auth', undefined, ip, userAgent);

    // Create JWT tokens
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    });
    const refreshToken = await createRefreshToken({ userId: user.id });

    // Get permissions from RBAC
    const permissions = getUserPermissions(user.role.name);

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
      permissions,
    };
  },

  /**
   * Verify TOTP code and complete login after 2FA challenge.
   */
  async verify2FAAndLogin(
    request: Request,
    userId: string,
    totpCode: string,
    tempToken: string,
  ): Promise<Verify2FAResult> {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    // Verify the temp token is still valid
    const tempPayload = await verifyAccessToken(tempToken);
    if (!tempPayload || tempPayload.sub !== userId) {
      throw new AuthError('INVALID_TEMP_TOKEN', 'Jeton temporaire invalide ou expiré');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Utilisateur non trouvé');
    }

    if (!user.totpSecret) {
      throw new AuthError('TOTP_NOT_SETUP', 'La double authentification n\'est pas configurée');
    }

    // Verify TOTP code using otpauth
    const { default: OTPAuth } = await import('otpauth');
    const secret = OTPAuth.Secret.fromBase32(user.totpSecret);
    const totp = new OTPAuth.TOTP({
      issuer: 'IPVE Digital',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const delta = totp.validate({ token: totpCode, window: 1 });
    if (delta === null) {
      throw new AuthError('INVALID_TOTP_CODE', 'Code de vérification invalide');
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Audit log
    await auditLog(user.id, 'LOGIN_2FA', 'auth', undefined, ip, userAgent);

    // Generate real tokens
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    });
    const refreshToken = await createRefreshToken({ userId: user.id });

    const permissions = getUserPermissions(user.role.name);

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
      permissions,
    };
  },

  /**
   * Refresh an access token using a valid refresh token.
   */
  async refreshToken(refreshTokenValue: string): Promise<RefreshResult> {
    const payload = await verifyRefreshToken(refreshTokenValue);

    if (!payload || !payload.sub) {
      throw new AuthError('INVALID_REFRESH_TOKEN', 'Jeton de rafraîchissement invalide');
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(refreshTokenValue)) {
      throw new AuthError('TOKEN_REVOKED', 'Jeton révoqué');
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub as string },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new AuthError('INVALID_REFRESH_TOKEN', 'Utilisateur introuvable ou inactif');
    }

    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    });

    return { accessToken };
  },

  /**
   * Logout user and blacklist tokens.
   */
  async logout(
    request: Request,
    userId: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<{ success: boolean }> {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    // Blacklist both tokens
    blacklistToken(accessToken, 15 * 60 * 1000); // 15 minutes (remaining access token TTL)
    blacklistToken(refreshToken, 30 * 24 * 60 * 60 * 1000); // 30 days (refresh token TTL)

    // Audit log
    await auditLog(userId, 'LOGOUT', 'auth', undefined, ip, userAgent);

    return { success: true };
  },

  /**
   * Change user password.
   */
  async changePassword(
    request: Request,
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Utilisateur non trouvé');
    }

    const oldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!oldPasswordValid) {
      throw new AuthError('INVALID_PASSWORD', 'Mot de passe actuel incorrect');
    }

    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await auditLog(userId, 'CHANGE_PASSWORD', 'auth', undefined, ip, userAgent);

    return { success: true };
  },

  /**
   * Generate a new TOTP secret for 2FA setup.
   * Returns the secret (Base32) and a QR code URL.
   */
  async generateTOTP(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Utilisateur non trouvé');
    }

    const { default: OTPAuth } = await import('otpauth');

    // Generate a new TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;

    const totp = new OTPAuth.TOTP({
      issuer: 'IPVE Digital',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    // Save secret to user (totpEnabled stays false until verified)
    await db.user.update({
      where: { id: userId },
      data: { totpSecret: secretBase32 },
    });

    const qrCodeUrl = totp.toString();

    return { secret: secretBase32, qrCodeUrl };
  },

  /**
   * Verify a TOTP code. If it's the first successful verification, enables 2FA.
   */
  async verifyTOTP(userId: string, code: string): Promise<{ verified: boolean }> {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Utilisateur non trouvé');
    }

    if (!user.totpSecret) {
      throw new AuthError('TOTP_NOT_SETUP', 'La double authentification n\'est pas configurée');
    }

    const { default: OTPAuth } = await import('otpauth');
    const secret = OTPAuth.Secret.fromBase32(user.totpSecret);
    const totp = new OTPAuth.TOTP({
      issuer: 'IPVE Digital',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const delta = totp.validate({ token: code, window: 1 });
    const verified = delta !== null;

    if (verified && !user.totpEnabled) {
      // First successful verification — enable TOTP
      await db.user.update({
        where: { id: userId },
        data: {
          totpEnabled: true,
          totpVerifiedAt: new Date(),
        },
      });
    }

    return { verified };
  },

  /**
   * Disable TOTP for a user (requires a valid current TOTP code).
   */
  async disableTOTP(userId: string, code: string): Promise<{ success: boolean }> {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Utilisateur non trouvé');
    }

    if (!user.totpSecret) {
      throw new AuthError('TOTP_NOT_SETUP', 'La double authentification n\'est pas activée');
    }

    // Verify current TOTP code before disabling
    const { default: OTPAuth } = await import('otpauth');
    const secret = OTPAuth.Secret.fromBase32(user.totpSecret);
    const totp = new OTPAuth.TOTP({
      issuer: 'IPVE Digital',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new AuthError('INVALID_TOTP_CODE', 'Code de vérification invalide');
    }

    await db.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        totpEnabled: false,
      },
    });

    return { success: true };
  },

  /**
   * Get current user profile with permissions.
   */
  async getMe(userId: string): Promise<GetMeResult> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'Utilisateur non trouvé');
    }

    const permissions = getUserPermissions(user.role?.name ?? 'STUDENT');

    return {
      user: toSafeUser(user),
      permissions,
    };
  },
};

export default authService;
