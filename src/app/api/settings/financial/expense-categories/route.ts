import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/financial/expense-categories
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (activeOnly) where.isActive = true;

    const categories = await db.expenseCategory.findMany({
      where,
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });

    return json({ success: true, data: categories });
  } catch (error) {
    console.error('[SETTINGS] GET expense-categories error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des catégories' }, { status: 500 });
  }
}

// POST /api/settings/financial/expense-categories
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, code, description, budgetLimit, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Le nom est requis' },
        { status: 400 },
      );
    }

    const category = await db.expenseCategory.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
        budgetLimit: budgetLimit || 0,
        isActive: isActive !== false,
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'expense_categories',
        resourceId: category.id,
        newValues: JSON.stringify({ name: category.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST expense-categories error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la création' }, { status: 500 });
  }
}
