'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowLeft } from 'lucide-react';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

interface Filiere { id: string; name: string; code: string; }

interface LevelItem {
  id: string;
  name: string;
  filiereId: string;
  yearNumber: number;
  tuitionFee: number;
  filiere: Filiere;
  _count: { classes: number; students: number };
}

export function NiveauxSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LevelItem[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filiereFilter, setFiliereFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LevelItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', filiereId: '', yearNumber: 1, tuitionFee: 0 });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadFilieres = useCallback(async () => {
    const data = await apiFetchData<Filiere[]>('/api/settings/academic/filieres?active=true');
    setFilieres(data);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filiereFilter !== 'all') params.set('filiereId', filiereFilter);
      const data = await apiFetchData<LevelItem[]>(`/api/settings/academic/levels${params.toString() ? `?${params}` : ''}`);
      setItems(data);
    } catch { toast.error('Impossible de charger les niveaux'); }
    finally { setLoading(false); }
  }, [debouncedSearch, filiereFilter]);

  useEffect(() => { loadFilieres(); }, [loadFilieres]);
  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', filiereId: filieres[0]?.id || '', yearNumber: 1, tuitionFee: 0 });
    setDialogOpen(true);
  };

  const openEdit = (item: LevelItem) => {
    setSelected(item);
    setForm({ name: item.name, filiereId: item.filiereId, yearNumber: item.yearNumber, tuitionFee: item.tuitionFee });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.filiereId) { toast.error('Nom et filière requis'); return; }
    try {
      setSaving(true);
      if (selected) {
        await apiFetchData(`/api/settings/academic/levels/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Niveau modifié');
      } else {
        await apiFetchData('/api/settings/academic/levels', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Niveau créé');
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await apiFetchData(`/api/settings/academic/levels/${selected.id}`, { method: 'DELETE' });
      toast.success('Niveau supprimé');
      setDeleteOpen(false);
      setSelected(null);
      loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Niveaux</h2>
            <p className="text-sm text-muted-foreground">{items.length} niveau{items.length > 1 ? 'x' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"><Plus className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Nouveau niveau</span></Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filiereFilter} onValueChange={setFiliereFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filière" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les filières</SelectItem>
              {filieres.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <Skeleton className="h-64 w-full rounded-xl" /> : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun niveau trouvé</CardContent></Card>
      ) : (
        <Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Filière</TableHead><TableHead>Année</TableHead><TableHead>Frais (XOF)</TableHead><TableHead>Classes</TableHead><TableHead>Étudiants</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => (<TableRow key={item.id}><TableCell className="font-medium text-sm">{item.name}</TableCell><TableCell><Badge variant="outline">{item.filiere.code}</Badge> <span className="text-xs text-muted-foreground ml-1">{item.filiere.name}</span></TableCell><TableCell className="text-sm">{item.yearNumber}</TableCell><TableCell className="text-sm">{Number(item.tuitionFee).toLocaleString('fr-FR')} XOF</TableCell><TableCell className="text-sm">{item._count.classes}</TableCell><TableCell className="text-sm">{item._count.students}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
      )}

      {!loading && items.length > 0 && (
        <div className="md:hidden space-y-3">{items.map((item) => (
          <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between"><div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-muted-foreground">{item.filiere.name} — Année {item.yearNumber}</p><p className="text-xs mt-1">{Number(item.tuitionFee).toLocaleString('fr-FR')} XOF</p></div></div><div className="flex items-center gap-1 mt-3 pt-3 border-t"><Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button><Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="mr-1 h-3 w-3" />Supprimer</Button></div></CardContent></Card>
        ))}</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{selected ? 'Modifier le niveau' : 'Nouveau niveau'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label>Filière *</Label><Select value={form.filiereId} onValueChange={(v) => setForm((p) => ({ ...p, filiereId: v }))}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{filieres.map((f) => <SelectItem key={f.id} value={f.id}>{f.name} ({f.code})</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Licence 1" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Numéro d&apos;année</Label><Input type="number" min={1} max={10} value={form.yearNumber} onChange={(e) => setForm((p) => ({ ...p, yearNumber: Number(e.target.value) || 1 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div><div className="space-y-2"><Label>Frais de scolarité (XOF)</Label><Input type="number" min={0} value={form.tuitionFee} onChange={(e) => setForm((p) => ({ ...p, tuitionFee: Number(e.target.value) || 0 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white">{saving ? 'Enregistrement...' : selected ? 'Enregistrer' : 'Créer'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle className="text-destructive">Supprimer</DialogTitle><DialogDescription>Supprimer &quot;{selected?.name}&quot; ?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>Annuler</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>Supprimer</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
