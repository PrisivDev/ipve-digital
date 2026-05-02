import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/users — List users with search, filters, pagination
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || undefined;
    const roleParam = searchParams.get('role') || searchParams.get('roleId') || undefined;
    const status = searchParams.get('status'); // 'active' | 'inactive' | 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleParam) {
      // Support both role name (e.g. 'ADMIN') and role ID (UUID)
      where.role = roleParam.length < 10
        ? { name: roleParam }
        : { id: roleParam };
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const skip = (page - 1) * limit;

    // Sequential queries to avoid Supabase connection pool exhaustion
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        totpEnabled: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await db.user.count({ where });
    const activeCount = await db.user.count({ where: { ...where, isActive: true } });
    const inactiveCount = await db.user.count({ where: { ...where, isActive: false } });
    const twoFactorCount = await db.user.count({ where: { ...where, totpEnabled: true } });

    // Get all available roles
    const roles = await db.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    return json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          roleName: u.role.name,
          lastLogin: u.lastLogin?.toISOString() || null,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        roles,
        stats: {
          total,
          active: activeCount,
          inactive: inactiveCount,
          twoFactorActive: twoFactorCount,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET users error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des utilisateurs' },
      { status: 500 },
    );
  }
}

// POST /api/settings/users — Create user
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, roleId, password } = body;

    // Validations
    if (!email || !firstName || !lastName || !roleId || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, prénom, nom, rôle et mot de passe sont requis' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email uniqueness
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 },
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 },
      );
    }

    // Validate role exists
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Rôle introuvable' },
        { status: 400 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        roleId,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
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
        action: 'CREATE_USER',
        resource: 'users',
        resourceId: user.id,
        newValues: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleName: user.role.name,
        }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json(
      {
        success: true,
        data: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[SETTINGS] POST users error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 },
    );
  }
}
