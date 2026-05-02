'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Phone,
  Mail,
  BookOpen,
  Banknote,
  Plus,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTeachers, useCreateTeacher, type Teacher } from '@/hooks/useTeachers';

// ─── Helpers ──────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string) {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
}

function getContractBadge(type: string) {
  switch (type) {
    case 'CDI':
      return (
        <Badge className="bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]">
          CDI
        </Badge>
      );
    case 'CDD':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          CDD
        </Badge>
      );
    case 'INTERIM':
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
          Intérim
        </Badge>
      );
    case 'FREELANCE':
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          Freelance
        </Badge>
      );
    case 'STAGE':
      return (
        <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100">
          Stage
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

// ─── Skeleton Grid ────────────────────────────────────────────────────────

function TeachersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Teacher Form Dialog ──────────────────────────────────────────────────

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contractType: string;
  department: string;
  position: string;
  baseSalary: string;
  hireDate: string;
}

const INITIAL_FORM: TeacherFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  contractType: '',
  department: '',
  position: '',
  baseSalary: '',
  hireDate: '',
};

function TeacherFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createTeacher = useCreateTeacher();
  const [form, setForm] = useState<TeacherFormData>(INITIAL_FORM);

  const resetAndClose = useCallback(() => {
    setForm(INITIAL_FORM);
    onOpenChange(false);
  }, [onOpenChange]);

  const setField = (field: keyof TeacherFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('Veuillez remplir le prénom, le nom et l\'email.');
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.contractType) payload.contractType = form.contractType;
      if (form.department) payload.department = form.department;
      if (form.position.trim()) payload.position = form.position.trim();
      if (form.baseSalary) payload.baseSalary = Number(form.baseSalary);
      if (form.hireDate) payload.hireDate = form.hireDate;

      await createTeacher.mutateAsync(payload as any);
      toast.success('Enseignant créé avec succès.');
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.error || 'Erreur lors de la création.');
    }
  };

  const isSubmitting = createTeacher.isPending;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel enseignant</DialogTitle>
          <DialogDescription>
            Créez un compte enseignant avec un profil employé optionnel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Nom & Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                placeholder="Mamadou"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                placeholder="Kouyaté"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="m.kouyate@ipve.edu.ci"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                placeholder="+225 07 11 22 33"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Contract & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type de contrat</Label>
              <Select value={form.contractType} onValueChange={(v) => setField('contractType', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="INTERIM">Intérim</SelectItem>
                  <SelectItem value="FREELANCE">Freelance</SelectItem>
                  <SelectItem value="STAGE">Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Département</Label>
              <Select value={form.department} onValueChange={(v) => setField('department', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECTION">Direction</SelectItem>
                  <SelectItem value="ACADEMIQUE">Académique</SelectItem>
                  <SelectItem value="FINANCIER">Financier</SelectItem>
                  <SelectItem value="ADMINISTRATIF">Administratif</SelectItem>
                  <SelectItem value="INFORMATIQUE">Informatique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Poste</Label>
            <Input
              id="position"
              placeholder="Enseignant chercheur"
              value={form.position}
              onChange={(e) => setField('position', e.target.value)}
            />
          </div>

          {/* Salary & Hire Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="baseSalary">Salaire de base (FCFA)</Label>
              <Input
                id="baseSalary"
                type="number"
                placeholder="350000"
                value={form.baseSalary}
                onChange={(e) => setField('baseSalary', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Date d'embauche</Label>
              <Input
                id="hireDate"
                type="date"
                value={form.hireDate}
                onChange={(e) => setField('hireDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            className="bg-[#8B1C2D] hover:bg-[#6E1622] text-white"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
            Créer l'enseignant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Teacher Card ─────────────────────────────────────────────────────────

function TeacherCard({ teacher }: { teacher: Teacher }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-[#8B1C2D]/10 text-[#8B1C2D]">
              {getInitials(teacher.firstName, teacher.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">
                  {teacher.lastName} {teacher.firstName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {teacher.totalSubjects} matière{teacher.totalSubjects > 1 ? 's' : ''} · {teacher.totalHours}h/semaine
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {teacher.contract?.type && getContractBadge(teacher.contract.type)}
                <Badge
                  className={
                    teacher.isActive
                      ? 'bg-[oklch(0.93_0.02_155)] text-[oklch(0.35_0.08_155)] border-[oklch(0.85_0.03_155)] hover:bg-[oklch(0.93_0.02_155)]'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                >
                  {teacher.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              {teacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{teacher.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{teacher.email}</span>
              </div>
            </div>

            {teacher.subjects.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    Matières enseignées
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.slice(0, 5).map((subject) => (
                      <Badge key={subject.code} variant="outline" className="text-xs">
                        {subject.name}
                      </Badge>
                    ))}
                    {teacher.subjects.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.subjects.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {teacher.contract && (
              <>
                <Separator />
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {teacher.contract.baseSalary > 0 && (
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-foreground">
                        {Number(teacher.contract.baseSalary).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span>/mois</span>
                    </div>
                  )}
                  {teacher.contract.hireDate && (
                    <p>
                      Depuis le{' '}
                      {new Date(teacher.contract.hireDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────

export function TeachersSection() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, isError } = useTeachers({
    search,
    status: statusFilter,
  });

  const teachers = useMemo(() => data?.teachers ?? [], [data]);

  return (
    <div className="space-y-4">
      {/* Search & filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="bg-[#8B1C2D] hover:bg-[#6E1622] text-white"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </Button>
        </div>
      </div>

      {/* Count */}
      {!isLoading && !isError && (
        <p className="text-sm text-muted-foreground">
          {teachers.length} enseignant{teachers.length > 1 ? 's' : ''} trouvé{teachers.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Loading */}
      {isLoading && <TeachersSkeleton />}

      {/* Error */}
      {isError && (
        <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground">
          Erreur lors du chargement des enseignants. Veuillez réessayer.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && teachers.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
          <BookOpen className="h-8 w-8 opacity-40" />
          <p>Aucun enseignant trouvé.</p>
        </div>
      )}

      {/* Teacher cards */}
      {!isLoading && !isError && teachers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <TeacherFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
