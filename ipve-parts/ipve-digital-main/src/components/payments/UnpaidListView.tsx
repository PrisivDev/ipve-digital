'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CreditCard,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useUnpaidStudents,
  useSendReminders,
} from '@/hooks/usePayments';
import { useFilieres, useLevels } from '@/hooks/useStudents';
import {
  formatFCFA,
  TRANCHE_STATUS_LABELS,
  type UnpaidFilters,
  type UnpaidSummary,
  type TrancheStatus,
} from '@/types/payment.types';
import { toast } from 'sonner';

// ─── Status badge ─────────────────────────────────────────
function trancheStatusBadge(status: TrancheStatus) {
  const map: Record<TrancheStatus, string> = {
    PAYÉ: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PARTIEL: 'bg-amber-100 text-amber-700 border-amber-200',
    EN_RETARD: 'bg-red-100 text-red-700 border-red-200',
    EN_ATTENTE: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status]}`}>
      {TRANCHE_STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Skeleton ─────────────────────────────────────────────
function UnpaidSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-full sm:w-40" />
        <Skeleton className="h-9 w-full sm:w-40" />
      </div>
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full border-b last:border-b-0" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────
export function UnpaidListView() {

  // Filters
  const [search, setSearch] = useState('');
  const [filiereId, setFiliereId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sendReminderMutation = useSendReminders();

  // Build filters
  const filters: UnpaidFilters = useMemo(
    () => ({
      filiereId: filiereId || undefined,
      levelId: levelId || undefined,
      includeOverdue: overdueOnly || undefined,
      page,
      limit: 15,
    }),
    [filiereId, levelId, overdueOnly, page]
  );

  const { data, isLoading } = useUnpaidStudents(filters);
  const { data: filieres } = useFilieres();
  const { data: levels } = useLevels(filiereId || undefined);

  // Client-side search
  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    let result = data.data;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.studentName.toLowerCase().includes(q) ||
          u.studentNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data?.data, search]);

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((u) => u.studentId + ':' + u.trancheId)));
    }
  };

  const handleSendBulkReminders = () => {
    const studentIds = [...selectedIds].map((id) => id.split(':')[0]);
    const uniqueIds = [...new Set(studentIds)];
    sendReminderMutation.mutate(
      {
        studentIds: uniqueIds,
        channel: ['SMS'],
        includeOverdue: true,
      },
      {
        onSuccess: (result) => {
          toast.success(`${result.sentCount} rappel(s) envoyé(s), ${result.failedCount} échoué(s).`);
          setSelectedIds(new Set());
        },
        onError: () => {
          toast.error("Impossible d'envoyer les rappels.");
        },
      }
    );
  };

  const handleSendSingleReminder = (studentId: string) => {
    sendReminderMutation.mutate(
      {
        studentIds: [studentId],
        channel: ['SMS'],
      },
      {
        onSuccess: (result) => {
          toast.success(`${result.sentCount} rappel(s) envoyé(s).`);
        },
        onError: () => {
          toast.error("Impossible d'envoyer le rappel.");
        },
      }
    );
  };

  if (isLoading) return <UnpaidSkeleton />;

  return (
    <div className="space-y-4">
      {/* ─── Filters row ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou numéro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filiereId} onValueChange={(v) => { setFiliereId(v); setLevelId(''); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filière" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Toutes les filières</SelectItem>
            {filieres?.map((f: { id: string; name: string }) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={levelId} onValueChange={setLevelId}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Tous les niveaux</SelectItem>
            {levels?.map((l: { id: string; name: string }) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="overdue-toggle"
            checked={overdueOnly}
            onCheckedChange={setOverdueOnly}
          />
          <Label htmlFor="overdue-toggle" className="text-xs whitespace-nowrap cursor-pointer">
            Impayés en retard uniquement
          </Label>
        </div>
      </div>

      {/* ─── Results count + bulk action ─────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <Filter className="inline h-3.5 w-3.5 mr-1" />
          {pagination?.total ?? 0} résultat(s)
          {selectedIds.size > 0 && (
            <span className="ml-2 font-medium text-foreground">
              ({selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''})
            </span>
          )}
        </p>
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={handleSendBulkReminders}
            disabled={sendReminderMutation.isPending}
          >
            {sendReminderMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Envoyer rappel groupé ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* ─── Table ───────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filteredData.length > 0 && selectedIds.size === filteredData.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Étudiant</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Filière / Niveau
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">
                    Tranche
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">
                    Dû le
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">Montant dû</TableHead>
                  <TableHead className="text-xs font-semibold text-right hidden sm:table-cell">
                    Payé
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">Reste</TableHead>
                  <TableHead className="text-xs font-semibold hidden xl:table-cell">
                    Retard
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      Aucun impayé trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((u) => {
                    const rowId = u.studentId + ':' + u.trancheId;
                    return (
                      <TableRow key={rowId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(rowId)}
                            onCheckedChange={() => toggleSelect(rowId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{u.studentName}</p>
                            <p className="text-xs text-muted-foreground">{u.studentNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {u.filiereName || '—'}
                            {u.levelName ? ` / ${u.levelName}` : ''}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs">
                            T{u.trancheNumber} — {u.trancheName}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {u.dueDate
                              ? new Date(u.dueDate).toLocaleDateString('fr-FR')
                              : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {formatFCFA(u.amountDue)}
                        </TableCell>
                        <TableCell className="text-sm text-right text-emerald-700 hidden sm:table-cell">
                          {formatFCFA(u.amountPaid)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold text-red-700">
                          {formatFCFA(u.remaining)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {u.overdueDays !== null && u.overdueDays > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-700 border-red-200 text-xs"
                            >
                              {u.overdueDays}j
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{trancheStatusBadge(u.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs bg-[#8B1C2D] text-white border-[#8B1C2D] hover:bg-[#8B1C2D]/90"
                              title="Enregistrer paiement"
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              title="Envoyer rappel"
                              onClick={() => handleSendSingleReminder(u.studentId)}
                              disabled={sendReminderMutation.isPending}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Pagination ──────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
