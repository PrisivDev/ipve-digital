import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

// GET /api/payments/student/[studentId] — get student payment status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;
  const { paymentService } = await import('@/services/payment.service');

  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId') || undefined;

    const result = await paymentService.getStudentPaymentStatus(
      studentId,
      academicYearId,
    );
    return json(result);
  } catch (error: unknown) {
    console.error('GET /api/payments/student/[studentId] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Étudiant non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
