import { NextRequest, NextResponse } from 'next/server';
import { studentCardService } from '@/services/student-card.service';
import { json } from '@/lib/json';

// POST /api/student-cards/[id]/renew — renew a LOST/EXPIRED card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const newCard = await studentCardService.renew(id);
    return json(newCard, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erreur';
    if (message === 'Carte étudiant non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (
      message ===
      'Seules les cartes PERDUES ou EXPIRÉES peuvent être renouvelées'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error('POST /api/student-cards/[id]/renew error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
