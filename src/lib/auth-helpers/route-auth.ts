/**
 * IPVE Digital — Route-level auth helpers
 * Verify JWT from cookies and check role authorization.
 * Server-side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isTokenBlacklisted } from '@/lib/auth/auth.utils';

type JWTPayload = {
  userId?: string;
  email?: string;
  roleId?: string;
  roleName?: string;
};

interface AuthResult {
  authorized: true;
  payload: JWTPayload;
}

interface AuthError {
  authorized: false;
  response: NextResponse;
}

export type AuthCheck = AuthResult | AuthError;

/**
 * Verify JWT from cookies. Returns payload or an error response.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthCheck> {
  const token = request.cookies.get('ipve_access_token')?.value;

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      ),
    };
  }

  // Check blacklist
  if (isTokenBlacklisted(token)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 },
      ),
    };
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Token expiré ou invalide' },
        { status: 401 },
      ),
    };
  }

  return { authorized: true, payload };
}

/**
 * Require ADMIN or ACCOUNTANT role.
 */
export async function requireAdminOrAccountant(
  request: NextRequest,
): Promise<AuthCheck> {
  const check = await verifyAuth(request);

  if (!check.authorized) return check;

  const roleName = check.payload.roleName;
  if (roleName !== 'ADMIN' && roleName !== 'ACCOUNTANT') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Accès refusé. Rôle ADMIN ou COMPTABLE requis.' },
        { status: 403 },
      ),
    };
  }

  return check;
}
