import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/levels/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const level = await db.level.findUnique({
      where: { id },
      include: {
        filiere: { select: { id: true, name: true, code: true } },
        _count: { select: { classes: true, students: true } },
      },
    });

    if (!level) {
      return NextResponse.json({ success: false, error: 'Niveau introuvable' }, { status: 404 });
    }

    return json({ success: true, data: level });
  } catch (error) {
    console.error('[SETTINGS] GET level error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/academic/levels/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, filiereId, yearNumber, tuitionFee } = body;

    const existing = await db.level.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Niveau introuvable' }, { status: 404 });
    }

    if (filiereId && yearNumber !== undefined) {
      const conflict = await db.level.findUnique({
        where: { filiereId_yearNumber: { filiereId, yearNumber } },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Ce niveau existe déjà pour cette filière' },
          { status: 409 },
        );
      }
    }

    const level = await db.level.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(filiereId !== undefined && { filiereId }),
        ...(yearNumber !== undefined && { yearNumber }),
        ...(tuitionFee !== undefined && { tuitionFee }),
      },
      include: { filiere: { select: { id: true, name: true, code: true } } },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'levels',
        resourceId: id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: level });
  } catch (error) {
    console.error('[SETTINGS] PUT level error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/academic/levels/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.level.findUnique({
      where: { id },
      include: { _count: { select: { classes: true, students: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Niveau introuvable' }, { status: 404 });
    }

    if (existing._count.classes > 0 || existing._count.students > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des classes ou étudiants sont associés' },
        { status: 400 },
      );
    }

    await db.level.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'levels',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE level error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
