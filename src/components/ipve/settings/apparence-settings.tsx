'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor, Palette, RotateCcw, ArrowLeft, Check, Minimize2, Maximize2, Globe, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  primaryColorLabel: string;
  sidebarPosition: 'left' | 'right';
  compactMode: boolean;
  language: string;
}

const DEFAULTS: AppearanceSettings = {
  theme: 'system',
  primaryColor: '#8B1C2D',
  primaryColorLabel: 'Rouge IPVE',
  sidebarPosition: 'left',
  compactMode: false,
  language: 'fr',
};

const COLOR_PRESETS = [
  { value: '#8B1C2D', label: 'Rouge IPVE', oklch: 'oklch(0.33 0.13 20)' },
  { value: '#1B4F72', label: 'Bleu foncé', oklch: 'oklch(0.30 0.06 260)' },
  { value: '#2E7D32', label: 'Vert', oklch: 'oklch(0.52 0.15 145)' },
  { value: '#E65100', label: 'Orange', oklch: 'oklch(0.63 0.22 45)' },
  { value: '#6A1B9A', label: 'Violet', oklch: '0.45 0.20 295' },
  { value: '#00838F', label: 'Cyan', oklch: '0.55 0.12 200' },
];

function loadSettings(): AppearanceSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const stored = localStorage.getItem('ipve_appearance');
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

function saveToStorage(settings: AppearanceSettings) {
  localStorage.setItem('ipve_appearance', JSON.stringify(settings));
}

/**
 * Apply the theme class to <html>.
 */
function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  root.setAttribute('data-theme', theme);
}

/**
 * Apply the primary color as CSS custom properties.
 */
function applyPrimaryColor(hexColor: string, oklchValue: string) {
  const root = document.documentElement;
  root.style.setProperty('--ipve-primary', hexColor);
  root.style.setProperty('--primary', oklchValue);
  root.style.setProperty('--ring', oklchValue);
  root.style.setProperty('--sidebar-ring', oklchValue);
  root.setAttribute('data-primary-color', hexColor);
}

/**
 * Apply compact mode.
 */
function applyCompactMode(compact: boolean) {
  const root = document.documentElement;
  if (compact) {
    root.classList.add('compact-mode');
  } else {
    root.classList.remove('compact-mode');
  }
  root.setAttribute('data-compact', compact ? 'true' : 'false');
}

/**
 * Apply sidebar position.
 */
function applySidebarPosition(position: 'left' | 'right') {
  document.documentElement.setAttribute('data-sidebar-position', position);
}

/**
 * Apply all appearance settings to the DOM.
 */
function applyAllSettings(settings: AppearanceSettings) {
  applyTheme(settings.theme);
  const preset = COLOR_PRESETS.find((c) => c.value === settings.primaryColor);
  applyPrimaryColor(
    settings.primaryColor,
    preset?.oklch ?? 'oklch(0.33 0.13 20)',
  );
  applyCompactMode(settings.compactMode);
  applySidebarPosition(settings.sidebarPosition);
}

export function ApparenceSettings() {
  const { setSettingsSection } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULTS);

  // Load settings from localStorage and apply on mount
  useEffect(() => {
    const stored = loadSettings();
    applyAllSettings(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydration bridge for SSR/client mismatch
    setSettings(stored);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme, mounted]);

  const update = useCallback(<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveToStorage(next);
      applyAllSettings(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setSettings(DEFAULTS);
    saveToStorage(DEFAULTS);
    applyAllSettings(DEFAULTS);
    toast.success('Paramètres réinitialisés');
  }, []);

  const handleColorSelect = useCallback((preset: typeof COLOR_PRESETS[number]) => {
    update('primaryColor', preset.value);
    update('primaryColorLabel', preset.label);
  }, [update]);

  const effectiveTheme = () => {
    if (settings.theme === 'dark') return 'dark';
    if (settings.theme === 'light') return 'light';
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const currentPreset = COLOR_PRESETS.find((c) => c.value === settings.primaryColor);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-lg animate-pulse bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-muted animate-pulse" />
            <div className="h-4 w-52 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Apparence</h2>
            <p className="text-sm text-muted-foreground">Personnaliser l&apos;interface</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1.5 h-4 w-4" />Réinitialiser
        </Button>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4" />Thème
          </CardTitle>
          <CardDescription>Choisir le mode d&apos;affichage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {([
              { value: 'light' as const, label: 'Clair', desc: 'Thème lumineux', icon: Sun },
              { value: 'dark' as const, label: 'Sombre', desc: 'Thème nuit', icon: Moon },
              { value: 'system' as const, label: 'Système', desc: 'Automatique', icon: Monitor },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('theme', opt.value)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  settings.theme === opt.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                }`}
              >
                {settings.theme === opt.value && (
                  <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                  settings.theme === opt.value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <opt.icon className={`h-5 w-5 transition-colors ${
                    settings.theme === opt.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="text-center">
                  <span className={`text-xs font-semibold block ${
                    settings.theme === opt.value ? 'text-primary' : 'text-foreground'
                  }`}>{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Primary Color */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />Couleur principale
          </CardTitle>
          <CardDescription>Choisir la couleur d&apos;accentuation de l&apos;interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {COLOR_PRESETS.map((color) => {
                const isSelected = settings.primaryColor === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm scale-105'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`h-7 w-7 rounded-full transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
                      style={{ backgroundColor: color.value, ...(isSelected ? { '--tw-ring-color': color.value } as React.CSSProperties : {}) }}
                    />
                    <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {color.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {currentPreset && (
              <p className="text-xs text-muted-foreground">
                Couleur active : <span className="font-mono font-medium">{currentPreset.value}</span> — {currentPreset.label}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="h-4 w-4" />Options d&apos;interface
          </CardTitle>
          <CardDescription>Configurer le comportement et l&apos;affichage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Sidebar Position */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Layout className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <Label>Position de la barre latérale</Label>
                <p className="text-xs text-muted-foreground">Gauche ou droite</p>
              </div>
            </div>
            <Select value={settings.sidebarPosition} onValueChange={(v) => update('sidebarPosition', v as 'left' | 'right')}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t" />

          {/* Compact Mode */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                settings.compactMode ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {settings.compactMode ? (
                  <Minimize2 className="h-4 w-4 text-primary" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <Label>Mode compact</Label>
                <p className="text-xs text-muted-foreground">Réduire l&apos;espacement dans l&apos;interface</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => update('compactMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="border-t" />

          {/* Language */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <Label>Langue</Label>
                <p className="text-xs text-muted-foreground">Langue de l&apos;interface utilisateur</p>
              </div>
            </div>
            <Select value={settings.language} onValueChange={(v) => update('language', v)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aperçu en direct</CardTitle>
          <CardDescription>Prévisualisation des changements</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-xl border p-4 space-y-3 transition-colors"
            style={{
              background: effectiveTheme() === 'dark' ? '#1a1a2e' : '#f8f9fa',
              borderColor: effectiveTheme() === 'dark' ? '#333' : '#e5e7eb',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-[10px] ml-2 opacity-50">Aperçu IPVE Digital</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded" style={{ background: effectiveTheme() === 'dark' ? '#333' : '#ddd' }} />
              <div className="h-3 w-1/2 rounded" style={{ background: effectiveTheme() === 'dark' ? '#333' : '#ddd' }} />
            </div>
            <div className="flex gap-2">
              <div
                className="h-8 w-20 rounded-lg text-white text-[11px] font-medium flex items-center justify-center shadow-sm"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Bouton
              </div>
              <div
                className="h-8 w-20 rounded-lg border-2 text-[11px] font-medium flex items-center justify-center"
                style={{ borderColor: settings.primaryColor, color: settings.primaryColor }}
              >
                Lien
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              {COLOR_PRESETS.slice(0, 4).map((c) => (
                <div
                  key={c.value}
                  className="h-5 w-5 rounded-full transition-transform"
                  style={{
                    backgroundColor: c.value,
                    transform: settings.primaryColor === c.value ? 'scale(1.2)' : 'scale(1)',
                    outline: settings.primaryColor === c.value ? `2px solid ${c.value}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
