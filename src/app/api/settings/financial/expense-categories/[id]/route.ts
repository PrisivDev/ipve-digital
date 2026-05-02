import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/financial/expense-categories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const category = await db.expenseCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Catégorie introuvable' }, { status: 404 });
    }
    return json({ success: true, data: category });
  } catch (error) {
    console.error('[SETTINGS] GET expense-category error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/financial/expense-categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description, budgetLimit, isActive } = body;

    const existing = await db.expenseCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Catégorie introuvable' }, { status: 404 });
    }

    const category = await db.expenseCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(budgetLimit !== undefined && { budgetLimit }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'expense_categories',
        resourceId: id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: category });
  } catch (error) {
    console.error('[SETTINGS] PUT expense-category error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/financial/expense-categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.expenseCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true, children: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Catégorie introuvable' }, { status: 404 });
    }

    if (existing._count.expenses > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des dépenses sont associées' },
        { status: 400 },
      );
    }

    await db.expenseCategory.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'expense_categories',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE expense-category error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
