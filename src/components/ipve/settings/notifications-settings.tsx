'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, CheckCheck, ArrowLeft, Loader2, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

interface NotificationItem {
  id: string; userId: string | null; type: string; title: string; message: string;
  isRead: boolean; createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  INFO: 'Information', SUCCESS: 'Succès', WARNING: 'Attention', ERROR: 'Erreur',
  PAYMENT_REMINDER: 'Rappel paiement', GRADE_PUBLISHED: 'Note publiée', ABSENCE_ALERT: 'Alerte absence',
};

const TYPE_COLORS: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PAYMENT_REMINDER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  GRADE_PUBLISHED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ABSENCE_ALERT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function NotificationsSettings() {
  const { setSettingsSection } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (readFilter === 'read') params.set('isRead', 'true');
      else if (readFilter === 'unread') params.set('isRead', 'false');

      const data = await apiFetchData<{ notifications: NotificationItem[]; pagination: { total: number; totalPages: number; page: number } }>(`/api/settings/notifications?${params}`);
      setItems(data.notifications);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setPage(data.pagination.page);
    } catch { toast.error('Impossible de charger les notifications'); }
    finally { setLoading(false); }
  }, [page, typeFilter, readFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleRead = async (item: NotificationItem) => {
    try {
      await apiFetchData(`/api/settings/notifications/${item.id}`, { method: 'PUT' });
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetchData('/api/settings/notifications/all', { method: 'PUT' });
      toast.success('Toutes les notifications marquées comme lues');
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleDeleteSingle = async (id: string) => {
    try { await apiFetchData(`/api/settings/notifications/${id}`, { method: 'DELETE' }); loadData(); }
    catch { toast.error('Erreur'); }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkSaving(true);
      await apiFetchData(`/api/settings/notifications?ids=${Array.from(selectedIds).join(',')}`, { method: 'DELETE' });
      toast.success(`${selectedIds.size} notification(s) supprimée(s)`);
      setSelectedIds(new Set());
      setBulkOpen(false);
      loadData();
    } catch { toast.error('Erreur'); }
    finally { setBulkSaving(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSettingsSection('overview')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Notifications</h2>
            <p className="text-sm text-muted-foreground">{total} notification{total > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}><CheckCheck className="mr-1 h-4 w-4" />Tout marquer lu</Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkOpen(true)}><Trash2 className="mr-1 h-4 w-4" />Supprimer ({selectedIds.size})</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="unread">Non lues</SelectItem>
              <SelectItem value="read">Lues</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <Skeleton className="h-96 w-full rounded-xl" /> : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />Aucune notification</CardContent></Card>
      ) : (
        <Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="w-10"></TableHead><TableHead>Titre</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => (<TableRow key={item.id} className={!item.isRead ? 'bg-muted/20' : ''}><TableCell><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" /></TableCell><TableCell><div><p className={`text-sm ${!item.isRead ? 'font-semibold' : ''}`}>{item.title}</p><p className="text-xs text-muted-foreground">{item.message}</p></div></TableCell><TableCell><Badge variant="secondary" className={`text-xs ${TYPE_COLORS[item.type] || ''}`}>{TYPE_LABELS[item.type] || item.type}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell><TableCell><Badge variant={item.isRead ? 'outline' : 'default'} className="text-xs">{item.isRead ? 'Lue' : 'Non lue'}</Badge></TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleRead(item)}>{item.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSingle(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
      )}

      {!loading && items.length > 0 && (
        <div className="md:hidden space-y-3">{items.map((item) => (
          <Card key={item.id} className={!item.isRead ? 'border-l-4 border-l-[#8B1C2D]' : ''}><CardContent className="p-4"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><Badge variant="secondary" className={`text-xs ${TYPE_COLORS[item.type] || ''}`}>{TYPE_LABELS[item.type] || item.type}</Badge><Badge variant={item.isRead ? 'outline' : 'default'} className="text-[10px]">{item.isRead ? 'Lue' : 'Non lue'}</Badge></div><p className={`text-sm ${!item.isRead ? 'font-semibold' : ''}`}>{item.title}</p><p className="text-xs text-muted-foreground mt-1">{item.message}</p><p className="text-[10px] text-muted-foreground mt-2">{formatDate(item.createdAt)}</p></div></div><div className="flex items-center gap-1 mt-3 pt-3 border-t"><Button variant="ghost" size="sm" className="h-7" onClick={() => handleToggleRead(item)}>{item.isRead ? 'Marquer non lue' : 'Marquer lue'}</Button><Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => handleDeleteSingle(item.id)}><Trash2 className="mr-1 h-3 w-3" /></Button></div></CardContent></Card>
        ))}</div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Précédent</Button>
          <span className="text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Suivant<ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      )}

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle className="text-destructive">Supprimer les notifications</DialogTitle><DialogDescription>Supprimer {selectedIds.size} notification{selectedIds.size > 1 ? 's' : ''} ?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkSaving}>Annuler</Button><Button variant="destructive" onClick={handleBulkDelete} disabled={bulkSaving}>{bulkSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Supprimer</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
