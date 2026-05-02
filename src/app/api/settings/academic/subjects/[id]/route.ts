import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/subjects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const subject = await db.subject.findUnique({
      where: { id },
      include: { _count: { select: { classSubjects: true } } },
    });
    if (!subject) {
      return NextResponse.json({ success: false, error: 'Matière introuvable' }, { status: 404 });
    }
    return json({ success: true, data: subject });
  } catch (error) {
    console.error('[SETTINGS] GET subject error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/academic/subjects/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description, isActive } = body;

    const existing = await db.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Matière introuvable' }, { status: 404 });
    }

    if (code && code.toUpperCase().trim() !== existing.code) {
      const codeExists = await db.subject.findUnique({ where: { code: code.toUpperCase().trim() } });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Une matière avec ce code existe déjà' },
          { status: 409 },
        );
      }
    }

    const subject = await db.subject.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code.toUpperCase().trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'subjects',
        resourceId: id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: subject });
  } catch (error) {
    console.error('[SETTINGS] PUT subject error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/academic/subjects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.subject.findUnique({
      where: { id },
      include: { _count: { select: { classSubjects: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Matière introuvable' }, { status: 404 });
    }

    if (existing._count.classSubjects > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des classes sont associées' },
        { status: 400 },
      );
    }

    await db.subject.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'subjects',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name, code: existing.code }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE subject error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
