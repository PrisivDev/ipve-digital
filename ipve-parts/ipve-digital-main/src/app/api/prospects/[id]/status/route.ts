import { NextRequest, NextResponse } from 'next/server';
import type { ProspectStatus } from '@/types/prospect.types';
import { json } from '@/lib/json';

// PATCH /api/prospects/:id/status — update prospect status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    const body = await request.json();
    const { status, notes } = body as { status: ProspectStatus; notes?: string };

    if (!status) {
      return NextResponse.json({ error: 'Le statut est requis' }, { status: 400 });
    }

    const prospect = await prospectService.updateStatus(id, status, notes);
    return json(prospect);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
