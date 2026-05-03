'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

interface PaymentConfig {
  defaultPaymentMethod: string;
  latePenaltyPercent: number;
  gracePeriodDays: number;
}

const DEFAULTS: PaymentConfig = { defaultPaymentMethod: 'CASH', latePenaltyPercent: 0, gracePeriodDays: 0 };

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MTN_MOMO', label: 'MTN Mobile Money' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
];

export function ConfigPaiementsSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<PaymentConfig>(DEFAULTS);
  const [form, setForm] = useState<PaymentConfig>(DEFAULTS);

  const changed = JSON.stringify(form) !== JSON.stringify(original);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetchData<PaymentConfig>('/api/settings/financial/config');
      setForm({ ...DEFAULTS, ...data });
      setOriginal({ ...DEFAULTS, ...data });
    } catch { toast.error('Impossible de charger la configuration'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiFetchData('/api/settings/financial/config', { method: 'PUT', body: JSON.stringify(form) });
      setOriginal({ ...form });
      toast.success('Configuration des paiements enregistrée');
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-8 w-64" /></div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Configuration des paiements</h2>
            <p className="text-sm text-muted-foreground">Paramètres par défaut des paiements</p>
          </div>
        </div>
        {changed && (
          <Button onClick={handleSave} disabled={saving} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Enregistrer
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Méthode de paiement par défaut</CardTitle><CardDescription>Pré-sélectionnée lors de la saisie de paiements</CardDescription></CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select value={form.defaultPaymentMethod} onValueChange={(v) => setForm((p) => ({ ...p, defaultPaymentMethod: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pénalités de retard</CardTitle><CardDescription>Paramètres de calcul des pénalités pour les paiements en retard</CardDescription></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="penalty">Pénalité (%)</Label>
            <Input id="penalty" type="number" min={0} max={100} step={0.5} value={form.latePenaltyPercent} onChange={(e) => setForm((p) => ({ ...p, latePenaltyPercent: Number(e.target.value) || 0 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
            <p className="text-xs text-muted-foreground">Pourcentage appliqué sur le montant restant</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grace">Délai de grâce (jours)</Label>
            <Input id="grace" type="number" min={0} max={90} value={form.gracePeriodDays} onChange={(e) => setForm((p) => ({ ...p, gracePeriodDays: Number(e.target.value) || 0 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
            <p className="text-xs text-muted-foreground">Jours avant application de la pénalité</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
