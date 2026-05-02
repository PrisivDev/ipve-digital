'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  IdCard,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useStudentCards,
  useStudentCard,
  useGenerateStudentCard,
  useRenewStudentCard,
  useUpdateStudentCard,
} from '@/hooks/useStudentCards';
import { useStudents } from '@/hooks/useStudents';
import { StudentCardPrint } from '@/components/documents/StudentCardPrint';
import { toast } from 'sonner';

// ─── types ─────────────────────────────────────────────────
interface StudentCardRow {
  id: string;
  cardNumber: string;
  studentId: string;
  status: string;
  issueDate?: string;
  expiryDate?: string | null;
  printCount?: number;
  student?: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    photoUrl: string | null;
    filiereName: string | null;
    levelName: string | null;
    className: string | null;
  };
}

// ─── badge helpers ─────────────────────────────────────────
function getCardStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Active
        </Badge>
      );
    case 'LOST':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Perdue
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Expiree
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          Annulee
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── skeleton rows ─────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── NewCardDialog ─────────────────────────────────────────
interface NewCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NewCardDialog({ open, onOpenChange }: NewCardDialogProps) {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const { data: studentsData } = useStudents({
    search: studentSearch || undefined,
    limit: 20,
  });

  const students = studentsData?.data ?? [];
  const generateCard = useGenerateStudentCard();

  const handleSubmit = () => {
    if (!selectedStudentId) {
      toast.error('Veuillez selectionner un etudiant');
      return;
    }
    generateCard.mutate(
      {
        studentId: selectedStudentId,
        expiryDate: expiryDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Carte genere avec succes !');
          setSelectedStudentId('');
          setStudentSearch('');
          setExpiryDate('');
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.message ?? 'Erreur lors de la generation de la carte');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle carte</DialogTitle>
          <DialogDescription>
            Selectionnez un etudiant pour generer une carte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rechercher un etudiant</Label>
            <Input
              placeholder="Nom, matricule..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          {studentSearch && (
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {students.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucun etudiant trouve
                </div>
              ) : (
                students.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors border-b last:border-b-0 ${
                      selectedStudentId === s.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setStudentSearch('');
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-[#1B4F72]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {s.lastName} {s.firstName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.studentNumber}
                        {s.filiere?.name ? ` — ${s.filiere.name}` : ''}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedStudentId && !studentSearch && (
            <div className="flex items-center gap-3 p-3 border rounded-md bg-accent/50">
              <div className="h-8 w-8 rounded-full bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-[#1B4F72]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {students.find((s: any) => s.id === selectedStudentId)
                    ? `${students.find((s: any) => s.id === selectedStudentId).lastName} ${students.find((s: any) => s.id === selectedStudentId).firstName}`
                    : 'Etudiant selectionne'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {students.find((s: any) => s.id === selectedStudentId)?.studentNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setSelectedStudentId('')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="card-expiry">Date d&apos;expiration (optionnel)</Label>
            <Input
              id="card-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStudentId || generateCard.isPending}
            className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-2"
          >
            {generateCard.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generer la carte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CardPreviewSheet ──────────────────────────────────────
interface CardPreviewSheetProps {
  cardId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CardPreviewSheet({ cardId, open, onOpenChange }: CardPreviewSheetProps) {
  const { data: card, isLoading } = useStudentCard(cardId);
  const renewCard = useRenewStudentCard();
  const updateCard = useUpdateStudentCard();

  const [confirmAction, setConfirmAction] = useState<{
    type: 'renew' | 'cancel' | 'lost' | null;
  }>({ type: null });

  const c = card;

  const handleRenew = () => {
    if (!cardId) return;
    renewCard.mutate(
      { id: cardId },
      {
        onSuccess: () => {
          toast.success('Carte renouvelee avec succes !');
          setConfirmAction({ type: null });
        },
        onError: (err: any) => {
          toast.error(err.message ?? 'Erreur lors du renouvellement');
        },
      }
    );
  };

  const handleCancel = () => {
    if (!cardId) return;
    updateCard.mutate(
      { id: cardId, data: { status: 'CANCELLED' } },
      {
        onSuccess: () => {
          toast.success('Carte annulee');
          setConfirmAction({ type: null });
        },
        onError: (err: any) => {
          toast.error(err.message ?? 'Erreur');
        },
      }
    );
  };

  const handleMarkLost = () => {
    if (!cardId) return;
    updateCard.mutate(
      { id: cardId, data: { status: 'LOST' } },
      {
        onSuccess: () => {
          toast.success('Carte marquee comme perdue');
          setConfirmAction({ type: null });
        },
        onError: (err: any) => {
          toast.error(err.message ?? 'Erreur');
        },
      }
    );
  };

  const canRenew = c && ['LOST', 'EXPIRED'].includes(c.status);
  const canCancel = c && !['CANCELLED'].includes(c.status);
  const canMarkLost = c && c.status === 'ACTIVE';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </div>
          ) : c ? (
            <div className="space-y-6 pt-6">
              <SheetHeader>
                <SheetTitle>Carte {c.cardNumber ?? ''}</SheetTitle>
                <SheetDescription>
                  Apercu et gestion de la carte etudiant
                </SheetDescription>
              </SheetHeader>

              {/* Card Preview */}
              <div className="mx-auto w-full max-w-sm">
                <StudentCardPrint
                  student={{
                    firstName: c.student?.firstName ?? '',
                    lastName: c.student?.lastName ?? '',
                    studentNumber: c.student?.studentNumber ?? '',
                    dateOfBirth: null,
                    gender: c.student?.gender ?? '',
                    photoUrl: c.student?.photoUrl ?? null,
                    filiereName: c.student?.filiereName ?? null,
                    levelName: c.student?.levelName ?? null,
                    className: null,
                    enrollmentDate: null,
                  }}
                  status={c.status}
                  cardNumber={c.cardNumber}
                  showPrintButton={true}
                />
              </div>

              {/* Print Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Nombre d&apos;impressions : <span className="font-medium">{c.printCount ?? 0}</span>
                </span>
              </div>

              {/* Action Buttons */}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {canRenew && (
                  <Button
                    onClick={() => setConfirmAction({ type: 'renew' })}
                    className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renouveler
                  </Button>
                )}
                {canMarkLost && (
                  <Button
                    onClick={() => setConfirmAction({ type: 'lost' })}
                    variant="outline"
                    className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Marquer perdue
                  </Button>
                )}
                {canCancel && (
                  <Button
                    onClick={() => setConfirmAction({ type: 'cancel' })}
                    variant="outline"
                    className="gap-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Carte non trouvee
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirmAction.type !== null}
        onOpenChange={() => setConfirmAction({ type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === 'renew' && 'Renouveler la carte'}
              {confirmAction.type === 'cancel' && 'Annuler la carte'}
              {confirmAction.type === 'lost' && 'Marquer la carte comme perdue'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === 'renew' &&
                'Voulez-vous vraiment renouveler cette carte ? Une nouvelle carte sera generee.'}
              {confirmAction.type === 'cancel' &&
                'Voulez-vous vraiment annuler cette carte ? Cette action est irreversible.'}
              {confirmAction.type === 'lost' &&
                'Voulez-vous vraiment marquer cette carte comme perdue ?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction.type === 'renew') handleRenew();
                else if (confirmAction.type === 'cancel') handleCancel();
                else if (confirmAction.type === 'lost') handleMarkLost();
              }}
              disabled={renewCard.isPending || updateCard.isPending}
            >
              {(renewCard.isPending || updateCard.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── main component ────────────────────────────────────────
export function StudentCardsSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newCardOpen, setNewCardOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter handler
  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v);
    setPage(1);
  }, []);

  // Fetch cards
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: pageSize,
    }),
    [debouncedSearch, statusFilter, page, pageSize]
  );

  const { data, isLoading } = useStudentCards(filters);

  const cards: StudentCardRow[] = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };
  const counts = data?.counts;

  const handleViewCard = useCallback((cardId: string) => {
    setPreviewCardId(cardId);
    setPreviewOpen(true);
  }, []);

  const totalPages = Math.max(1, pagination.totalPages);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total cartes</p>
                <p className="text-2xl font-bold">{counts?.total ?? pagination.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center">
                <IdCard className="h-5 w-5 text-[#1B4F72]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold">{counts?.active ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <IdCard className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Perdues</p>
                <p className="text-2xl font-bold">{counts?.lost ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expirees</p>
                <p className="text-2xl font-bold">{counts?.expired ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <IdCard className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou numero de carte..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="LOST">Perdue</SelectItem>
            <SelectItem value="EXPIRED">Expiree</SelectItem>
            <SelectItem value="CANCELLED">Annulee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-2"
            onClick={() => setNewCardOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouvelle carte
          </Button>
        </div>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {isLoading
            ? 'Chargement...'
            : `${pagination.total} carte${pagination.total > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">N° Carte</TableHead>
                  <TableHead className="w-[200px]">Etudiant</TableHead>
                  <TableHead className="hidden md:table-cell">Filiere</TableHead>
                  <TableHead className="hidden lg:table-cell">Niveau</TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Emise le</TableHead>
                  <TableHead className="hidden md:table-cell">Expire le</TableHead>
                  <TableHead className="hidden lg:table-cell">Impression</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : cards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <IdCard className="h-10 w-10 opacity-30" />
                        <p className="font-medium">
                          Aucune carte trouvee
                        </p>
                        <p className="text-xs">
                          Essayez de modifier vos filtres ou votre recherche.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cards.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => handleViewCard(c.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        {c.cardNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {c.student
                              ? `${c.student.lastName} ${c.student.firstName}`
                              : '—'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {c.student?.studentNumber ?? ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {c.student?.filiereName ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {c.student?.levelName ?? '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getCardStatusBadge(c.status)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {c.issueDate
                          ? new Date(c.issueDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {c.printCount ?? 0}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCard(c.id);
                          }}
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

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers[0] > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-xs"
                  onClick={() => setPage(1)}
                >
                  1
                </Button>
                {pageNumbers[0] > 2 && (
                  <span className="text-muted-foreground text-xs px-1">...</span>
                )}
              </>
            )}

            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="text-muted-foreground text-xs px-1">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-xs"
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Card Preview Sheet */}
      <CardPreviewSheet
        cardId={previewCardId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* New Card Dialog */}
      <NewCardDialog open={newCardOpen} onOpenChange={setNewCardOpen} />
    </div>
  );
}


