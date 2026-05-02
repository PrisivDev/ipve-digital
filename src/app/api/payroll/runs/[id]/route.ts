import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrAccountant } from '@/lib/auth-helpers/route-auth';
import { payrollService } from '@/services/payroll.service';
import { json } from '@/lib/json';

// GET /api/payroll/runs/[id] — get payroll run detail with all payslips
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrAccountant(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const payrollRun = await payrollService.getById(id);
    return json({ success: true, data: payrollRun });
  } catch (error: unknown) {
    console.error('GET /api/payroll/runs/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Exercice de paie non trouvé') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
