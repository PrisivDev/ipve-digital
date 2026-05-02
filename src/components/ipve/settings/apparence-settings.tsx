'use client';

import { useState } from 'react';
import { Sun, Moon, Monitor, Palette, RotateCcw, ArrowLeft } from 'lucide-react';
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
  sidebarPosition: 'left' | 'right';
  compactMode: boolean;
  language: string;
}

const DEFAULTS: AppearanceSettings = {
  theme: 'system',
  primaryColor: '#8B1C2D',
  sidebarPosition: 'left',
  compactMode: false,
  language: 'fr',
};

const COLOR_PRESETS = [
  { value: '#8B1C2D', label: 'Rouge IPVE', preview: 'bg-[#8B1C2D]' },
  { value: '#1B4F72', label: 'Bleu foncé', preview: 'bg-[#1B4F72]' },
  { value: '#2E7D32', label: 'Vert', preview: 'bg-[#2E7D32]' },
  { value: '#E65100', label: 'Orange', preview: 'bg-[#E65100]' },
];

function loadSettings(): AppearanceSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const stored = localStorage.getItem('ipve_appearance');
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

function saveSettings(settings: AppearanceSettings) {
  localStorage.setItem('ipve_appearance', JSON.stringify(settings));
  // Apply theme
  const root = document.documentElement;
  if (settings.theme === 'dark') root.classList.add('dark');
  else if (settings.theme === 'light') root.classList.remove('dark');
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ApparenceSettings() {
  const { setSettingsSection } = useAppStore();
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') return DEFAULTS;
    return loadSettings();
  });

  const update = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    saveSettings(DEFAULTS);
    toast.success('Paramètres réinitialisés');
  };

  const effectiveTheme = () => {
    if (settings.theme === 'dark') return 'dark';
    if (settings.theme === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Apparence</h2>
            <p className="text-sm text-muted-foreground">Personnaliser l&apos;interface</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="mr-1.5 h-4 w-4" />Réinitialiser</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sun className="h-4 w-4" />Thème</CardTitle><CardDescription>Choisir le mode d&apos;affichage</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {([
              { value: 'light' as const, label: 'Clair', icon: Sun },
              { value: 'dark' as const, label: 'Sombre', icon: Moon },
              { value: 'system' as const, label: 'Système', icon: Monitor },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('theme', opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${settings.theme === opt.value ? 'border-[#8B1C2D] bg-[#8B1C2D]/5' : 'border-border hover:border-muted-foreground/30'}`}
              >
                <opt.icon className={`h-6 w-6 ${settings.theme === opt.value ? 'text-[#8B1C2D]' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${settings.theme === opt.value ? 'text-[#8B1C2D]' : 'text-muted-foreground'}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Couleur principale</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => update('primaryColor', color.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${settings.primaryColor === color.value ? 'border-[#8B1C2D]' : 'border-border'}`}
              >
                <div className={`h-6 w-6 rounded-full ${color.preview}`} />
                <span className="text-xs font-medium">{color.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Options</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div><Label>Position de la barre latérale</Label><p className="text-xs text-muted-foreground">Gauche ou droite</p></div>
            <Select value={settings.sidebarPosition} onValueChange={(v) => update('sidebarPosition', v as 'left' | 'right')}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="left">Gauche</SelectItem><SelectItem value="right">Droite</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between max-w-md">
            <div><Label>Mode compact</Label><p className="text-xs text-muted-foreground">Réduire l&apos;espacement</p></div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.compactMode} onChange={(e) => update('compactMode', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B1C2D]" />
            </label>
          </div>
          <div className="flex items-center justify-between max-w-md">
            <div><Label>Langue</Label><p className="text-xs text-muted-foreground">Interface utilisateur</p></div>
            <Select value={settings.language} onValueChange={(v) => update('language', v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader><CardTitle className="text-base">Aperçu</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border p-4 space-y-3" style={{ background: effectiveTheme() === 'dark' ? '#1a1a2e' : '#f8f9fa' }}>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded" style={{ background: effectiveTheme() === 'dark' ? '#333' : '#ddd' }} />
              <div className="h-3 w-1/2 rounded" style={{ background: effectiveTheme() === 'dark' ? '#333' : '#ddd' }} />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded text-white text-[10px] flex items-center justify-center" style={{ backgroundColor: settings.primaryColor }}>Bouton</div>
              <div className="h-6 w-16 rounded border text-[10px] flex items-center justify-center" style={{ borderColor: settings.primaryColor, color: settings.primaryColor }}>Lien</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
