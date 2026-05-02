import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

// GET /api/admissions/:id — single admission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admissionService } = await import('@/services/admission.service');
  try {
    const admission = await admissionService.getById(id);
    return json(admission);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Candidature non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/admissions/:id — update admission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admissionService } = await import('@/services/admission.service');
  try {
    const body = await request.json();
    const admission = await admissionService.update(id, body);
    return json(admission);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Candidature non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admissions/:id — delete admission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admissionService } = await import('@/services/admission.service');
  try {
    await admissionService.remove(id);
    return json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Candidature non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
