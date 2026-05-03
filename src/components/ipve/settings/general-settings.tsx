'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Save, X, Upload, Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData, apiFetch } from '@/lib/api-fetch';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InstitutionSettings {
  schoolName: string;
  shortName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  academicYear: string;
  logoUrl: string | null;
  currency: string;
  locale: string;
}

const DEFAULTS: InstitutionSettings = {
  schoolName: '',
  shortName: '',
  motto: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  academicYear: '',
  logoUrl: null,
  currency: 'XOF',
  locale: 'fr-FR',
};

const CURRENCIES = [
  { value: 'XOF', label: 'FCFA (XOF)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar US (USD)' },
  { value: 'GNF', label: 'Guinée Franc (GNF)' },
];

const LOCALES = [
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'fr-CI', label: 'Français (Côte d\'Ivoire)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español (España)' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GeneralSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<InstitutionSettings>(DEFAULTS);
  const [form, setForm] = useState<InstitutionSettings>(DEFAULTS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const changed = JSON.stringify(form) !== JSON.stringify(original);

  /* Fetch settings on mount */
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetchData<InstitutionSettings>('/api/settings/institution');
      setForm({ ...DEFAULTS, ...data });
      setOriginal({ ...DEFAULTS, ...data });
    } catch {
      toast.error('Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  /* Update a single field */
  const set = (key: keyof InstitutionSettings, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* Save */
  const handleSave = async () => {
    try {
      setSaving(true);
      await apiFetchData('/api/settings/institution', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setOriginal({ ...form });
      toast.success('Paramètres enregistrés avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  /* Cancel */
  const handleCancel = () => {
    setForm({ ...original });
  };

  /* Logo upload */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', file);
      const res = await apiFetch('/api/settings/institution/logo', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur');
      setForm((prev) => ({ ...prev, logoUrl: json.data.logoUrl }));
      toast.success('Logo mis à jour');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Paramètres généraux</h2>
            <p className="text-sm text-muted-foreground">Informations de l'établissement</p>
          </div>
        </div>
        {changed && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-1.5 h-4 w-4" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {/* Logo Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logo de l'établissement</CardTitle>
          <CardDescription>Image affichée sur les documents et l'interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 overflow-hidden">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground/50" />
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1B4F72]" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Télécharger un logo
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG ou SVG — max 2 Mo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations de l'établissement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schoolName">Nom de l'établissement</Label>
            <Input
              id="schoolName"
              value={form.schoolName}
              onChange={(e) => set('schoolName', e.target.value)}
              placeholder="Institut Privé de..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortName">Nom court / Sigle</Label>
            <Input
              id="shortName"
              value={form.shortName}
              onChange={(e) => set('shortName', e.target.value)}
              placeholder="IPVE"
              maxLength={10}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="motto">Devise</Label>
            <Input
              id="motto"
              value={form.motto}
              onChange={(e) => set('motto', e.target.value)}
              placeholder="Excellence, Innovation, Professionnalisme"
            />
          </div>

          <Separator className="sm:col-span-2" />

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Cocody Riviera, Abidjan, Côte d'Ivoire"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+225 27 XX XX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="contact@ipve.edu.ci"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://www.ipve.edu.ci"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academicYear">Année académique</Label>
            <Input
              id="academicYear"
              value={form.academicYear}
              onChange={(e) => set('academicYear', e.target.value)}
              placeholder="2024-2025"
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency & Locale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Devise et langue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Devise</Label>
            <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Locale</Label>
            <Select value={form.locale} onValueChange={(v) => set('locale', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
