'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateStudent, useStudent, useFilieres, useLevels, useClasses } from '@/hooks/useStudents';
import { toast } from 'sonner';

// ─── schemas ───────────────────────────────────────────────
const step1Schema = z.object({
  firstName: z.string().min(2, 'Le prenom est requis (min. 2 car.)'),
  lastName: z.string().min(2, 'Le nom est requis (min. 2 car.)'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
});

const step2Schema = z.object({
  filiereId: z.string().optional(),
  levelId: z.string().optional(),
  classId: z.string().optional(),
});

const step3Schema = z.object({
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  emergencyContact: z.string().optional(),
  medicalNotes: z.string().optional(),
});

const step4Schema = z.object({
  scholarship: z.boolean().default(false),
  scholarshipPct: z.coerce.number().min(0).max(100).optional().or(z.literal(0)),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;
type Step4Values = z.infer<typeof step4Schema>;

interface FormValues extends Step1Values, Step2Values, Step3Values, Step4Values {}

const STEPS = [
  { id: 1, label: 'Informations personnelles' },
  { id: 2, label: 'Informations academiques' },
  { id: 3, label: 'Contacts' },
  { id: 4, label: 'Bourse' },
];

// ─── component ─────────────────────────────────────────────
interface StudentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function StudentEditDialog({
  open,
  onOpenChange,
  studentId,
}: StudentEditDialogProps) {
  const [step, setStep] = useState(1);

  const {
    register,
    control,
    formState: { errors },
    setValue,
    reset,
    trigger,
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(
      z.object({
        ...step1Schema.shape,
        ...step2Schema.shape,
        ...step3Schema.shape,
        ...step4Schema.shape,
      })
    ),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      address: '',
      filiereId: '',
      levelId: '',
      classId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      emergencyContact: '',
      medicalNotes: '',
      scholarship: false,
      scholarshipPct: 0,
      email: '',
    },
  });

  const filiereId = useWatch({ control, name: 'filiereId' });
  const scholarship = useWatch({ control, name: 'scholarship' });
  const levelId = useWatch({ control, name: 'levelId' });
  const watchGender = useWatch({ control, name: 'gender' });
  const watchFiliereId = useWatch({ control, name: 'filiereId' });
  const watchLevelId = useWatch({ control, name: 'levelId' });
  const watchClassId = useWatch({ control, name: 'classId' });

  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: filieres } = useFilieres();
  const { data: levels } = useLevels(filiereId);
  const { data: classes } = useClasses(levelId);
  const updateStudent = useUpdateStudent();

  // Pre-fill form when student data is loaded
  useEffect(() => {
    if (student && open) {
      const s = student;
      reset({
        firstName: s.firstName ?? '',
        lastName: s.lastName ?? '',
        dateOfBirth: s.dateOfBirth
          ? new Date(s.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: s.gender ?? '',
        nationality: s.nationality ?? 'Ivoirienne',
        address: s.address ?? '',
        filiereId: s.filiereId ?? s.filiere?.id ?? '',
        levelId: s.levelId ?? s.level?.id ?? '',
        classId: s.classId ?? '',
        parentName: s.parentName ?? '',
        parentPhone: s.parentPhone ?? '',
        parentEmail: s.parentEmail ?? '',
        emergencyContact: s.emergencyContact ?? '',
        medicalNotes: s.medicalNotes ?? '',
        scholarship: s.scholarship ?? false,
        scholarshipPct: s.scholarshipPct ?? 0,
        email: s.email ?? '',
      });
      setTimeout(() => setStep(1), 0);
    }
  }, [student, open, reset]);

  const canGoNext = async () => {
    let valid = false;
    if (step === 1) valid = await trigger(['firstName', 'lastName']);
    else if (step === 2) valid = true; // filiereId/levelId are optional for edits
    else if (step === 3) valid = true;
    else if (step === 4) valid = await trigger(['email']);
    return valid;
  };

  const handleNext = async () => {
    const valid = await canGoNext();
    if (valid && step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      // Navigate to first step with errors
      const firstErrorStep = Object.keys(errors)[0];
      const stepFields: Record<string, number> = {
        firstName: 1, lastName: 1, dateOfBirth: 1, gender: 1, nationality: 1, address: 1,
        filiereId: 2, levelId: 2, classId: 2,
        parentName: 3, parentPhone: 3, parentEmail: 3, emergencyContact: 3, medicalNotes: 3,
        scholarship: 4, scholarshipPct: 4, email: 4,
      };
      const errorStep = stepFields[firstErrorStep] ?? 1;
      if (errorStep !== step) setStep(errorStep);
      toast.error('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    const data = getValues();
    updateStudent.mutate(
      { id: studentId, data },
      {
        onSuccess: () => {
          toast.success('Etudiant modifie avec succes !');
          setStep(1);
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(
            err.message ?? "Erreur lors de la modification de l'etudiant"
          );
        },
      }
    );
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setStep(1);
    }
    onOpenChange(val);
  };

  if (studentLoading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;etudiant</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;etudiant en 4 etapes.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 py-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step === s.id
                      ? 'bg-[#1B4F72] text-white'
                      : step > s.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.id
                  )}
                </div>
                <span className="text-[10px] mt-1 text-center hidden sm:block leading-tight">
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mt-[-12px] transition-colors ${
                    step > s.id ? 'bg-emerald-500' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Separator />

        <form className="grid gap-4 py-2" onKeyDown={(e) => {
          // Prevent Enter key from submitting the form in multi-step wizard
          if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
            e.preventDefault();
          }
        }}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Informations personnelles
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Prenom *</Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Ex: Aminata"
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Nom *</Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Ex: Kone"
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth">Date de naissance</Label>
                  <Input
                    id="edit-dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select
                    value={watchGender || ''}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nationality">Nationalite</Label>
                  <Input
                    id="edit-nationality"
                    placeholder="Ex: Ivoirienne"
                    {...register('nationality')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Adresse</Label>
                  <Input
                    id="edit-address"
                    placeholder="Ex: Cocody, Abidjan"
                    {...register('address')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Info */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Informations academiques
              </p>
              <div className="space-y-2">
                <Label>Filiere *</Label>
                <Select
                  value={watchFiliereId || ''}
                  onValueChange={(v) => {
                    setValue('filiereId', v);
                    setValue('levelId', '');
                    setValue('classId', '');
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
                  <p className="text-xs text-destructive">
                    {errors.filiereId.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Niveau *</Label>
                  <Select
                    value={watchLevelId || ''}
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
                    <p className="text-xs text-destructive">
                      {errors.levelId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select
                    value={watchClassId || ''}
                    onValueChange={(v) => setValue('classId', v)}
                    disabled={!levelId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(classes ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contacts */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Contacts &amp; informations complementaires
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-parentName">Nom du parent/tuteur</Label>
                  <Input
                    id="edit-parentName"
                    placeholder="Ex: M. Kone Ibrahim"
                    {...register('parentName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-parentPhone">Telephone parent</Label>
                  <Input
                    id="edit-parentPhone"
                    placeholder="Ex: +225 07 XX XX XX"
                    {...register('parentPhone')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-parentEmail">Email parent</Label>
                  <Input
                    id="edit-parentEmail"
                    type="email"
                    placeholder="parent@email.ci"
                    {...register('parentEmail')}
                  />
                  {errors.parentEmail && (
                    <p className="text-xs text-destructive">
                      {errors.parentEmail.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyContact">
                    Contact d&apos;urgence
                  </Label>
                  <Input
                    id="edit-emergencyContact"
                    placeholder="+225 01 XX XX XX"
                    {...register('emergencyContact')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-medicalNotes">Notes medicales</Label>
                <Textarea
                  id="edit-medicalNotes"
                  placeholder="Allergies, traitements en cours..."
                  className="min-h-[80px]"
                  {...register('medicalNotes')}
                />
              </div>
            </div>
          )}

          {/* Step 4: Scholarship */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Bourse &amp; compte utilisateur
              </p>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-scholarship"
                  checked={scholarship}
                  onCheckedChange={(v) =>
                    setValue('scholarship', v === true, { shouldValidate: true })
                  }
                />
                <Label htmlFor="edit-scholarship" className="cursor-pointer">
                  Cet etudiant beneficie d&apos;une bourse
                </Label>
              </div>
              {scholarship && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="edit-scholarshipPct">
                    Pourcentage de bourse (%)
                  </Label>
                  <Input
                    id="edit-scholarshipPct"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Ex: 50"
                    {...register('scholarshipPct')}
                  />
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="edit-email">
                  Email pour le compte utilisateur
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="prenom.nom@etu.ipve.edu.ci"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Un compte sera cree automatiquement pour acceder au portail
                  etudiant.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
            )}
            <div className="flex-1" />
            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-1"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={updateStudent.isPending}
                className="bg-[#1B4F72] hover:bg-[#153A56] text-white gap-1"
              >
                {updateStudent.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Enregistrer
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
