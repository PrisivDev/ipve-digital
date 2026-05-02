import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrAccountant } from '@/lib/auth-helpers/route-auth';
import { payrollService } from '@/services/payroll.service';
import type { PayrollStatus } from '@prisma/client';
import { json } from '@/lib/json';

// GET /api/payroll/runs — list payroll runs with filters
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      status: (searchParams.get('status') as PayrollStatus) || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    };

    const result = await payrollService.getAll(filters);
    return json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/payroll/runs error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des exercices de paie' },
      { status: 500 },
    );
  }
}

// POST /api/payroll/runs — generate payroll run for a given month/year
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.month || !body.year) {
      return NextResponse.json(
        { success: false, error: 'Le mois et l\'année sont requis' },
        { status: 400 },
      );
    }

    if (body.month < 1 || body.month > 12) {
      return NextResponse.json(
        { success: false, error: 'Le mois doit être entre 1 et 12' },
        { status: 400 },
      );
    }

    if (body.year < 2000 || body.year > 2100) {
      return NextResponse.json(
        { success: false, error: 'L\'année est invalide' },
        { status: 400 },
      );
    }

    const payrollRun = await payrollService.generate(body, auth.payload.userId!);
    return json({ success: true, data: payrollRun }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/payroll/runs error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération de la paie';
    const status = message.includes('existe déjà') ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// PATCH /api/payroll/runs — validate payroll run
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'L\'identifiant de l\'exercice de paie est requis' },
        { status: 400 },
      );
    }

    const payrollRun = await payrollService.validate(body.id, auth.payload.userId!);
    return json({ success: true, data: payrollRun });
  } catch (error: unknown) {
    console.error('PATCH /api/payroll/runs error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la validation';
    if (message === 'Exercice de paie non trouvé') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
