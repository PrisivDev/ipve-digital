import { NextResponse } from 'next/server';
import { json } from '@/lib/json';

// GET /api/payments/dashboard — payment dashboard data
export async function GET() {
  const { paymentService } = await import('@/services/payment.service');

  try {
    const dashboard = await paymentService.getPaymentDashboard();
    return json(dashboard);
  } catch (error) {
    console.error('GET /api/payments/dashboard error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du tableau de bord', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
