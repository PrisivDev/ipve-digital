'use client';

import { useState } from 'react';
import { FileDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFCFA } from '@/types/accounting.types';
import { useIncomeStatement } from '@/hooks/useAccounting';
import { cn } from '@/lib/utils';

export function IncomeStatementPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data, isLoading } = useIncomeStatement({
    startDate,
    endDate,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Compte de Résultat</h3>
          <p className="text-sm text-muted-foreground">
            Produits et charges — résultat net de la période
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileDown className="h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Date début</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[170px] h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Date fin</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[170px] h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Two columns layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PRODUITS (Classe 7) */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  PRODUITS (Classe 7)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.revenues.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Aucun produit sur cette période
                  </p>
                ) : (
                  data.revenues.map((row) => (
                    <div
                      key={row.accountNumber}
                      className="flex justify-between items-center py-1.5 pl-4 text-sm"
                    >
                      <span className="text-muted-foreground text-xs">
                        <span className="font-mono mr-1">{row.accountNumber}</span>
                        {row.accountName}
                      </span>
                      <span className="font-mono text-xs font-medium">
                        {formatFCFA(row.amount)}
                      </span>
                    </div>
                  ))
                )}
                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-700">Total Produits</span>
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    {formatFCFA(data.totalRevenue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CHARGES (Classe 6) */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-orange-700 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  CHARGES (Classe 6)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.expenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Aucune charge sur cette période
                  </p>
                ) : (
                  data.expenses.map((row) => (
                    <div
                      key={row.accountNumber}
                      className="flex justify-between items-center py-1.5 pl-4 text-sm"
                    >
                      <span className="text-muted-foreground text-xs">
                        <span className="font-mono mr-1">{row.accountNumber}</span>
                        {row.accountName}
                      </span>
                      <span className="font-mono text-xs font-medium">
                        {formatFCFA(row.amount)}
                      </span>
                    </div>
                  ))
                )}
                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-orange-700">Total Charges</span>
                  <span className="font-mono text-sm font-bold text-orange-700">
                    {formatFCFA(data.totalExpenses)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RÉSULTAT NET */}
          <Card className={cn(
            'border-2',
            data.netResult >= 0
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-red-500 bg-red-50/50'
          )}>
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Résultat Net
                  </p>
                  <p className={cn(
                    'text-xs',
                    data.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {data.netResult >= 0 ? 'Bénéfice' : 'Perte'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-center">
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatFCFA(data.totalRevenue)}
                  </span>
                  <span className="text-lg text-muted-foreground">−</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatFCFA(data.totalExpenses)}
                  </span>
                  <span className="text-lg text-muted-foreground">=</span>
                  <span className={cn(
                    'text-2xl font-bold font-mono',
                    data.netResult >= 0 ? 'text-emerald-700' : 'text-red-700'
                  )}>
                    {formatFCFA(Math.abs(data.netResult))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
