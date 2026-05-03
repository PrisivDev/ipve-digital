import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// POST /api/prospects/:id/convert — convert prospect to student
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { prospectService } = await import('@/services/prospect.service');
  try {
    const body = await request.json();
    const { filiereId, levelId, classId, scholarship, scholarshipPct } = body as {
      filiereId: string;
      levelId: string;
      classId: string;
      scholarship?: boolean;
      scholarshipPct?: number;
    };

    if (!filiereId || !levelId || !classId) {
      return NextResponse.json(
        { error: 'La filière, le niveau et la classe sont requis' },
        { status: 400 },
      );
    }

    const result = await prospectService.convert(id, {
      filiereId,
      levelId,
      classId,
      scholarship,
      scholarshipPct,
    });
    return json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Prospect non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
