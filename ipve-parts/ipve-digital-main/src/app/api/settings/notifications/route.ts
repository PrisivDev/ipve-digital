import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/notifications — list all notifications (paginated)
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const type = searchParams.get('type') || undefined;
    const isRead = searchParams.get('isRead'); // 'true' | 'false' | undefined

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isRead === 'true') where.isRead = true;
    else if (isRead === 'false') where.isRead = false;

    const skip = (page - 1) * limit;

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await db.notification.count({ where });

    return json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
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
    console.error('[SETTINGS] GET notifications error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/notifications — bulk delete notifications
export async function DELETE(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);
    const type = searchParams.get('type');
    const deleteAll = searchParams.get('all') === 'true';

    let deleteCount = 0;

    if (deleteAll && type) {
      deleteCount = await db.notification.deleteMany({ where: { type } }).then((r) => r.count);
    } else if (ids && ids.length > 0) {
      deleteCount = await db.notification.deleteMany({ where: { id: { in: ids } } }).then((r) => r.count);
    } else {
      return NextResponse.json(
        { success: false, error: 'Spécifiez ids ou all&type pour la suppression' },
        { status: 400 },
      );
    }

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE',
        resource: 'notifications',
        newValues: JSON.stringify({ deleteCount }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({ success: true, data: { deleted: deleteCount } });
  } catch (error) {
    console.error('[SETTINGS] DELETE notifications error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
