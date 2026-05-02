import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { json } from '@/lib/json';

// POST /api/admissions/:id/enroll — enroll an accepted admission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admissionService } = await import('@/services/admission.service');

  try {
    // Verify auth — extract reviewer from access token cookie
    const accessToken = request.cookies.get('ipve_access_token')?.value;
    const payload = accessToken ? await verifyAccessToken(accessToken) : null;
    if (!payload?.sub) {
      return NextResponse.json(
        { error: 'Authentification requise pour inscrire un candidat' },
        { status: 401 },
      );
    }

    const admission = await admissionService.enroll(id);
    return json(admission);
  } catch (error: unknown) {
    console.error('POST /api/admissions/:id/enroll error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Candidature non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('acceptées') || message.includes('déjà inscrite')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
