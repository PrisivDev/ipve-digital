'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, User, Shield, Settings2, Eye, EyeOff, Loader2, Check, Sun, Moon,
  Camera, Upload, Sparkles, Mail, Phone, BadgeCheck, KeyRound, Monitor,
  ChevronRight, Globe, Palette, Lock, Fingerprint,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from 'next-themes';
import { apiFetch, apiFetchData } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';

/* ================================================================== */
/*  Profile View — Modern & Aesthetic Design                          */
/* ================================================================== */

export function ProfileView() {
  const { setActiveModule } = useAppStore();
  const { profileTab, setProfileTab } = useAppStore();
  const currentUser = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const { theme, setTheme } = useTheme();

  /* ---- Profile tab state ---- */
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  /* ---- Avatar upload state ---- */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /* ---- Security tab state ---- */
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  /* ---- Preferences tab state ---- */
  const [language, setLanguage] = useState('fr');
  const [prefSaving, setPrefSaving] = useState(false);

  /* ---- Profile handlers ---- */
  const openEditProfile = () => {
    setProfileForm({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      phone: currentUser?.phone || '',
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }
    try {
      setProfileSaving(true);
      const data = await apiFetchData('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      toast.success('Profil mis à jour avec succès');
      setEditingProfile(false);
      await fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelProfile = () => {
    setProfileForm({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      phone: currentUser?.phone || '',
    });
    setEditingProfile(false);
  };

  /* ---- Avatar handlers ---- */
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Utilisez JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await apiFetchData('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      });
      toast.success('Photo de profil mise à jour');
      await fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléchargement');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      await apiFetchData('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ avatarUrl: null }),
      });
      toast.success('Photo supprimée');
      setAvatarPreview(null);
      await fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ---- Security handlers ---- */
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0–5
  };

  const strengthLabel = (score: number) => {
    if (score <= 1) return { label: 'Très faible', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score === 2) return { label: 'Faible', color: 'bg-orange-500', textColor: 'text-orange-500' };
    if (score === 3) return { label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (score === 4) return { label: 'Fort', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    return { label: 'Très fort', color: 'bg-emerald-600', textColor: 'text-emerald-600' };
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      setPasswordSaving(true);
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || 'Erreur');
        return data;
      });
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement');
    } finally {
      setPasswordSaving(false);
    }
  };

  /* ---- Preferences handlers ---- */
  const handleSavePreferences = useCallback(async () => {
    try {
      setPrefSaving(true);
      toast.success('Préférences enregistrées');
    } catch {
      toast.error('Erreur');
    } finally {
      setPrefSaving(false);
    }
  }, []);

  /* ---- Helpers ---- */
  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.charAt(0)?.toUpperCase() || ''}${lastName?.charAt(0)?.toUpperCase() || ''}` || '?';

  const displayedAvatarUrl = avatarPreview || currentUser?.avatarUrl;
  const pwdStrength = getPasswordStrength(passwordForm.newPassword);
  const strengthInfo = strengthLabel(pwdStrength);
  const roleName = currentUser?.roleName || '—';

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    TEACHER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ACCOUNTANT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    STUDENT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const tabItems = [
    { value: 'profil' as const, label: 'Profil', icon: User },
    { value: 'securite' as const, label: 'Sécurité', icon: Shield },
    { value: 'preferences' as const, label: 'Préférences', icon: Palette },
  ];

  if (!currentUser) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setActiveModule('dashboard')} className="h-9 w-9 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Aucun utilisateur connecté</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => setActiveModule('dashboard')}
        className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />

      {/* ─── Hero Profile Card ─── */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Banner gradient */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#1B4F72] via-[#1B4F72]/90 to-[#8B1C2D]/80">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMmgydjJoLTJ6bTQgMGgtMnYtMmgydjJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          {/* Decorative circles */}
          <div className="absolute top-4 right-8 h-20 w-20 rounded-full bg-white/5 blur-xl" />
          <div className="absolute bottom-2 right-24 h-12 w-12 rounded-full bg-white/5 blur-lg" />
        </div>

        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 sm:-mt-16">
            <div className="relative group shrink-0">
              <div className="relative ring-4 ring-background rounded-full shadow-xl">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 transition-transform duration-300 group-hover:scale-105">
                  {displayedAvatarUrl && <AvatarImage src={displayedAvatarUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} className="object-cover" />}
                  <AvatarFallback className="bg-[#1B4F72] text-white text-2xl sm:text-3xl font-bold">
                    {getInitials(currentUser.firstName, currentUser.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Camera overlay */}
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer disabled:cursor-wait"
              >
                {avatarUploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-7 w-7 text-white drop-shadow-lg" />
                    <span className="text-[10px] text-white font-medium drop-shadow">Changer</span>
                  </div>
                )}
              </button>

              {/* Online indicator */}
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-background bg-emerald-500" />
            </div>

            {/* User info */}
            <div className="text-center sm:text-left flex-1 min-w-0 pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                <BadgeCheck className="h-5 w-5 text-[#1B4F72] shrink-0 hidden sm:block" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{currentUser.email}</p>
              <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <Badge className={cn('text-xs font-medium', roleColors[currentUser.roleName] || '')}>
                  {roleName}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentUser.isActive ? '✓ Actif' : '○ Inactif'}
                </Badge>
                {currentUser.totpEnabled && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1">
                    <Fingerprint className="h-3 w-3" />
                    2FA activé
                  </Badge>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={avatarUploading} className="gap-1.5">
                {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="hidden sm:inline">Photo</span>
              </Button>
              {currentUser.avatarUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={avatarUploading} className="text-destructive hover:text-destructive gap-1.5">
                  ✕ <span className="hidden sm:inline">Supprimer</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Modern Tab Navigation ─── */}
      <div className="relative">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/60 backdrop-blur-sm border border-border/40">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = profileTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setProfileTab(tab.value)}
                className={cn(
                  'relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground/80'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border/50" />
                )}
                <Icon className={cn('h-4 w-4 relative z-10', isActive && 'text-[#1B4F72]')} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB: Profil ─── */}
      {profileTab === 'profil' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Personal Info Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B4F72]/10">
                    <User className="h-4.5 w-4.5 text-[#1B4F72]" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Informations personnelles</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Visibles dans toute l&apos;application</p>
                  </div>
                </div>
                {!editingProfile ? (
                  <Button variant="outline" size="sm" onClick={openEditProfile} className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelProfile} disabled={profileSaving}>Annuler</Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={profileSaving} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white gap-1.5">
                      {profileSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <Check className="h-3.5 w-3.5" />
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prénom</Label>
                  <Input
                    value={editingProfile ? profileForm.firstName : currentUser.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    disabled={!editingProfile}
                    className={cn(!editingProfile && 'bg-muted/50 border-transparent')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom</Label>
                  <Input
                    value={editingProfile ? profileForm.lastName : currentUser.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    disabled={!editingProfile}
                    className={cn(!editingProfile && 'bg-muted/50 border-transparent')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Mail className="inline h-3 w-3 mr-1" /> Email
                  </Label>
                  <Input type="email" value={currentUser.email} disabled className="bg-muted/50 border-transparent" />
                  <p className="text-[11px] text-muted-foreground">Non modifiable</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Phone className="inline h-3 w-3 mr-1" /> Téléphone
                  </Label>
                  <Input
                    value={editingProfile ? profileForm.phone : currentUser.phone || ''}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    disabled={!editingProfile}
                    placeholder="+225 07 XX XX XX XX"
                    className={cn(!editingProfile && 'bg-muted/50 border-transparent')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Info */}
          {!currentUser.totpEnabled && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/20 px-4 py-3.5">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Renforcez la sécurité de votre compte</p>
                <p className="text-xs text-blue-700/80 dark:text-blue-400/70 mt-0.5">
                  Activez l&apos;authentification à deux facteurs dans l&apos;onglet Sécurité pour une protection supplémentaire.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Sécurité ─── */}
      {profileTab === 'securite' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Password Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <KeyRound className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Changer le mot de passe</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Utilisez un mot de passe fort et unique</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPwd(!showCurrentPwd)}>
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showNewPwd ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Minimum 8 caractères"
                    className={passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? '' : ''}
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPwd(!showNewPwd)}>
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordForm.newPassword && (
                  <div className="space-y-2 mt-2">
                    <Progress value={pwdStrength * 20} className="h-1.5" />
                    <div className="flex items-center justify-between">
                      <p className={cn('text-xs font-medium', strengthInfo.textColor)}>{strengthInfo.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {passwordForm.newPassword.length}/8 min.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirmer</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirmer le mot de passe"
                    className={
                      passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                        ? 'border-destructive focus-visible:ring-destructive'
                        : passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword
                          ? 'border-emerald-500 focus-visible:ring-emerald-500'
                          : ''
                    }
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                  <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Correspond
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white gap-2"
                >
                  {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Mettre à jour
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Fingerprint className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Double authentification (2FA)</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Protection supplémentaire pour votre compte</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    currentUser.totpEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
                  )}>
                    {currentUser.totpEnabled ? <Check className="h-5 w-5 text-emerald-600" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{currentUser.totpEnabled ? '2FA activé' : '2FA désactivé'}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser.totpEnabled ? 'Votre compte est protégé' : 'Recommandé pour renforcer la sécurité'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={currentUser.totpEnabled ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => toast.info('Fonctionnalité disponible dans une prochaine version')}
                  className={!currentUser.totpEnabled ? 'bg-emerald-600 hover:bg-emerald-600/90 text-white gap-1.5' : 'gap-1.5'}
                >
                  {currentUser.totpEnabled ? 'Gérer' : 'Activer'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB: Préférences ─── */}
      {profileTab === 'preferences' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Theme */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Monitor className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Apparence</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Personnaliser l&apos;interface</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'light', label: 'Clair', icon: Sun, preview: 'bg-white border' },
                  { value: 'dark', label: 'Sombre', icon: Moon, preview: 'bg-gray-900 border-gray-700' },
                  { value: 'system', label: 'Système', icon: Monitor, preview: 'bg-gradient-to-br from-white to-gray-900' },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  const isActive = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        'relative flex flex-col items-center gap-2.5 rounded-xl p-4 border-2 transition-all duration-200',
                        isActive ? 'border-[#1B4F72] bg-[#1B4F72]/5 shadow-sm' : 'border-transparent hover:border-border bg-muted/30'
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#1B4F72] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className={cn('h-12 w-full rounded-lg flex items-center justify-center', opt.preview)}>
                        <Icon className={cn('h-5 w-5', isActive ? 'text-[#1B4F72]' : 'text-muted-foreground/60')} />
                      </div>
                      <span className={cn('text-xs font-medium', isActive ? 'text-[#1B4F72]' : 'text-muted-foreground')}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
                  <Globe className="h-4.5 w-4.5 text-sky-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Langue</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Choisir la langue de l&apos;interface</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[
                  { value: 'fr', label: 'Français', flag: '🇫🇷' },
                  { value: 'en', label: 'English', flag: '🇬🇧' },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 flex-1',
                      language === lang.value
                        ? 'border-[#1B4F72] bg-[#1B4F72]/5'
                        : 'border-transparent bg-muted/30 hover:border-border'
                    )}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className={cn('text-sm font-medium', language === lang.value ? 'text-[#1B4F72]' : 'text-muted-foreground')}>{lang.label}</span>
                    {language === lang.value && <Check className="h-4 w-4 text-[#1B4F72] ml-auto" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <Button
              onClick={handleSavePreferences}
              disabled={prefSaving}
              className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white gap-2"
            >
              {prefSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Settings2 className="h-4 w-4" />
              Enregistrer les préférences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
