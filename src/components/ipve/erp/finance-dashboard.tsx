'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// --- Mock Data ---
const kpiData = [
  { title: 'Recettes totales', value: '5 750 000 FCFA', icon: TrendingUp, colorClass: 'text-[oklch(0.35_0.08_155)]', iconBgClass: 'bg-primary/10', trend: '+8.5%', positive: true },
  { title: 'Dépenses totales', value: '9 070 000 FCFA', icon: TrendingDown, colorClass: 'text-red-700', iconBgClass: 'bg-red-100', trend: '+15%', positive: false },
  { title: 'Marge nette', value: '-3 320 000 FCFA', icon: DollarSign, colorClass: 'text-orange-700', iconBgClass: 'bg-orange-100', trend: 'Déficit', positive: false },
  { title: 'Trésorerie dispo', value: '2 699 000 FCFA', icon: Wallet, colorClass: 'text-[oklch(0.35_0.08_155)]', iconBgClass: 'bg-primary/10', trend: 'Solde positif', positive: true },
];

const monthlyRevenue = [
  { month: 'Oct', recettes: 2800000, depenses: 1500000 },
  { month: 'Nov', recettes: 1950000, depenses: 1800000 },
  { month: 'Déc', recettes: 1000000, depenses: 2100000 },
  { month: 'Jan', recettes: 1500000, depenses: 1200000 },
  { month: 'Fév', recettes: 2200000, depenses: 1600000 },
  { month: 'Mar', recettes: 3000000, depenses: 1400000 },
];

const paymentMethods = [
  { method: 'Espèces', amount: 2450000, fill: 'oklch(0.30 0.06 260)' },
  { method: 'Mobile Money', amount: 1980000, fill: 'oklch(0.7 0.14 55)' },
  { method: 'Virement', amount: 1320000, fill: 'oklch(0.60 0.08 200)' },
];

const recentTransactions = [
  { date: '15 Mar 2025', description: 'Paiement scolarité - Koné Aminata', type: 'recette', amount: 350000, status: 'Complété' },
  { date: '14 Mar 2025', description: 'Loyer bureau - Mars 2025', type: 'depense', amount: 450000, status: 'Payé' },
  { date: '13 Mar 2025', description: 'Paiement scolarité - Yao Jean-Baptiste', type: 'recette', amount: 175000, status: 'Complété' },
  { date: '12 Mar 2025', description: 'Achat fournitures bureau', type: 'depense', amount: 85000, status: 'Payé' },
  { date: '11 Mar 2025', description: 'Paiement scolarité - Brou Kouamé', type: 'recette', amount: 350000, status: 'Complété' },
  { date: '10 Mar 2025', description: 'Salaires enseignants - Fév 2025', type: 'depense', amount: 3200000, status: 'Payé' },
  { date: '09 Mar 2025', description: 'Paiement scolarité - Diallo Marie-Claire', type: 'recette', amount: 175000, status: 'Complété' },
  { date: '08 Mar 2025', description: 'Facture électricité - Fév 2025', type: 'depense', amount: 120000, status: 'Payé' },
];

const budgetOverview = [
  { name: 'Salaires', planned: 3600000, actual: 3200000 },
  { name: 'Loyer', planned: 450000, actual: 450000 },
  { name: 'Fournitures', planned: 200000, actual: 185000 },
  { name: 'Marketing', planned: 300000, actual: 350000 },
  { name: 'Maintenance', planned: 150000, actual: 120000 },
];

// --- Chart Configs ---
const revenueChartConfig = {
  recettes: { label: 'Recettes', color: 'oklch(0.30 0.06 260)' },
  depenses: { label: 'Dépenses', color: 'oklch(0.6 0.2 25)' },
} satisfies ChartConfig;

const paymentChartConfig = {
  amount: { label: 'Montant', color: 'oklch(0.30 0.06 260)' },
} satisfies ChartConfig;

// --- KPI Card ---
function KpiCard({ title, value, icon: Icon, colorClass, iconBgClass, trend, positive }: (typeof kpiData)[number]) {
  return (
    <Card className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
            <span className={cn('text-lg sm:text-xl font-bold tracking-tight', colorClass)}>{value}</span>
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBgClass)}>
            <Icon className={cn('h-5 w-5', colorClass)} />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {positive ? (
            <ArrowUpRight className="h-3 w-3 text-[oklch(0.35_0.08_155)]" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span className={cn('text-xs font-medium', positive ? 'text-[oklch(0.35_0.08_155)]' : 'text-red-500')}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

export function FinanceDashboard() {
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Area Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recettes vs Dépenses</CardTitle>
            <CardDescription>6 derniers mois (en FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="finRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.30 0.06 260)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.30 0.06 260)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finExpensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.6 0.2 25)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.6 0.2 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="oklch(0.7 0 0)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.7 0 0)" tickFormatter={(v) => `${v / 1000000}M`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="recettes" stroke="oklch(0.30 0.06 260)" fill="url(#finRevenueGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="depenses" stroke="oklch(0.6 0.2 25)" fill="url(#finExpensesGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recettes par mode de paiement</CardTitle>
            <CardDescription>Répartition des encaissements</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentChartConfig} className="h-[280px] w-full">
              <BarChart data={paymentMethods} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="method" tick={{ fontSize: 12 }} stroke="oklch(0.7 0 0)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.7 0 0)" tickFormatter={(v) => `${v / 1000000}M`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions + Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Transactions récentes</CardTitle>
                <CardDescription>Dernières opérations financières</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">{recentTransactions.length} entrées</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Description</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                    <TableHead className="text-xs font-semibold hidden sm:table-cell">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{tx.date}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{tx.description}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-[10px] px-2 py-0.5',
                            tx.type === 'recette'
                              ? 'bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]'
                              : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
                          )}
                        >
                          {tx.type === 'recette' ? 'Recette' : 'Dépense'}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn('text-sm font-semibold text-right whitespace-nowrap', tx.type === 'recette' ? 'text-[oklch(0.35_0.08_155)]' : 'text-red-700')}>
                        {tx.type === 'recette' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">{tx.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Budget prévisionnel</CardTitle>
            <CardDescription>Planifié vs Réalisé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetOverview.map((budget) => {
              const pct = Math.round((budget.actual / budget.planned) * 100);
              const overBudget = pct > 100;
              return (
                <div key={budget.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{budget.name}</span>
                    <span className={cn('text-xs font-semibold', overBudget ? 'text-red-600' : 'text-muted-foreground')}>
                      {pct}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={cn('h-2', overBudget && '[&>div]:bg-red-500')}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Prévu: {formatCurrency(budget.planned)}</span>
                    <span>Réel: {formatCurrency(budget.actual)}</span>
                  </div>
                </div>
              );
            })}
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span className={cn(
                budgetOverview.reduce((a, b) => a + b.actual, 0) > budgetOverview.reduce((a, b) => a + b.planned, 0)
                  ? 'text-red-600' : 'text-[oklch(0.35_0.08_155)]'
              )}>
                {formatCurrency(budgetOverview.reduce((a, b) => a + b.actual, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
