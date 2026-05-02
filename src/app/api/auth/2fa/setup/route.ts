import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthError, verifyAccessToken, isTokenBlacklisted } from '@/lib/auth';

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

    const result = await authService.generateTOTP(payload.sub as string);

    return NextResponse.json({
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
      message: 'Scannez le QR code avec votre application d\'authentification',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('[AUTH] 2FA setup error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}
