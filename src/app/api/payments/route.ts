import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';
import type { PaymentFilters, PaymentMethod, PaymentStatus } from '@/types/payment.types';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/payments — list payments with filters + pagination
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);

  const filters: PaymentFilters = {
    search: searchParams.get('search') || undefined,
    studentId: searchParams.get('studentId') || undefined,
    paymentMethod: searchParams.get('paymentMethod') as PaymentMethod | undefined,
    status: searchParams.get('status') as PaymentStatus | undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    receivedBy: searchParams.get('receivedBy') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '25'),
  };

  try {
    const result = await paymentService.getPayments(filters);
    return json(result);
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des paiements' },
      { status: 500 },
    );
  }
}

// POST /api/payments — record a new payment
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const payment = await paymentService.recordPayment(body);
    return json(payment, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/payments error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du paiement';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
