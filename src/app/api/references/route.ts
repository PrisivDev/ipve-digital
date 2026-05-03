import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// GET /api/references — return filieres, levels, classes for dropdowns
// Optional query params: ?filiereId=xxx (filter levels by filiere)
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = req.nextUrl;
    const filiereId = searchParams.get('filiereId') || undefined;

    // Sequential queries to avoid Supabase connection pool exhaustion
    const filieres = await db.filiere.findMany({
      select: { id: true, name: true, code: true },
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const levelsWhere = filiereId ? { filiereId } : {};
    const levels = await db.level.findMany({
      select: { id: true, name: true, filiereId: true },
      where: levelsWhere,
      orderBy: { yearNumber: 'asc' },
    });

    // Fetch classes filtered by level if provided
    const levelId = searchParams.get('levelId') || undefined;
    let classes: { id: string; name: string; levelId: string }[] = [];
    if (levelId) {
      classes = await db.class.findMany({
        select: { id: true, name: true, levelId: true },
        where: { levelId },
        orderBy: { name: 'asc' },
      });
    }

    return json({ filieres, levels, classes });
  } catch (error) {
    console.error('GET /api/references error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des références' },
      { status: 500 },
    );
  }
}
