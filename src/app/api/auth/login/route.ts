import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, checkRateLimit, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rateCheck = checkRateLimit(ip, 5, 15 * 60 * 1000); // 5 attempts per 15 min

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'TROP_DE_TENTATIVES',
          message: `Trop de tentatives. Réessayez dans ${Math.ceil(rateCheck.retryAfterMs / 60000)} minutes.`,
          retryAfterMs: rateCheck.retryAfterMs,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
        },
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'CHAMPS_MANQUANTS', message: 'Email et mot de passe requis' },
        { status: 400 },
      );
    }

    const result = await authService.login(request, email, password);

    // If 2FA is required, return the challenge
    if (result.requires2FA) {
      return NextResponse.json({
        requires2FA: true,
        userId: result.userId,
        tempToken: result.tempToken,
        message: 'Double authentification requise',
      });
    }

    // Success — set httpOnly cookies + return tokens in body (for cross-origin contexts)
    const response = NextResponse.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      permissions: result.permissions,
      message: 'Connexion réussie',
    });

    setAuthCookies(response.headers, result.accessToken, result.refreshToken);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    // Log detailed error for Vercel debugging
    const errMessage = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error('[AUTH] Login error:', errMessage, errStack);

    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Erreur serveur interne',
        debug: process.env.NODE_ENV === 'development' ? errMessage : undefined,
      },
      { status: 500 },
    );
  }
}
