'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  Plus,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Briefcase,
  Check,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  useEmployees,
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
  useDeactivateEmployee,
  type EmployeeListItem,
  type EmployeeDetail,
} from '@/hooks/useEmployees';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────

const DEPARTMENTS = [
  { value: 'DIRECTION', label: 'Direction' },
  { value: 'ACADEMIQUE', label: 'Academique' },
  { value: 'FINANCIER', label: 'Financier' },
  { value: 'ADMINISTRATIF', label: 'Administratif' },
  { value: 'INFORMATIQUE', label: 'Informatique' },
] as const;

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'INTERIM', label: 'Interim' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'STAGE', label: 'Stage' },
] as const;

const DEPARTMENT_LABELS: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.value, d.label])
);

const CONTRACT_LABELS: Record<string, string> = Object.fromEntries(
  CONTRACT_TYPES.map((c) => [c.value, c.label])
);

// ─── Helpers ────────────────────────────────────────────────

function formatSalary(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateString(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

// ─── Badge helpers ──────────────────────────────────────────

function getStatusBadge(isActive: boolean) {
  if (isActive) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        Actif
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
      Inactif
    </Badge>
  );
}

function getContractBadge(contractType: string) {
  switch (contractType) {
    case 'CDI':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
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
          Interim
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
        <Badge className="bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100">
          Stage
        </Badge>
      );
    default:
      return <Badge variant="outline">{contractType}</Badge>;
  }
}

// ─── Skeleton rows ──────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Form schema ────────────────────────────────────────────

const employeeFormSchema = z.object({
  firstName: z.string().min(2, 'Le prenom est requis (min. 2 car.)'),
  lastName: z.string().min(2, 'Le nom est requis (min. 2 car.)'),
  dateOfBirth: z.string().optional(),
  hireDate: z.string().min(1, "La date d'embauche est requise"),
  contractType: z.string().min(1, 'Le type de contrat est requis'),
  department: z.string().min(1, 'Le departement est requis'),
  position: z.string().optional(),
  baseSalary: z.coerce.number().min(0, 'Le salaire doit etre positif'),
  transportAllowance: z.coerce.number().min(0).optional(),
  housingAllowance: z.coerce.number().min(0).optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  cnpsNumber: z.string().optional(),
  taxId: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

const FORM_DEFAULTS: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  hireDate: '',
  contractType: '',
  department: '',
  position: '',
  baseSalary: 0,
  transportAllowance: 0,
  housingAllowance: 0,
  bankName: '',
  bankAccount: '',
  cnpsNumber: '',
  taxId: '',
};

// ─── EmployeeFormDialog ─────────────────────────────────────

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
}

function EmployeeFormDialog({ open, onOpenChange, editId }: EmployeeFormDialogProps) {
  const isEdit = !!editId;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    trigger,
    getValues,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const watchContractType = useWatch({ control, name: 'contractType' });
  const { data: existingEmployee, isLoading: employeeLoading } = useEmployee(editId ?? null);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  // Pre-fill form when editing
  useEffect(() => {
    if (existingEmployee?.data && open && isEdit) {
      const emp: EmployeeDetail = existingEmployee.data;
      reset({
        firstName: emp.firstName ?? '',
        lastName: emp.lastName ?? '',
        dateOfBirth: toDateString(emp.dateOfBirth),
        hireDate: toDateString(emp.hireDate),
        contractType: emp.contractType ?? '',
        department: emp.department ?? '',
        position: emp.position ?? '',
        baseSalary: emp.baseSalary ?? 0,
        transportAllowance: emp.transportAllowance ?? 0,
        housingAllowance: emp.housingAllowance ?? 0,
        bankName: emp.bankName ?? '',
        bankAccount: emp.bankAccount ?? '',
        cnpsNumber: emp.cnpsNumber ?? '',
        taxId: emp.taxId ?? '',
      });
    }
  }, [existingEmployee, open, isEdit, reset]);

  const onSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    const data = getValues();

    if (isEdit && editId) {
      updateEmployee.mutate(
        { id: editId, data },
        {
          onSuccess: () => {
            toast.success('Employe modifie avec succes !');
            reset(FORM_DEFAULTS);
            onOpenChange(false);
          },
          onError: (err: any) => {
            toast.error(err?.error ?? err?.message ?? "Erreur lors de la modification de l'employe");
          },
        }
      );
    } else {
      createEmployee.mutate(data, {
        onSuccess: () => {
          toast.success('Employe cree avec succes !');
          reset(FORM_DEFAULTS);
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.error ?? err?.message ?? "Erreur lors de la creation de l'employe");
        },
      });
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      reset(FORM_DEFAULTS);
    }
    onOpenChange(val);
  };

  const isPending = createEmployee.isPending || updateEmployee.isPending;

  // Loading skeleton for edit mode
  if (employeeLoading && open && isEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'employe" : 'Nouvel employe'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de l\'employe.'
              : 'Remplissez les informations du nouvel employe.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 py-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
        >
          {/* ── Section 1: Informations personnelles ── */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Informations personnelles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-firstName">Prenom *</Label>
                <Input
                  id="emp-firstName"
                  placeholder="Ex: Aminata"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-lastName">Nom *</Label>
                <Input
                  id="emp-lastName"
                  placeholder="Ex: Kone"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-dateOfBirth">Date de naissance</Label>
                <Input
                  id="emp-dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 2: Informations contractuelles ── */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Informations contractuelles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-hireDate">Date d&apos;embauche *</Label>
                <Input
                  id="emp-hireDate"
                  type="date"
                  {...register('hireDate')}
                />
                {errors.hireDate && (
                  <p className="text-xs text-destructive">{errors.hireDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Type de contrat *</Label>
                <Select
                  value={watchContractType || ''}
                  onValueChange={(v) => setValue('contractType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contractType && (
                  <p className="text-xs text-destructive">{errors.contractType.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departement *</Label>
                <Select
                  value={watch('department') || ''}
                  onValueChange={(v) => setValue('department', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-position">Poste</Label>
                <Input
                  id="emp-position"
                  placeholder="Ex: Enseignant, Comptable..."
                  {...register('position')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-baseSalary">Salaire de base (FCFA) *</Label>
                <Input
                  id="emp-baseSalary"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register('baseSalary')}
                />
                {errors.baseSalary && (
                  <p className="text-xs text-destructive">{errors.baseSalary.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-transport">Indemnite transport</Label>
                <Input
                  id="emp-transport"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register('transportAllowance')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-housing">Indemnite logement</Label>
                <Input
                  id="emp-housing"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register('housingAllowance')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 3: Informations bancaires ── */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Informations bancaires
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-bankName">Nom de la banque</Label>
                <Input
                  id="emp-bankName"
                  placeholder="Ex: BICICI, SIB..."
                  {...register('bankName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-bankAccount">Numero de compte</Label>
                <Input
                  id="emp-bankAccount"
                  placeholder="Ex: CI00 01234..."
                  {...register('bankAccount')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-cnps">Numero CNPS</Label>
                <Input
                  id="emp-cnps"
                  placeholder="Ex: 123456789"
                  {...register('cnpsNumber')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-taxId">Numero fiscal (IFU)</Label>
                <Input
                  id="emp-taxId"
                  placeholder="Ex: 0001234567A"
                  {...register('taxId')}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="bg-[#8B1C2D] hover:bg-[#6B1422] text-white gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Creer l\'employe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ─────────────────────────────────────────

export function EmployeesSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter handlers that reset page to 1
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);
  const handleDepartmentChange = useCallback((v: string) => {
    setDepartmentFilter(v);
    setPage(1);
  }, []);
  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v);
    setPage(1);
  }, []);

  // Fetch employees
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive') : undefined,
      page,
      limit: pageSize,
    }),
    [debouncedSearch, departmentFilter, statusFilter, page, pageSize]
  );

  const { data, isLoading } = useEmployees(filters);
  const deactivateEmployee = useDeactivateEmployee();

  const employees: EmployeeListItem[] = data?.data?.data ?? [];
  const pagination = data?.data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };

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

  // Handlers
  const handleCreate = useCallback(() => {
    setEditId(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((employeeId: string) => {
    setEditId(employeeId);
    setFormOpen(true);
  }, []);

  const handleToggleActive = useCallback(
    (emp: EmployeeListItem) => {
      if (emp.isActive) {
        deactivateEmployee.mutate(emp.id, {
          onSuccess: () => {
            toast.success('Employe desactive avec succes');
          },
          onError: (err: any) => {
            toast.error(err?.error ?? err?.message ?? 'Erreur lors de la desactivation');
          },
        });
      } else {
        // Reactivate: use update to set isActive = true, clear terminationDate
        toast.info('Pour reactiver un employe, utilisez la fonctionnalite de modification.');
      }
    },
    [deactivateEmployee]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, numero..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Department Filter */}
        <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Departement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les departements</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button
          className="bg-[#8B1C2D] hover:bg-[#6B1422] text-white gap-2"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4" />
          Nouvel employe
        </Button>

        <div className="flex items-center gap-3">
          {/* Page size */}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
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
              : `${pagination.total} employe${pagination.total > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">N° Employe</TableHead>
                  <TableHead className="w-[200px]">Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Departement</TableHead>
                  <TableHead className="hidden lg:table-cell">Poste</TableHead>
                  <TableHead className="hidden sm:table-cell">Contrat</TableHead>
                  <TableHead className="hidden md:table-cell">Salaire</TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-10 w-10 opacity-30" />
                        <p className="font-medium">Aucun employe trouve</p>
                        <p className="text-xs">
                          Essayez de modifier vos filtres ou votre recherche.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs">
                        {emp.employeeNumber}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {emp.lastName} {emp.firstName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {DEPARTMENT_LABELS[emp.department] ?? emp.department}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {emp.position ?? '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getContractBadge(emp.contractType)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatSalary(emp.baseSalary)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getStatusBadge(emp.isActive)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(emp.id)}
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              emp.isActive
                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            onClick={() => handleToggleActive(emp)}
                            disabled={deactivateEmployee.isPending}
                            title={emp.isActive ? 'Desactiver' : 'Activer'}
                          >
                            {emp.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
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

      {/* Form Dialog (create / edit) */}
      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editId}
      />
    </div>
  );
}
