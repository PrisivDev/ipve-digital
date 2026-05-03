'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Save, X, RotateCcw, Shield, Lock, Clock, Smartphone,
  Loader2, Monitor, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiFetchData } from '@/lib/api-fetch';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SecurityPolicies {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  enforce2FA: boolean;
}

interface RolePermissions {
  id: string;
  name: string;
  label: string;
  description: string | null;
  dbPermissionCount: number;
  memoryPermissionCount: number;
  userCount: number;
}

interface PermissionsData {
  matrix: Array<{
    module: string;
    label: string;
    dbCount: number;
    roles: Record<string, { count: number; total: number }>;
  }>;
  roles: RolePermissions[];
  summary: {
    totalPermissions: number;
    rolesCount: number;
    modulesCount: number;
  };
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  entries: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

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

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOGOUT: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  CREATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CHANGE_PASSWORD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const ACTION_LEGEND = [
  { action: 'CREATE', color: 'bg-green-500', label: 'CREATE' },
  { action: 'READ', color: 'bg-blue-500', label: 'READ' },
  { action: 'UPDATE', color: 'bg-amber-500', label: 'UPDATE' },
  { action: 'DELETE', color: 'bg-red-500', label: 'DELETE' },
  { action: 'EXPORT', color: 'bg-purple-500', label: 'EXPORT' },
  { action: 'VALIDATE', color: 'bg-teal-500', label: 'VALIDATE' },
];

const DEFAULT_POLICIES: SecurityPolicies = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: false,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  enforce2FA: false,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SecuritySettings({ defaultTab = 'politiques' }: { defaultTab?: string }) {
  const { setSettingsSection } = useAppStore();

  /* --- Politiques tab state --- */
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesSaving, setPoliciesSaving] = useState(false);
  const [originalPolicies, setOriginalPolicies] = useState<SecurityPolicies>(DEFAULT_POLICIES);
  const [policies, setPolicies] = useState<SecurityPolicies>(DEFAULT_POLICIES);
  const policiesChanged =
    JSON.stringify(policies) !== JSON.stringify(originalPolicies);

  /* --- Permissions tab state --- */
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsData, setPermissionsData] = useState<PermissionsData | null>(null);

  /* --- Audit log tab state --- */
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditResourceFilter, setAuditResourceFilter] = useState<string>('all');

  /* ---- Load functions ---- */

  const loadPolicies = useCallback(async () => {
    try {
      setPoliciesLoading(true);
      const data = await apiFetchData<SecurityPolicies>('/api/settings/security/policies');
      const merged = { ...DEFAULT_POLICIES, ...data };
      setPolicies(merged);
      setOriginalPolicies(merged);
    } catch {
      toast.error('Impossible de charger les politiques de sécurité');
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      setPermissionsLoading(true);
      const data = await apiFetchData<PermissionsData>('/api/settings/security/permissions');
      // Map matrix data into each role for display
      const enrichedRoles = data.roles.map((role) => {
        const moduleEntries = data.matrix.map((m) => ({
          module: m.label,
          count: m.roles[role.name]?.count || 0,
        }));
        return {
          ...role,
          total: role.memoryPermissionCount,
          modules: moduleEntries,
        };
      });
      setPermissionsData({ ...data, roles: enrichedRoles as any });
    } catch {
      toast.error('Impossible de charger les permissions');
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  const loadAuditLog = useCallback(async (page: number, action: string, resource: string) => {
    try {
      setAuditLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '30');
      if (action !== 'all') params.set('action', action);
      if (resource !== 'all') params.set('resource', resource);
      const data = await apiFetchData<{ entries: Array<{ id: string; userId: string; action: string; resource: string; resourceId: string | null; ipAddress: string | null; userAgent: string | null; createdAt: string; user: { id: string; email: string; firstName: string; lastName: string } | null }>; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/settings/security/audit-log?${params}`);
      const entries: AuditLogEntry[] = data.entries.map((e) => ({
        ...e,
        userName: e.user ? `${e.user.firstName} ${e.user.lastName}` : 'Inconnu',
      }));
      setAuditEntries(entries);
      setAuditTotal(data.pagination.total);
      setAuditPage(data.pagination.page);
      setAuditTotalPages(data.pagination.totalPages);
    } catch {
      toast.error('Impossible de charger le journal d\'audit');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);
  useEffect(() => { loadPermissions(); }, [loadPermissions]);
  useEffect(() => { loadAuditLog(1, auditActionFilter, auditResourceFilter); }, [loadAuditLog, auditActionFilter, auditResourceFilter]);

  /* ---- Handlers ---- */

  const handleSavePolicies = async () => {
    try {
      setPoliciesSaving(true);
      await apiFetchData('/api/settings/security/policies', {
        method: 'PUT',
        body: JSON.stringify(policies),
      });
      setOriginalPolicies({ ...policies });
      toast.success('Politiques enregistrées');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setPoliciesSaving(false);
    }
  };

  const handleCancelPolicies = () => {
    setPolicies({ ...originalPolicies });
  };

  const handleResetPolicies = () => {
    setPolicies({ ...DEFAULT_POLICIES });
  };

  const handleAuditPageChange = (newPage: number) => {
    loadAuditLog(newPage, auditActionFilter, auditResourceFilter);
  };

  /* ---- Helpers ---- */

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  const isMobileUA = (ua: string | null) => {
    if (!ua) return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  };

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Sécurité</h2>
          <p className="text-sm text-muted-foreground">Politiques, permissions et journal d'audit</p>
        </div>
      </div>

      {/* 3 Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="politiques">Politiques</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
        </TabsList>

        {/* ==================== POLITIQUES ==================== */}
        <TabsContent value="politiques" className="space-y-4">
          {policiesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Action buttons */}
              {policiesChanged && (
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetPolicies}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Réinitialiser
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelPolicies}>
                    <X className="mr-1.5 h-4 w-4" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePolicies}
                    disabled={policiesSaving}
                    className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
                  >
                    {policiesSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                    Enregistrer
                  </Button>
                </div>
              )}

              {/* Password Policy */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#1B4F72]" />
                    <CardTitle className="text-base">Politique de mot de passe</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Longueur minimale</Label>
                      <span className="text-sm font-semibold text-[#1B4F72]">{policies.passwordMinLength}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[policies.passwordMinLength]}
                        min={6}
                        max={128}
                        step={1}
                        onValueChange={(v) => setPolicies((p) => ({ ...p, passwordMinLength: v[0] }))}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={6}
                        max={128}
                        value={policies.passwordMinLength}
                        onChange={(e) => {
                          const v = Math.min(128, Math.max(6, Number(e.target.value) || 6));
                          setPolicies((p) => ({ ...p, passwordMinLength: v }));
                        }}
                        className="w-20 text-center"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw-upper">Exiger des majuscules</Label>
                      <Switch
                        id="pw-upper"
                        checked={policies.passwordRequireUppercase}
                        onCheckedChange={(v) => setPolicies((p) => ({ ...p, passwordRequireUppercase: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw-numbers">Exiger des chiffres</Label>
                      <Switch
                        id="pw-numbers"
                        checked={policies.passwordRequireNumbers}
                        onCheckedChange={(v) => setPolicies((p) => ({ ...p, passwordRequireNumbers: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw-special">Exiger des caractères spéciaux</Label>
                      <Switch
                        id="pw-special"
                        checked={policies.passwordRequireSpecialChars}
                        onCheckedChange={(v) => setPolicies((p) => ({ ...p, passwordRequireSpecialChars: v }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session & Login */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#1B4F72]" />
                    <CardTitle className="text-base">Session &amp; Connexion</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Durée de session (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min={5}
                      max={1440}
                      value={policies.sessionTimeoutMinutes}
                      onChange={(e) => {
                        const v = Math.min(1440, Math.max(5, Number(e.target.value) || 60));
                        setPolicies((p) => ({ ...p, sessionTimeoutMinutes: v }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-login">Tentatives de connexion max</Label>
                    <Input
                      id="max-login"
                      type="number"
                      min={1}
                      max={20}
                      value={policies.maxLoginAttempts}
                      onChange={(e) => {
                        const v = Math.min(20, Math.max(1, Number(e.target.value) || 5));
                        setPolicies((p) => ({ ...p, maxLoginAttempts: v }));
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 2FA Policy */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-[#1B4F72]" />
                    <CardTitle className="text-base">Authentification à deux facteurs (2FA)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enforce-2fa">Imposer le 2FA pour tous les utilisateurs</Label>
                    <Switch
                      id="enforce-2fa"
                      checked={policies.enforce2FA}
                      onCheckedChange={(v) => setPolicies((p) => ({ ...p, enforce2FA: v }))}
                    />
                  </div>
                  {policies.enforce2FA && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-400">
                        Tous les utilisateurs devront configurer le 2FA lors de leur prochaine connexion. Les utilisateurs sans 2FA configuré seront invités à le faire.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ==================== PERMISSIONS ==================== */}
        <TabsContent value="permissions" className="space-y-4">
          {permissionsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : permissionsData ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{permissionsData.summary.totalPermissions}</p>
                      <p className="text-xs text-muted-foreground">Permissions totales</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20">
                      <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{permissionsData.summary.rolesCount}</p>
                      <p className="text-xs text-muted-foreground">Rôles</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20">
                      <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{permissionsData.summary.modulesCount}</p>
                      <p className="text-xs text-muted-foreground">Modules</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions Legend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Légende des actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {ACTION_LEGEND.map((item) => (
                    <div key={item.action} className="flex items-center gap-1.5">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Role Accordion */}
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                    <Accordion type="multiple" className="w-full">
                      {permissionsData.roles.map((role) => (
                        <AccordionItem key={role.name} value={role.name}>
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className={`${ROLE_COLORS[role.name] || ''} text-xs`}>
                                {ROLE_LABELS[role.name] || role.name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {role.total} permissions — {role.modules.length} modules
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {role.modules.map((mod) => (
                                <div
                                  key={mod.module}
                                  className="flex items-center justify-between rounded-lg border p-3"
                                >
                                  <span className="text-sm font-medium">{mod.module}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {mod.count}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune donnée de permissions disponible
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== JOURNAL D'AUDIT ==================== */}
        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <Select value={auditActionFilter} onValueChange={(v) => { setAuditActionFilter(v); setAuditPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrer par action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="LOGIN">Connexion</SelectItem>
                  <SelectItem value="LOGOUT">Déconnexion</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                  <SelectItem value="CHANGE_PASSWORD">Changement mot de passe</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Filtrer par ressource..."
                value={auditResourceFilter === 'all' ? '' : auditResourceFilter}
                onChange={(e) => {
                  const v = e.target.value || 'all';
                  setAuditResourceFilter(v);
                  setAuditPage(1);
                }}
                className="flex-1"
              />
              {auditResourceFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAuditResourceFilter('all'); setAuditPage(1); }}
                >
                  <X className="mr-1 h-4 w-4" />
                  Effacer
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Total count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {auditTotal} entrée{auditTotal > 1 ? 's' : ''} trouvée{auditTotal > 1 ? 's' : ''} — Page {auditPage}/{auditTotalPages}
            </p>
          </div>

          {auditLoading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : auditEntries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune entrée dans le journal d'audit
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table */}
              <Card className="hidden lg:block">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Ressource</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Adresse IP</TableHead>
                          <TableHead>Appareil</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <span className="font-medium text-sm">{entry.userName}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs ${ACTION_COLORS[entry.action] || ''}`}>
                                {entry.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{entry.resource}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{entry.ipAddress || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {isMobileUA(entry.userAgent) ? (
                                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                                  {entry.userAgent ? entry.userAgent.split(' ').slice(0, 3).join(' ') : '—'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {auditEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{entry.userName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${ACTION_COLORS[entry.action] || ''}`}>
                          {entry.action}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{entry.resource}</Badge>
                        {entry.ipAddress && (
                          <span className="text-[10px] text-muted-foreground font-mono">{entry.ipAddress}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                        {isMobileUA(entry.userAgent) ? (
                          <Smartphone className="h-3.5 w-3.5" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[10px] truncate max-w-[250px]">
                          {entry.userAgent ? entry.userAgent.split(' ').slice(0, 4).join(' ') : 'Inconnu'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {auditTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPage <= 1}
                    onClick={() => handleAuditPageChange(auditPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {auditPage} / {auditTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPage >= auditTotalPages}
                    onClick={() => handleAuditPageChange(auditPage + 1)}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
