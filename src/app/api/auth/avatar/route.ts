import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isTokenBlacklisted } from '@/lib/auth';
import { db } from '@/lib/db';
import { json } from '@/lib/json';

/**
 * POST /api/auth/avatar — Upload avatar for the authenticated user
 * Strategy: try Supabase Storage first, fallback to base64 data URL
 * No 2FA required — only a valid access token.
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('ipve_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 },
      );
    }

    if (isTokenBlacklisted(accessToken)) {
      return NextResponse.json(
        { success: false, error: 'Jeton révoqué' },
        { status: 401 },
      );
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload?.sub) {
      return NextResponse.json(
        { success: false, error: 'Jeton invalide' },
        { status: 401 },
      );
    }

    const userId = payload.sub as string;

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fichier image requis' },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' },
        { status: 400 },
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'L\'image ne doit pas dépasser 2 Mo.' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    let avatarUrl: string;

    // Try Supabase Storage first
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const supabaseAdmin = getSupabaseAdmin();

      if (supabaseAdmin) {
        const ext = file.name.split('.').pop() || 'png';
        const uniqueName = `avatars/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Try to create avatars bucket if it doesn't exist
        try {
          const { error: bucketError } = await supabaseAdmin.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 2 * 1024 * 1024,
          });
          if (bucketError && !bucketError.message.includes('already exists')) {
            console.warn('[AUTH] Could not create avatars bucket:', bucketError.message);
          }
        } catch {
          // Bucket might already exist, continue
        }

        const { error: uploadError } = await supabaseAdmin.storage
          .from('avatars')
          .upload(uniqueName, bytes, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(uniqueName);
          avatarUrl = urlData.publicUrl;
        } else {
          console.warn('[AUTH] Supabase Storage upload failed, using base64 fallback:', uploadError.message);
          avatarUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
        }
      } else {
        // No Supabase admin client (missing env vars), use base64 fallback
        console.warn('[AUTH] Supabase admin not configured, using base64 fallback for avatar');
        avatarUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
      }
    } catch (storageErr) {
      console.warn('[AUTH] Supabase Storage error, using base64 fallback:', storageErr);
      avatarUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;
    }

    // Update user avatarUrl in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: { role: true },
    });

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_AVATAR',
          resource: 'user',
          resourceId: userId,
          newValues: JSON.stringify({ avatarUrl: avatarUrl.substring(0, 100) + '...' }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    } catch {
      // Audit logging should never block the main flow
    }

    return json({
      success: true,
      avatarUrl: updatedUser.avatarUrl,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        isActive: updatedUser.isActive,
        roleName: updatedUser.role?.name ?? 'UNKNOWN',
        totpEnabled: updatedUser.totpEnabled,
      },
    });
  } catch (error) {
    console.error('[AUTH] POST avatar error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du téléchargement de l\'avatar' },
      { status: 500 },
    );
  }
}
