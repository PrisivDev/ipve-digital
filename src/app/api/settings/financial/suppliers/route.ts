import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/financial/suppliers
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
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (activeOnly) where.isActive = true;

    const suppliers = await db.supplier.findMany({
      where,
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });

    return json({ success: true, data: suppliers });
  } catch (error) {
    console.error('[SETTINGS] GET suppliers error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des fournisseurs' }, { status: 500 });
  }
}

// POST /api/settings/financial/suppliers
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, phone, email, address, contactPerson, rib } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Le nom est requis' },
        { status: 400 },
      );
    }

    const supplier = await db.supplier.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        rib: rib?.trim() || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE',
        resource: 'suppliers',
        resourceId: supplier.id,
        newValues: JSON.stringify({ name: supplier.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    console.error('[SETTINGS] POST suppliers error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la création' }, { status: 500 });
  }
}
