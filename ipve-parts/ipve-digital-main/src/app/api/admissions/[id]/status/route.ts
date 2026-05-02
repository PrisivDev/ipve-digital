import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import type { AdmissionStatus } from '@prisma/client';
import { json } from '@/lib/json';

// PUT /api/admissions/:id/status — update admission status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admissionService } = await import('@/services/admission.service');

  try {
    // Verify auth — extract reviewer from access token cookie
    const accessToken = request.cookies.get('ipve_access_token')?.value;
    const payload = accessToken ? await verifyAccessToken(accessToken) : null;
    const reviewerId = payload?.sub ?? null;

    // Parse body
    const body = await request.json();
    const { status, decisionNote } = body as {
      status: AdmissionStatus;
      decisionNote?: string;
    };

    if (!status) {
      return NextResponse.json(
        { error: 'Le statut est requis' },
        { status: 400 },
      );
    }

    const admission = await admissionService.updateStatus(
      id,
      status,
      reviewerId,
      decisionNote,
    );
    return json(admission);
  } catch (error: unknown) {
    console.error('PUT /api/admissions/:id/status error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Candidature non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (
      message.includes('Transition invalide') ||
      message.includes('réviseur authentifié')
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
