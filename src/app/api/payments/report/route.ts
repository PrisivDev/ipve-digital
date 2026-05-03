import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';
import type { PaymentReportFilters } from '@/types/payment.types';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/payments/report — payment report with groupings
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);

  const filters: PaymentReportFilters = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    groupBy: searchParams.get('groupBy') as PaymentReportFilters['groupBy'] | undefined,
    paymentMethod: searchParams.get('paymentMethod') as PaymentReportFilters['paymentMethod'] | undefined,
  };

  try {
    const report = await paymentService.getPaymentReport(filters);
    return json(report);
  } catch (error) {
    console.error('GET /api/payments/report error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du rapport' },
      { status: 500 },
    );
  }
}
