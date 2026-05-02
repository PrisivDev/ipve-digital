import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { studentService } = await import('@/services/student.service');
  try {
    const summary = await studentService.getFinancialSummary(id);
    return json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Étudiant non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
