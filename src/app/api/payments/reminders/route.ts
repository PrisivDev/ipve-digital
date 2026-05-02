import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';
import { json } from '@/lib/json';

// POST /api/payments/reminders — send payment reminders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.channel || !Array.isArray(body.channel) || body.channel.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un canal de communication est requis (SMS, EMAIL)' },
        { status: 400 },
      );
    }

    const result = await paymentService.sendReminders(body);
    return json(result);
  } catch (error: unknown) {
    console.error('POST /api/payments/reminders error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'envoi des relances';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
