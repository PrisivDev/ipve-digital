import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/payments/[id] — get payment detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { paymentService } = await import('@/services/payment.service');

  try {
    const payment = await paymentService.getPaymentById(id);
    return json(payment);
  } catch (error: unknown) {
    console.error('GET /api/payments/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Paiement non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/payments/[id] — cancel a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { paymentService } = await import('@/services/payment.service');

  try {
    const body = await request.json();
    const { reason, cancelledBy } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'La raison de l\'annulation est requise' },
        { status: 400 },
      );
    }
    if (!cancelledBy || typeof cancelledBy !== 'string') {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'utilisateur qui annule est requis' },
        { status: 400 },
      );
    }

    const payment = await paymentService.cancelPayment(id, reason, cancelledBy);
    return json(payment);
  } catch (error: unknown) {
    console.error('DELETE /api/payments/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Paiement non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
