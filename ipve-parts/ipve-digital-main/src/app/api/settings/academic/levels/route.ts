import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/levels
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const filiereId = searchParams.get('filiereId') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: Record<string, unknown> = {};
    if (filiereId) where.filiereId = filiereId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const levels = await db.level.findMany({
      where,
      include: {
        filiere: { select: { id: true, name: true, code: true } },
        _count: { select: { classes: true, students: true } },
      },
      orderBy: [{ yearNumber: 'asc' }],
    });

    return json({ success: true, data: levels });
  } catch (error) {
    console.error('[SETTINGS] GET levels error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des niveaux' },
      { status: 500 },
    );
  }
}

// POST /api/settings/academic/levels
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, filiereId, yearNumber, tuitionFee } = body;

    if (!name || !filiereId || yearNumber === undefined) {
      return NextResponse.json(
        { success: false, error: 'Le nom, la filière et le numéro d\'année sont requis' },
        { status: 400 },
      );
    }

    const filiere = await db.filiere.findUnique({ where: { id: filiereId } });
    if (!filiere) {
      return NextResponse.json(
        { success: false, error: 'Filière introuvable' },
        { status: 400 },
      );
    }

    const existing = await db.level.findUnique({
      where: { filiereId_yearNumber: { filiereId, yearNumber } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ce niveau existe déjà pour cette filière' },
        { status: 409 },
      );
    }

    const level = await db.level.create({
      data: {
        name: name.trim(),
        filiereId,
        yearNumber,
        tuitionFee: tuitionFee || 0,
      },
      include: { filiere: { select: { id: true, name: true, code: true } } },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'levels',
        resourceId: level.id,
        newValues: JSON.stringify({ name: level.name, filiereId, yearNumber }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: level }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST levels error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du niveau' },
      { status: 500 },
    );
  }
}
