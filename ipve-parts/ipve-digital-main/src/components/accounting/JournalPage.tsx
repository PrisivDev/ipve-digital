'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatFCFA,
  getJournalTypeColor,
  JOURNAL_TYPE_LABELS,
} from '@/types/accounting.types';
import type { JournalType } from '@/types/accounting.types';
import {
  useJournal,
  useJournalEntry,
  useValidateEntry,
  useDeleteEntry,
} from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { JournalEntryForm } from './JournalEntryForm';
import { cn } from '@/lib/utils';

type ValidationFilter = 'all' | 'draft' | 'validated';

export function JournalPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [journalType, setJournalType] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Debounce search
  if (search !== debouncedSearch) {
    setTimeout(() => setDebouncedSearch(search), 300);
  }

  // Build validation filter
  const isValidated =
    validationFilter === 'all' ? undefined : validationFilter === 'validated';

  const { data, isLoading } = useJournal({
    search: debouncedSearch || undefined,
    journalType: journalType !== 'all' ? (journalType as JournalType) : undefined,
    isValidated,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const { data: detail } = useJournalEntry(detailId);
  const validateEntry = useValidateEntry();
  const deleteEntry = useDeleteEntry();

  const handleValidate = async (id: string) => {
    try {
      await validateEntry.mutateAsync(id);
      toast.success('Écriture validée avec succès.');
    } catch {
      toast.error('Impossible de valider cette écriture.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Écriture supprimée avec succès.');
    } catch {
      toast.error('Impossible de supprimer cette écriture.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setJournalType('all');
    setValidationFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasFilters = debouncedSearch || journalType !== 'all' || validationFilter !== 'all' || startDate || endDate;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Journal</h3>
          <p className="text-sm text-muted-foreground">
            Écritures comptables — partie double OHADA
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-[#1A2B4A] hover:bg-[#1A2B4A]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle écriture
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>

        <Select value={journalType} onValueChange={(v) => { setJournalType(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Type de journal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les journaux</SelectItem>
            {(Object.keys(JOURNAL_TYPE_LABELS) as JournalType[]).map((jt) => (
              <SelectItem key={jt} value={jt}>
                {JOURNAL_TYPE_LABELS[jt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={validationFilter} onValueChange={(v) => { setValidationFilter(v as ValidationFilter); setPage(1); }}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="validated">Validé</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-[150px] h-9"
          placeholder="Début"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-[150px] h-9"
          placeholder="Fin"
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-9">
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="text-xs font-semibold">N° Écriture</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold hidden lg:table-cell">Description</TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">Journal</TableHead>
                <TableHead className="text-xs font-semibold hidden md:table-cell">Réf.</TableHead>
                <TableHead className="text-xs font-semibold text-right">Débit</TableHead>
                <TableHead className="text-xs font-semibold text-right">Crédit</TableHead>
                <TableHead className="text-xs font-semibold">Statut</TableHead>
                <TableHead className="text-xs font-semibold w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    Aucune écriture trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((entry) => (
                  <TableRow key={entry.id} className="group">
                    <TableCell className="font-mono text-xs font-semibold">
                      {entry.entryNumber}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.entryDate).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate hidden lg:table-cell">
                      {entry.description}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getJournalTypeColor(entry.journalType))}
                      >
                        {JOURNAL_TYPE_LABELS[entry.journalType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono hidden md:table-cell">
                      {entry.referenceId || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono whitespace-nowrap">
                      {formatFCFA(entry.totalDebit)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono whitespace-nowrap">
                      {formatFCFA(entry.totalCredit)}
                    </TableCell>
                    <TableCell>
                      {entry.isValidated ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Validé
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs gap-1">
                          ⏳ Brouillon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Voir le détail"
                          onClick={() => setDetailId(entry.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {!entry.isValidated && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                              title="Valider"
                              onClick={() => handleValidate(entry.id)}
                              disabled={validateEntry.isPending}
                            >
                              {validateEntry.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Supprimer"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleteEntry.isPending}
                            >
                              {deleteEntry.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Page {data.pagination.page} sur {data.pagination.totalPages} — {data.pagination.total} écriture(s)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(1)}
                disabled={page <= 1}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage(data.pagination.totalPages)}
                disabled={page >= data.pagination.totalPages}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Écriture {detail?.entryNumber}
              {detail?.isValidated ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs">
                  Validé
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">
                  Brouillon
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Date</span>
                  <p className="font-medium">{new Date(detail.entryDate).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Journal</span>
                  <p className="font-medium">{JOURNAL_TYPE_LABELS[detail.journalType]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Référence</span>
                  <p className="font-mono">{detail.referenceId || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Description</span>
                  <p className="font-medium">{detail.description}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="text-xs">Compte</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Libellé</TableHead>
                    <TableHead className="text-xs text-right">Débit</TableHead>
                    <TableHead className="text-xs text-right">Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {line.accountNumber} — {line.accountName}
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">
                        {line.description || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-right font-mono">
                        {line.debitAmount > 0 ? formatFCFA(line.debitAmount) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-right font-mono">
                        {line.creditAmount > 0 ? formatFCFA(line.creditAmount) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between text-sm font-semibold p-2 bg-muted/50 rounded">
                <span>Totaux</span>
                <span>D: {formatFCFA(detail.totalDebit)} / C: {formatFCFA(detail.totalCredit)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create form */}
      <JournalEntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
