import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const result = await accountingService.getJournalEntryById(id);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const status = message.includes('non trouvée') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.userId) {
      return NextResponse.json({ error: 'userId est obligatoire pour la validation' }, { status: 400 });
    }

    const result = await accountingService.validateEntry(id, body.userId);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const status = message.includes('non trouvée') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    await accountingService.deleteEntry(id);
    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const status = message.includes('non trouvée') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
