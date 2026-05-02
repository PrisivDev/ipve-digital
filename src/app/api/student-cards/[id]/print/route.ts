import { NextRequest, NextResponse } from 'next/server';
import { studentCardService } from '@/services/student-card.service';
import { json } from '@/lib/json';

// POST /api/student-cards/[id]/print — record a print
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const card = await studentCardService.recordPrint(id);
    return json(card);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erreur';
    if (message === 'Carte étudiant non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error('POST /api/student-cards/[id]/print error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
