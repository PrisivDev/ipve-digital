import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import type { TrialBalanceFilters } from '@/types/accounting.types';
import { json } from '@/lib/json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: TrialBalanceFilters = {
      date: searchParams.get('date') ?? undefined,
      onlyMoved: searchParams.get('onlyMoved') === 'true' ? true : undefined,
    };

    const result = await accountingService.getTrialBalance(filters);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
