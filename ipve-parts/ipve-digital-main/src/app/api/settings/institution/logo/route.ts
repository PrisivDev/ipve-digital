import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';

// POST /api/settings/institution/logo — Upload logo
// Strategy: try Supabase Storage first, fallback to base64 data URL
export async function POST(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fichier logo requis' },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non supporté. Utilisez JPG, PNG, SVG ou WebP.' },
        { status: 400 },
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Le fichier ne doit pas dépasser 2 Mo.' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    let logoUrl: string;

    // Try Supabase Storage first
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const supabaseAdmin = getSupabaseAdmin();

      if (supabaseAdmin) {
        const ext = file.name.split('.').pop() || 'png';
        const uniqueName = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Try to create bucket if it doesn't exist
        try {
          const { error: bucketError } = await supabaseAdmin.storage.createBucket('logos', {
            public: true,
            fileSizeLimit: 2 * 1024 * 1024,
          });
          if (bucketError && !bucketError.message.includes('already exists')) {
            console.warn('[SETTINGS] Could not create logos bucket:', bucketError.message);
          }
        } catch {
          // Bucket might already exist, continue
        }

        const { error: uploadError } = await supabaseAdmin.storage
          .from('logos')
          .upload(uniqueName, bytes, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from('logos')
            .getPublicUrl(uniqueName);
          logoUrl = urlData.publicUrl;
        } else {
          console.warn('[SETTINGS] Supabase Storage upload failed, using base64 fallback:', uploadError.message);
          logoUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
        }
      } else {
        // No Supabase admin client (missing env vars), use base64 fallback
        console.warn('[SETTINGS] Supabase admin not configured, using base64 fallback for logo');
        logoUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
      }
    } catch (storageErr) {
      console.warn('[SETTINGS] Supabase Storage error, using base64 fallback:', storageErr);
      logoUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
    }

    // Update institution settings
    const existing = await db.institutionSettings.findFirst();
    let settings;
    if (existing) {
      settings = await db.institutionSettings.update({
        where: { id: existing.id },
        data: { logoUrl },
      });
    } else {
      settings = await db.institutionSettings.create({
        data: { logoUrl },
      });
    }

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'UPLOAD_INSTITUTION_LOGO',
          resource: 'institution_settings',
          resourceId: settings.id,
          newValues: JSON.stringify({ logoUrl: logoUrl.substring(0, 100) + '...' }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    } catch {
      // Audit logging should never block the main flow
    }

    return NextResponse.json({
      success: true,
      data: { logoUrl },
    });
  } catch (error) {
    console.error('[SETTINGS] POST logo error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du téléchargement du logo' },
      { status: 500 },
    );
  }
}
