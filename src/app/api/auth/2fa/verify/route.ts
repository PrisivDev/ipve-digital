import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, verifyAccessToken, isTokenBlacklisted, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ipve_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'NON_AUTHENTIFIE', message: 'Authentification requise' },
        { status: 401 },
      );
    }

    if (isTokenBlacklisted(accessToken)) {
      return NextResponse.json(
        { error: 'TOKEN_REVOKED', message: 'Jeton révoqué' },
        { status: 401 },
      );
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload?.sub) {
      return NextResponse.json(
        { error: 'TOKEN_INVALIDE', message: 'Jeton invalide' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'CODE_INVALIDE', message: 'Code à 6 chiffres requis' },
        { status: 400 },
      );
    }

    const result = await authService.verifyTOTP(payload.sub as string, code);

    return NextResponse.json({
      verified: result.verified,
      message: result.verified
        ? 'Double authentification activée avec succès'
        : 'Code invalide',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] 2FA verify error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/2fa/verify - Used during login flow when 2FA is required.
 * This variant accepts tempToken + userId + code to complete login.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, totpCode, tempToken } = body;

    if (!userId || !totpCode || !tempToken) {
      return NextResponse.json(
        { error: 'CHAMPS_MANQUANTS', message: 'userId, totpCode et tempToken requis' },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(totpCode)) {
      return NextResponse.json(
        { error: 'CODE_INVALIDE', message: 'Code à 6 chiffres requis' },
        { status: 400 },
      );
    }

    const result = await authService.verify2FAAndLogin(
      request,
      userId,
      totpCode,
      tempToken,
    );

    const response = NextResponse.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      permissions: result.permissions,
      message: 'Connexion avec double authentification réussie',
    });

    setAuthCookies(response.headers, result.accessToken, result.refreshToken, request);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] 2FA login verify error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}
