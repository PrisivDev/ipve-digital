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

interface FiliereItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  durationYears: number;
  isActive: boolean;
  _count: { levels: number; students: number };
}

export function FilieresSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FiliereItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<FiliereItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', durationYears: 3 });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const data = await apiFetchData<FiliereItem[]>(`/api/settings/academic/filieres${params.toString() ? `?${params}` : ''}`);
      setItems(data);
    } catch { toast.error('Impossible de charger les filières'); }
    finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', code: '', description: '', durationYears: 3 });
    setDialogOpen(true);
  };

  const openEdit = (item: FiliereItem) => {
    setSelected(item);
    setForm({ name: item.name, code: item.code, description: item.description || '', durationYears: item.durationYears });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Nom et code requis'); return; }
    try {
      setSaving(true);
      if (selected) {
        await apiFetchData(`/api/settings/academic/filieres/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Filière modifiée');
      } else {
        await apiFetchData('/api/settings/academic/filieres', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Filière créée');
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (item: FiliereItem) => {
    try {
      await apiFetchData(`/api/settings/academic/filieres/${item.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !item.isActive }) });
      toast.success(item.isActive ? 'Filière désactivée' : 'Filière activée');
      loadData();
    } catch (err: any) { toast.error(err.message || 'Erreur'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await apiFetchData(`/api/settings/academic/filieres/${selected.id}`, { method: 'DELETE' });
      toast.success('Filière supprimée');
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
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Filières</h2>
            <p className="text-sm text-muted-foreground">{items.length} filière{items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white">
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle filière</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom ou code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {loading ? <Skeleton className="h-64 w-full rounded-xl" /> : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune filière trouvée</CardContent></Card>
      ) : (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Niveaux</TableHead>
                  <TableHead>Étudiants</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline" className="font-mono">{item.code}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.durationYears} ans</TableCell>
                    <TableCell className="text-sm">{item._count.levels}</TableCell>
                    <TableCell className="text-sm">{item._count.students}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}>
                        {item.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(item)}>
                          {item.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mobile cards */}
      {!loading && items.length > 0 && (
        <div className="md:hidden space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
                      <p className="font-medium text-sm">{item.name}</p>
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{item.durationYears} ans</span>
                      <span>{item._count.levels} niveaux</span>
                      <span>{item._count.students} étudiants</span>
                    </div>
                  </div>
                  <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? 'bg-green-100 text-green-700' : ''}>
                    {item.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3 w-3" />Modifier</Button>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => handleToggleActive(item)}>
                    {item.isActive ? <><ToggleRight className="mr-1 h-3 w-3" />Désactiver</> : <><ToggleLeft className="mr-1 h-3 w-3" />Activer</>}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => { setSelected(item); setDeleteOpen(true); }}><Trash2 className="mr-1 h-3 w-3" />Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? 'Modifier la filière' : 'Nouvelle filière'}</DialogTitle>
            <DialogDescription>{selected ? selected.name : 'Créer une nouvelle filière'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Informatique" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="INFO" className="uppercase" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description de la filière" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
            </div>
            <div className="space-y-2">
              <Label>Durée (années)</Label>
              <Input type="number" min={1} max={10} value={form.durationYears} onChange={(e) => setForm((p) => ({ ...p, durationYears: Number(e.target.value) || 3 }))} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#8B1C2D] hover:bg-[#8B1C2D]/90 text-white">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{selected ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer la filière</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer &quot;{selected?.name}&quot; ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
