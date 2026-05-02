import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/institution — Read institution settings (singleton)
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    let settings = await db.institutionSettings.findFirst();

    // Auto-create default settings if none exist
    if (!settings) {
      settings = await db.institutionSettings.create({ data: {} });
    }

    return json({
      success: true,
      data: {
        id: settings.id,
        schoolName: settings.schoolName,
        shortName: settings.shortName,
        motto: settings.motto,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logoUrl: settings.logoUrl,
        academicYear: settings.academicYear,
        currency: settings.currency,
        locale: settings.locale,
        updatedAt: settings.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET institution error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des paramètres institutionnels' },
      { status: 500 },
    );
  }
}

// PUT /api/settings/institution — Update institution settings
export async function PUT(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const {
      schoolName,
      shortName,
      motto,
      address,
      phone,
      email,
      website,
      logoUrl,
      academicYear,
      currency,
      locale,
    } = body;

    // Find or create settings
    const existing = await db.institutionSettings.findFirst();

    const data: Record<string, unknown> = {};
    if (schoolName !== undefined) data.schoolName = schoolName;
    if (shortName !== undefined) data.shortName = shortName;
    if (motto !== undefined) data.motto = motto;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (website !== undefined) data.website = website;
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (academicYear !== undefined) data.academicYear = academicYear;
    if (currency !== undefined) data.currency = currency;
    if (locale !== undefined) data.locale = locale;

    let settings;
    if (existing) {
      settings = await db.institutionSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await db.institutionSettings.create({ data });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE_INSTITUTION_SETTINGS',
        resource: 'institution_settings',
        resourceId: settings.id,
        oldValues: existing ? JSON.stringify(existing) : null,
        newValues: JSON.stringify(data),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({
      success: true,
      data: {
        id: settings.id,
        schoolName: settings.schoolName,
        shortName: settings.shortName,
        motto: settings.motto,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logoUrl: settings.logoUrl,
        academicYear: settings.academicYear,
        currency: settings.currency,
        locale: settings.locale,
        updatedAt: settings.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[SETTINGS] PUT institution error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des paramètres institutionnels' },
      { status: 500 },
    );
  }
}
