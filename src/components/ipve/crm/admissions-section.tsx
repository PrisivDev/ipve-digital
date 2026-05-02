'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  Plus,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Check,
  X,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  useAdmissions,
  useAdmission,
  useCreateAdmission,
  useUpdateAdmissionStatus,
  useEnrollAdmission,
  useFilieres,
  useLevels,
} from '@/hooks/useAdmissions';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';

// ─── types ─────────────────────────────────────────────────
interface AdmissionRow {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  filiereName?: string | null;
  filiere?: { name: string } | null;
  levelName?: string | null;
  level?: { name: string } | null;
  status: string;
  createdAt: string;
}

// ─── badge helpers ─────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status) {
    case 'DRAFT':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          Brouillon
        </Badge>
      );
    case 'SUBMITTED':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Soumise
        </Badge>
      );
    case 'UNDER_REVIEW':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          En cours
        </Badge>
      );
    case 'ACCEPTED':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Acceptee
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Rejetee
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
          Annulee
        </Badge>
      );
    case 'ENROLLED':
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          Inscrite
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
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── admission form schema ─────────────────────────────────
const admissionFormSchema = z.object({
  firstName: z.string().min(2, 'Le prenom est requis (min. 2 car.)'),
  lastName: z.string().min(2, 'Le nom est requis (min. 2 car.)'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  nationality: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  filiereId: z.string().min(1, 'La filiere est requise'),
  levelId: z.string().min(1, 'Le niveau est requis'),
  previousSchool: z.string().optional(),
  previousDiploma: z.string().optional(),
  notes: z.string().optional(),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

// ─── AdmissionFormDialog ───────────────────────────────────
interface AdmissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AdmissionFormDialog({ open, onOpenChange }: AdmissionFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      nationality: 'Ivoirienne',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      filiereId: '',
      levelId: '',
      previousSchool: '',
      previousDiploma: '',
      notes: '',
    },
  });

  const filiereId = useWatch({ control, name: 'filiereId' });
  const { data: filieres } = useFilieres();
  const { data: levels } = useLevels(filiereId);
  const createAdmission = useCreateAdmission();

  const onSubmit = (data: AdmissionFormValues) => {
    createAdmission.mutate(data, {
      onSuccess: () => {
        toast.success('Admission creee avec succes !');
        reset();
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast.error(err.message ?? "Erreur lors de la creation de l'admission");
      },
    });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      reset();
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle admission</DialogTitle>
          <DialogDescription>
            Remplissez les informations du candidat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {/* Personal Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Informations personnelles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-firstName">Prenom *</Label>
                <Input
                  id="ad-firstName"
                  placeholder="Ex: Aminata"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-lastName">Nom *</Label>
                <Input
                  id="ad-lastName"
                  placeholder="Ex: Kone"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-dateOfBirth">Date de naissance</Label>
                <Input id="ad-dateOfBirth" type="date" {...register('dateOfBirth')} />
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select
                  value={watch('gender') || ''}
                  onValueChange={(v) => setValue('gender', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Masculin</SelectItem>
                    <SelectItem value="FEMALE">Feminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-nationality">Nationalite</Label>
                <Input
                  id="ad-nationality"
                  placeholder="Ex: Ivoirienne"
                  {...register('nationality')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-phone">Telephone</Label>
                <Input
                  id="ad-phone"
                  placeholder="Ex: +225 07 XX XX XX"
                  {...register('phone')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-email">Email</Label>
                <Input
                  id="ad-email"
                  type="email"
                  placeholder="email@exemple.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-address">Adresse</Label>
              <Input
                id="ad-address"
                placeholder="Ex: Cocody, Abidjan"
                {...register('address')}
              />
            </div>
          </div>

          <Separator />

          {/* Parent Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Informations du parent/tuteur
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-parentName">Nom du parent/tuteur</Label>
                <Input
                  id="ad-parentName"
                  placeholder="Ex: M. Kone Ibrahim"
                  {...register('parentName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-parentPhone">Telephone parent</Label>
                <Input
                  id="ad-parentPhone"
                  placeholder="+225 01 XX XX XX"
                  {...register('parentPhone')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-parentEmail">Email parent</Label>
              <Input
                id="ad-parentEmail"
                type="email"
                placeholder="parent@email.ci"
                {...register('parentEmail')}
              />
              {errors.parentEmail && (
                <p className="text-xs text-destructive">{errors.parentEmail.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Academic Choice */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Choix academique
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filiere *</Label>
                <Select
                  value={watch('filiereId') || ''}
                  onValueChange={(v) => {
                    setValue('filiereId', v);
                    setValue('levelId', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une filiere..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(filieres ?? []).map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.filiereId && (
                  <p className="text-xs text-destructive">{errors.filiereId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Niveau *</Label>
                <Select
                  value={watch('levelId') || ''}
                  onValueChange={(v) => setValue('levelId', v)}
                  disabled={!filiereId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels ?? []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.levelId && (
                  <p className="text-xs text-destructive">{errors.levelId.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-previousSchool">Ecole precedente</Label>
                <Input
                  id="ad-previousSchool"
                  placeholder="Ex: Lycee classique d'Abidjan"
                  {...register('previousSchool')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-previousDiploma">Diplome precedent</Label>
                <Input
                  id="ad-previousDiploma"
                  placeholder="Ex: BAC D"
                  {...register('previousDiploma')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="ad-notes">Notes</Label>
            <Textarea
              id="ad-notes"
              placeholder="Remarques ou informations supplementaires..."
              className="min-h-[80px]"
              {...register('notes')}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createAdmission.isPending}
              className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-2"
            >
              {createAdmission.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Creer l'admission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AdmissionDetailSheet ──────────────────────────────────
interface AdmissionDetailSheetProps {
  admissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AdmissionDetailSheet({
  admissionId,
  open,
  onOpenChange,
}: AdmissionDetailSheetProps) {
  const { data: admission, isLoading } = useAdmission(admissionId);
  const updateStatus = useUpdateAdmissionStatus();
  const enrollAdmission = useEnrollAdmission();

  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'reject' | 'enroll' | null;
  }>({ type: null });

  const handleStatusChange = (action: 'accept' | 'reject') => {
    if (!admissionId) return;
    const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    updateStatus.mutate(
      { id: admissionId, status },
      {
        onSuccess: () => {
          toast.success(
            action === 'accept'
              ? 'Admission acceptee avec succes'
              : 'Admission rejetee'
          );
          setConfirmAction({ type: null });
        },
        onError: (err: any) => {
          toast.error(err.message ?? 'Erreur lors du changement de statut');
        },
      }
    );
  };

  const handleEnroll = () => {
    if (!admissionId) return;
    enrollAdmission.mutate(
      { id: admissionId },
      {
        onSuccess: () => {
          toast.success('Candidat inscrit avec succes !');
          setConfirmAction({ type: null });
        },
        onError: (err: any) => {
          toast.error(err.message ?? "Erreur lors de l'inscription");
        },
      }
    );
  };

  const adm = admission;
  const canAccept = adm && ['SUBMITTED', 'UNDER_REVIEW'].includes(adm.status);
  const canReject = adm && ['SUBMITTED', 'UNDER_REVIEW'].includes(adm.status);
  const canEnroll = adm && adm.status === 'ACCEPTED';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : adm ? (
            <div className="space-y-6 pt-6">
              <SheetHeader>
                <SheetTitle>
                  Admission {adm.admissionNumber ?? adm.id}
                </SheetTitle>
                <SheetDescription>
                  Details de la demande d&apos;admission
                </SheetDescription>
              </SheetHeader>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Statut :</span>
                {getStatusBadge(adm.status)}
              </div>

              {/* Status Timeline */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">Historique</p>
                  <div className="space-y-3">
                    {adm.statusHistory && Array.isArray(adm.statusHistory) ? (
                      adm.statusHistory.map((h: any, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                              i === 0 ? 'bg-[#1B4F72]' : 'bg-muted-foreground/30'
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium">{h.status}</p>
                            <p className="text-xs text-muted-foreground">
                              {h.date ?? new Date().toLocaleDateString('fr-FR')}
                              {h.note ? ` — ${h.note}` : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full shrink-0 bg-[#1B4F72]" />
                        <div>
                          <p className="text-sm font-medium">{adm.status}</p>
                          <p className="text-xs text-muted-foreground">
                            {adm.createdAt
                              ? new Date(adm.createdAt).toLocaleDateString('fr-FR')
                              : new Date().toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Applicant Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium">Informations du candidat</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nom :</span>
                      <p className="font-medium">{adm.lastName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prenom :</span>
                      <p className="font-medium">{adm.firstName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telephone :</span>
                      <p className="font-medium">{adm.phone || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email :</span>
                      <p className="font-medium">{adm.email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date de naissance :</span>
                      <p className="font-medium">
                        {adm.dateOfBirth
                          ? new Date(adm.dateOfBirth).toLocaleDateString('fr-FR')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sexe :</span>
                      <p className="font-medium">
                        {adm.gender === 'MALE' ? 'Masculin' : adm.gender === 'FEMALE' ? 'Feminin' : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nationalite :</span>
                      <p className="font-medium">{adm.nationality || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adresse :</span>
                      <p className="font-medium">{adm.address || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parent Info */}
              {(adm.parentName || adm.parentPhone || adm.parentEmail) && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Parent / Tuteur</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nom :</span>
                        <p className="font-medium">{adm.parentName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Telephone :</span>
                        <p className="font-medium">{adm.parentPhone || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Email :</span>
                        <p className="font-medium">{adm.parentEmail || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Academic Choice */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium">Choix academique</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Filiere :</span>
                      <p className="font-medium">
                        {adm.filiere?.name ?? adm.filiereName ?? '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Niveau :</span>
                      <p className="font-medium">
                        {adm.level?.name ?? adm.levelName ?? '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ecole precedente :</span>
                      <p className="font-medium">{adm.previousSchool || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Diplome :</span>
                      <p className="font-medium">{adm.previousDiploma || '—'}</p>
                    </div>
                  </div>
                  {adm.notes && (
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Notes :</span>
                      <p className="text-sm mt-1">{adm.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {(canAccept || canReject || canEnroll) && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {canAccept && (
                      <Button
                        onClick={() => setConfirmAction({ type: 'accept' })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Accepter
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        onClick={() => setConfirmAction({ type: 'reject' })}
                        variant="destructive"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Rejeter
                      </Button>
                    )}
                    {canEnroll && (
                      <Button
                        onClick={() => setConfirmAction({ type: 'enroll' })}
                        className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Inscrire
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Admission non trouvee
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
              {confirmAction.type === 'accept' && 'Confirmer l\'acceptation'}
              {confirmAction.type === 'reject' && 'Confirmer le rejet'}
              {confirmAction.type === 'enroll' && 'Confirmer l\'inscription'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === 'accept' &&
                'Voulez-vous vraiment accepter cette demande d\'admission ?'}
              {confirmAction.type === 'reject' &&
                'Voulez-vous vraiment rejeter cette demande d\'admission ? Cette action est irreversible.'}
              {confirmAction.type === 'enroll' &&
                'Voulez-vous inscrire ce candidat et creer son dossier etudiant ?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction.type === 'accept') handleStatusChange('accept');
                else if (confirmAction.type === 'reject') handleStatusChange('reject');
                else if (confirmAction.type === 'enroll') handleEnroll();
              }}
              disabled={updateStatus.isPending || enrollAdmission.isPending}
            >
              {(updateStatus.isPending || enrollAdmission.isPending) && (
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
export function AdmissionsSection() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filiereFilter, setFiliereFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [detailAdmissionId, setDetailAdmissionId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter handlers that reset page
  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v);
    setPage(1);
  }, []);
  const handleFiliereChange = useCallback((v: string) => {
    setFiliereFilter(v);
    setPage(1);
  }, []);

  // Fetch admissions
  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      filiereId: filiereFilter !== 'all' ? filiereFilter : undefined,
      page,
      limit: pageSize,
    }),
    [debouncedSearch, statusFilter, filiereFilter, page, pageSize]
  );

  const { data, isLoading } = useAdmissions(filters);

  const admissions: AdmissionRow[] = data?.data ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };
  const counts = data?.counts;

  const handleViewDetail = useCallback((admissionId: string) => {
    setDetailAdmissionId(admissionId);
    setDetailOpen(true);
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
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{counts?.total ?? pagination.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-[#1B4F72]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">
                  {(counts?.draft ?? 0) + (counts?.submitted ?? 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Acceptees</p>
                <p className="text-2xl font-bold">{counts?.accepted ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rejetees</p>
                <p className="text-2xl font-bold">{counts?.rejected ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
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
            placeholder="Rechercher par nom, numero, telephone..."
            value={search}
            onChange={(e) => {
              handleSearchChange(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="DRAFT">Brouillon</SelectItem>
            <SelectItem value="SUBMITTED">Soumise</SelectItem>
            <SelectItem value="UNDER_REVIEW">En cours</SelectItem>
            <SelectItem value="ACCEPTED">Acceptee</SelectItem>
            <SelectItem value="REJECTED">Rejetee</SelectItem>
            <SelectItem value="CANCELLED">Annulee</SelectItem>
            <SelectItem value="ENROLLED">Inscrite</SelectItem>
          </SelectContent>
        </Select>

        {/* Filiere Filter */}
        <Select value={filiereFilter} onValueChange={handleFiliereChange}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Filiere" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les filieres</SelectItem>
            <SelectItem value="f1">Informatique (BTS)</SelectItem>
            <SelectItem value="f2">Gestion &amp; Commerce</SelectItem>
            <SelectItem value="f3">Marketing Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-2"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouvelle admission
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {isLoading
            ? 'Chargement...'
            : `${pagination.total} admission${pagination.total > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table View */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">N° Admission</TableHead>
                  <TableHead className="w-[200px]">Nom complet</TableHead>
                  <TableHead className="hidden md:table-cell">Tel</TableHead>
                  <TableHead className="hidden lg:table-cell">Filiere</TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : admissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileCheck className="h-10 w-10 opacity-30" />
                        <p className="font-medium">
                          Aucune admission trouvee
                        </p>
                        <p className="text-xs">
                          Essayez de modifier vos filtres ou votre recherche.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  admissions.map((a) => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() => handleViewDetail(a.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        {a.admissionNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {a.lastName} {a.firstName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {a.email ?? ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {a.phone ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {a.filiere?.name ?? a.filiereName ?? '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getStatusBadge(a.status)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(a.id);
                            }}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {a.status === 'ACCEPTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs gap-1 text-[#1B4F72] hover:text-[#1B4F72]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailAdmissionId(a.id);
                                setDetailOpen(true);
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Inscrire</span>
                            </Button>
                          )}
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

      {/* Detail Sheet */}
      <AdmissionDetailSheet
        admissionId={detailAdmissionId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* New Admission Form Dialog */}
      <AdmissionFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
