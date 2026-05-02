import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/users/[id] — Get user by ID with role info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLogin: true,
        totpEnabled: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 },
      );
    }

    return json({
      success: true,
      data: {
        ...user,
        lastLogin: user.lastLogin?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET user error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement de l\'utilisateur' },
      { status: 500 },
    );
  }
}

// PUT /api/settings/users/[id] — Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const { firstName, lastName, phone, roleId, isActive, password } = body;

    // Check user exists
    const existing = await db.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 },
      );
    }

    // Prevent self-deactivation
    if (isActive === false && id === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas désactiver votre propre compte' },
        { status: 400 },
      );
    }

    // Prevent self-admin-removal
    if (roleId && roleId !== existing.roleId && id === auth.userId) {
      const newRole = await db.role.findUnique({ where: { id: roleId } });
      if (newRole?.name !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Vous ne pouvez pas retirer votre propre rôle d\'administrateur' },
          { status: 400 },
        );
      }
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName.trim();
    if (lastName !== undefined) data.lastName = lastName.trim();
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (roleId !== undefined) data.roleId = roleId;
    if (isActive !== undefined) data.isActive = isActive;

    // Optional password reset
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
          { status: 400 },
        );
      }
      data.passwordHash = await hashPassword(password);
    }

    // Validate role if changing
    if (roleId && roleId !== existing.roleId) {
      const role = await db.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Rôle introuvable' },
          { status: 400 },
        );
      }
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE_USER',
        resource: 'users',
        resourceId: id,
        oldValues: JSON.stringify({
          firstName: existing.firstName,
          lastName: existing.lastName,
          phone: existing.phone,
          roleName: existing.role.name,
          isActive: existing.isActive,
        }),
        newValues: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roleName: user.role.name,
          isActive: user.isActive,
          passwordChanged: !!password,
        }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({
      success: true,
      data: {
        ...user,
        lastLogin: user.lastLogin?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[SETTINGS] PUT user error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 },
    );
  }
}

// DELETE /api/settings/users/[id] — Deactivate user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Check user exists
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 },
      );
    }

    // Prevent self-deactivation
    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez pas désactiver votre propre compte' },
        { status: 400 },
      );
    }

    // Already inactive
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Cet utilisateur est déjà désactivé' },
        { status: 400 },
      );
    }

    // Soft delete: set isActive = false
    const deactivated = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DEACTIVATE_USER',
        resource: 'users',
        resourceId: id,
        oldValues: JSON.stringify({ isActive: true }),
        newValues: JSON.stringify({ isActive: false }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({
      success: true,
      data: deactivated,
    });
  } catch (error) {
    console.error('[SETTINGS] DELETE user error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désactivation de l\'utilisateur' },
      { status: 500 },
    );
  }
}
