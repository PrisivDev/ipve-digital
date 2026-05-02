import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

// GET /api/prospects/:id/interactions — get interactions for a prospect
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    const prospect = await prospectService.getById(id);
    return json(prospect.interactions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/prospects/:id/interactions — add interaction
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    const body = await request.json();
    const { type, subject, content, direction } = body as {
      type: string;
      subject?: string;
      content: string;
      direction?: string;
    };

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Le type et le contenu de l\'interaction sont requis' },
        { status: 400 },
      );
    }

    const interaction = await prospectService.addInteraction(id, {
      type: type as any,
      subject,
      content,
      direction: direction as any,
    });
    return json(interaction, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
