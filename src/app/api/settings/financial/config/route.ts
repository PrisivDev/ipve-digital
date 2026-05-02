import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/financial/config
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    let settings = await db.institutionSettings.findFirst();
    if (!settings) {
      settings = await db.institutionSettings.create({ data: {} });
    }

    return json({
      success: true,
      data: {
        defaultPaymentMethod: settings.defaultPaymentMethod || 'CASH',
        latePenaltyPercent: settings.latePenaltyPercent || 0,
        gracePeriodDays: settings.gracePeriodDays || 0,
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET financial config error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}

// PUT /api/settings/financial/config
export async function PUT(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { defaultPaymentMethod, latePenaltyPercent, gracePeriodDays } = body;

    let settings = await db.institutionSettings.findFirst();
    if (!settings) {
      settings = await db.institutionSettings.create({ data: {} });
    }

    const updated = await db.institutionSettings.update({
      where: { id: settings.id },
      data: {
        ...(defaultPaymentMethod !== undefined && { defaultPaymentMethod }),
        ...(latePenaltyPercent !== undefined && { latePenaltyPercent: Number(latePenaltyPercent) }),
        ...(gracePeriodDays !== undefined && { gracePeriodDays: Number(gracePeriodDays) }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE',
        resource: 'financial_config',
        resourceId: settings.id,
        newValues: JSON.stringify(body),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({
      success: true,
      data: {
        defaultPaymentMethod: updated.defaultPaymentMethod || 'CASH',
        latePenaltyPercent: updated.latePenaltyPercent || 0,
        gracePeriodDays: updated.gracePeriodDays || 0,
      },
    });
  } catch (error) {
    console.error('[SETTINGS] PUT financial config error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
