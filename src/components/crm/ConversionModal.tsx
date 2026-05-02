'use client';

import { useMemo, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { UserCheck, Loader2, GraduationCap, BookOpen, School, CheckCircle2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useConvertProspect } from '@/hooks/useProspects';
import { toast } from 'sonner';

// ─── Static data ─────────────────────────────────────────────────────────────

interface FiliereOption {
  id: string;
  label: string;
  type: 'BTS' | 'Licence';
}

const FILIERES: FiliereOption[] = [
  { id: 'informatique-bts', label: 'Informatique (BTS)', type: 'BTS' },
  { id: 'gestion-commerce-lic', label: 'Gestion & Commerce (Licence)', type: 'Licence' },
  { id: 'marketing-digital-lic', label: 'Marketing Digital (Licence)', type: 'Licence' },
  { id: 'comptabilite-gestion-bts', label: 'Comptabilité & Gestion (BTS)', type: 'BTS' },
  { id: 'communication-lic', label: 'Communication (Licence)', type: 'Licence' },
  { id: 'reseaux-securite-bts', label: 'Réseaux & Sécurité (BTS)', type: 'BTS' },
];

const LEVELS_BY_TYPE: Record<'BTS' | 'Licence', { id: string; label: string }[]> = {
  BTS: [
    { id: 'bts-1', label: 'BTS 1' },
    { id: 'bts-2', label: 'BTS 2' },
  ],
  Licence: [
    { id: 'lic-1', label: 'Licence 1' },
    { id: 'lic-2', label: 'Licence 2' },
    { id: 'lic-3', label: 'Licence 3' },
  ],
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConversionModalProps {
  prospect: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    filiereInterest: string | null;
    levelInterest: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConversionFormValues {
  filiereId: string;
  levelId: string;
  classId: string;
  scholarship: boolean;
  scholarshipPct: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConversionModal({ prospect, open, onOpenChange }: ConversionModalProps) {
  const convertMutation = useConvertProspect();

  const form = useForm<ConversionFormValues>({
    defaultValues: {
      filiereId: '',
      levelId: '',
      classId: '',
      scholarship: false,
      scholarshipPct: '',
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = form;

  const watchedFiliereId = useWatch({ control, name: 'filiereId' });
  const watchedScholarship = useWatch({ control, name: 'scholarship' });
  const watchedLevelId = useWatch({ control, name: 'levelId' });
  const watchedClassId = useWatch({ control, name: 'classId' });
  const watchedScholarshipPct = useWatch({ control, name: 'scholarshipPct' });

  // Pre-fill form when prospect changes
  useEffect(() => {
    if (prospect && open) {
      reset({
        filiereId: '',
        levelId: '',
        classId: '',
        scholarship: false,
        scholarshipPct: '',
      });

      // Try to match prospect's filiereInterest to a static option
      if (prospect.filiereInterest) {
        const match = FILIERES.find(
          (f) =>
            f.label.toLowerCase().includes(prospect.filiereInterest!.toLowerCase()) ||
            f.id.toLowerCase().includes(prospect.filiereInterest!.toLowerCase())
        );
        if (match) {
          setValue('filiereId', match.id);
        }
      }

      // Try to match prospect's levelInterest to a level option
      if (prospect.levelInterest && watchedFiliereId) {
        const filiere = FILIERES.find((f) => f.id === watchedFiliereId);
        if (filiere) {
          const levels = LEVELS_BY_TYPE[filiere.type];
          const match = levels.find(
            (l) =>
              l.label.toLowerCase().includes(prospect.levelInterest!.toLowerCase()) ||
              l.id.toLowerCase().includes(prospect.levelInterest!.toLowerCase())
          );
          if (match) {
            setValue('levelId', match.id);
          }
        }
      }
    }
  }, [prospect, open, reset, setValue, watchedFiliereId]);

  // Reset level when filière changes
  useEffect(() => {
    setValue('levelId', '');
  }, [watchedFiliereId, setValue]);

  // Derive available levels from selected filière
  const availableLevels = useMemo(() => {
    if (!watchedFiliereId) return [];
    const filiere = FILIERES.find((f) => f.id === watchedFiliereId);
    if (!filiere) return [];
    return LEVELS_BY_TYPE[filiere.type];
  }, [watchedFiliereId]);

  // Derive labels for the recap section
  const selectedFiliere = useMemo(
    () => FILIERES.find((f) => f.id === watchedFiliereId),
    [watchedFiliereId]
  );
  const selectedLevel = useMemo(
    () => availableLevels.find((l) => l.id === watchedLevelId),
    [availableLevels, watchedLevelId]
  );

  const isSubmitting = convertMutation.isPending;

  const handleConvert = (data: ConversionFormValues) => {
    if (!prospect) return;

    convertMutation.mutate(
      {
        id: prospect.id,
        studentData: {
          filiereId: data.filiereId,
          levelId: data.levelId,
          classId: data.classId,
          scholarship: data.scholarship,
          scholarshipPct: data.scholarship ? Number(data.scholarshipPct) || 0 : undefined,
        },
      },
      {
        onSuccess: (response) => {
          const studentNumber = response?.studentNumber ?? 'Nouveau';
          toast.success(`Conversion réussie: L'étudiant ${studentNumber} a été créé avec succès.`);
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const message =
            error && typeof error === 'object' && 'message' in error
              ? (error as { message: string }).message
              : 'Une erreur est survenue lors de la conversion.';
          toast.error(`Erreur de conversion: ${message}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {/* ── Header ─────────────────────────────────────────── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <UserCheck className="h-4 w-4" />
            </div>
            Convertir en étudiant
          </DialogTitle>
          <DialogDescription>
            Confirmez et complétez les informations pour inscrire{' '}
            <span className="font-medium text-foreground">
              {prospect ? `${prospect.firstName} ${prospect.lastName}` : 'ce candidat'}
            </span>{' '}
            en tant qu'étudiant.
          </DialogDescription>
        </DialogHeader>

        {/* ── Summary card (read-only prospect info) ──────────── */}
        <Card className="border-2 border-dashed border-muted-foreground/25 py-4">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Informations du candidat
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">
                ADMIS
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryField
                icon={<UserCheck className="h-3.5 w-3.5" />}
                label="Nom complet"
                value={
                  prospect
                    ? `${prospect.firstName} ${prospect.lastName}`
                    : '—'
                }
              />
              <SummaryField
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Téléphone"
                value={prospect?.phone ?? '—'}
              />
              <SummaryField
                icon={<GraduationCap className="h-3.5 w-3.5" />}
                label="Email"
                value={prospect?.email ?? 'Non renseigné'}
              />
              <SummaryField
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Filière visée"
                value={prospect?.filiereInterest ?? 'Non renseigné'}
              />
              <SummaryField
                icon={<School className="h-3.5 w-3.5" />}
                label="Niveau visé"
                value={prospect?.levelInterest ?? 'Non renseigné'}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* ── Conversion form ─────────────────────────────────── */}
        <Form {...form}>
          <form id="conversion-form" onSubmit={handleSubmit(handleConvert)}>
            <div className="grid gap-4">
              {/* Filière */}
              <FormField
                control={control}
                name="filiereId"
                rules={{ required: 'Veuillez sélectionner une filière' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <GraduationCap className="mr-1.5 inline h-4 w-4 text-muted-foreground" />
                      Filière
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner une filière" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FILIERES.map((filiere) => (
                          <SelectItem key={filiere.id} value={filiere.id}>
                            {filiere.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Niveau */}
              <FormField
                control={control}
                name="levelId"
                rules={{ required: 'Veuillez sélectionner un niveau' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <BookOpen className="mr-1.5 inline h-4 w-4 text-muted-foreground" />
                      Niveau
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || availableLevels.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !watchedFiliereId
                                ? 'Sélectionnez d\'abord une filière'
                                : 'Sélectionner un niveau'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Classe */}
              <FormField
                control={control}
                name="classId"
                rules={{ required: 'Veuillez renseigner la classe' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <School className="mr-1.5 inline h-4 w-4 text-muted-foreground" />
                      Classe
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: INFO-BTS1-A"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bourse toggle */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Bourse / Réduction
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Activer si l'étudiant bénéficie d'une bourse ou réduction
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="scholarship"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>

                {/* Scholarship percentage */}
                {watchedScholarship && (
                  <div className="mt-3">
                    <FormField
                      control={control}
                      name="scholarshipPct"
                      rules={{
                        required: 'Veuillez indiquer le pourcentage',
                        validate: (val) => {
                          const num = Number(val);
                          if (isNaN(num) || num < 1 || num > 100) {
                            return 'Le pourcentage doit être entre 1 et 100';
                          }
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-3">
                            <FormControl>
                              <div className="relative flex-1">
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  max={100}
                                  placeholder="50"
                                  className="pr-8"
                                  disabled={isSubmitting}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>

        <Separator />

        {/* ── Recap section ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Récapitulatif de l'inscription
          </div>

          <div className="rounded-lg border bg-muted/20">
            <div className="divide-y">
              <RecapRow label="Étudiant" value={prospect ? `${prospect.firstName} ${prospect.lastName}` : '—'} />
              <RecapRow
                label="Filière"
                value={selectedFiliere?.label ?? '—'}
              />
              <RecapRow
                label="Niveau"
                value={selectedLevel?.label ?? '—'}
              />
              <RecapRow
                label="Classe"
                value={watchedClassId || '—'}
              />
              <RecapRow
                label="Bourse"
                value={
                  watchedScholarship
                    ? `${watchedScholarshipPct || 0}% de réduction`
                    : 'Aucune'
                }
                highlight={watchedScholarship}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="conversion-form"
            className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conversion en cours…
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Confirmer la conversion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function RecapRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? 'font-semibold text-emerald-700'
            : 'font-medium text-foreground'
        }
      >
        {value}
      </span>
    </div>
  );
}

export default ConversionModal;
