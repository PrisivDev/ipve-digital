import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/academic-years
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const years = await db.academicYear.findMany({
      include: {
        periods: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { classes: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return json({ success: true, data: years });
  } catch (error) {
    console.error('[SETTINGS] GET academic-years error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des années scolaires' }, { status: 500 });
  }
}

// POST /api/settings/academic/academic-years
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, startDate, endDate, isCurrent, periods } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Le nom, la date de début et la date de fin sont requis' },
        { status: 400 },
      );
    }

    const year = await db.academicYear.create({
      data: {
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
        ...(periods && periods.length > 0 && {
          periods: {
            create: periods.map((p: { name: string; startDate: string; endDate: string; weight?: number; sortOrder?: number }) => ({
              name: p.name.trim(),
              startDate: new Date(p.startDate),
              endDate: new Date(p.endDate),
              weight: p.weight || 1,
              sortOrder: p.sortOrder || 0,
            })),
          },
        }),
      },
      include: { periods: { orderBy: { sortOrder: 'asc' } } },
    });

    if (isCurrent) {
      await db.academicYear.updateMany({
        where: { id: { not: year.id }, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'academic_years',
        resourceId: year.id,
        newValues: JSON.stringify({ name: year.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: year }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST academic-years error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la création' }, { status: 500 });
  }
}
