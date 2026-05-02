import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import type { IncomeStatementFilters } from '@/types/accounting.types';
import { json } from '@/lib/json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate et endDate sont obligatoires' },
        { status: 400 },
      );
    }

    const filters: IncomeStatementFilters = { startDate, endDate };
    const result = await accountingService.getIncomeStatement(filters);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
