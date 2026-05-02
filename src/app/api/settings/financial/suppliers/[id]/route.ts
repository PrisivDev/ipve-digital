import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/financial/suppliers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Fournisseur introuvable' }, { status: 404 });
    }
    return json({ success: true, data: supplier });
  } catch (error) {
    console.error('[SETTINGS] GET supplier error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/financial/suppliers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address, contactPerson, rib, isActive } = body;

    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fournisseur introuvable' }, { status: 404 });
    }

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(contactPerson !== undefined && { contactPerson: contactPerson?.trim() || null }),
        ...(rib !== undefined && { rib: rib?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'suppliers',
        resourceId: id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: supplier });
  } catch (error) {
    console.error('[SETTINGS] PUT supplier error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/financial/suppliers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const existing = await db.supplier.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fournisseur introuvable' }, { status: 404 });
    }

    if (existing._count.expenses > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer : des dépenses sont associées' },
        { status: 400 },
      );
    }

    await db.supplier.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'suppliers',
        resourceId: id,
        oldValues: JSON.stringify({ name: existing.name }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE supplier error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
