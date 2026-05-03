import { NextRequest, NextResponse } from 'next/server';
import { prospectService } from '@/services/prospect.service';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/prospects/kanban — get kanban board data
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const filters = {
    search: searchParams.get('search') || undefined,
    source: searchParams.get('source') || undefined,
    assignedTo: searchParams.get('assignedTo') || undefined,
    filiereInterest: searchParams.get('filiereInterest') || undefined,
  };
  try {
    const columns = await prospectService.getKanbanData(filters);
    return json(columns);
  } catch (error) {
    console.error('GET /api/prospects/kanban error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement du tableau kanban' }, { status: 500 });
  }
}
