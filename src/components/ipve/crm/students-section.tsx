'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Download,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useStudents,
  useFilieres,
  useLevels,
} from '@/hooks/useStudents';
import { StudentCard } from '@/components/students/StudentCard';
import { StudentDetailSheet } from '@/components/students/StudentDetailSheet';
import { StudentFormDialog } from '@/components/students/StudentFormDialog';
import { StudentEditDialog } from '@/components/students/StudentEditDialog';

// ─── types ─────────────────────────────────────────────────
type ViewMode = 'table' | 'grid';
type PaymentStatusLabel = 'up_to_date' | 'partial' | 'overdue';

interface StudentRow {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'M' | 'F';
  email?: string;
  phone?: string;
  filiereName?: string | null;
  filiere?: { name: string } | null;
  levelName?: string | null;
  level?: { name: string } | null;
  status: string;
  paymentStatus?: { label: string; status: PaymentStatusLabel } | null;
}

// ─── badge helpers ─────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Actif
        </Badge>
      );
    case 'ENROLLED':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Inscrit
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
          Suspendu
        </Badge>
      );
    case 'GRADUATED':
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          Diplome
        </Badge>
      );
    case 'DROPPED':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          Abandon
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentBadge(ps: { label: string; status: PaymentStatusLabel } | null | undefined) {
  if (!ps) return <span className="text-xs text-muted-foreground">—</span>;
  switch (ps.status) {
    case 'up_to_date':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          A jour
        </Badge>
      );
    case 'partial':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Partiel
        </Badge>
      );
    case 'overdue':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          En retard
        </Badge>
      );
  }
}

// ─── skeleton rows ─────────────────────────────────────────
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function GridSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex gap-1.5 mt-3">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

// ─── main component ────────────────────────────────────────
export function StudentsSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // ── Dynamic filter data from the database ──
  const { data: filieres = [], isLoading: filieresLoading } = useFilieres();
  const { data: levels = [], isLoading: levelsLoading } = useLevels(
    filiereFilter !== 'all' ? filiereFilter : undefined
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter handlers that reset page to 1
  const handleFiliereChange = useCallback((v: string) => {
    setFiliereFilter(v);
    setLevelFilter('all'); // reset level when filiere changes
    setPage(1);
  }, []);
  const handleLevelChange = useCallback((v: string) => {
    setLevelFilter(v);
    setPage(1);
  }, []);
  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v);
    setPage(1);
  }, []);

  // Fetch students
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      filiereId: filiereFilter !== 'all' ? filiereFilter : undefined,
      levelId: levelFilter !== 'all' ? levelFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      limit: pageSize,
    }),
    [debouncedSearch, filiereFilter, levelFilter, statusFilter, page, pageSize]
  );

  const { data, isLoading } = useStudents(filters);

  const students: StudentRow[] = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };

  // Handlers
  const handleViewDetail = useCallback((studentId: string) => {
    setDetailStudentId(studentId);
    setDetailOpen(true);
  }, []);

  const handleEditStudent = useCallback((studentId: string) => {
    setEditStudentId(studentId);
    setEditOpen(true);
  }, []);

  const totalPages = Math.max(1, pagination.totalPages);

  // Page numbers to display
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, matricule..."
            value={search}
            onChange={(e) => {
              handleSearchChange(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <Select value={filiereFilter} onValueChange={handleFiliereChange}>
          <SelectTrigger className="w-full sm:w-[170px]">
            {filieresLoading ? (
              <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement...
              </span>
            ) : (
              <SelectValue placeholder="Filiere" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les filieres</SelectItem>
            {filieres.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            {levelsLoading ? (
              <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement...
              </span>
            ) : (
              <SelectValue placeholder="Niveau" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="ENROLLED">Inscrit</SelectItem>
            <SelectItem value="SUSPENDED">Suspendu</SelectItem>
            <SelectItem value="GRADUATED">Diplome</SelectItem>
            <SelectItem value="DROPPED">Abandon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            className="bg-[#8B1C2D] hover:bg-[#6B1422] text-white gap-2"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 rounded-r-none"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 rounded-l-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Page size */}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          {/* Count */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {isLoading
              ? 'Chargement...'
              : `${pagination.total} etudiant${pagination.total > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">
                      Nom complet
                    </TableHead>
                    <TableHead className="w-[130px]">Numero</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Filiere
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Niveau
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Statut
                    </TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <GraduationCap className="h-10 w-10 opacity-30" />
                          <p className="font-medium">
                            Aucun etudiant trouve
                          </p>
                          <p className="text-xs">
                            Essayez de modifier vos filtres ou votre recherche.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => handleViewDetail(s.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback
                                className={`text-xs font-semibold ${
                                  s.gender === 'FEMALE' || s.gender === 'F'
                                    ? 'bg-pink-100 text-pink-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {`${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {s.lastName} {s.firstName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {s.email ?? ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.studentNumber}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {s.filiere?.name ?? s.filiereName ?? '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {s.level?.name ?? s.levelName ?? '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {getStatusBadge(s.status)}
                        </TableCell>
                        <TableCell>{getPaymentBadge(s.paymentStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(s.id);
                              }}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStudent(s.id);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <GridSkeleton />
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <GraduationCap className="h-10 w-10 opacity-30 mb-2" />
                <p className="font-medium">Aucun etudiant trouve</p>
                <p className="text-xs">
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {students.map((s) => (
                <StudentCard
                  key={s.id}
                  firstName={s.firstName}
                  lastName={s.lastName}
                  studentNumber={s.studentNumber}
                  gender={s.gender}
                  filiereName={s.filiere?.name ?? s.filiereName ?? null}
                  levelName={s.level?.name ?? s.levelName ?? null}
                  status={s.status}
                  paymentStatus={s.paymentStatus ?? null}
                  onClick={() => handleViewDetail(s.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

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
                  <span className="text-muted-foreground text-xs px-1">
                    ...
                  </span>
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
                  <span className="text-muted-foreground text-xs px-1">
                    ...
                  </span>
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

      {/* Detail Sheet */}
      <StudentDetailSheet
        studentId={detailStudentId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* New Student Form Dialog */}
      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} />

      {/* Edit Student Dialog */}
      {editStudentId && (
        <StudentEditDialog
          studentId={editStudentId}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
