'use client';

import {
  Users,
  TrendingUp,
  Clock,
  UserPlus,
  GraduationCap,
  TrendingDown,
  DollarSign,
  BarChart3,
  Plus,
  CreditCard,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
import { useDashboard, type DashboardApiData } from '@/hooks/useDashboard';

// --- IPVE Color Palette (from logo) ---
const COLORS = {
  maroon: 'oklch(0.33 0.13 20)',
  maroonLight: 'oklch(0.45 0.11 20)',
  navy: 'oklch(0.30 0.06 260)',
  navyLight: 'oklch(0.45 0.08 260)',
  gold: 'oklch(0.76 0.15 65)',
  goldLight: 'oklch(0.85 0.10 65)',
  silver: 'oklch(0.70 0.02 260)',
  copper: 'oklch(0.60 0.12 50)',
  steel: 'oklch(0.55 0.08 250)',
  teal: 'oklch(0.60 0.08 200)',
};

// --- Chart Configs ---
const revenueChartConfig = {
  revenue: { label: 'Recettes', color: COLORS.navy },
  expenses: { label: 'Dépenses', color: COLORS.maroon },
} satisfies ChartConfig;

const pieChartConfig = {
  Informatique: { label: 'Informatique', color: COLORS.navy },
  Gestion: { label: 'Gestion', color: COLORS.maroon },
  Marketing: { label: 'Marketing', color: COLORS.gold },
  Comptabilité: { label: 'Comptabilité', color: COLORS.teal },
} satisfies ChartConfig;

const attendanceChartConfig = {
  taux: { label: "Taux d'assiduité (%)", color: COLORS.navy },
} satisfies ChartConfig;

// --- Helpers ---

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function mapPaymentStatus(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'Complété';
    case 'PARTIAL': return 'Partiel';
    case 'PENDING': return 'En attente';
    case 'OVERDUE': return 'En retard';
    default: return status;
  }
}

function getNotificationConfig(notif: Record<string, unknown>): {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  time: string;
  color: string;
} {
  const title = (notif.title as string) || (notif.message as string) || 'Notification';
  const type = (notif.type as string) || 'info';
  const createdAt = notif.createdAt as string | undefined;
  let time = 'À l\'instant';
  if (createdAt) {
    try {
      const diff = Date.now() - new Date(createdAt).getTime();
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (days > 0) time = `Il y a ${days}j`;
      else if (hours > 0) time = `Il y a ${hours}h`;
      else time = 'À l\'instant';
    } catch {
      /* keep default */
    }
  }

  switch (type) {
    case 'payment':
    case 'success':
      return { icon: CheckCircle2, text: title, time, color: 'text-[oklch(0.35_0.08_155)]' };
    case 'warning':
    case 'alert':
      return { icon: AlertCircle, text: title, time, color: 'text-amber-600' };
    case 'prospect':
    case 'user':
      return { icon: UserPlus, text: title, time, color: 'text-primary' };
    case 'reminder':
      return { icon: Bell, text: title, time, color: 'text-muted-foreground' };
    default:
      return { icon: Info, text: title, time, color: 'text-muted-foreground' };
  }
}

// --- KPI Card Component ---
interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
}

function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, valueColor, trend, loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-border/50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5 w-full">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-xl sm:text-2xl font-bold tracking-tight', valueColor || 'text-foreground')}>
                {value}
              </span>
            </div>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.positive ? (
              <ArrowUpRight className="h-3 w-3 text-[oklch(0.35_0.08_155)]" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={cn('text-xs font-medium', trend.positive ? 'text-[oklch(0.35_0.08_155)]' : 'text-red-500')}>
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Chart Skeleton ---
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn('w-full', className || 'h-[280px]')} />
      </CardContent>
    </Card>
  );
}

// --- Derived data helpers ---

function buildStudentsByProgramPie(data: DashboardApiData) {
  // Map filiereId to colors using the pieChartConfig keys
  const filiereColorMap: Record<string, string> = {
    'Informatique': COLORS.navy,
    'Gestion': COLORS.maroon,
    'Marketing': COLORS.gold,
    'Comptabilité': COLORS.teal,
  };

  const entries = data.studentsByProgram ?? [];
  if (entries.length === 0) return [];

  return entries.map((entry) => ({
    name: entry.filiereName,
    value: entry._count.id,
    fill: filiereColorMap[entry.filiereName] || COLORS.silver,
  }));
}

function buildMappedPayments(data: DashboardApiData) {
  if (!data.recentPayments?.length) return [];
  return data.recentPayments.map((p) => ({
    student: p.student
      ? `${p.student.firstName} ${p.student.lastName}`
      : 'Inconnu',
    amount: formatCurrency(p.amountPaid),
    date: formatDate(p.paymentDate),
    status: mapPaymentStatus(p.status),
  }));
}

function buildMappedNotifications(data: DashboardApiData) {
  if (!data.notifications?.length) return [];
  return data.notifications.map((n) => getNotificationConfig(n));
}

// --- Main Dashboard View ---
export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <Skeleton className="h-6 w-44 mt-3 sm:mt-0 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCard key={i} title="" value="" icon={Users} iconBg="" iconColor="" loading />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCard key={i} title="" value="" icon={Users} iconBg="" iconColor="" loading />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ChartSkeleton className="h-[240px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Tableau de bord</h2>
            <p className="text-sm text-muted-foreground">
              Vue d&apos;ensemble de votre établissement
            </p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-sm font-medium">Impossible de charger les données du tableau de bord</p>
            <p className="text-xs text-muted-foreground mt-1">Vérifiez votre connexion et réessayez.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Derived values from API ---
  const totalStudents = data.students?.total ?? 0;
  const activeStudents = data.students?.active ?? 0;
  const totalTeachers = data.teachers?.total ?? 0;
  const revenue = data.finances?.revenue ?? data.payments?.revenue ?? 0;
  const expenses = data.finances?.expenses ?? data.expenses?.amount ?? 0;
  const margin = data.finances?.margin ?? revenue - expenses;
  const attendanceRate = data.academics?.attendanceRate ?? 0;
  const avgGrade = data.academics?.avgGrade ?? 0;
  const totalProspects = data.prospects?.total ?? 0;
  const newProspects = data.prospects?.new ?? 0;

  // Charts data – now provided by the API
  const monthlyRevenue = data.monthlyRevenue ?? [];
  const attendanceBySubject = data.attendanceBySubject ?? [];
  const studentsByProgram = buildStudentsByProgramPie(data);
  const mappedPayments = buildMappedPayments(data);
  const mappedNotifications = buildMappedNotifications(data);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de votre établissement
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-normal">
            <Clock className="h-3 w-3 mr-1" />
            Dernière mise à jour: À l&apos;instant
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Étudiants inscrits"
          value={String(totalStudents)}
          subtitle={`${activeStudents} actifs`}
          icon={Users}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          valueColor="text-primary"
        />
        <KpiCard
          title="Recettes totales"
          value={formatCurrency(revenue)}
          subtitle="FCFA"
          icon={TrendingUp}
          iconBg="bg-[oklch(0.94_0.01_260)]"
          iconColor="text-[oklch(0.35_0.06_260)]"
        />
        <KpiCard
          title="Taux d'assiduité"
          value={`${attendanceRate}%`}
          subtitle="Moyenne globale"
          icon={Clock}
          iconBg="bg-[oklch(0.95_0.04_65)]"
          iconColor="text-[oklch(0.65_0.14_55)]"
        />
        <KpiCard
          title="Prospects"
          value={String(totalProspects)}
          subtitle={newProspects > 0 ? `dont ${newProspects} nouveau${newProspects > 1 ? 'x' : ''}` : 'Aucun nouveau'}
          icon={UserPlus}
          iconBg="bg-[oklch(0.94_0.02_200)]"
          iconColor="text-[oklch(0.50_0.08_200)]"
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Enseignants"
          value={String(totalTeachers)}
          subtitle="Actifs"
          icon={GraduationCap}
          iconBg="bg-[oklch(0.94_0.03_50)]"
          iconColor="text-[oklch(0.50_0.10_50)]"
        />
        <KpiCard
          title="Dépenses"
          value={formatCurrency(expenses)}
          subtitle="FCFA"
          icon={TrendingDown}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <KpiCard
          title="Marge nette"
          value={formatCurrency(margin)}
          subtitle="FCFA"
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          trend={margin >= 0 ? undefined : { value: 'Déficit', positive: false }}
        />
        <KpiCard
          title="Moyenne générale"
          value={`${avgGrade}/20`}
          subtitle="Tous programmes"
          icon={BarChart3}
          iconBg="bg-[oklch(0.94_0.03_250)]"
          iconColor="text-[oklch(0.45_0.08_250)]"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Area Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recettes vs Dépenses</CardTitle>
            <CardDescription>6 derniers mois (en FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.maroon} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.maroon} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="oklch(0.7 0 0)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.7 0 0)" tickFormatter={(v) => `${v / 1000000}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.navy}
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke={COLORS.maroon}
                    fill="url(#expensesGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Données mensuelles non disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students by Program Pie Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Répartition des étudiants</CardTitle>
            <CardDescription>Par programme</CardDescription>
          </CardHeader>
          <CardContent>
            {studentsByProgram.length > 0 ? (
              <>
                <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={studentsByProgram}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {studentsByProgram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {studentsByProgram.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Données non disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Bar Chart */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Taux d'assiduité par matière</CardTitle>
          <CardDescription>Pourcentage de présence (%)</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceBySubject.length > 0 ? (
            <ChartContainer config={attendanceChartConfig} className="h-[240px] w-full">
              <BarChart data={attendanceBySubject} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="oklch(0.7 0 0)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="oklch(0.7 0 0)" tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="taux" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {attendanceBySubject.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.taux >= 90 ? COLORS.navy : entry.taux >= 80 ? COLORS.gold : COLORS.maroon}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
              Données non disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section: Payments + Notifications + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Payments Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Derniers paiements</CardTitle>
                <CardDescription>5 transactions récentes</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {mappedPayments.length} entrées
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {mappedPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">Étudiant</TableHead>
                      <TableHead className="text-xs font-semibold">Montant</TableHead>
                      <TableHead className="text-xs font-semibold hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedPayments.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm font-medium">{payment.student}</TableCell>
                        <TableCell className="text-sm">{payment.amount} F</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{payment.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === 'Complété'
                                ? 'default'
                                : payment.status === 'Partiel'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={cn(
                              'text-[10px] px-2 py-0.5',
                              payment.status === 'Complété' && 'bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.10_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]',
                              payment.status === 'Partiel' && 'bg-[oklch(0.95_0.04_65)] text-[oklch(0.55_0.14_55)] border-[oklch(0.88_0.04_65)] hover:bg-[oklch(0.95_0.04_65)]',
                              payment.status === 'En retard' && 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                            )}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                Aucun paiement récent
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: Notifications + Quick Actions */}
        <div className="flex flex-col gap-4">
          {/* Notifications */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Notifications récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                {mappedNotifications.length > 0 ? (
                  mappedNotifications.map((notif, index) => {
                    const NotifIcon = notif.icon;
                    return (
                      <div key={index} className="flex items-start gap-3 py-1">
                        <NotifIcon className={cn('h-4 w-4 shrink-0 mt-0.5', notif.color)} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs leading-snug">{notif.text}</span>
                          <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
                    Aucune notification
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4" />
                  Nouvel étudiant
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                  <CreditCard className="h-4 w-4" />
                  Enregistrer paiement
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-[oklch(0.95_0.04_65)] hover:text-[oklch(0.50_0.12_50)]">
                  <ClipboardList className="h-4 w-4" />
                  Saisir notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
