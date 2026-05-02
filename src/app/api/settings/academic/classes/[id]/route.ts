import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/classes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const cls = await db.class.findUnique({
      where: { id },
      include: {
        level: { select: { id: true, name: true, yearNumber: true, filiere: { select: { id: true, name: true, code: true } } } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!cls) {
      return NextResponse.json({ success: false, error: 'Classe introuvable' }, { status: 404 });
    }
    return json({ success: true, data: cls });
  } catch (error) {
    console.error('[SETTINGS] GET class error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/academic/classes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, levelId, capacity, room, academicYearId } = body;

    const existing = await db.class.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Classe introuvable' }, { status: 404 });
    }

    const cls = await db.class.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(levelId !== undefined && { levelId }),
        ...(capacity !== undefined && { capacity }),
        ...(room !== undefined && { room: room?.trim() || null }),
        ...(academicYearId !== undefined && { academicYearId }),
      },
      include: {
        level: { select: { id: true, name: true, yearNumber: true, filiere: { select: { id: true, name: true, code: true } } } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'classes',
        resourceId: id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: cls });
  } catch (error) {
    console.error('[SETTINGS] PUT class error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/academic/classes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.class.findUnique({
      where: { id },
      include: { _count: { select: { students: true, classSubjects: true, grades: true, attendance: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Classe introuvable' }, { status: 404 });
    }

    if (existing._count.students > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des étudiants sont associés' },
        { status: 400 },
      );
    }

    await db.class.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'classes',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE class error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
