import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrAccountant } from '@/lib/auth-helpers/route-auth';
import { employeeService } from '@/services/employee.service';
import { json } from '@/lib/json';

// GET /api/employees/[id] — get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const employee = await employeeService.getById(id);
    return json({ success: true, data: employee });
  } catch (error: unknown) {
    console.error('GET /api/employees/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Employé non trouvé') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/employees/[id] — update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    // Prevent updating employeeNumber
    if (body.employeeNumber) {
      return NextResponse.json(
        { success: false, error: 'Le numéro d\'employé ne peut pas être modifié' },
        { status: 400 },
      );
    }

    const employee = await employeeService.update(id, body);
    return json({ success: true, data: employee });
  } catch (error: unknown) {
    console.error('PUT /api/employees/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Employé non trouvé') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE /api/employees/[id] — soft delete (set isActive=false, terminationDate=today)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    await employeeService.remove(id);
    return json({ success: true, data: { message: 'Employé désactivé avec succès' } });
  } catch (error: unknown) {
    console.error('DELETE /api/employees/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Employé non trouvé') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
