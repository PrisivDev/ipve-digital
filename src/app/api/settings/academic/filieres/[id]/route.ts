import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/academic/filieres/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const filiere = await db.filiere.findUnique({
      where: { id },
      include: { _count: { select: { levels: true, students: true } } },
    });

    if (!filiere) {
      return NextResponse.json(
        { success: false, error: 'Filière introuvable' },
        { status: 404 },
      );
    }

    return json({ success: true, data: filiere });
  } catch (error) {
    console.error('[SETTINGS] GET filiere error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement de la filière' },
      { status: 500 },
    );
  }
}

// PUT /api/settings/academic/filieres/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description, durationYears, isActive } = body;

    const existing = await db.filiere.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Filière introuvable' },
        { status: 404 },
      );
    }

    if (code && code.toUpperCase().trim() !== existing.code) {
      const codeExists = await db.filiere.findUnique({ where: { code: code.toUpperCase().trim() } });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Une filière avec ce code existe déjà' },
          { status: 409 },
        );
      }
    }

    const filiere = await db.filiere.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code.toUpperCase().trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(durationYears !== undefined && { durationYears }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'filieres',
        resourceId: filiere.id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: filiere });
  } catch (error) {
    console.error('[SETTINGS] PUT filiere error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification de la filière' },
      { status: 500 },
    );
  }
}

// DELETE /api/settings/academic/filieres/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.filiere.findUnique({
      where: { id },
      include: { _count: { select: { levels: true, students: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Filière introuvable' },
        { status: 404 },
      );
    }

    if (existing._count.levels > 0 || existing._count.students > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des niveaux ou étudiants sont associés' },
        { status: 400 },
      );
    }

    await db.filiere.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'filieres',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name, code: existing.code }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE filiere error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la filière' },
      { status: 500 },
    );
  }
}
