import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/security/audit-log — Paginated audit log with filters
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    const skip = (page - 1) * limit;

    // Sequential queries to avoid Supabase connection pool exhaustion
    const entries = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total = await db.auditLog.count({ where });

    return json({
      success: true,
      data: {
        entries: entries.map((entry) => ({
          id: entry.id,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: entry.createdAt.toISOString(),
          user: entry.user
            ? {
                id: entry.user.id,
                email: entry.user.email,
                firstName: entry.user.firstName,
                lastName: entry.user.lastName,
              }
            : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET audit log error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement du journal d\'audit' },
      { status: 500 },
    );
  }
}
