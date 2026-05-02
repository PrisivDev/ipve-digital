import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrAccountant } from '@/lib/auth-helpers/route-auth';
import { employeeService } from '@/services/employee.service';
import type { ContractType, Department } from '@prisma/client';
import { json } from '@/lib/json';

// GET /api/employees — list with filters + pagination
export async function GET(request: NextRequest) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      department: (searchParams.get('department') as Department) || undefined,
      status: (searchParams.get('status') as 'active' | 'inactive') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    };

    const result = await employeeService.getAll(filters);
    return json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/employees error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des employés' },
      { status: 500 },
    );
  }
}

// POST /api/employees — create employee
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { success: false, error: 'Le prénom et le nom sont requis' },
        { status: 400 },
      );
    }

    if (!body.hireDate) {
      return NextResponse.json(
        { success: false, error: 'La date d\'embauche est requise' },
        { status: 400 },
      );
    }

    if (!body.contractType || !Object.values(ContractType).includes(body.contractType)) {
      return NextResponse.json(
        { success: false, error: 'Le type de contrat est invalide' },
        { status: 400 },
      );
    }

    if (body.baseSalary === undefined || body.baseSalary === null || body.baseSalary < 0) {
      return NextResponse.json(
        { success: false, error: 'Le salaire de base doit être un montant positif' },
        { status: 400 },
      );
    }

    const employee = await employeeService.create(body);
    return json({ success: true, data: employee }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/employees error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de l\'employé';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
