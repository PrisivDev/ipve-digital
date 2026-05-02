import { NextRequest, NextResponse } from 'next/server';
import { admissionService } from '@/services/admission.service';
import { json } from '@/lib/json';

// GET /api/admissions — list with filters + pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    filiereId: searchParams.get('filiereId') || undefined,
    levelId: searchParams.get('levelId') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
  };

  try {
    const result = await admissionService.getAll(filters);
    return json(result);
  } catch (error) {
    console.error('GET /api/admissions error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des candidatures' },
      { status: 500 },
    );
  }
}

// POST /api/admissions — create admission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        { error: 'Les champs prénom, nom et téléphone sont obligatoires' },
        { status: 400 },
      );
    }
    if (!body.filiereId || !body.levelId) {
      return NextResponse.json(
        { error: 'Les champs filière et niveau sont obligatoires' },
        { status: 400 },
      );
    }

    const admission = await admissionService.create(body);
    return json(admission, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/admissions error:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
