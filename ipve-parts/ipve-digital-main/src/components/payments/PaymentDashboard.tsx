'use client';

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wallet,
  Receipt,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePaymentDashboard } from '@/hooks/usePayments';
import {
  formatFCFA,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  getPaymentMethodIcon,
  type PaymentMethod,
} from '@/types/payment.types';

// ─── Color map for pie chart ───────────────────────────────
const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: '#8B1C2D',
  MTN_MOMO: '#FFCB00',
  ORANGE_MONEY: '#FF6600',
  WAVE: '#1DC3E2',
  BANK_TRANSFER: '#1A2B4A',
  CHEQUE: '#6B7280',
};

const PIE_COLORS = Object.values(METHOD_COLORS);

// ─── Status badge helper ──────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    PARTIALLY_REFUNDED: 'bg-blue-100 text-blue-700 border-blue-200',
    REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status] || ''}`}>
      {PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] || status}
    </Badge>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium">{label}</p>
      <p className="text-[#8B1C2D] font-bold">{formatFCFA(payload[0].value)}</p>
    </div>
  );
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { label: string; total: number; count: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium">{d.payload.label}</p>
      <p className="font-bold">{formatFCFA(d.value)}</p>
      <p className="text-muted-foreground text-xs">{d.payload.count} paiement(s)</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export function PaymentDashboard() {
  const { data, isLoading } = usePaymentDashboard();

  if (isLoading || !data) return <DashboardSkeleton />;

  const momPositive = data.monthOverMonthChange >= 0;
  const pieData = data.byMethod.map((m) => ({
    name: m.method,
    label: m.label,
    value: m.total,
    count: m.count,
  }));

  return (
    <div className="space-y-6">
      {/* ─── Row 1: KPI Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Total encaissé ce mois */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <Wallet className="h-4 w-4 text-emerald-700" />
              </div>
              <span className="text-xs text-muted-foreground">Encaissé ce mois</span>
            </div>
            <p className="text-lg font-bold text-emerald-700">{formatFCFA(data.totalCollectedMonth)}</p>
            <div className="flex items-center gap-1 mt-1">
              {momPositive ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${momPositive ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {Math.abs(data.monthOverMonthChange).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs mois préc.</span>
            </div>
          </CardContent>
        </Card>

        {/* Card: Total impayés */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-700" />
              </div>
              <span className="text-xs text-muted-foreground">Total impayés</span>
            </div>
            <p className="text-lg font-bold text-red-700">{formatFCFA(data.totalUnpaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.unpaidStudentCount} étudiant{data.unpaidStudentCount > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Card: Trésorerie estimée */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
              <span className="text-xs text-muted-foreground">Trésorerie estimée</span>
            </div>
            <p className="text-lg font-bold text-blue-700">{formatFCFA(data.estimatedTreasury)}</p>
          </CardContent>
        </Card>

        {/* Card: Nb paiements ce mois */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Receipt className="h-4 w-4 text-purple-700" />
              </div>
              <span className="text-xs text-muted-foreground">Paiements ce mois</span>
            </div>
            <p className="text-lg font-bold text-purple-700">
              {data.revenueChart.length > 0
                ? data.recentPayments.filter((p) => {
                    const now = new Date();
                    const pDate = new Date(p.paymentDate);
                    return (
                      pDate.getMonth() === now.getMonth() &&
                      pDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2: Chart + Recent Payments ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Revenus mensuels</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="#8B1C2D"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent payments table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Paiements récents</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Étudiant</TableHead>
                    <TableHead className="text-xs text-right">Montant</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Méthode</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-8">
                        Aucun paiement récent
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{p.studentName}</TableCell>
                        <TableCell className="text-xs font-semibold text-right whitespace-nowrap">
                          {formatFCFA(p.amountPaid)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {getPaymentMethodIcon(p.paymentMethod)}{' '}
                            {PAYMENT_METHOD_LABELS[p.paymentMethod]}
                          </span>
                        </TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 3: Top Debtors + Pie Chart ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 débiteurs */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top 5 débiteurs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {data.topDebtors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun débiteur
              </p>
            ) : (
              <div className="space-y-2">
                {data.topDebtors.map((d, idx) => (
                  <div
                    key={d.studentId + d.trancheId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.trancheName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-red-700">
                        {formatFCFA(d.remaining)}
                      </p>
                      {d.overdueDays && d.overdueDays > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-100 text-red-700 border-red-200"
                        >
                          {d.overdueDays}j de retard
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par mode */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Répartition par mode</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune donnée
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
