'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Search, Pencil, Key, UserX, UserCheck, Users, UserCircle,
  ShieldCheck, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuthStore } from '@/stores/auth.store';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleName: string;
  isActive: boolean;
  lastLogin: string | null;
  totpEnabled: boolean;
  createdAt: string;
}

interface UsersStats {
  total: number;
  active: number;
  inactive: number;
  twoFactorActive: number;
}

interface UsersResponse {
  users: UserItem[];
  stats: UsersStats;
}

const ROLES = ['ADMIN', 'TEACHER', 'ACCOUNTANT', 'CASHIER', 'SECRETARY', 'PARENT', 'STUDENT'] as const;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  TEACHER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCOUNTANT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CASHIER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SECRETARY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PARENT: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  STUDENT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  TEACHER: 'Enseignant',
  ACCOUNTANT: 'Comptable',
  CASHIER: 'Caissier',
  SECRETARY: 'Secrétaire',
  PARENT: 'Parent',
  STUDENT: 'Étudiant',
};

/* ------------------------------------------------------------------ */
/*  apiFetch helper                                                    */
/* ------------------------------------------------------------------ */

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erreur');
  return json.data as T;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UsersManagement() {
  const { setSettingsSection } = useAppStore();
  const currentUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UsersStats>({ total: 0, active: 0, inactive: 0, twoFactorActive: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  // Form state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    email: '', firstName: '', lastName: '', phone: '', role: 'STUDENT', password: '',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phone: '', role: '',
  });

  // Reset password form
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  /* Fetch users (server-side filtering) */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const qs = params.toString();
      const data = await apiFetch<UsersResponse>(`/api/settings/users${qs ? `?${qs}` : ''}`);
      setUsers(data.users);
      setStats(data.stats || { total: 0, active: 0, inactive: 0, twoFactorActive: 0 });
    } catch {
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* Create user */
  const handleCreate = async () => {
    if (!createForm.email || !createForm.firstName || !createForm.lastName || !createForm.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      setFormSaving(true);
      await apiFetch('/api/settings/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      toast.success('Utilisateur créé avec succès');
      setCreateOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', phone: '', role: 'STUDENT', password: '' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setFormSaving(false);
    }
  };

  /* Edit user */
  const openEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', role: user.roleName });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      setFormSaving(true);
      await apiFetch(`/api/settings/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      toast.success('Utilisateur modifié avec succès');
      setEditOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification');
    } finally {
      setFormSaving(false);
    }
  };

  /* Reset password */
  const openReset = (user: UserItem) => {
    setSelectedUser(user);
    setResetForm({ newPassword: '', confirmPassword: '' });
    setShowNewPwd(false);
    setShowConfirmPwd(false);
    setResetOpen(true);
  };

  const handleReset = async () => {
    if (!selectedUser) return;
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      setFormSaving(true);
      await apiFetch(`/api/settings/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'resetPassword', newPassword: resetForm.newPassword }),
      });
      toast.success('Mot de passe réinitialisé');
      setResetOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setFormSaving(false);
    }
  };

  /* Deactivate / Reactivate */
  const openDeactivate = (user: UserItem) => {
    setSelectedUser(user);
    setDeactivateOpen(true);
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    try {
      setFormSaving(true);
      const action = selectedUser.isActive ? 'deactivate' : 'reactivate';
      await apiFetch(`/api/settings/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      toast.success(selectedUser.isActive ? 'Utilisateur désactivé' : 'Utilisateur réactivé');
      setDeactivateOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setFormSaving(false);
    }
  };

  /* Helpers */
  const isSelf = (userId: string) => currentUser?.id === userId;
  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsSection('overview')}
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Gestion des utilisateurs</h2>
            <p className="text-sm text-muted-foreground">{stats.total} utilisateurs au total</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Nouvel utilisateur</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
              <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-xs text-muted-foreground">Inactifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.twoFactorActive}</p>
              <p className="text-xs text-muted-foreground">2FA actif</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          {isSelf(user.id) && (
                            <Badge variant="outline" className="text-xs font-normal">(Vous)</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ROLE_COLORS[user.roleName] || ''}>
                          {ROLE_LABELS[user.roleName] || user.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openReset(user)}>
                            <Key className="h-4 w-4" />
                          </Button>
                          {!isSelf(user.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeactivate(user)}
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4 text-red-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun utilisateur trouvé
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <UserCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        {isSelf(user.id) && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">(Vous)</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-[10px]">
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] ${ROLE_COLORS[user.roleName] || ''}`}>
                    {ROLE_LABELS[user.roleName] || user.roleName}
                  </Badge>
                  {user.totpEnabled && (
                    <Badge variant="outline" className="text-[10px]">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      2FA
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between pt-3 border-t">
                  <p className="text-[11px] text-muted-foreground">
                    {user.lastLogin ? `Dernière connexion: ${formatDate(user.lastLogin)}` : 'Jamais connecté'}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openReset(user)}>
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    {!isSelf(user.id) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDeactivate(user)}>
                        {user.isActive ? (
                          <UserX className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ---- Create User Dialog ---- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen} showCloseButton={false}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
            <DialogDescription>Créer un nouveau compte utilisateur</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-firstName">Prénom *</Label>
                <Input
                  id="c-firstName"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-lastName">Nom *</Label>
                <Input
                  id="c-lastName"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email *</Label>
              <Input
                id="c-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="jean.dupont@ipve.edu.ci"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-phone">Téléphone</Label>
                <Input
                  id="c-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+225 07 XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-password">Mot de passe *</Label>
              <Input
                id="c-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 6 caractères"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={formSaving}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={formSaving} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
              {formSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Edit User Dialog ---- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen} showCloseButton={false}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-firstName">Prénom</Label>
                <Input
                  id="e-firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-lastName">Nom</Label>
                <Input
                  id="e-lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="e-phone">Téléphone</Label>
                <Input
                  id="e-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={formSaving}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={formSaving} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
              {formSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Reset Password Dialog ---- */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen} showCloseButton={false}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="r-newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="r-newPassword"
                  type={showNewPwd ? 'text' : 'password'}
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Minimum 6 caractères"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                >
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="r-confirmPassword"
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirmer"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                >
                  {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={formSaving}>
              Annuler
            </Button>
            <Button onClick={handleReset} disabled={formSaving} className="bg-amber-600 hover:bg-amber-600/90 text-white">
              {formSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Deactivate Confirmation Dialog ---- */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen} showCloseButton={false}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {selectedUser?.isActive ? 'Désactiver l\'utilisateur' : 'Réactiver l\'utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isActive
                ? `Voulez-vous vraiment désactiver ${selectedUser?.firstName} ${selectedUser?.lastName} ? L'utilisateur ne pourra plus se connecter.`
                : `Voulez-vous réactiver ${selectedUser?.firstName} ${selectedUser?.lastName} ?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={formSaving}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleToggleActive}
              disabled={formSaving}
            >
              {formSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {selectedUser?.isActive ? 'Désactiver' : 'Réactiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
