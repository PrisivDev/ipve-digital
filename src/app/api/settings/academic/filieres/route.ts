import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/filieres
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (activeOnly) where.isActive = true;

    const filieres = await db.filiere.findMany({
      where,
      include: { _count: { select: { levels: true, students: true } } },
      orderBy: { name: 'asc' },
    });

    return json({ success: true, data: filieres });
  } catch (error) {
    console.error('[SETTINGS] GET filieres error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des filières' },
      { status: 500 },
    );
  }
}

// POST /api/settings/academic/filieres
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, code, description, durationYears } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Le nom et le code sont requis' },
        { status: 400 },
      );
    }

    const existing = await db.filiere.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Une filière avec ce code existe déjà' },
        { status: 409 },
      );
    }

    const filiere = await db.filiere.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
        durationYears: durationYears || 3,
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'filieres',
        resourceId: filiere.id,
        newValues: JSON.stringify({ name: filiere.name, code: filiere.code }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: filiere }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST filieres error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la filière' },
      { status: 500 },
    );
  }
}
