import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

// GET /api/payment-plans/[id] — get plan detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { paymentPlanService } = await import('@/services/payment-plan.service');

  try {
    const plan = await paymentPlanService.getPlanById(id);
    return json(plan);
  } catch (error: unknown) {
    console.error('GET /api/payment-plans/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Plan de paiement non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
