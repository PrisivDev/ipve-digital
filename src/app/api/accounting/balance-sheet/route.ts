import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import { json } from '@/lib/json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Le paramètre date est obligatoire' },
        { status: 400 },
      );
    }

    const result = await accountingService.getBalanceSheet(date);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
