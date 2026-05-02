'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Phone,
  Calendar,
  UserPlus,
  GraduationCap,
  Globe,
  LayoutDashboard,
  Columns3,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  useKanbanData,
  useCreateProspect,
  useUpdateProspectStatus,
} from '@/hooks/useProspects';
import {
  PROSPECT_STATUS_LABELS,
  PROSPECT_SOURCE_LABELS,
} from '@/types/prospect.types';
import type { ProspectSource, ProspectStatus } from '@/types/prospect.types';
import { CrmDashboard } from '@/components/crm/CrmDashboard';
import { ProspectDetailSheet } from '@/components/crm/ProspectDetailSheet';
import { ConversionModal } from '@/components/crm/ConversionModal';
import { useAppStore } from '@/store/app-store';

// ─── Status styles ───────────────────────────────────────

const statusBadgeStyles: Record<ProspectStatus, string> = {
  NOUVEAU: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
  CONTACTE: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100',
  INTERESSE: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  DOSSIER_RECU: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
  ADMIS: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  CONVERTI: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
  ABANDONNE: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
};

const statusColumnColors: Record<ProspectStatus, string> = {
  NOUVEAU: 'border-t-gray-400',
  CONTACTE: 'border-t-sky-500',
  INTERESSE: 'border-t-amber-500',
  DOSSIER_RECU: 'border-t-orange-500',
  ADMIS: 'border-t-emerald-500',
  CONVERTI: 'border-t-purple-500',
  ABANDONNE: 'border-t-red-500',
};

const sourceEntries = Object.entries(PROSPECT_SOURCE_LABELS) as [ProspectSource, string][];

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });

// ─── Add Prospect Dialog ──────────────────────────────────

function AddProspectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: 'OTHER' as ProspectSource,
    filiereInterest: '',
    notes: '',
  });
  const createMutation = useCreateProspect();

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast.error('Champs obligatoires: Prénom, nom et téléphone sont requis.');
      return;
    }
    createMutation.mutate(form, {
      onSuccess: () => {
        toast.success(`${form.firstName} ${form.lastName} a été ajouté au pipeline.`);
        onOpenChange(false);
        setForm({ firstName: '', lastName: '', phone: '', email: '', source: 'OTHER', filiereInterest: '', notes: '' });
      },
      onError: () => {
        toast.error("Impossible d'ajouter le prospect.");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau prospect</DialogTitle>
          <DialogDescription>Ajoutez un prospect dans le pipeline d'admissions.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pFirstName">Prénom *</Label>
              <Input id="pFirstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pLastName">Nom *</Label>
              <Input id="pLastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pPhone">Téléphone *</Label>
              <Input id="pPhone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 XX XX XX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pEmail">Email</Label>
              <Input id="pEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as ProspectSource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sourceEntries.map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filière visée</Label>
              <Input value={form.filiereInterest} onChange={(e) => setForm({ ...form, filiereInterest: e.target.value })} placeholder="Ex: Informatique" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informations supplémentaires..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Prospect Card ────────────────────────────────────────

function ProspectCard({ prospect, onClick, onQuickStatus }: { prospect: any; onClick: () => void; onQuickStatus: (id: string, status: ProspectStatus) => void }) {
  const daysSince = prospect.daysSinceContact;
  const showAlert = daysSince !== null && daysSince > 7;

  return (
    <Card
      className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(prospect.firstName, prospect.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {prospect.lastName} {prospect.firstName}
            </div>
          </div>
          {showAlert && (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" title={`${daysSince}j sans contact`} />
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{prospect.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3 shrink-0" />
            <span className="truncate">{prospect.filiereInterest ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">{PROSPECT_SOURCE_LABELS[prospect.source] ?? prospect.source}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{fmtDate(prospect.createdAt)}</span>
          </div>
        </div>

        {/* Quick status buttons for ADMIS column */}
        {prospect.status === 'ADMIS' && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="h-6 w-full text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              onClick={() => onQuickStatus(prospect.id, 'CONVERTI')}
            >
              <UserPlus className="h-3 w-3" />
              Convertir en étudiant
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Main Section ─────────────────────────────────────────

export function ProspectsSection() {
  const [view, setView] = useState<'pipeline' | 'dashboard'>('pipeline');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [convertProspect, setConvertProspect] = useState<any>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [filterSource, setFilterSource] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: kanbanData, isLoading: kanbanLoading } = useKanbanData(
    useMemo(
      () => ({
        search: debouncedSearch || undefined,
        source: (filterSource as ProspectSource) || undefined,
      }),
      [debouncedSearch, filterSource]
    )
  );

  const updateStatus = useUpdateProspectStatus();

  const columns = kanbanData?.data ?? kanbanData ?? [];

  const handleCardClick = (prospect: any) => {
    setSelectedId(prospect.id);
    setDetailOpen(true);
  };

  const handleQuickConvert = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
    // find the prospect data
    const prospect = columns
      .flatMap((c: any) => c.prospects)
      .find((p: any) => p.id === id);
    if (prospect) {
      setConvertProspect(prospect);
      setConvertOpen(true);
    }
  };

  const handleQuickStatus = (id: string, status: ProspectStatus) => {
    updateStatus.mutate(
      { id, status, notes: status === 'CONVERTI' ? 'Conversion rapide' : undefined },
      {
        onSuccess: () => {
          toast.success(status === 'CONVERTI' ? 'Prospect converti avec succès.' : `Statut passé à ${PROSPECT_STATUS_LABELS[status]}.`);
          if (status === 'CONVERTI') {
            setDetailOpen(false);
          }
        },
      }
    );
  };

  const handleConvertFromDetail = (prospect: any) => {
    setConvertProspect(prospect);
    setConvertOpen(true);
  };

  const totalProspects = columns.reduce((sum: number, c: any) => sum + c.count, 0);

  return (
    <div className="space-y-4">
      {/* Header with view toggle + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border bg-muted p-0.5">
            <Button
              variant={view === 'pipeline' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setView('pipeline')}
            >
              <Columns3 className="h-3 w-3" />
              Pipeline
            </Button>
            <Button
              variant={view === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setView('dashboard')}
            >
              <LayoutDashboard className="h-3 w-3" />
              Tableau de bord
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalProspects} prospect{totalProspects !== 1 ? 's' : ''}
          </p>
        </div>

        <AddProspectDialog open={addOpen} onOpenChange={setAddOpen} />
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un prospect</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* View content */}
      {view === 'dashboard' ? (
        <CrmDashboard />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone..."
                className="pl-8 h-8 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="h-8 w-full sm:w-[180px] text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                {sourceEntries.map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kanban Board */}
          {kanbanLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="rounded-lg border">
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-6" />
                  </div>
                  <Separator />
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
              {columns.map((column: any) => (
                <div key={column.status} className="flex flex-col min-w-0">
                  <div className={`rounded-lg border border-t-4 ${statusColumnColors[column.status as ProspectStatus]} bg-card`}>
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-semibold text-xs truncate">
                          {column.label}
                        </h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {column.count}
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <ScrollArea className="h-[420px]">
                      <div className="p-2 space-y-2">
                        {column.prospects.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground text-center py-6">
                            Aucun prospect
                          </p>
                        ) : (
                          column.prospects.map((prospect: any) => (
                            <ProspectCard
                              key={prospect.id}
                              prospect={prospect}
                              onClick={() => handleCardClick(prospect)}
                              onQuickStatus={handleQuickStatus}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Prospect Detail Sheet */}
      <ProspectDetailSheet
        prospectId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onConvert={handleConvertFromDetail}
      />

      {/* Conversion Modal */}
      <ConversionModal
        prospect={convertProspect}
        open={convertOpen}
        onOpenChange={setConvertOpen}
      />
    </div>
  );
}
