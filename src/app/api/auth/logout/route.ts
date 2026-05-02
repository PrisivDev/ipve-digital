import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, verifyAccessToken, clearAuthCookies, isTokenBlacklisted } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ipve_access_token')?.value;
    const refreshToken = request.cookies.get('ipve_refresh_token')?.value;

    if (!accessToken) {
      const response = NextResponse.json({ message: 'Déconnexion réussie' });
      clearAuthCookies(response.headers);
      return response;
    }

    // Verify access token to get userId
    const payload = await verifyAccessToken(accessToken);

    if (payload?.sub) {
      await authService.logout(
        request,
        payload.sub as string,
        accessToken,
        refreshToken ?? '',
      );
    }

    const response = NextResponse.json({ message: 'Déconnexion réussie' });
    clearAuthCookies(response.headers);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      const response = NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
      clearAuthCookies(response.headers);
      return response;
    }

    console.error('[AUTH] Logout error:', error);
    const response = NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
    clearAuthCookies(response.headers);
    return response;
  }
}
