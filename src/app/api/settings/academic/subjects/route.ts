import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/subjects
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

    const subjects = await db.subject.findMany({
      where,
      include: { _count: { select: { classSubjects: true } } },
      orderBy: { name: 'asc' },
    });

    return json({ success: true, data: subjects });
  } catch (error) {
    console.error('[SETTINGS] GET subjects error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des matières' }, { status: 500 });
  }
}

// POST /api/settings/academic/subjects
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, code, description, isActive } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Le nom et le code sont requis' },
        { status: 400 },
      );
    }

    const existing = await db.subject.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Une matière avec ce code existe déjà' },
        { status: 409 },
      );
    }

    const subject = await db.subject.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
        isActive: isActive !== false,
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'subjects',
        resourceId: subject.id,
        newValues: JSON.stringify({ name: subject.name, code: subject.code }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: subject }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST subjects error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la création de la matière' }, { status: 500 });
  }
}
