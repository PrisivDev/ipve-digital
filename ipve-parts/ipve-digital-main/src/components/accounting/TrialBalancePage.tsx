'use client';

import { useState, useMemo } from 'react';
import { FileDown, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatFCFA, ACCOUNT_CLASS_LABELS } from '@/types/accounting.types';
import type { TrialBalanceRow } from '@/types/accounting.types';
import { useTrialBalance } from '@/hooks/useAccounting';
import { cn } from '@/lib/utils';

export function TrialBalancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [onlyMoved, setOnlyMoved] = useState(true);

  const { data, isLoading } = useTrialBalance({
    date: date || undefined,
    onlyMoved,
  });

  // Group rows by account class
  const grouped = useMemo(() => {
    if (!data.rows) return {};

    const groups: Record<string, TrialBalanceRow[]> = {};
    for (const row of data.rows) {
      const cls = row.accountClass;
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(row);
    }
    return groups;
  }, [data.rows]);

  // Class subtotals
  const classSubtotals = useMemo(() => {
    const result: Record<string, { td: number; tc: number; sd: number; sc: number }> = {};
    for (const [cls, rows] of Object.entries(grouped)) {
      result[cls] = rows.reduce(
        (acc, r) => ({
          td: acc.td + r.totalDebit,
          tc: acc.tc + r.totalCredit,
          sd: acc.sd + r.balanceDebit,
          sc: acc.sc + r.balanceCredit,
        }),
        { td: 0, tc: 0, sd: 0, sc: 0 }
      );
    }
    return result;
  }, [grouped]);

  const sortedClasses = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Balance Générale</h3>
          <p className="text-sm text-muted-foreground">
            Vérification de l'équilibre débit / crédit
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileDown className="h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[170px] h-9"
          />
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Checkbox
            id="only-moved"
            checked={onlyMoved}
            onCheckedChange={(v) => setOnlyMoved(!!v)}
          />
          <Label htmlFor="only-moved" className="text-xs cursor-pointer">
            Comptes mouvementés uniquement
          </Label>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="text-xs font-semibold">Compte</TableHead>
                <TableHead className="text-xs font-semibold">Intitulé</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Classe</TableHead>
                <TableHead className="text-xs font-semibold text-right">Total Débit</TableHead>
                <TableHead className="text-xs font-semibold text-right">Total Crédit</TableHead>
                <TableHead className="text-xs font-semibold text-right">Solde D</TableHead>
                <TableHead className="text-xs font-semibold text-right">Solde C</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.rows?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucune donnée pour cette période.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {sortedClasses.map((cls) => {
                    const rows = grouped[cls];
                    const sub = classSubtotals[cls];
                    return (
                      <TableClassGroup
                        key={cls}
                        className={cls}
                        rows={rows}
                        subtotalDebit={sub.td}
                        subtotalCredit={sub.tc}
                        subtotalBalanceD={sub.sd}
                        subtotalBalanceC={sub.sc}
                      />
                    );
                  })}

                  {/* Grand total row */}
                  <TableRow className="hover:bg-transparent bg-muted/70 font-bold">
                    <TableCell colSpan={3} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        {data.isBalanced ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        TOTAUX
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      {formatFCFA(data.totalDebit)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      {formatFCFA(data.totalCredit)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      {formatFCFA(data.totalBalanceDebit)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono">
                      {formatFCFA(data.totalBalanceCredit)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function TableClassGroup({
  className,
  rows,
  subtotalDebit,
  subtotalCredit,
  subtotalBalanceD,
  subtotalBalanceC,
}: {
  className: string;
  rows: TrialBalanceRow[];
  subtotalDebit: number;
  subtotalCredit: number;
  subtotalBalanceD: number;
  subtotalBalanceC: number;
}) {
  const label = ACCOUNT_CLASS_LABELS[className] || `Classe ${className}`;

  return (
    <>
      {/* Class header row */}
      <TableRow className="hover:bg-transparent bg-muted/40 font-semibold">
        <TableCell colSpan={3} className="text-xs font-bold text-[#1A2B4A]">
          {label}
        </TableCell>
        <TableCell className="text-xs text-right font-mono text-muted-foreground">
          {formatFCFA(subtotalDebit)}
        </TableCell>
        <TableCell className="text-xs text-right font-mono text-muted-foreground">
          {formatFCFA(subtotalCredit)}
        </TableCell>
        <TableCell className="text-xs text-right font-mono text-muted-foreground">
          {subtotalBalanceD > 0 ? formatFCFA(subtotalBalanceD) : '—'}
        </TableCell>
        <TableCell className="text-xs text-right font-mono text-muted-foreground">
          {subtotalBalanceC > 0 ? formatFCFA(subtotalBalanceC) : '—'}
        </TableCell>
      </TableRow>

      {/* Individual accounts */}
      {rows.map((row) => (
        <TableRow key={row.accountNumber}>
          <TableCell className="font-mono text-xs font-semibold pl-6">
            {row.accountNumber}
          </TableCell>
          <TableCell className="text-xs">{row.accountName}</TableCell>
          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
            {className}
          </TableCell>
          <TableCell className="text-xs text-right font-mono">
            {row.totalDebit > 0 ? formatFCFA(row.totalDebit) : '—'}
          </TableCell>
          <TableCell className="text-xs text-right font-mono">
            {row.totalCredit > 0 ? formatFCFA(row.totalCredit) : '—'}
          </TableCell>
          <TableCell className="text-xs text-right font-mono text-emerald-700">
            {row.balanceDebit > 0 ? formatFCFA(row.balanceDebit) : '—'}
          </TableCell>
          <TableCell className="text-xs text-right font-mono text-red-600">
            {row.balanceCredit > 0 ? formatFCFA(row.balanceCredit) : '—'}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
