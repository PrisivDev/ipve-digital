'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, ArrowLeft } from 'lucide-react';
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

interface LevelOption { id: string; name: string; yearNumber: number; filiere: { id: string; name: string; code: string }; }
interface YearOption { id: string; name: string; isCurrent: boolean; }

interface ClassItem {
  id: string;
  name: string;
  levelId: string;
  capacity: number;
  room: string | null;
  academicYearId: string;
  level: LevelOption;
  academicYear: { id: string; name: string; isCurrent: boolean };
  _count: { students: number; classSubjects: number };
}

export function ClassesSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', levelId: '', capacity: 40, room: '', academicYearId: '' });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadLevels = useCallback(async () => {
    const data = await apiFetchData<LevelOption[]>('/api/settings/academic/levels');
    setLevels(data);
  }, []);

  const loadYears = useCallback(async () => {
    const data = await apiFetchData<YearOption[]>('/api/settings/academic/academic-years');
    setYears(data);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (levelFilter !== 'all') params.set('levelId', levelFilter);
      if (yearFilter !== 'all') params.set('academicYearId', yearFilter);
      const data = await apiFetchData<ClassItem[]>(`/api/settings/academic/classes${params.toString() ? `?${params}` : ''}`);
      setItems(data);
    } catch { toast.error('Impossible de charger les classes'); }
    finally { setLoading(false); }
  }, [debouncedSearch, levelFilter, yearFilter]);

  useEffect(() => { loadLevels(); loadYears(); }, [loadLevels, loadYears]);
  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', levelId: levels[0]?.id || '', capacity: 40, room: '', academicYearId: years[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEdit = (item: ClassItem) => {
    setSelected(item);
    setForm({ name: item.name, levelId: item.levelId, capacity: item.capacity, room: item.room || '', academicYearId: item.academicYearId });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.levelId || !form.academicYearId) { toast.error('Nom, niveau et année scolaire requis'); return; }
    try {
      setSaving(true);
      if (selected) {
        await apiFetchData(`/api/settings/academic/classes/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Classe modifiée');
      } else {
        await apiFetchData('/api/settings/academic/classes', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Classe créée');
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
      await apiFetchData(`/api/settings/academic/classes/${selected.id}`, { method: 'DELETE' });
      toast.success('Classe supprimée');
      setDeleteOpen(false);
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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Classes</h2>
            <p className="text-sm text-muted-foreground">{items.length} classe{items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white"><Plus className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Nouvelle classe</span></Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={levelFilter} onValueChange={setLevelFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Niveau" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les niveaux</SelectItem>{levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
          <Select value={yearFilter} onValueChange={setYearFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Année" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes</SelectItem>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select>
        </CardContent>
      </Card>

      {loading ? <Skeleton className="h-64 w-full rounded-xl" /> : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune classe trouvée</CardContent></Card>
      ) : (
        <Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Niveau</TableHead><TableHead>Année scolaire</TableHead><TableHead>Salle</TableHead><TableHead>Capacité</TableHead><TableHead>Étudiants</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => (<TableRow key={item.id}><TableCell className="font-medium text-sm">{item.name}</TableCell><TableCell><span className="text-sm">{item.level.name}</span><p className="text-xs text-muted-foreground">{item.level.filiere?.code}</p></TableCell><TableCell><Badge variant={item.academicYear.isCurrent ? 'default' : 'outline'} className={item.academicYear.isCurrent ? 'bg-green-100 text-green-700' : ''}>{item.academicYear.name}</Badge></TableCell><TableCell className="text-sm">{item.room || '—'}</TableCell><TableCell className="text-sm">{item._count.students}/{item.capacity}</TableCell><TableCell className="text-sm">{item._count.students}</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
      )}

      {!loading && items.length > 0 && (
        <div className="md:hidden space-y-3">{items.map((item) => (
          <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between"><div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-muted-foreground">{item.level.name} — {item.academicYear.name}</p><p className="text-xs mt-1">{item.room || 'Sans salle'} · {item._count.students}/{item.capacity} étudiants</p></div></div><div className="flex items-center gap-1 mt-3 pt-3 border-t"><Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button><Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="mr-1 h-3 w-3" />Supprimer</Button></div></CardContent></Card>
        ))}</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{selected ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Groupe A" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div><div className="space-y-2"><Label>Niveau *</Label><Select value={form.levelId} onValueChange={(v) => setForm((p) => ({ ...p, levelId: v }))}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.filiere?.code})</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Année scolaire *</Label><Select value={form.academicYearId} onValueChange={(v) => setForm((p) => ({ ...p, academicYearId: v }))}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Capacité</Label><Input type="number" min={1} max={200} value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) || 40 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div><div className="space-y-2"><Label>Salle</Label><Input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="Salle 101" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white">{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{selected ? 'Enregistrer' : 'Créer'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle className="text-destructive">Supprimer</DialogTitle><DialogDescription>Supprimer la classe &quot;{selected?.name}&quot; ?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>Annuler</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>Supprimer</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
