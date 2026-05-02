'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, ArrowLeft, Database, Users, GraduationCap, DollarSign, Bell, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';

interface SystemInfo {
  counts: Record<string, number>;
  currentYear: { id: string; name: string; startDate: string; endDate: string } | null;
  lastSync: string;
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erreur');
  return json.data as T;
}

export function DonneesSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<SystemInfo>('/api/settings/system/info');
      setInfo(data);
    } catch { toast.error('Impossible de charger les informations système'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await apiFetch<Record<string, unknown>>('/api/settings/system/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ipve-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Données exportées avec succès');
    } catch { toast.error('Erreur lors de l\'export'); }
    finally { setExporting(false); }
  };

  const STAT_CARDS = [
    { key: 'students', label: 'Étudiants', icon: GraduationCap, color: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
    { key: 'activeStudents', label: 'Étudiants actifs', icon: GraduationCap, color: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400' },
    { key: 'employees', label: 'Employés', icon: Users, color: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
    { key: 'users', label: 'Utilisateurs', icon: Users, color: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
    { key: 'payments', label: 'Paiements', icon: DollarSign, color: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'expenses', label: 'Dépenses', icon: DollarSign, color: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600 dark:text-red-400' },
    { key: 'filieres', label: 'Filières', icon: FileText, color: 'bg-teal-50 dark:bg-teal-900/20', iconColor: 'text-teal-600 dark:text-teal-400' },
    { key: 'classes', label: 'Classes', icon: Database, color: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-600 dark:text-orange-400' },
    { key: 'grades', label: 'Notes', icon: FileText, color: 'bg-pink-50 dark:bg-pink-900/20', iconColor: 'text-pink-600 dark:text-pink-400' },
    { key: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { key: 'auditLogs', label: 'Logs d\'audit', icon: Shield, color: 'bg-slate-50 dark:bg-slate-900/20', iconColor: 'text-slate-600 dark:text-slate-400' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-8 w-56" /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Données système</h2>
            <p className="text-sm text-muted-foreground">Statistiques et gestion des données</p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
          <Download className="mr-1.5 h-4 w-4" />{exporting ? 'Export...' : 'Exporter les données'}
        </Button>
      </div>

      {info?.currentYear && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
              <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Année scolaire en cours</p>
              <p className="text-xs text-muted-foreground">{info.currentYear.name} — {new Date(info.currentYear.startDate).toLocaleDateString('fr-FR')} au {new Date(info.currentYear.endDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <Badge className="ml-auto bg-green-100 text-green-700">Active</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{info?.counts[card.key] ?? 0}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informations système</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base de données</span>
            <Badge variant="default" className="bg-green-100 text-green-700">Connectée</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dernière synchronisation</span>
            <span>{info?.lastSync ? new Date(info.lastSync).toLocaleString('fr-FR') : '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enregistrements totaux</span>
            <span>{info ? Object.values(info.counts).reduce((a, b) => a + b, 0) : 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
