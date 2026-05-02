/**
 * IPVE Digital — Auth Utilities
 * Server-side only: JWT management, password hashing, in-memory token blacklist, rate limiter, cookie helpers.
 */

import * as jose from 'jose';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// JWT Configuration
// ---------------------------------------------------------------------------

const JWT_SECRET_FALLBACK =
  'ipve-digital-secret-key-change-in-production-2024';

const ACCESS_TOKEN_EXPIRY = '15m';
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 900 000 ms

const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 2 592 000 000 ms

const COOKIE_ACCESS_TOKEN = 'ipve_access_token';
const COOKIE_REFRESH_TOKEN = 'ipve_refresh_token';

// ---------------------------------------------------------------------------
// JWT Secret
// ---------------------------------------------------------------------------

export async function getJwtSecret(): Promise<Uint8Array> {
  const secret = process.env.JWT_SECRET ?? JWT_SECRET_FALLBACK;
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------

export async function createAccessToken(payload: {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
}): Promise<string> {
  const secret = await getJwtSecret();
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(secret);
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

export async function createRefreshToken(payload: {
  userId: string;
}): Promise<string> {
  const secret = await getJwtSecret();
  return await new jose.SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(secret);
}

// ---------------------------------------------------------------------------
// Verify Tokens
// ---------------------------------------------------------------------------

type JWTPayload = jose.JWTPayload & {
  userId?: string;
  email?: string;
  roleId?: string;
  roleName?: string;
};

export async function verifyAccessToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const secret = await getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const secret = await getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Password Hashing
// ---------------------------------------------------------------------------

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Token Blacklist Key (for Redis-style lookup if migrated later)
// ---------------------------------------------------------------------------

export function generateTokenBlacklistKey(
  userId: string,
  tokenId: string,
): string {
  return `bl:${userId}:${tokenId}`;
}

// ---------------------------------------------------------------------------
// In-Memory Token Blacklist (Map with TTL)
// ---------------------------------------------------------------------------

const tokenBlacklist = new Map<string, number>(); // token → expiry timestamp (ms)

let blacklistCleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureBlacklistCleanup(): void {
  if (blacklistCleanupTimer) return;
  blacklistCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [token, expiresAt] of tokenBlacklist.entries()) {
      if (expiresAt <= now) {
        tokenBlacklist.delete(token);
      }
    }
  }, 60_000); // clean up every 60 s
}

export function blacklistToken(token: string, expiresInMs: number): void {
  tokenBlacklist.set(token, Date.now() + expiresInMs);
  ensureBlacklistCleanup();
}

export function isTokenBlacklisted(token: string): boolean {
  const expiresAt = tokenBlacklist.get(token);
  if (expiresAt === undefined) return false;

  if (expiresAt <= Date.now()) {
    tokenBlacklist.delete(token);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// In-Memory Rate Limiter
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

let rateLimitCleanupTimer: ReturnType<typeof setInterval> | null = null;

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function ensureRateLimitCleanup(): void {
  if (rateLimitCleanupTimer) return;
  rateLimitCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (entry.windowStart + DEFAULT_WINDOW_MS <= now) {
        rateLimitStore.delete(ip);
      }
    }
  }, 60_000); // clean up every 60 s
}

export function checkRateLimit(
  ip: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  ensureRateLimitCleanup();

  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  // No entry yet — first request
  if (!entry) {
    rateLimitStore.set(ip, { attempts: 1, windowStart: now });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterMs: 0,
    };
  }

  // Window expired — reset
  if (now - entry.windowStart >= windowMs) {
    entry.attempts = 1;
    entry.windowStart = now;
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterMs: 0,
    };
  }

  // Within window — check remaining
  if (entry.attempts >= maxAttempts) {
    const retryAfterMs = entry.windowStart + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  entry.attempts += 1;
  return {
    allowed: true,
    remaining: maxAttempts - entry.attempts,
    retryAfterMs: 0,
  };
}

// ---------------------------------------------------------------------------
// Cookie Helpers (for Next.js API routes / Route Handlers)
// ---------------------------------------------------------------------------

export function setAuthCookies(
  headers: Headers,
  accessToken: string,
  refreshToken: string,
): void {
  const accessMaxAge = Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000);
  const refreshMaxAge = Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000);

  headers.append(
    'Set-Cookie',
    [
      `${COOKIE_ACCESS_TOKEN}=${accessToken}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=None`,
      `Max-Age=${accessMaxAge}`,
    ].join('; '),
  );

  headers.append(
    'Set-Cookie',
    [
      `${COOKIE_REFRESH_TOKEN}=${refreshToken}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=None`,
      `Max-Age=${refreshMaxAge}`,
    ].join('; '),
  );
}

export function clearAuthCookies(headers: Headers): void {
  headers.append(
    'Set-Cookie',
    [
      `${COOKIE_ACCESS_TOKEN}=`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=None`,
      `Max-Age=0`,
    ].join('; '),
  );

  headers.append(
    'Set-Cookie',
    [
      `${COOKIE_REFRESH_TOKEN}=`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=None`,
      `Max-Age=0`,
    ].join('; '),
  );
}
