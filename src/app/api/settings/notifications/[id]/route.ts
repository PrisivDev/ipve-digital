import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// PUT /api/settings/notifications/[id] — toggle read status or mark all as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    if (id === 'all') {
      const result = await db.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
      return json({ success: true, data: { updated: result.count } });
    }

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification introuvable' }, { status: 404 });
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: !notification.isRead },
    });

    return json({ success: true, data: updated });
  } catch (error) {
    console.error('[SETTINGS] PUT notification error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// DELETE /api/settings/notifications/[id] — delete single notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await db.notification.delete({ where: { id } });
    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[SETTINGS] DELETE notification error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
