import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/academic-years/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const year = await db.academicYear.findUnique({
      where: { id },
      include: { periods: { orderBy: { sortOrder: 'asc' } }, _count: { select: { classes: true } } },
    });
    if (!year) {
      return NextResponse.json({ success: false, error: 'Année scolaire introuvable' }, { status: 404 });
    }
    return json({ success: true, data: year });
  } catch (error) {
    console.error('[SETTINGS] GET academic-year error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/academic/academic-years/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startDate, endDate, isCurrent } = body;

    const existing = await db.academicYear.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Année scolaire introuvable' }, { status: 404 });
    }

    if (isCurrent) {
      await db.academicYear.updateMany({
        where: { id: { not: id }, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const year = await db.academicYear.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(isCurrent !== undefined && { isCurrent }),
      },
      include: { periods: { orderBy: { sortOrder: 'asc' } } },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'academic_years',
        resourceId: id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: year });
  } catch (error) {
    console.error('[SETTINGS] PUT academic-year error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/academic/academic-years/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.academicYear.findUnique({
      where: { id },
      include: { _count: { select: { classes: true, periods: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Année scolaire introuvable' }, { status: 404 });
    }

    if (existing._count.classes > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des classes sont associées' },
        { status: 400 },
      );
    }

    // Delete periods first, then the year
    await db.period.deleteMany({ where: { academicYearId: id } });
    await db.academicYear.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'academic_years',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE academic-year error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
