'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Phone,
  Mail,
  Users,
  Pencil,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Contact,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useParents,
  useUpdateParent,
  type Parent,
} from '@/hooks/useParents';

// ─── Helpers ───────────────────────────────────────────

function getInitials(name: string | null | undefined) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getStudentStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] px-1.5 py-0">
          Actif
        </Badge>
      );
    case 'ENROLLED':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] px-1.5 py-0">
          Inscrit
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 text-[10px] px-1.5 py-0">
          Suspendu
        </Badge>
      );
    case 'GRADUATED':
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 text-[10px] px-1.5 py-0">
          Diplome
        </Badge>
      );
    case 'DROPPED':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 text-[10px] px-1.5 py-0">
          Abandon
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
  }
}

// ─── Card Skeleton ─────────────────────────────────────

function ParentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Parent Edit Dialog ────────────────────────────────

function ParentEditDialog({
  parent,
  open,
  onOpenChange,
}: {
  parent: Parent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateParent = useUpdateParent();

  // Form state - initialized from parent on each open via key prop
  const [formName, setFormName] = useState(() => parent?.parentName ?? '');
  const [formPhone, setFormPhone] = useState(() => parent?.parentPhone ?? '');
  const [formEmail, setFormEmail] = useState(() => parent?.parentEmail ?? '');
  const [formEmergency, setFormEmergency] = useState(() => parent?.emergencyContact ?? '');

  const handleSubmit = useCallback(() => {
    if (!parent) return;
    if (!parent.parentPhone) {
      toast.error('Le numero de telephone est requis');
      return;
    }
    updateParent.mutate(
      {
        parentPhone: parent.parentPhone,
        parentName: formName.trim() || null,
        parentEmail: formEmail.trim() || null,
        emergencyContact: formEmergency.trim() || null,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Parent mis a jour avec succes (${result.updatedCount} enfant${result.updatedCount > 1 ? 's' : ''})`
          );
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const message =
            err && typeof err === 'object' && 'error' in err
              ? (err as { error: string }).error
              : 'Erreur lors de la mise a jour';
          toast.error(message);
        },
      }
    );
  }, [formName, formEmail, formEmergency, parent, updateParent, onOpenChange]);

  const isSaving = updateParent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Modifier le parent</DialogTitle>
          <DialogDescription>
            Les modifications seront appliquees a tous les enfants associes a ce parent.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nom du parent</Label>
            <Input
              id="edit-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nom complet du parent"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-phone">Telephone</Label>
            <Input
              id="edit-phone"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+225 XX XX XX XX"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Le telephone ne peut pas etre modifie (identifiant du parent).
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-emergency">Contact d&apos;urgence</Label>
            <Input
              id="edit-emergency"
              value={formEmergency}
              onChange={(e) => setFormEmergency(e.target.value)}
              placeholder="+225 XX XX XX XX"
            />
          </div>

          {parent && parent.children.length > 0 && (
            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm font-medium mb-2">
                {parent.childrenCount} enfant{parent.childrenCount > 1 ? 's' : ''} associe{parent.childrenCount > 1 ? 's' : ''} :
              </p>
              <ul className="space-y-1">
                {parent.children.map((c) => (
                  <li key={c.studentId} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground">{c.studentName}</span>
                    {c.filiere && (
                      <span className="text-muted-foreground">
                        — {c.filiere}{c.level ? ` (${c.level})` : ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            className="bg-[#8B1C2D] hover:bg-[#6B1422] text-white gap-2"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────

export function ParentsSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Edit dialog state
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [debouncedSearch, page, limit]
  );

  const { data, isLoading } = useParents(filters);

  const parents: Parent[] = data?.parents ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  };

  const totalPages = Math.max(1, pagination.totalPages);

  const handleEdit = useCallback((parent: Parent) => {
    setEditParent(parent);
    setEditOpen(true);
  }, []);

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
      {/* Search and count bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, telephone, email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {isLoading
            ? 'Chargement...'
            : `${pagination.total} parent${pagination.total > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Parents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <ParentCardSkeleton key={i} />)
        ) : parents.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-30" />
            <p className="font-medium">Aucun parent trouve</p>
            <p className="text-xs">Essayez de modifier votre recherche.</p>
          </div>
        ) : (
          parents.map((parent) => (
            <Card key={`${parent.parentPhone}-${parent.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-[#8B1C2D]/10 text-[#8B1C2D]">
                      {getInitials(parent.parentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name + Edit */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">
                        {parent.parentName || 'Nom non renseigne'}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => handleEdit(parent)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{parent.parentPhone}</span>
                      </div>
                      {parent.parentEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{parent.parentEmail}</span>
                        </div>
                      )}
                      {parent.emergencyContact && (
                        <div className="flex items-center gap-2">
                          <Contact className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{parent.emergencyContact}</span>
                        </div>
                      )}
                    </div>

                    {/* Children count badge */}
                    <div className="flex items-center gap-2 pt-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]">
                        {parent.childrenCount} enfant{parent.childrenCount > 1 ? 's' : ''} inscrit{parent.childrenCount > 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Children list */}
                    <div className="space-y-1.5 pt-1">
                      {parent.children.map((child) => (
                        <div
                          key={child.studentId}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-foreground font-medium">
                            {child.studentName}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {child.filiere && (
                              <span className="text-muted-foreground truncate max-w-[100px]">
                                {child.filiere}
                              </span>
                            )}
                            {getStudentStatusBadge(child.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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

      {/* Edit Dialog - key forces remount when parent changes */}
      <ParentEditDialog
        key={editParent?.parentPhone ?? 'none'}
        parent={editParent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
