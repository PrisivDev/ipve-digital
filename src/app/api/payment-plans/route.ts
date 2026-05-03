import { NextRequest, NextResponse } from 'next/server';
import { paymentPlanService } from '@/services/payment-plan.service';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/payment-plans — list all active payment plans
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get('academicYearId') || undefined;

  try {
    const plans = await paymentPlanService.getAllPlans(academicYearId);
    return json(plans);
  } catch (error) {
    console.error('GET /api/payment-plans error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des plans de paiement' },
      { status: 500 },
    );
  }
}

// POST /api/payment-plans — create a new payment plan
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const plan = await paymentPlanService.createPlan(body);
    return json(plan, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/payment-plans error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du plan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
