import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const refreshTokenValue =
      request.cookies.get('ipve_refresh_token')?.value;

    if (!refreshTokenValue) {
      return NextResponse.json(
        { error: 'TOKEN_MANQUANT', message: 'Jeton de rafraîchissement requis' },
        { status: 401 },
      );
    }

    const result = await authService.refreshToken(refreshTokenValue);

    const response = NextResponse.json({
      message: 'Jeton rafraîchi avec succès',
    });

    // Set new access token cookie
    response.headers.append(
      'Set-Cookie',
      [
        `ipve_access_token=${result.accessToken}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=900', // 15 minutes
      ].join('; '),
    );

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] Refresh error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}
