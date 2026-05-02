import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import type { LedgerFilters } from '@/types/accounting.types';
import { json } from '@/lib/json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json({ error: 'accountId est obligatoire' }, { status: 400 });
    }

    const filters: LedgerFilters = {
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    };

    const result = await accountingService.getLedger(accountId, filters);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const status = message.includes('non trouvé') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
