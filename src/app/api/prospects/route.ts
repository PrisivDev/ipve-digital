import { NextRequest, NextResponse } from 'next/server';
import { prospectService } from '@/services/prospect.service';
import { json } from '@/lib/json';

// GET /api/prospects — list with filters + pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    source: searchParams.get('source') || undefined,
    assignedTo: searchParams.get('assignedTo') || undefined,
    filiereInterest: searchParams.get('filiereInterest') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
  };
  try {
    const result = await prospectService.getAll(filters);
    return json(result);
  } catch (error) {
    console.error('GET /api/prospects error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des prospects' }, { status: 500 });
  }
}

// POST /api/prospects — create prospect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prospect = await prospectService.create(body);
    return json(prospect, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/prospects error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du prospect';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
