import { NextRequest, NextResponse } from 'next/server';
import { studentCardService } from '@/services/student-card.service';
import type { StudentCardStatus } from '@prisma/client';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/student-cards — list with filters + pagination
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);

  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') as StudentCardStatus | null || undefined,
    studentId: searchParams.get('studentId') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
  };

  try {
    const result = await studentCardService.getAll(filters);
    return json(result);
  } catch (error) {
    console.error('GET /api/student-cards error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des cartes étudiantes' },
      { status: 500 },
    );
  }
}

// POST /api/student-cards — generate a new card
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { studentId, expiryDate } = body;

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json(
        { error: 'studentId est requis' },
        { status: 400 },
      );
    }

    if (expiryDate && isNaN(Date.parse(expiryDate))) {
      return NextResponse.json(
        { error: 'expiryDate invalide (format ISO attendu)' },
        { status: 400 },
      );
    }

    const card = await studentCardService.generate({
      studentId,
      expiryDate,
    });

    return json(card, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/student-cards error:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création de la carte';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
