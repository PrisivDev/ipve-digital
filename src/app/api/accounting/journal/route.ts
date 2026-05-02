import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import type { JournalFilters, CreateJournalEntryDto } from '@/types/accounting.types';
import { json } from '@/lib/json';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: JournalFilters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      journalType: (searchParams.get('journalType') as JournalFilters['journalType']) ?? undefined,
      isValidated: searchParams.get('isValidated') === 'true'
        ? true
        : searchParams.get('isValidated') === 'false'
          ? false
          : undefined,
      search: searchParams.get('search') ?? undefined,
      referenceType: (searchParams.get('referenceType') as JournalFilters['referenceType']) ?? undefined,
    };

    const result = await accountingService.getJournal(filters);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const dto: CreateJournalEntryDto = {
      entryDate: body.entryDate,
      description: body.description,
      journalType: body.journalType,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      createdBy: body.createdBy,
      lines: body.lines,
    };

    if (!dto.entryDate) {
      return NextResponse.json({ error: 'La date de l\'écriture est obligatoire' }, { status: 400 });
    }
    if (!dto.description) {
      return NextResponse.json({ error: 'La description est obligatoire' }, { status: 400 });
    }
    if (!dto.journalType) {
      return NextResponse.json({ error: 'Le type de journal est obligatoire' }, { status: 400 });
    }
    if (!dto.lines || dto.lines.length < 2) {
      return NextResponse.json({ error: 'L\'écriture doit contenir au moins 2 lignes' }, { status: 400 });
    }

    const result = await accountingService.createJournalEntry(dto);
    return json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const status = message.includes('non équilibrée') || message.includes('introuvable')
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
