import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/student.service';
import { json } from '@/lib/json';

// GET /api/students — list with filters + pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    search: searchParams.get('search') || undefined,
    filiereId: searchParams.get('filiereId') || undefined,
    levelId: searchParams.get('levelId') || undefined,
    classId: searchParams.get('classId') || undefined,
    status: searchParams.get('status') as any || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
  };
  try {
    const result = await studentService.getAll(filters);
    return json(result);
  } catch (error) {
    console.error('GET /api/students error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: 'Erreur lors du chargement des étudiants', detail: msg, ...(process.env.NODE_ENV !== 'production' && { stack }) },
      { status: 500 },
    );
  }
}

// POST /api/students — create student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const student = await studentService.create(body);
    return json(student, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/students error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la création';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
