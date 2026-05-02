'use client';

import {
  Users,
  UserPlus,
  TrendingUp,
  UserMinus,
  AlertTriangle,
  Phone,
  Globe,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversionStats } from '@/hooks/useProspects';
import type { ConversionStats } from '@/types/prospect.types';
import {
  PROSPECT_STATUS_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_ORDER,
} from '@/types/prospect.types';
import type { ProspectStatus } from '@/types/prospect.types';

// ─── Color palettes ────────────────────────────────────────

const KPI_CARDS = [
  {
    key: 'totalProspects' as const,
    label: 'Total prospects',
    icon: Users,
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-200 dark:ring-slate-700',
  },
  {
    key: 'monthlyNew' as const,
    label: 'Nouveaux ce mois',
    icon: UserPlus,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  {
    key: 'conversionRate' as const,
    label: 'Taux de conversion',
    icon: TrendingUp,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
    isPercent: true,
  },
  {
    key: 'totalAbandoned' as const,
    label: 'Abandonnés',
    icon: UserMinus,
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-200 dark:ring-red-800',
  },
];

const FUNNEL_SHADES = [
  'bg-[#8B1C2D]',       // NOUVEAU — darkest bordeaux
  'bg-[#9F2840]',       // CONTACTE
  'bg-[#B33552]',       // INTERESSE
  'bg-[#C74365]',       // DOSSIER_RECU
  'bg-[#D4567A]',       // ADMIS
  'bg-[#E06E8E]',       // CONVERTI — lightest bordeaux
];

const SOURCE_COLORS = [
  'bg-emerald-500 dark:bg-emerald-400',
  'bg-amber-500 dark:bg-amber-400',
  'bg-rose-500 dark:bg-rose-400',
  'bg-purple-500 dark:bg-purple-400',
  'bg-cyan-500 dark:bg-cyan-400',
  'bg-orange-500 dark:bg-orange-400',
  'bg-teal-500 dark:bg-teal-400',
  'bg-pink-500 dark:bg-pink-400',
  'bg-lime-500 dark:bg-lime-400',
  'bg-slate-500 dark:bg-slate-400',
];

// Funnel stages (exclude ABANDONNE)
const FUNNEL_STAGES = PROSPECT_STATUS_ORDER.filter(
  (s) => s !== 'ABANDONNE',
) as Exclude<ProspectStatus, 'ABANDONNE'>[];

// ─── KPI Card ──────────────────────────────────────────────

function KpiCard({
  config,
  value,
  isLoading,
}: {
  config: (typeof KPI_CARDS)[number];
  value: number;
  isLoading: boolean;
}) {
  const Icon = config.icon;
  const display = config.isPercent
    ? `${value.toFixed(1)} %`
    : value.toLocaleString('fr-FR');

  return (
    <Card className={`${config.bg} ${config.ring} ring-1 transition-shadow hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}
          >
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <>
                <Skeleton className="mb-1 h-3 w-24" />
                <Skeleton className="h-6 w-14" />
              </>
            ) : (
              <>
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {config.label}
                </p>
                <p className="text-2xl font-bold tracking-tight">{display}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Conversion Funnel ────────────────────────────────────

function ConversionFunnel({
  stats,
  isLoading,
}: {
  stats: ConversionStats | undefined;
  isLoading: boolean;
}) {
  // Find the max count for percentage calculation
  const stageCounts = FUNNEL_STAGES.map((s) => stats?.byStatus[s] ?? 0);
  const maxCount = Math.max(...stageCounts, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-[#8B1C2D]" />
          Entonnoir de conversion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="mx-auto h-10 rounded-md"
                style={{ width: `${100 - i * 12}%` }}
              />
            ))
          : FUNNEL_STAGES.map((stage, i) => {
              const count = stats?.byStatus[stage] ?? 0;
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const barWidth = Math.max(pct, 8); // minimum 8% so label is readable
              const shareOfTotal =
                (stats?.totalProspects ?? 0) > 0
                  ? ((count / (stats?.totalProspects ?? 1)) * 100).toFixed(1)
                  : '0.0';

              return (
                <div key={stage} className="flex items-center gap-3">
                  {/* Stage label */}
                  <span className="hidden w-28 shrink-0 text-right text-xs font-medium text-muted-foreground sm:block">
                    {PROSPECT_STATUS_LABELS[stage]}
                  </span>

                  {/* Funnel bar */}
                  <div className="flex flex-1 justify-center">
                    <div
                      className={`${FUNNEL_SHADES[i]} flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-white transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="sm:hidden text-[10px] truncate mr-2">
                        {PROSPECT_STATUS_LABELS[stage]}
                      </span>
                      <span>{count}</span>
                      <span className="ml-2 opacity-80">{shareOfTotal}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
      </CardContent>
    </Card>
  );
}

// ─── Sources de prospects ──────────────────────────────────

function SourcesChart({
  stats,
  isLoading,
}: {
  stats: ConversionStats | undefined;
  isLoading: boolean;
}) {
  // Sort sources by count descending, filter out zeroes
  const sources = Object.entries(stats?.bySource ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalSources = sources.reduce((sum, [, c]) => sum + c, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-purple-500" />
          Sources de prospects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))
        ) : sources.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucune donnée disponible
          </p>
        ) : (
          sources.map(([key, count], i) => {
            const pct = totalSources > 0 ? ((count / totalSources) * 100).toFixed(1) : '0';
            const label =
              PROSPECT_SOURCE_LABELS[key as keyof typeof PROSPECT_SOURCE_LABELS] ?? key;
            const color = SOURCE_COLORS[i % SOURCE_COLORS.length];

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{label}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── Inactive Prospects Alert ─────────────────────────────

function InactiveAlert({
  count,
  isLoading,
}: {
  count: number;
  isLoading: boolean;
}) {
  return (
    <Card className="h-full border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-48" />
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {count.toLocaleString('fr-FR')}
              </p>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Prospects inactifs
              </p>
            </div>
            <p className="max-w-[260px] text-xs text-amber-600/80 dark:text-amber-400/70">
              Ces prospects n'ont pas été contactés depuis plus de 7 jours. Un suivi est
              recommandé pour éviter les abandons.
            </p>
            {count > 0 && (
              <Badge
                variant="outline"
                className="mt-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              >
                <Phone className="mr-1 h-3 w-3" />
                Relancer
              </Badge>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Monthly Trend ────────────────────────────────────────

function MonthlyTrend({
  stats,
  isLoading,
}: {
  stats: ConversionStats | undefined;
  isLoading: boolean;
}) {
  // Take last 6 months
  const months = (stats?.byMonth ?? []).slice(-6);
  const maxProspects = Math.max(...months.map((m) => m.prospects), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-teal-500" />
          Tendance mensuelle
          <span className="text-xs font-normal text-muted-foreground">(6 derniers mois)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 flex-1 rounded" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : months.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucune donnée mensuelle disponible
          </p>
        ) : (
          <div className="space-y-3">
            {months.map((m) => {
              const prospectsWidth = Math.max((m.prospects / maxProspects) * 100, 2);
              const convertedWidth =
                maxProspects > 0
                  ? Math.max((m.converted / maxProspects) * 100, 0)
                  : 0;

              return (
                <div key={m.month} className="group">
                  {/* Row label + bars */}
                  <div className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                      {m.month}
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      {/* Prospects bar */}
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-slate-500 transition-all duration-700 dark:bg-slate-400"
                            style={{ width: `${prospectsWidth}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums">
                          {m.prospects}
                        </span>
                      </div>
                      {/* Converted bar */}
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700 dark:bg-emerald-400"
                            style={{ width: `${convertedWidth}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {m.converted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="mt-3 flex items-center gap-5 border-t pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-4 rounded-full bg-slate-500 dark:bg-slate-400" />
                Prospects
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-4 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Convertis
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────

export function CrmDashboard() {
  const { data: stats, isLoading } = useConversionStats();

  return (
    <section className="space-y-6" aria-label="Tableau de bord CRM">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Vue d'ensemble</h3>
        <p className="text-sm text-muted-foreground">
          Métriques et analyses du pipeline d'admissions
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((config) => (
          <KpiCard
            key={config.key}
            config={config}
            value={stats?.[config.key] ?? 0}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* ── Conversion Funnel ──────────────────────────── */}
      <ConversionFunnel stats={stats} isLoading={isLoading} />

      {/* ── Two-column: Sources + Inactive ─────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SourcesChart stats={stats} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <InactiveAlert count={stats?.inactiveProspects ?? 0} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Monthly Trend ──────────────────────────────── */}
      <MonthlyTrend stats={stats} isLoading={isLoading} />
    </section>
  );
}
