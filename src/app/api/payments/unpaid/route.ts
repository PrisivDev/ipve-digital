import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';
import type { UnpaidFilters } from '@/types/payment.types';
import { json } from '@/lib/json';

// GET /api/payments/unpaid — list unpaid students
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: UnpaidFilters = {
    filiereId: searchParams.get('filiereId') || undefined,
    levelId: searchParams.get('levelId') || undefined,
    trancheId: searchParams.get('trancheId') || undefined,
    minAmount: searchParams.get('minAmount')
      ? parseInt(searchParams.get('minAmount')!)
      : undefined,
    maxAmount: searchParams.get('maxAmount')
      ? parseInt(searchParams.get('maxAmount')!)
      : undefined,
    includeOverdue: searchParams.get('includeOverdue') === 'true',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
  };

  try {
    const result = await paymentService.getUnpaidStudents(filters);
    return json(result);
  } catch (error) {
    console.error('GET /api/payments/unpaid error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des impayés' },
      { status: 500 },
    );
  }
}
