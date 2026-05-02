import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { studentService } = await import('@/services/student.service');

  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId') || undefined;
  const periodId = searchParams.get('periodId') || undefined;

  try {
    const summary = await studentService.getGrades(id, academicYearId, periodId);
    return json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Étudiant non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
