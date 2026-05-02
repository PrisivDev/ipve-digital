'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  usePayments,
  usePayment,
  useCancelPayment,
} from '@/hooks/usePayments';
import {
  formatFCFA,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  getPaymentMethodIcon,
  type PaymentFilters,
  type PaymentStatus,
  type PaymentMethod,
  type PaymentListItem,
} from '@/types/payment.types';
import { ReceiptTemplate } from './ReceiptTemplate';
import { toast } from 'sonner';
import { usePaymentMethodOptions } from '@/hooks/usePayments';

// ─── Status badge ─────────────────────────────────────────
function statusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    PARTIALLY_REFUNDED: 'bg-blue-100 text-blue-700 border-blue-200',
    REFUNDED: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status] || ''}`}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Skeleton ─────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-full sm:w-40" />
        <Skeleton className="h-9 w-full sm:w-40" />
      </div>
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full border-b last:border-b-0" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────
export function PaymentHistoryView() {
  const methodOptions = usePaymentMethodOptions();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const cancelMutation = useCancelPayment();

  // Build filters
  const filters: PaymentFilters = useMemo(
    () => ({
      search: search || undefined,
      status: (statusFilter || undefined) as PaymentStatus | undefined,
      paymentMethod: (methodFilter || undefined) as PaymentMethod | undefined,
      page,
      limit: 15,
    }),
    [search, statusFilter, methodFilter, page]
  );

  const { data, isLoading } = usePayments(filters);
  const { data: paymentDetail } = usePayment(detailId);

  const filteredData = data?.data ?? [];

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const handleCancel = (id: string) => {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Le paiement a été annulé avec succès.');
        setDetailId(null);
      },
      onError: () => {
        toast.error("Impossible d'annuler ce paiement.");
      },
    });
  };

  if (isLoading) return <HistorySkeleton />;

  return (
    <div className="space-y-4">
      {/* ─── Filters ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par étudiant, reçu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Tous les statuts</SelectItem>
            {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Mode de paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Tous les modes</SelectItem>
            {methodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ─── Results count ───────────────────────────── */}
      <p className="text-sm text-muted-foreground">
        <Filter className="inline h-3.5 w-3.5 mr-1" />
        {pagination?.total ?? 0} paiement(s) trouvé(s)
      </p>

      {/* ─── Table ───────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Étudiant</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Tranche
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">
                    Mode
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">
                    N° Reçu
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((p: PaymentListItem) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{p.studentName}</p>
                          <p className="text-xs text-muted-foreground">{p.studentNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {p.trancheName}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-right whitespace-nowrap">
                        {formatFCFA(p.amountPaid)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span>{getPaymentMethodIcon(p.paymentMethod)}</span>
                          <span>{PAYMENT_METHOD_LABELS[p.paymentMethod]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                        {p.paymentNumber}
                      </TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDetailId(p.id)}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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

      {/* ─── Detail Dialog ───────────────────────────── */}
      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détail du paiement</DialogTitle>
          </DialogHeader>
          {paymentDetail && (
            <ReceiptTemplate
              payment={{
                ...paymentDetail,
                studentName: paymentDetail.studentName,
                studentNumber: paymentDetail.studentNumber,
                trancheName: paymentDetail.trancheName,
              }}
            />
          )}
          {paymentDetail && paymentDetail.status !== 'CANCELLED' && (
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleCancel(paymentDetail.id)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Annuler ce paiement
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
