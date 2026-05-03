'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Download, ArrowLeft, Database, Users, GraduationCap, DollarSign, Bell, Shield,
  FileText, Activity, Calendar, HardDrive, Clock, CheckCircle2, AlertCircle,
  BarChart3, PieChartIcon, TrendingUp, Layers, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

interface SystemInfo {
  counts: Record<string, number>;
  currentYear: { id: string; name: string; startDate: string; endDate: string } | null;
  lastSync: string;
}

interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  sub?: string;
}

export function DonneesSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetchData<SystemInfo>('/api/settings/system/info');
      setInfo(data);
    } catch {
      toast.error('Impossible de charger les informations système');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await apiFetchData<Record<string, unknown>>('/api/settings/system/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ipve-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Données exportées avec succès');
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (n: number) => n.toLocaleString('fr-FR');
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('fr-FR');

  // Data sections
  const sections = [
    {
      id: 'all',
      label: 'Vue d\'ensemble',
      icon: BarChart3,
    },
    {
      id: 'students',
      label: 'Étudiants',
      icon: GraduationCap,
    },
    {
      id: 'academic',
      label: 'Académique',
      icon: Calendar,
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
    },
    {
      id: 'system',
      label: 'Système',
      icon: Shield,
    },
  ];

  // Stat cards grouped by section
  const getStatsBySection = (): Record<string, StatItem[]> => {
    if (!info) return {};
    const c = info.counts;
    return {
      all: [
        { key: 'students', label: 'Étudiants', value: c.students ?? 0, icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { key: 'activeStudents', label: 'Étudiants actifs', value: c.activeStudents ?? 0, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: `${Math.round(((c.activeStudents ?? 0) / Math.max(c.students ?? 1, 1)) * 100)}%` },
        { key: 'employees', label: 'Employés', value: c.employees ?? 0, icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { key: 'users', label: 'Utilisateurs', value: c.users ?? 0, icon: Shield, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { key: 'payments', label: 'Paiements', value: c.payments ?? 0, icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        { key: 'classes', label: 'Classes', value: c.classes ?? 0, icon: Layers, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
      ],
      students: [
        { key: 'students', label: 'Total étudiants', value: c.students ?? 0, icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { key: 'activeStudents', label: 'Actifs', value: c.activeStudents ?? 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: `${Math.round(((c.activeStudents ?? 0) / Math.max(c.students ?? 1, 1)) * 100)}% du total` },
        { key: 'admissions', label: 'Admissions', value: c.admissions ?? 0, icon: FileText, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
        { key: 'prospects', label: 'Prospects', value: c.prospects ?? 0, icon: TrendingUp, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
      ],
      academic: [
        { key: 'filieres', label: 'Filières', value: c.filieres ?? 0, icon: FileText, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
        { key: 'levels', label: 'Niveaux', value: c.levels ?? 0, icon: Layers, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { key: 'classes', label: 'Classes', value: c.classes ?? 0, icon: Layers, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        { key: 'subjects', label: 'Matières', value: c.subjects ?? 0, icon: BookOpen, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        { key: 'academicYears', label: 'Années scolaires', value: c.academicYears ?? 0, icon: Calendar, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
        { key: 'schedules', label: 'Emplois du temps', value: c.schedules ?? 0, icon: Clock, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' },
        { key: 'grades', label: 'Notes', value: c.grades ?? 0, icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { key: 'attendance', label: 'Présences', value: c.attendance ?? 0, icon: Activity, color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-900/20' },
      ],
      finance: [
        { key: 'payments', label: 'Total paiements', value: c.payments ?? 0, icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        { key: 'completedPayments', label: 'Complétés', value: c.completedPayments ?? 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: `${Math.round(((c.completedPayments ?? 0) / Math.max(c.payments ?? 1, 1)) * 100)}%` },
        { key: 'pendingPayments', label: 'En attente', value: c.pendingPayments ?? 0, icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
        { key: 'expenses', label: 'Dépenses', value: c.expenses ?? 0, icon: DollarSign, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
      ],
      system: [
        { key: 'users', label: 'Utilisateurs', value: c.users ?? 0, icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { key: 'activeUsers', label: 'Utilisateurs actifs', value: c.activeUsers ?? 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { key: 'notifications', label: 'Notifications', value: c.notifications ?? 0, icon: Bell, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { key: 'auditLogs', label: "Logs d'audit", value: c.auditLogs ?? 0, icon: Shield, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
      ],
    };
  };

  const totalRecords = info ? Object.values(info.counts).reduce((a, b) => a + b, 0) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statsBySection = getStatsBySection();
  const currentStats = statsBySection[activeSection] ?? statsBySection['all'] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Données système</h2>
            <p className="text-sm text-muted-foreground">Statistiques, surveillance et gestion des données</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-1.5 h-4 w-4" />Actualiser
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
            <Download className="mr-1.5 h-4 w-4" />
            {exporting ? 'Export...' : 'Exporter les données'}
          </Button>
        </div>
      </div>

      {/* Current Academic Year Banner */}
      {info?.currentYear && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-4 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
            <Calendar className="h-5 w-5 text-green-700 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-green-900 dark:text-green-200">Année scolaire en cours</p>
            <p className="text-xs text-green-700 dark:text-green-400 truncate">
              {info.currentYear.name} — {formatDate(info.currentYear.startDate)} au {formatDate(info.currentYear.endDate)}
            </p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 shrink-0">
            <CheckCircle2 className="mr-1 h-3 w-3" />Active
          </Badge>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <section.icon className="h-3.5 w-3.5" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentStats.map((stat) => (
          <Card key={stat.key} className="group hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg} transition-transform group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.sub && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                    {stat.sub}
                  </Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold tracking-tight">{formatNumber(stat.value)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual Distribution Bar */}
      {activeSection === 'all' && info && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />Répartition des données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Étudiants & Personnes', value: (info.counts.students ?? 0) + (info.counts.employees ?? 0) + (info.counts.users ?? 0) + (info.counts.admissions ?? 0) + (info.counts.prospects ?? 0), color: 'bg-blue-500' },
                { label: 'Académique', value: (info.counts.filieres ?? 0) + (info.counts.levels ?? 0) + (info.counts.classes ?? 0) + (info.counts.subjects ?? 0) + (info.counts.academicYears ?? 0) + (info.counts.schedules ?? 0) + (info.counts.grades ?? 0) + (info.counts.attendance ?? 0), color: 'bg-emerald-500' },
                { label: 'Finance', value: (info.counts.payments ?? 0) + (info.counts.expenses ?? 0), color: 'bg-amber-500' },
                { label: 'Système', value: (info.counts.notifications ?? 0) + (info.counts.auditLogs ?? 0), color: 'bg-purple-500' },
              ].map((row) => {
                const pct = totalRecords > 0 ? Math.round((row.value / totalRecords) * 100) : 0;
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold">{formatNumber(row.value)} <span className="text-xs font-normal text-muted-foreground">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-500 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student & Payment Metrics (for 'all' and 'students' / 'finance' sections) */}
      {(activeSection === 'all' || activeSection === 'students') && info && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />Indicateurs étudiants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taux d&apos;activité</span>
                  <span className="font-semibold">{info.counts.students ? Math.round(((info.counts.activeStudents ?? 0) / info.counts.students) * 100) : 0}%</span>
                </div>
                <Progress value={info.counts.students ? ((info.counts.activeStudents ?? 0) / info.counts.students) * 100 : 0} className="h-2.5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ratio prospects/étudiants</span>
                  <span className="font-semibold">
                    {info.counts.students ? Math.round(((info.counts.prospects ?? 0) / info.counts.students) * 100) : 0}%
                  </span>
                </div>
                <Progress value={info.counts.students ? Math.min(((info.counts.prospects ?? 0) / info.counts.students) * 100, 100) : 0} className="h-2.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(activeSection === 'all' || activeSection === 'finance') && info && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />Indicateurs financiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taux de complétion des paiements</span>
                  <span className="font-semibold">{info.counts.payments ? Math.round(((info.counts.completedPayments ?? 0) / info.counts.payments) * 100) : 0}%</span>
                </div>
                <Progress value={info.counts.payments ? ((info.counts.completedPayments ?? 0) / info.counts.payments) * 100 : 0} className="h-2.5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paiements en attente</span>
                  <span className="font-semibold">{info.counts.payments ? Math.round(((info.counts.pendingPayments ?? 0) / info.counts.payments) * 100) : 0}%</span>
                </div>
                <Progress value={info.counts.payments ? ((info.counts.pendingPayments ?? 0) / info.counts.payments) * 100 : 0} className="h-2.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />Informations système
          </CardTitle>
          <CardDescription>État et métriques de la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Base de données</p>
                <p className="text-xs text-muted-foreground">Connexion PostgreSQL</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
              <CheckCircle2 className="mr-1 h-3 w-3" />Connectée
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Dernière synchronisation</p>
                <p className="text-xs text-muted-foreground">Actualisation des données</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{info?.lastSync ? formatDateTime(info.lastSync) : '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Enregistrements totaux</p>
                <p className="text-xs text-muted-foreground">Toutes les tables confondues</p>
              </div>
            </div>
            <span className="text-sm font-semibold">{formatNumber(totalRecords)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Journaux d&apos;audit</p>
                <p className="text-xs text-muted-foreground">Traçabilité des actions</p>
              </div>
            </div>
            <span className="text-sm font-semibold">{formatNumber(info?.counts.auditLogs ?? 0)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Extra icon used for subjects
function BookOpen(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
