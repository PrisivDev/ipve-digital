'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';

// --- Types ---
interface Budget {
  id: string;
  name: string;
  planned: number;
  actual: number;
}

// --- Mock Data ---
const mockBudgets: Budget[] = [
  { id: '1', name: 'Budget Annuel', planned: 15000000, actual: 9070000 },
  { id: '2', name: 'Budget Salaires', planned: 3600000, actual: 3200000 },
  { id: '3', name: 'Budget Marketing', planned: 300000, actual: 350000 },
  { id: '4', name: 'Budget Loyer', planned: 450000, actual: 450000 },
  { id: '5', name: 'Budget Fournitures', planned: 200000, actual: 185000 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

function getProgressColor(pct: number): string {
  if (pct >= 90) return '[&>div]:bg-red-500';
  if (pct >= 75) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-[oklch(0.50_0.08_155)]';
}

function getProgressBadge(pct: number) {
  if (pct >= 100) {
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs">Dépassé</Badge>;
  }
  if (pct >= 90) {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">Attention</Badge>;
  }
  return <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)] text-xs">Normal</Badge>;
}

function getRemainingColor(remaining: number): string {
  return remaining >= 0 ? 'text-[oklch(0.35_0.08_155)]' : 'text-red-700';
}

// Chart config
const budgetChartConfig = {
  planned: { label: 'Planifié', color: 'oklch(0.30 0.06 260)' },
  actual: { label: 'Réalisé', color: 'oklch(0.6 0.2 25)' },
} satisfies ChartConfig;

export function BudgetsSection() {
  const [editOpen, setEditOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [form, setForm] = useState({
    name: '',
    planned: '',
  });

  const chartData = useMemo(() => {
    return mockBudgets.map((b) => ({
      name: b.name.replace('Budget ', ''),
      planned: b.planned,
      actual: b.actual,
    }));
  }, []);

  const totalPlanned = mockBudgets.reduce((s, b) => s + b.planned, 0);
  const totalActual = mockBudgets.reduce((s, b) => s + b.actual, 0);
  const totalRemaining = totalPlanned - totalActual;

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsNew(false);
    setForm({ name: budget.name, planned: budget.planned.toString() });
    setEditOpen(true);
  };

  const handleAdd = () => {
    setEditingBudget(null);
    setIsNew(true);
    setForm({ name: '', planned: '' });
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-[oklch(0.35_0.08_155)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget total planifié</p>
                <p className="text-lg font-bold text-[oklch(0.35_0.08_155)]">{formatCurrency(totalPlanned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dépenses réalisées</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(totalActual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Solde restant</p>
                <p className={cn('text-lg font-bold', getRemainingColor(totalRemaining))}>{formatCurrency(totalRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add budget button */}
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          <span>Ajouter un budget</span>
        </Button>
      </div>

      {/* Budget cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockBudgets.map((budget) => {
          const pct = Math.round((budget.actual / budget.planned) * 100);
          const remaining = budget.planned - budget.actual;
          return (
            <Card key={budget.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-[oklch(0.35_0.08_155)]" />
                    {budget.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getProgressBadge(pct)}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(budget)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Planifié</p>
                    <p className="text-sm font-semibold">{formatCurrency(budget.planned)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Réalisé</p>
                    <p className="text-sm font-semibold text-red-700">{formatCurrency(budget.actual)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progression</span>
                    <span className={cn('font-semibold', pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-amber-600' : 'text-[oklch(0.35_0.08_155)]')}>
                      {pct}%
                    </span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className={cn('h-2.5', getProgressColor(pct))} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Restant</span>
                  <span className={cn('text-sm font-semibold', getRemainingColor(remaining))}>
                    {formatCurrency(Math.abs(remaining))} {remaining < 0 ? '(dépassement)' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Budget comparison chart */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Comparaison Planifié vs Réalisé</CardTitle>
          <CardDescription>Par poste budgétaire (en FCFA)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={budgetChartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.7 0 0)" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.7 0 0)" tickFormatter={(v) => `${v / 1000000}M`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="planned" fill="oklch(0.30 0.06 260)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="actual" fill="oklch(0.6 0.2 25)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Nouveau budget' : `Modifier : ${editingBudget?.name}`}</DialogTitle>
            <DialogDescription>
              {isNew ? 'Créez une nouvelle ligne budgétaire.' : 'Modifiez les informations du budget.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="budgetName">Nom du budget</Label>
              <Input
                id="budgetName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Budget Marketing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetPlanned">Montant planifié (FCFA)</Label>
              <Input
                id="budgetPlanned"
                type="number"
                value={form.planned}
                onChange={(e) => setForm({ ...form, planned: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setEditOpen(false)}>
              {isNew ? 'Créer' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
