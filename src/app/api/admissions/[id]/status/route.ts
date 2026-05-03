import { NextRequest, NextResponse } from 'next/server';
import type { AdmissionStatus } from '@prisma/client';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// PUT /api/admissions/:id/status — update admission status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { admissionService } = await import('@/services/admission.service');

  try {
    const reviewerId = auth.payload.userId ?? null;

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
