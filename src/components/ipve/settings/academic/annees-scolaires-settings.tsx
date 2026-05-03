'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarDays, Star, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

interface Period { id: string; name: string; startDate: string; endDate: string; weight: number; sortOrder: number; isCurrent: boolean; }

interface YearItem {
  id: string; name: string; startDate: string; endDate: string; isCurrent: boolean;
  periods: Period[];
  _count: { classes: number };
}

const PERIOD_TEMPLATES = [
  { name: 'Semestre 1', startDate: '{start}', endDate: '{mid}', weight: 1, sortOrder: 1 },
  { name: 'Semestre 2', startDate: '{mid}', endDate: '{end}', weight: 1, sortOrder: 2 },
];

export function AnneesScolairesSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<YearItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<YearItem | null>(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false, periods: [] as Array<{ name: string; startDate: string; endDate: string; weight: number; sortOrder: number }> });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetchData<YearItem[]>('/api/settings/academic/academic-years');
      setItems(data);
    } catch { toast.error('Impossible de charger les années scolaires'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setSelected(null);
    const nextYear = new Date().getFullYear() + 1;
    setForm({
      name: `${new Date().getFullYear()}-${nextYear}`,
      startDate: `${new Date().getFullYear()}-09-01`,
      endDate: `${nextYear}-06-30`,
      isCurrent: false,
      periods: PERIOD_TEMPLATES.map((t) => ({
        ...t,
        startDate: t.startDate.replace('{start}', `${new Date().getFullYear()}-09-01`).replace('{mid}', `${new Date().getFullYear()}-12-31`),
        endDate: t.endDate.replace('{end}', `${nextYear}-06-30`).replace('{mid}', `${new Date().getFullYear()}-12-31`),
      })),
    });
    setDialogOpen(true);
  };

  const openEdit = (item: YearItem) => {
    setSelected(item);
    setForm({
      name: item.name,
      startDate: item.startDate.split('T')[0],
      endDate: item.endDate.split('T')[0],
      isCurrent: item.isCurrent,
      periods: item.periods.map((p) => ({
        name: p.name,
        startDate: p.startDate.split('T')[0],
        endDate: p.endDate.split('T')[0],
        weight: p.weight,
        sortOrder: p.sortOrder,
      })),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) { toast.error('Nom, date début et fin requis'); return; }
    try {
      setSaving(true);
      if (selected) {
        await apiFetchData(`/api/settings/academic/academic-years/${selected.id}`, { method: 'PUT', body: JSON.stringify({ name: form.name, startDate: form.startDate, endDate: form.endDate, isCurrent: form.isCurrent }) });
        toast.success('Année scolaire modifiée');
      } else {
        await apiFetchData('/api/settings/academic/academic-years', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Année scolaire créée');
      }
      setDialogOpen(false); loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleSetCurrent = async (item: YearItem) => {
    if (item.isCurrent) return;
    try {
      await apiFetchData(`/api/settings/academic/academic-years/${item.id}`, { method: 'PUT', body: JSON.stringify({ isCurrent: true }) });
      toast.success('Année scolaire définie comme en cours');
      loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try { setSaving(true); await apiFetchData(`/api/settings/academic/academic-years/${selected.id}`, { method: 'DELETE' }); toast.success('Année scolaire supprimée'); setDeleteOpen(false); loadData(); }
    catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const addPeriod = () => {
    setForm((p) => ({
      ...p,
      periods: [...p.periods, { name: `Période ${p.periods.length + 1}`, startDate: p.startDate, endDate: p.endDate, weight: 1, sortOrder: p.periods.length + 1 }],
    }));
  };

  const removePeriod = (idx: number) => {
    setForm((p) => ({ ...p, periods: p.periods.filter((_, i) => i !== idx) }));
  };

  const updatePeriod = (idx: number, field: string, value: string | number) => {
    setForm((p) => ({
      ...p,
      periods: p.periods.map((pp, i) => (i === idx ? { ...pp, [field]: value } : pp)),
    }));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Années scolaires</h2>
            <p className="text-sm text-muted-foreground">{items.length} année{items.length > 1 ? 's' : ''} scolaire{items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"><Plus className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Nouvelle année</span></Button>
      </div>

      {loading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div> : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune année scolaire</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{items.map((item) => (
          <Card key={item.id} className={item.isCurrent ? 'border-green-300 dark:border-green-800' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </div>
                {item.isCurrent && <Badge className="bg-green-100 text-green-700"><Star className="mr-1 h-3 w-3" />En cours</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(item.startDate)} → {formatDate(item.endDate)}</span>
                <Badge variant="outline">{item._count.classes} classes</Badge>
              </div>
              {item.periods.length > 0 && (
                <div className="space-y-1">
                  {item.periods.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">{formatDate(p.startDate)} — {formatDate(p.endDate)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-end gap-1">
                {!item.isCurrent && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSetCurrent(item)}>
                    <Star className="mr-1 h-3 w-3" />Définir en cours
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button>
                <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="mr-1 h-3 w-3" />Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? 'Modifier' : 'Nouvelle'} année scolaire</DialogTitle>
            <DialogDescription>{selected ? selected.name : 'Définir les dates et périodes'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="2024-2025" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                  <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm((p) => ({ ...p, isCurrent: e.target.checked }))} className="rounded" />
                  <span className="text-sm">En cours</span>
                </label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date de début *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Date de fin *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Périodes</Label>
              <Button variant="outline" size="sm" type="button" onClick={addPeriod}><Plus className="mr-1 h-3 w-3" />Ajouter</Button>
            </div>

            {form.periods.map((period, idx) => (
              <Card key={idx}>
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Période {idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePeriod(idx)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                  <div className="space-y-2">
                    <Input value={period.name} onChange={(e) => updatePeriod(idx, 'name', e.target.value)} placeholder="Nom" className="text-sm" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Début</Label>
                        <Input type="date" value={period.startDate} onChange={(e) => updatePeriod(idx, 'startDate', e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fin</Label>
                        <Input type="date" value={period.endDate} onChange={(e) => updatePeriod(idx, 'endDate', e.target.value)} className="text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Coefficient</Label>
                        <Input type="number" min={0} step={0.5} value={period.weight} onChange={(e) => updatePeriod(idx, 'weight', Number(e.target.value))} className="text-sm" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ordre</Label>
                        <Input type="number" min={0} value={period.sortOrder} onChange={(e) => updatePeriod(idx, 'sortOrder', Number(e.target.value))} className="text-sm" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white">{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{selected ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle className="text-destructive">Supprimer</DialogTitle><DialogDescription>Supprimer &quot;{selected?.name}&quot; et toutes ses périodes ?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>Annuler</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>Supprimer</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
