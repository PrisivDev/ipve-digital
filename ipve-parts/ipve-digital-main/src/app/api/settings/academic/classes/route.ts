import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/classes
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const levelId = searchParams.get('levelId') || undefined;
    const academicYearId = searchParams.get('academicYearId') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: Record<string, unknown> = {};
    if (levelId) where.levelId = levelId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const classes = await db.class.findMany({
      where,
      include: {
        level: { select: { id: true, name: true, yearNumber: true, filiere: { select: { id: true, name: true, code: true } } } },
        academicYear: { select: { id: true, name: true, isCurrent: true } },
        _count: { select: { students: true, classSubjects: true } },
      },
      orderBy: { name: 'asc' },
    });

    return json({ success: true, data: classes });
  } catch (error) {
    console.error('[SETTINGS] GET classes error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des classes' }, { status: 500 });
  }
}

// POST /api/settings/academic/classes
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, levelId, capacity, room, academicYearId } = body;

    if (!name || !levelId || !academicYearId) {
      return NextResponse.json(
        { success: false, error: 'Le nom, le niveau et l\'année scolaire sont requis' },
        { status: 400 },
      );
    }

    const cls = await db.class.create({
      data: {
        name: name.trim(),
        levelId,
        capacity: capacity || 40,
        room: room?.trim() || null,
        academicYearId,
      },
      include: {
        level: { select: { id: true, name: true, yearNumber: true, filiere: { select: { id: true, name: true, code: true } } } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'classes',
        resourceId: cls.id,
        newValues: JSON.stringify({ name: cls.name, levelId, academicYearId }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: cls }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST classes error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la création de la classe' }, { status: 500 });
  }
}
