'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatFCFA, JOURNAL_TYPE_LABELS } from '@/types/accounting.types';
import type { JournalType } from '@/types/accounting.types';
import { useAccountSearch, useCreateJournalEntry } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JournalLine {
  _key: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
}

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultJournalType?: JournalType;
  onSuccess?: () => void;
}

function createEmptyLine(): JournalLine {
  return {
    _key: crypto.randomUUID(),
    accountId: '',
    accountNumber: '',
    accountName: '',
    description: '',
    debitAmount: 0,
    creditAmount: 0,
  };
}

export function JournalEntryForm({
  open,
  onOpenChange,
  defaultJournalType,
  onSuccess,
}: JournalEntryFormProps) {
  const createEntry = useCreateJournalEntry();

  const [description, setDescription] = useState('');
  const [journalType, setJournalType] = useState<JournalType>(defaultJournalType ?? 'OD');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<JournalLine[]>([createEmptyLine(), createEmptyLine()]);

  // Account search per line
  const [searchingLineKey, setSearchingLineKey] = useState<string | null>(null);
  const [lineSearches, setLineSearches] = useState<Record<string, string>>({});

  const activeSearchKey = searchingLineKey;
  const activeSearchQuery = activeSearchKey ? (lineSearches[activeSearchKey] ?? '') : '';
  const { data: searchResults = [], isLoading: searchLoading } = useAccountSearch(activeSearchQuery);

  // Totals
  const totalDebit = lines.reduce((s, l) => s + (l.debitAmount || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.creditAmount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const isValid = isBalanced && lines.every((l) => l.accountId && (l.debitAmount > 0 || l.creditAmount > 0));

  const updateLine = useCallback((key: string, updates: Partial<JournalLine>) => {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, ...updates } : l)));
  }, []);

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (key: string) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  const selectAccount = (lineKey: string, account: { id: string; accountNumber: string; accountName: string }) => {
    updateLine(lineKey, {
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
    });
    setSearchingLineKey(null);
    setLineSearches((prev) => ({ ...prev, [lineKey]: '' }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      await createEntry.mutateAsync({
        entryDate,
        description,
        journalType,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debitAmount: l.debitAmount,
          creditAmount: l.creditAmount,
          description: l.description || undefined,
        })),
      });

      toast.success('Écriture enregistrée avec succès.');
      resetForm();
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : "Erreur lors de l'enregistrement.";
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setDescription('');
    setJournalType(defaultJournalType ?? 'OD');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setLines([createEmptyLine(), createEmptyLine()]);
    setLineSearches({});
    setSearchingLineKey(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle écriture comptable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Journal</Label>
              <Select value={journalType} onValueChange={(v) => setJournalType(v as JournalType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(JOURNAL_TYPE_LABELS) as JournalType[]).map((jt) => (
                    <SelectItem key={jt} value={jt}>
                      {JOURNAL_TYPE_LABELS[jt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Libellé</Label>
              <Input
                placeholder="Description de l'écriture..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Lines table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50">
                  <TableHead className="text-xs font-semibold w-[240px]">Compte</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">Libellé</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-[120px]">Débit</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-[120px]">Crédit</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line._key}>
                    {/* Account selector */}
                    <TableCell>
                      <Popover
                        open={searchingLineKey === line._key}
                        onOpenChange={(v) => {
                          setSearchingLineKey(v ? line._key : null);
                          if (v) setLineSearches((prev) => ({ ...prev, [line._key]: '' }));
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left h-8 text-xs font-mono"
                          >
                            {line.accountNumber
                              ? `${line.accountNumber} — ${line.accountName}`
                              : 'Sélectionner un compte...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Rechercher par n° ou nom..."
                              value={lineSearches[line._key] ?? ''}
                              onChange={(e) =>
                                setLineSearches((prev) => ({
                                  ...prev,
                                  [line._key]: e.target.value,
                                }))
                              }
                              className="h-8 text-xs"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {searchLoading && (
                              <div className="p-3 text-center text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
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
                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                                onClick={() => selectAccount(line._key, acc)}
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
                    </TableCell>
                    {/* Line description */}
                    <TableCell className="hidden sm:table-cell">
                      <Input
                        placeholder="Libellé ligne..."
                        value={line.description}
                        onChange={(e) => updateLine(line._key, { description: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    {/* Debit */}
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={line.debitAmount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateLine(line._key, { debitAmount: val, creditAmount: 0 });
                        }}
                        className="h-8 text-xs text-right"
                      />
                    </TableCell>
                    {/* Credit */}
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={line.creditAmount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateLine(line._key, { creditAmount: val, debitAmount: 0 });
                        }}
                        className="h-8 text-xs text-right"
                      />
                    </TableCell>
                    {/* Delete */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(line._key)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add line */}
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={addLine}>
                <Plus className="h-3 w-3" />
                Ajouter une ligne
              </Button>
            </div>
          </div>

          {/* Totals & Balance */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4 text-sm">
              <span>
                Total Débit : <strong>{formatFCFA(totalDebit)}</strong>
              </span>
              <span>
                Total Crédit : <strong>{formatFCFA(totalCredit)}</strong>
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                isBalanced
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {isBalanced ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ÉQUILIBRÉ
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  DÉSÉQUILIBRÉ
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createEntry.isPending}
          >
            {createEntry.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
