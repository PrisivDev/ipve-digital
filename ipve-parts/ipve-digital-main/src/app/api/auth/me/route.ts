import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, verifyAccessToken, isTokenBlacklisted } from '@/lib/auth';
import { db } from '@/lib/db';
import { json } from '@/lib/json';

/**
 * GET /api/auth/me — Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ipve_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'NON_AUTHENTIFIE', message: 'Authentification requise' },
        { status: 401 },
      );
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(accessToken)) {
      return NextResponse.json(
        { error: 'TOKEN_REVOKED', message: 'Jeton révoqué' },
        { status: 401 },
      );
    }

    // Verify access token
    const payload = await verifyAccessToken(accessToken);

    if (!payload?.sub) {
      return NextResponse.json(
        { error: 'TOKEN_INVALIDE', message: 'Jeton invalide' },
        { status: 401 },
      );
    }

    const result = await authService.getMe(payload.sub as string);

    return json({
      user: result.user,
      permissions: result.permissions,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] Me error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/auth/me — Update current user profile (firstName, lastName, phone)
 */
export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ipve_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 },
      );
    }

    if (isTokenBlacklisted(accessToken)) {
      return NextResponse.json(
        { success: false, error: 'Jeton révoqué' },
        { status: 401 },
      );
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload?.sub) {
      return NextResponse.json(
        { success: false, error: 'Jeton invalide' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, avatarUrl } = body;

    // Validate at least one field is provided
    if (!firstName && !lastName && phone === undefined && avatarUrl === undefined) {
      return NextResponse.json(
        { success: false, error: 'Au moins un champ est requis' },
        { status: 400 },
      );
    }

    // Build update data
    const updateData: Record<string, string | null> = {};
    if (typeof firstName === 'string') updateData.firstName = firstName.trim();
    if (typeof lastName === 'string') updateData.lastName = lastName.trim();
    if (typeof phone === 'string') updateData.phone = phone.trim() || null;
    if (typeof avatarUrl === 'string') updateData.avatarUrl = avatarUrl.trim() || null;

    const updatedUser = await db.user.update({
      where: { id: payload.sub as string },
      data: updateData,
      include: { role: true },
    });

    return json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        isActive: updatedUser.isActive,
        roleName: updatedUser.role?.name ?? 'UNKNOWN',
        totpEnabled: updatedUser.totpEnabled,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] PUT me error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}
