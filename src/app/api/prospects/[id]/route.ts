import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/prospects/:id — get prospect detail
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    const prospect = await prospectService.getById(id);
    return json(prospect);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/prospects/:id — update prospect
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    const body = await request.json();
    const prospect = await prospectService.update(id, body);
    return json(prospect);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/prospects/:id — soft delete (set status ABANDONNE with notes "Supprimé")
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    await prospectService.updateStatus(id, 'ABANDONNE', 'Supprimé');
    return json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
