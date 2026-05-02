'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, User, Shield, Settings2, Eye, EyeOff, Loader2, Check, Sun, Moon,
  Camera, Trash2, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useAuthStore, type AuthUser } from '@/stores/auth.store';
import { useTheme } from 'next-themes';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProfileView() {
  const { setSettingsSection } = useAppStore();
  const currentUser = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const { theme, setTheme } = useTheme();

  /* Profil tab */
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  /* Avatar upload */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /* Sécurité tab */
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  /* Préférences tab */
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
    if (!profileForm.firstName.trim()) {
      toast.error('Le prénom est requis');
      return;
    }
    if (!profileForm.lastName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      setProfileSaving(true);
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      toast.success('Profil mis à jour avec succès');
      setEditingProfile(false);
      await fetchUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      toast.error(message);
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.');
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Upload
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Erreur');

      toast.success('Photo de profil mise à jour');
      await fetchUser(); // Refresh user data in auth store
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      toast.error(message);
      setAvatarPreview(null); // Revert preview on error
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      toast.success('Photo de profil supprimée');
      setAvatarPreview(null);
      await fetchUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur';
      toast.error(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ---- Security handlers ---- */

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
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }
    try {
      setPasswordSaving(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe';
      toast.error(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  /* ---- Preferences handlers ---- */

  const handleSavePreferences = useCallback(async () => {
    try {
      setPrefSaving(true);
      // Theme is handled by next-themes automatically, language could be persisted later
      toast.success('Préférences enregistrées');
    } catch {
      toast.error('Erreur');
    } finally {
      setPrefSaving(false);
    }
  }, []);

  /* ---- Helpers ---- */

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName?.charAt(0)?.toUpperCase() || '';
    const l = lastName?.charAt(0)?.toUpperCase() || '';
    return f + l || '?';
  };

  const roleName = currentUser?.roleName || '\u2014';

  const displayedAvatarUrl = avatarPreview || currentUser?.avatarUrl;

  /* ---- Render ---- */

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsSection('overview')}
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Mon profil</h2>
            <p className="text-sm text-muted-foreground">Aucun utilisateur connecté</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsSection('overview')}
          className="h-9 w-9 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Mon profil</h2>
          <p className="text-sm text-muted-foreground">Gérer vos informations personnelles et votre photo de profil</p>
        </div>
      </div>

      {/* Hidden file input for avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profil">
            <User className="mr-1.5 h-4 w-4 hidden sm:inline" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="securite">
            <Shield className="mr-1.5 h-4 w-4 hidden sm:inline" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings2 className="mr-1.5 h-4 w-4 hidden sm:inline" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* ==================== PROFIL ==================== */}
        <TabsContent value="profil" className="space-y-4">
          {/* Avatar + Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar with upload overlay */}
                <div className="relative group">
                  <Avatar className="h-28 w-28 ring-4 ring-border/50 transition-all duration-200">
                    {displayedAvatarUrl && (
                      <AvatarImage
                        src={displayedAvatarUrl}
                        alt={`${currentUser.firstName} ${currentUser.lastName}`}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-[#1B4F72] text-white text-3xl font-bold">
                      {getInitials(currentUser.firstName, currentUser.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload overlay */}
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:cursor-wait"
                    aria-label="Changer la photo de profil"
                  >
                    {avatarUploading ? (
                      <Loader2 className="h-7 w-7 text-white animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-7 w-7 text-white" />
                        <span className="text-[10px] text-white font-medium">Changer</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl font-bold">
                    {currentUser.firstName} {currentUser.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-[#1B4F72]/10 text-[#1B4F72]">
                      {roleName}
                    </Badge>
                    <Badge variant="outline">
                      {currentUser.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    {currentUser.totpEnabled && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="mr-1 h-3 w-3" />
                        2FA
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="sm:ml-auto flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-4 w-4" />
                    )}
                    {currentUser.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
                  </Button>
                  {currentUser.avatarUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={avatarUploading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Informations personnelles</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Ces informations sont visibles dans toute l'application
                  </CardDescription>
                </div>
                {!editingProfile ? (
                  <Button variant="outline" size="sm" onClick={openEditProfile}>
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelProfile} disabled={profileSaving}>
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
                    >
                      {profileSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-firstName">Prénom</Label>
                <Input
                  id="p-firstName"
                  value={editingProfile ? profileForm.firstName : currentUser.firstName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                  disabled={!editingProfile}
                  className={!editingProfile ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-lastName">Nom</Label>
                <Input
                  id="p-lastName"
                  value={editingProfile ? profileForm.lastName : currentUser.lastName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                  disabled={!editingProfile}
                  className={!editingProfile ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">Email</Label>
                <Input
                  id="p-email"
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-phone">Téléphone</Label>
                <Input
                  id="p-phone"
                  value={editingProfile ? profileForm.phone : currentUser.phone || ''}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  disabled={!editingProfile}
                  placeholder="+225 07 XX XX XX XX"
                  className={!editingProfile ? 'bg-muted' : ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* Info about no 2FA required */}
          {!currentUser.totpEnabled && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-sm">
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                Modification libre de votre profil
              </p>
              <p className="text-blue-700 dark:text-blue-400 mt-1">
                Vous pouvez modifier vos informations personnelles et votre photo de profil sans authentification à deux facteurs. Activez le 2FA dans l'onglet Sécurité pour renforcer la protection de votre compte.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ==================== SÉCURITÉ ==================== */}
        <TabsContent value="securite" className="space-y-4">
          {/* Change Password */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Changer le mot de passe</CardTitle>
              <CardDescription>
                Assurez-vous d'utiliser un mot de passe fort et unique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-currentPwd">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="s-currentPwd"
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Votre mot de passe actuel"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  >
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="s-newPwd">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="s-newPwd"
                    type={showNewPwd ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Minimum 8 caractères"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordForm.newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordForm.newPassword.length >= i * 4
                              ? passwordForm.newPassword.length >= 12
                                ? 'bg-green-500'
                                : passwordForm.newPassword.length >= 8
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordForm.newPassword.length < 8
                        ? `${8 - passwordForm.newPassword.length} caractères manquants`
                        : passwordForm.newPassword.length < 12
                          ? 'Complexité moyenne'
                          : 'Mot de passe fort'}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-confirmPwd">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="s-confirmPwd"
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirmer"
                    className={
                      passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                        ? 'border-destructive'
                        : passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword
                          ? 'border-green-500'
                          : ''
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  >
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
                >
                  {passwordSaving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-1.5 h-4 w-4" />
                  )}
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Authentification à deux facteurs</CardTitle>
              <CardDescription>
                Protégez votre compte avec une couche de sécurité supplémentaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser.totpEnabled ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="mr-1 h-3 w-3" />
                      2FA activé
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      2FA désactivé
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {currentUser.totpEnabled
                      ? 'Votre compte est protégé par une double authentification'
                      : 'Nous recommandons fortement d\'activer cette fonctionnalité'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Fonctionnalité disponible dans une prochaine version')}
                >
                  {currentUser.totpEnabled ? 'Gérer le 2FA' : 'Configurer le 2FA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== PRÉFÉRENCES ==================== */}
        <TabsContent value="preferences" className="space-y-4">
          {/* Language */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Langue</CardTitle>
              <CardDescription>Choisir la langue de l'interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs space-y-2">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thème</CardTitle>
              <CardDescription>Choisir l'apparence de l'interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {theme === 'dark' ? 'Mode sombre' : theme === 'light' ? 'Mode clair' : 'Système'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Basculer entre le mode clair et sombre
                    </p>
                  </div>
                </div>
                <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Clair
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Sombre
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      Système
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSavePreferences}
              disabled={prefSaving}
              className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
            >
              {prefSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Enregistrer les préférences
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
