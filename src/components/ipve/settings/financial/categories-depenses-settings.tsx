'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

interface CategoryItem {
  id: string; name: string; code: string | null; description: string | null;
  budgetLimit: number; isActive: boolean;
  _count: { expenses: number };
}

export function CategoriesDepensesSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CategoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', budgetLimit: 0 });

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const data = await apiFetchData<CategoryItem[]>(`/api/settings/financial/expense-categories${params.toString() ? `?${params}` : ''}`);
      setItems(data);
    } catch { toast.error('Impossible de charger les catégories'); }
    finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setSelected(null); setForm({ name: '', code: '', description: '', budgetLimit: 0 }); setDialogOpen(true); };
  const openEdit = (item: CategoryItem) => { setSelected(item); setForm({ name: item.name, code: item.code || '', description: item.description || '', budgetLimit: item.budgetLimit }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    try {
      setSaving(true);
      if (selected) {
        await apiFetchData(`/api/settings/financial/expense-categories/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Catégorie modifiée');
      } else {
        await apiFetchData('/api/settings/financial/expense-categories', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Catégorie créée');
      }
      setDialogOpen(false); loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (item: CategoryItem) => {
    try {
      await apiFetchData(`/api/settings/financial/expense-categories/${item.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !item.isActive }) });
      loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try { setSaving(true); await apiFetchData(`/api/settings/financial/expense-categories/${selected.id}`, { method: 'DELETE' }); toast.success('Catégorie supprimée'); setDeleteOpen(false); loadData(); }
    catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Catégories de dépenses</h2>
            <p className="text-sm text-muted-foreground">{items.length} catégorie{items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"><Plus className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Nouvelle catégorie</span></Button>
      </div>

      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></CardContent></Card>

      {loading ? <Skeleton className="h-64 w-full rounded-xl" /> : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune catégorie trouvée</CardContent></Card>
      ) : (
        <Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Plafond (XOF)</TableHead><TableHead>Dépenses</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => (<TableRow key={item.id}><TableCell><Badge variant="outline" className="font-mono">{item.code || '—'}</Badge></TableCell><TableCell><p className="font-medium text-sm">{item.name}</p>{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}</TableCell><TableCell className="text-sm">{item.budgetLimit > 0 ? Number(item.budgetLimit).toLocaleString('fr-FR') : '—'}</TableCell><TableCell className="text-sm">{item._count.expenses}</TableCell><TableCell><Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? 'bg-green-100 text-green-700' : ''}>{item.isActive ? 'Actif' : 'Inactif'}</Badge></TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(item)}>{item.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
      )}

      {!loading && items.length > 0 && (
        <div className="md:hidden space-y-3">{items.map((item) => (
          <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between"><div><p className="font-medium text-sm">{item.name}</p>{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}<p className="text-xs mt-1">{item._count.expenses} dépenses · {item.budgetLimit > 0 ? `Plafond: ${Number(item.budgetLimit).toLocaleString('fr-FR')} XOF` : 'Sans plafond'}</p></div><Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'Actif' : 'Inactif'}</Badge></div><div className="flex items-center gap-1 mt-3 pt-3 border-t"><Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button><Button variant="ghost" size="sm" className="h-7" onClick={() => handleToggle(item)}>{item.isActive ? 'Désactiver' : 'Activer'}</Button><Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="mr-1 h-3 w-3" /></Button></div></CardContent></Card>
        ))}</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{selected ? 'Modifier' : 'Nouvelle'} catégorie</DialogTitle></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div><div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} className="uppercase" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div></div><div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div><div className="space-y-2"><Label>Plafond budgétaire (XOF)</Label><Input type="number" min={0} value={form.budgetLimit} onChange={(e) => setForm((p) => ({ ...p, budgetLimit: Number(e.target.value) || 0 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white">{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{selected ? 'Enregistrer' : 'Créer'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle className="text-destructive">Supprimer</DialogTitle><DialogDescription>Supprimer &quot;{selected?.name}&quot; ?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>Annuler</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>Supprimer</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
