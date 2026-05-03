import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import type { CreateChartOfAccountDto } from '@/types/accounting.types';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (tree === 'true') {
      const result = await accountingService.getAccountTree();
      return json(result);
    }

    if (search) {
      const result = await accountingService.searchAccounts(search);
      return json(result);
    }

    const result = await accountingService.getAllAccounts(includeInactive);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    const dto: CreateChartOfAccountDto = {
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      accountClass: body.accountClass,
      accountType: body.accountType,
      parentId: body.parentId,
      normalBalance: body.normalBalance,
    };

    if (!dto.accountNumber || !dto.accountName || !dto.accountClass || !dto.accountType || !dto.normalBalance) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 },
      );
    }

    const result = await accountingService.createAccount(dto);
    return json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const status = message.includes('existe déjà') || message.includes('standard') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
