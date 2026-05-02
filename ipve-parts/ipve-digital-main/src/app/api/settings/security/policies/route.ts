import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/security/policies — Read security policies
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    let settings = await db.institutionSettings.findFirst();

    // Auto-create default if none exist
    if (!settings) {
      settings = await db.institutionSettings.create({ data: {} });
    }

    return json({
      success: true,
      data: {
        passwordMinLength: settings.passwordMinLength,
        passwordRequireUppercase: settings.passwordRequireUppercase,
        passwordRequireNumbers: settings.passwordRequireNumbers,
        passwordRequireSpecial: settings.passwordRequireSpecial,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        maxLoginAttempts: settings.maxLoginAttempts,
        twoFactorEnforced: settings.twoFactorEnforced,
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET security policies error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des politiques de sécurité' },
      { status: 500 },
    );
  }
}

// PUT /api/settings/security/policies — Update security policies
export async function PUT(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const {
      passwordMinLength,
      passwordRequireUppercase,
      passwordRequireNumbers,
      passwordRequireSpecial,
      sessionTimeoutMinutes,
      maxLoginAttempts,
      twoFactorEnforced,
    } = body;

    // Validations
    if (passwordMinLength !== undefined) {
      const len = Number(passwordMinLength);
      if (!Number.isInteger(len) || len < 6 || len > 128) {
        return NextResponse.json(
          { success: false, error: 'La longueur minimale du mot de passe doit être entre 6 et 128 caractères' },
          { status: 400 },
        );
      }
    }

    if (sessionTimeoutMinutes !== undefined) {
      const timeout = Number(sessionTimeoutMinutes);
      if (!Number.isInteger(timeout) || timeout < 5 || timeout > 1440) {
        return NextResponse.json(
          { success: false, error: 'Le délai d\'expiration de session doit être entre 5 et 1440 minutes' },
          { status: 400 },
        );
      }
    }

    if (maxLoginAttempts !== undefined) {
      const attempts = Number(maxLoginAttempts);
      if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) {
        return NextResponse.json(
          { success: false, error: 'Le nombre maximum de tentatives doit être entre 1 et 20' },
          { status: 400 },
        );
      }
    }

    // Find or create settings
    const existing = await db.institutionSettings.findFirst();

    const data: Record<string, unknown> = {};
    if (passwordMinLength !== undefined) data.passwordMinLength = Number(passwordMinLength);
    if (passwordRequireUppercase !== undefined) data.passwordRequireUppercase = Boolean(passwordRequireUppercase);
    if (passwordRequireNumbers !== undefined) data.passwordRequireNumbers = Boolean(passwordRequireNumbers);
    if (passwordRequireSpecial !== undefined) data.passwordRequireSpecial = Boolean(passwordRequireSpecial);
    if (sessionTimeoutMinutes !== undefined) data.sessionTimeoutMinutes = Number(sessionTimeoutMinutes);
    if (maxLoginAttempts !== undefined) data.maxLoginAttempts = Number(maxLoginAttempts);
    if (twoFactorEnforced !== undefined) data.twoFactorEnforced = Boolean(twoFactorEnforced);

    const settings = existing
      ? await db.institutionSettings.update({
          where: { id: existing.id },
          data,
        })
      : await db.institutionSettings.create({ data });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE_SECURITY_POLICIES',
        resource: 'security_policies',
        resourceId: settings.id,
        oldValues: existing ? JSON.stringify({
          passwordMinLength: existing.passwordMinLength,
          passwordRequireUppercase: existing.passwordRequireUppercase,
          passwordRequireNumbers: existing.passwordRequireNumbers,
          passwordRequireSpecial: existing.passwordRequireSpecial,
          sessionTimeoutMinutes: existing.sessionTimeoutMinutes,
          maxLoginAttempts: existing.maxLoginAttempts,
          twoFactorEnforced: existing.twoFactorEnforced,
        }) : null,
        newValues: JSON.stringify(data),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return json({
      success: true,
      data: {
        passwordMinLength: settings.passwordMinLength,
        passwordRequireUppercase: settings.passwordRequireUppercase,
        passwordRequireNumbers: settings.passwordRequireNumbers,
        passwordRequireSpecial: settings.passwordRequireSpecial,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        maxLoginAttempts: settings.maxLoginAttempts,
        twoFactorEnforced: settings.twoFactorEnforced,
      },
    });
  } catch (error) {
    console.error('[SETTINGS] PUT security policies error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour des politiques de sécurité' },
      { status: 500 },
    );
  }
}
