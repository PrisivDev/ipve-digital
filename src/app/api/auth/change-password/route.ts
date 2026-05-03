import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, verifyAccessToken, isTokenBlacklisted, extractAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Try cookie first, then Authorization header
    const accessToken = extractAccessToken(request);

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
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'CHAMPS_MANQUANTS', message: 'Ancien et nouveau mot de passe requis' },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'MOT_DE_PASSE_FAIBLE', message: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 },
      );
    }

    await authService.changePassword(
      request,
      payload.sub as string,
      oldPassword,
      newPassword,
    );

    return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] Change password error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}
