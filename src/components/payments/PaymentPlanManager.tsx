'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  usePaymentPlans,
  useCreatePaymentPlan,
} from '@/hooks/usePayments';
import { useFilieres, useLevels } from '@/hooks/useStudents';
import {
  formatFCFA,
  type CreateTrancheDto,
} from '@/types/payment.types';
import { toast } from 'sonner';

// ─── Tranche row in the form ─────────────────────────────
interface TrancheRow {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  isMandatory: boolean;
}

function createEmptyTranche(num: number): TrancheRow {
  return {
    id: `new-${num}-${Date.now()}`,
    name: `Tranche ${num}`,
    amount: '',
    dueDate: '',
    isMandatory: true,
  };
}

// ─── Skeleton ─────────────────────────────────────────────
function PlansSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardContent className="p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full border-b last:border-b-0" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────
export function PaymentPlanManager() {

  // Data
  const { data: plans, isLoading } = usePaymentPlans();
  const { data: filieres } = useFilieres();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Form state
  const [planName, setPlanName] = useState('');
  const [filiereId, setFiliereId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [tranches, setTranches] = useState<TrancheRow[]>([
    createEmptyTranche(1),
  ]);

  const createMutation = useCreatePaymentPlan();
  const { data: levels } = useLevels(filiereId || undefined);

  // Total amount
  const totalAmount = useMemo(
    () => tranches.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [tranches]
  );

  // Selected plan details
  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  // Handlers
  const addTranche = () => {
    setTranches((prev) => [...prev, createEmptyTranche(prev.length + 1)]);
  };

  const removeTranche = (id: string) => {
    setTranches((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((t) => t.id !== id);
    });
  };

  const updateTranche = (id: string, field: keyof TrancheRow, value: string | boolean) => {
    setTranches((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const resetForm = () => {
    setPlanName('');
    setFiliereId('');
    setLevelId('');
    setTranches([createEmptyTranche(1)]);
  };

  const handleCreate = () => {
    if (!planName.trim() || !levelId) {
      toast.error('Champs requis: Veuillez saisir un nom et sélectionner un niveau.');
      return;
    }

    const validTranches = tranches.filter((t) => t.amount && Number(t.amount) > 0);
    if (validTranches.length === 0) {
      toast.error('Tranches requises: Ajoutez au moins une tranche avec un montant.');
      return;
    }

    const tranchesDto: CreateTrancheDto[] = validTranches.map((t, idx) => ({
      trancheNumber: idx + 1,
      name: t.name,
      amount: Number(t.amount),
      dueDate: t.dueDate || undefined,
      isMandatory: t.isMandatory,
    }));

    createMutation.mutate(
      {
        name: planName.trim(),
        levelId,
        academicYearId: 'current', // Will be resolved by backend
        totalAmount,
        tranches: tranchesDto,
      },
      {
        onSuccess: () => {
          toast.success(`Plan créé: Plan "${planName}" créé avec ${tranchesDto.length} tranche(s).`);
          setCreateOpen(false);
          resetForm();
        },
        onError: (err: any) => {
          toast.error(err.message || 'Impossible de créer le plan.');
        },
      }
    );
  };

  if (isLoading) return <PlansSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button
          onClick={() => { resetForm(); setCreateOpen(true); }}
          className="gap-2 bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"
        >
          <Plus className="h-4 w-4" />
          Nouveau plan
        </Button>
      </div>

      {/* Plans table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Nom</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">
                    Filière
                  </TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">
                    Niveau
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                  <TableHead className="text-xs font-semibold text-center hidden sm:table-cell">
                    Tranches
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!plans || plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucun plan de paiement
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="text-sm font-medium">{plan.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {plan.filiereName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {plan.levelName}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-right">
                        {formatFCFA(plan.totalAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-center hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {plan.trancheCount} tranche{plan.trancheCount > 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setDetailOpen(true);
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

      {/* ─── Create Plan Dialog ──────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau plan de paiement</DialogTitle>
            <DialogDescription>
              Définissez les tranches de paiement pour un niveau donné.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nom du plan</Label>
              <Input
                id="plan-name"
                placeholder="Ex: Scolarité BTS 1 — 2025"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            {/* Filière + Niveau */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filière</Label>
                <Select
                  value={filiereId}
                  onValueChange={(v) => { setFiliereId(v); setLevelId(''); }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres?.map((f: { id: string; name: string }) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={levelId} onValueChange={setLevelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels?.map((l: { id: string; name: string }) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tranches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tranches</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTranche}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {/* Header row (desktop) */}
                <div className="hidden sm:grid sm:grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                  <span className="w-8">N°</span>
                  <span>Nom</span>
                  <span>Montant (FCFA)</span>
                  <span>Date d'échéance</span>
                  <span className="w-16">Oblig.</span>
                  <span className="w-8"></span>
                </div>

                {tranches.map((t, idx) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-2 rounded-lg border p-2 sm:p-0 sm:border-0"
                  >
                    {/* Number */}
                    <div className="flex items-center justify-center h-8 text-xs font-medium text-muted-foreground sm:border-b sm:py-2">
                      {idx + 1}
                    </div>

                    {/* Name */}
                    <div className="sm:py-2">
                      <Input
                        placeholder="Nom"
                        value={t.name}
                        onChange={(e) => updateTranche(t.id, 'name', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Amount */}
                    <div className="sm:py-2">
                      <Input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={t.amount}
                        onChange={(e) => updateTranche(t.id, 'amount', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Date */}
                    <div className="sm:py-2">
                      <Input
                        type="date"
                        value={t.dueDate}
                        onChange={(e) => updateTranche(t.id, 'dueDate', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Mandatory */}
                    <div className="flex items-center justify-center h-8 sm:py-2">
                      <Checkbox
                        checked={t.isMandatory}
                        onCheckedChange={(v) => updateTranche(t.id, 'isMandatory', !!v)}
                      />
                    </div>

                    {/* Delete */}
                    <div className="flex items-center justify-center h-8 sm:py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                        onClick={() => removeTranche(t.id)}
                        disabled={tranches.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold text-[#8B1C2D]">
                  {formatFCFA(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ───────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.name || 'Détail du plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlan?.filiereName} — {selectedPlan?.levelName}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Montant total</span>
                  <p className="font-bold text-[#8B1C2D]">{formatFCFA(selectedPlan.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tranches</span>
                  <p className="font-medium">{selectedPlan.trancheCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Année académique</span>
                  <p className="font-medium">{selectedPlan.academicYearName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statut</span>
                  <div className="mt-1">
                    {selectedPlan.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Inactif
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center py-6">
                Les détails des tranches seront disponibles dans la vue étudiant.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
