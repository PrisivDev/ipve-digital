'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  User,
  CreditCard,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useStudentPaymentStatus,
  useRecordPayment,
  useStudentSearch,
  usePaymentMethodOptions,
} from '@/hooks/usePayments';
import {
  formatFCFA,
  TRANCHE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getPaymentMethodIcon,
  type PaymentMethod,
  type TrancheStatus,
  type TrancheSummary,
  type PaymentDetail,
  type PaymentAllocation,
} from '@/types/payment.types';
import { ReceiptTemplate } from './ReceiptTemplate';
import { toast } from 'sonner';

// ─── Status badge for tranches ────────────────────────────
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

// ─── Allocation calculator ────────────────────────────────
function computeAllocation(
  amount: number,
  tranches: TrancheSummary[]
): PaymentAllocation[] {
  if (!tranches.length || amount <= 0) return [];
  const result: PaymentAllocation[] = [];
  let remaining = amount;
  for (const t of tranches) {
    if (remaining <= 0) break;
    if (t.status === 'PAYÉ') continue;
    const toAllocate = Math.min(remaining, t.remaining);
    result.push({
      trancheId: t.trancheId,
      trancheName: t.trancheName,
      trancheNumber: t.trancheNumber,
      amountDue: t.remaining,
      amountAllocated: toAllocate,
      fullyCovered: toAllocate >= t.remaining,
    });
    remaining -= toAllocate;
  }
  return result;
}

// ─── Component ────────────────────────────────────────────
export function RecordPaymentView() {
  const methodOptions = usePaymentMethodOptions();

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Receipt dialog
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [recordedPayment, setRecordedPayment] = useState<PaymentDetail | null>(null);

  // Queries
  const { data: searchResults, isLoading: searchLoading } = useStudentSearch(searchQuery);
  const { data: studentStatus, isLoading: statusLoading } = useStudentPaymentStatus(
    selectedStudentId
  );
  const recordMutation = useRecordPayment();

  // Find next tranche to pay
  const nextTranche = useMemo(() => {
    if (!studentStatus?.tranches) return null;
    return (
      studentStatus.tranches.find(
        (t) => t.status !== 'PAYÉ' && t.remaining > 0
      ) || null
    );
  }, [studentStatus]);

  // Allocation preview
  const allocation = useMemo(() => {
    if (!studentStatus?.tranches || !amount) return [];
    return computeAllocation(Number(amount), studentStatus.tranches);
  }, [studentStatus, amount]);

  const totalAllocated = useMemo(
    () => allocation.reduce((s, a) => s + a.amountAllocated, 0),
    [allocation]
  );

  // Handlers
  const handleSelectStudent = useCallback(
    (id: string, name: string) => {
      setSelectedStudentId(id);
      setSelectedStudentName(name);
      setPopoverOpen(false);
      setSearchQuery('');
      setAmount('');
      // Suggest remaining of next tranche — will be computed once status loads
    },
    []
  );

  const handleSubmit = () => {
    if (!selectedStudentId || !amount || Number(amount) <= 0) {
      toast.error('Champs requis: Veuillez sélectionner un étudiant et saisir un montant.');
      return;
    }

    const payload = {
      studentId: selectedStudentId,
      trancheId: nextTranche?.trancheId,
      amountPaid: Number(amount),
      paymentDate: payDate,
      paymentMethod: method,
      referenceNumber: reference || undefined,
      notes: notes || undefined,
    };

    recordMutation.mutate(payload, {
      onSuccess: (data: PaymentDetail) => {
        toast.success(`Paiement enregistré: Paiement de ${formatFCFA(data.amountPaid)} pour ${data.studentName}`);
        setRecordedPayment(data);
        setReceiptOpen(true);
        // Reset form
        setSelectedStudentId(null);
        setSelectedStudentName('');
        setAmount('');
        setReference('');
        setNotes('');
      },
      onError: (err: any) => {
        toast.error(err.message || "Impossible d'enregistrer le paiement.");
      },
    });
  };

  const handleSuggestAmount = () => {
    if (nextTranche) {
      setAmount(String(nextTranche.remaining));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ─── Student Search ─────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" />
            Rechercher un étudiant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom ou numéro étudiant..."
                  value={selectedStudentName || searchQuery}
                  onChange={(e) => {
                    if (!selectedStudentId) setSearchQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (selectedStudentId) {
                      setSelectedStudentId(null);
                      setSelectedStudentName('');
                    }
                    setPopoverOpen(true);
                  }}
                  className="pl-9"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
              {searchLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults?.data?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun résultat
                </p>
              ) : (
                searchResults?.data?.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s.id, s.studentName)}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.studentNumber}
                        {s.filiereName ? ` · ${s.filiereName}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* ─── Student Info + Financial Status ────────────── */}
      {selectedStudentId && (
        <div className="space-y-4">
          {/* Student info card */}
          <Card className="border-border/50 shadow-sm bg-gradient-to-r from-[#8B1C2D]/5 to-transparent">
            <CardContent className="p-4">
              {statusLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : studentStatus ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base">{studentStatus.studentName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {studentStatus.studentNumber}
                      {studentStatus.filiereName && studentStatus.levelName
                        ? ` · ${studentStatus.filiereName} — ${studentStatus.levelName}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total dû</span>
                      <p className="font-bold">{formatFCFA(studentStatus.totalDue)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payé</span>
                      <p className="font-bold text-emerald-700">
                        {formatFCFA(studentStatus.totalPaid)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reste</span>
                      <p className="font-bold text-red-700">
                        {formatFCFA(studentStatus.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Tranches table */}
          {studentStatus?.tranches && studentStatus.tranches.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold">
                  Situation financière — Tranches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">N°</TableHead>
                        <TableHead className="text-xs">Nom</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Dû le</TableHead>
                        <TableHead className="text-xs text-right">Montant</TableHead>
                        <TableHead className="text-xs text-right">Payé</TableHead>
                        <TableHead className="text-xs text-right">Reste</TableHead>
                        <TableHead className="text-xs">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentStatus.tranches.map((t) => (
                        <TableRow
                          key={t.trancheId}
                          className={
                            nextTranche?.trancheId === t.trancheId
                              ? 'bg-amber-50/50'
                              : ''
                          }
                        >
                          <TableCell className="text-xs font-medium">{t.trancheNumber}</TableCell>
                          <TableCell className="text-xs">
                            {t.trancheName}
                            {nextTranche?.trancheId === t.trancheId && (
                              <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                                Prochaine
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {t.dueDate
                              ? new Date(t.dueDate).toLocaleDateString('fr-FR')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {formatFCFA(t.amountDue)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-emerald-700">
                            {formatFCFA(t.amountPaid)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">
                            {formatFCFA(t.remaining)}
                          </TableCell>
                          <TableCell>{trancheStatusBadge(t.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Payment Form ───────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Enregistrer un paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Montant à encaisser (FCFA)</Label>
              <div className="flex gap-2">
                <Input
                  id="pay-amount"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                {nextTranche && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 whitespace-nowrap"
                    onClick={handleSuggestAmount}
                  >
                    {formatFCFA(nextTranche.remaining)}
                  </Button>
                )}
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="pay-ref">Référence (optionnel)</Label>
              <Input
                id="pay-ref"
                placeholder="Numéro transaction mobile money"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="pay-date">Date</Label>
              <Input
                id="pay-date"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes (optionnel)</Label>
            <Textarea
              id="pay-notes"
              placeholder="Notes additionnelles..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Allocation preview */}
          {allocation.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Affectation prévue
              </p>
              <div className="space-y-1.5">
                {allocation.map((a) => (
                  <div key={a.trancheId} className="flex items-center justify-between text-sm">
                    <span>
                      Tranche {a.trancheNumber} ({a.trancheName})
                      {a.fullyCovered ? (
                        <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600 ml-1" />
                      ) : null}
                    </span>
                    <span className="font-medium">
                      {formatFCFA(a.amountAllocated)}
                      {!a.fullyCovered && (
                        <span className="text-muted-foreground">
                          {' '}sur {formatFCFA(a.amountDue)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {totalAllocated < Number(amount) && (
                <p className="text-xs text-amber-600 font-medium mt-2">
                  ⚠️ Excédent de {formatFCFA(Number(amount) - totalAllocated)} non affecté
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedStudentId || !amount || recordMutation.isPending}
            className="w-full sm:w-auto bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"
          >
            {recordMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Enregistrer le paiement
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ─── Receipt Dialog ─────────────────────────────── */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Reçu de paiement
            </DialogTitle>
          </DialogHeader>
          {recordedPayment && (
            <ReceiptTemplate
              payment={{
                ...recordedPayment,
                studentName: recordedPayment.studentName,
                studentNumber: recordedPayment.studentNumber,
                trancheName: recordedPayment.trancheName,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
