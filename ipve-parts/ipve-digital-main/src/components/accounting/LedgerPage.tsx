'use client';

import { useState } from 'react';
import { Search, FileDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { formatFCFA, getJournalTypeColor, JOURNAL_TYPE_LABELS } from '@/types/accounting.types';
import type { ChartOfAccountFlat } from '@/types/accounting.types';
import { useLedger, useAccountSearch } from '@/hooks/useAccounting';
import { cn } from '@/lib/utils';

export function LedgerPage() {
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccountFlat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: searchResults = [], isLoading: searchLoading } = useAccountSearch(
    popoverOpen ? searchQuery : ''
  );

  const { data: ledger, isLoading } = useLedger(
    selectedAccount?.id ?? null,
    { startDate: startDate || undefined, endDate: endDate || undefined }
  );

  const selectAccount = (account: ChartOfAccountFlat) => {
    setSelectedAccount(account);
    setPopoverOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Grand Livre</h3>
          <p className="text-sm text-muted-foreground">
            Détail des mouvements par compte
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileDown className="h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Account selector */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 justify-start text-left min-w-[250px]">
              {selectedAccount ? (
                <span className="font-mono text-xs">
                  {selectedAccount.accountNumber} — {selectedAccount.accountName}
                </span>
              ) : (
                <span className="text-muted-foreground">Sélectionner un compte...</span>
              )}
              <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par n° ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {searchLoading && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Recherche...
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Aucun compte trouvé
                </div>
              )}
              {searchResults.map((acc) => (
                <button
                  key={acc.id}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2',
                    selectedAccount?.id === acc.id && 'bg-accent'
                  )}
                  onClick={() => selectAccount(acc)}
                >
                  <span className="font-mono font-semibold text-muted-foreground w-16 shrink-0">
                    {acc.accountNumber}
                  </span>
                  <span className="truncate">{acc.accountName}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] shrink-0">
                    {acc.accountClass}
                  </Badge>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-[150px] h-9"
          placeholder="Date début"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-[150px] h-9"
          placeholder="Date fin"
        />
      </div>

      {/* Content */}
      {!selectedAccount ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Sélectionnez un compte pour afficher le Grand Livre.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : ledger ? (
        <div className="space-y-4">
          {/* Account summary */}
          <Card className="border-l-4 border-l-[#1A2B4A]">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono font-bold text-lg">{ledger.accountNumber}</span>
                  <span className="text-sm text-muted-foreground ml-2">{ledger.accountName}</span>
                </div>
                <Badge variant="outline" className="text-xs self-start">
                  {ledger.accountType === 'ASSET' ? 'Actif' :
                   ledger.accountType === 'LIABILITY' ? 'Passif' :
                   ledger.accountType === 'EQUITY' ? 'Capitaux Propres' :
                   ledger.accountType === 'REVENUE' ? 'Produits' : 'Charges'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Solde initial</span>
                  <span className={cn('font-mono font-semibold', ledger.initialBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {formatFCFA(Math.abs(ledger.initialBalance))} {ledger.initialBalance >= 0 ? 'D' : 'C'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Mouvements du compte</span>
                  <span className="text-xs">
                    D: {formatFCFA(ledger.finalDebit)} / C: {formatFCFA(ledger.finalCredit)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Solde final</span>
                  <span className={cn('text-lg font-bold font-mono', ledger.finalBalance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {formatFCFA(Math.abs(ledger.finalBalance))} {ledger.finalBalance >= 0 ? 'D' : 'C'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ledger table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold hidden sm:table-cell">N° Pièce</TableHead>
                    <TableHead className="text-xs font-semibold">Libellé</TableHead>
                    <TableHead className="text-xs font-semibold hidden md:table-cell">Journal</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Débit</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Crédit</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucun mouvement pour cette période.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(entry.entryDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden sm:table-cell">
                          {entry.entryNumber}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getJournalTypeColor(entry.journalType))}
                          >
                            {JOURNAL_TYPE_LABELS[entry.journalType]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono whitespace-nowrap">
                          {entry.debitAmount > 0 ? formatFCFA(entry.debitAmount) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono whitespace-nowrap">
                          {entry.creditAmount > 0 ? formatFCFA(entry.creditAmount) : '—'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-sm text-right font-mono font-semibold whitespace-nowrap',
                            entry.runningBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                          )}
                        >
                          {formatFCFA(Math.abs(entry.runningBalance))} {entry.runningBalance >= 0 ? 'D' : 'C'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
