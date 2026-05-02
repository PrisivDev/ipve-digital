/**
 * IPVE — Settings Auth Helper
 * Shared admin-only JWT verification for all settings API routes.
 * Returns authenticated user info or a 401/403 NextResponse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isTokenBlacklisted } from '@/lib/auth';
import { db } from '@/lib/db';

export interface SettingsAuthResult {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
}

/**
 * Verify the request has a valid JWT from an ADMIN user.
 * Returns authenticated user info or an error NextResponse.
 */
export async function verifySettingsAdmin(
  request: NextRequest,
): Promise<SettingsAuthResult | NextResponse> {
  // 1. Get access token from cookie
  const accessToken = request.cookies.get('ipve_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: 'Authentification requise' },
      { status: 401 },
    );
  }

  // 2. Check token blacklist
  if (isTokenBlacklisted(accessToken)) {
    return NextResponse.json(
      { success: false, error: 'Jeton révoqué' },
      { status: 401 },
    );
  }

  // 3. Verify token
  const payload = await verifyAccessToken(accessToken);

  if (!payload?.sub) {
    return NextResponse.json(
      { success: false, error: 'Jeton invalide' },
      { status: 401 },
    );
  }

  // 4. Check user is ADMIN
  const user = await db.user.findUnique({
    where: { id: payload.sub as string },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { success: false, error: 'Utilisateur introuvable ou inactif' },
      { status: 401 },
    );
  }

  if (user.role.name !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Accès réservé aux administrateurs' },
      { status: 403 },
    );
  }

  return {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  };
}

/**
 * Helper to get client IP from request headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
