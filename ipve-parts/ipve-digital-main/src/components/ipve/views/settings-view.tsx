'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, School, GraduationCap, BookOpen, List,
  CalendarDays, DollarSign, Tag, Truck, Users, Shield, Bell,
  Palette, Database, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore, type SettingsSection } from '@/store/app-store';
import { GeneralSettings } from '@/components/ipve/settings/general-settings';
import { UsersManagement } from '@/components/ipve/settings/users-management';
import { FilieresSettings, NiveauxSettings, ClassesSettings, MatieresSettings, AnneesScolairesSettings } from '@/components/ipve/settings/academic';
import { ConfigPaiementsSettings, CategoriesDepensesSettings, FournisseursSettings } from '@/components/ipve/settings/financial';
import { RolesPermissionsSettings } from '@/components/ipve/settings/roles-permissions-settings';
import { SecuriteSettings } from '@/components/ipve/settings/securite-settings';
import { AuditSettings } from '@/components/ipve/settings/audit-settings';
import { NotificationsSettings } from '@/components/ipve/settings/notifications-settings';
import { ApparenceSettings } from '@/components/ipve/settings/apparence-settings';
import { DonneesSettings } from '@/components/ipve/settings/donnees-settings';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavItem {
  key: SettingsSection;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  key: string;
  label: string;
  icon?: React.ElementType;
  items: NavItem[];
  standalone?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    items: [],
    standalone: true,
  },
  {
    key: 'institution',
    label: 'Institution',
    icon: School,
    items: [{ key: 'institution', label: 'Informations générales', icon: School }],
  },
  {
    key: 'academique',
    label: 'Académique',
    icon: GraduationCap,
    items: [
      { key: 'filieres', label: 'Filières', icon: BookOpen },
      { key: 'niveaux', label: 'Niveaux', icon: List },
      { key: 'classes', label: 'Classes', icon: Users },
      { key: 'matieres', label: 'Matières', icon: Tag },
      { key: 'annees-scolaires', label: 'Années scolaires', icon: CalendarDays },
    ],
  },
  {
    key: 'financier',
    label: 'Financier',
    icon: DollarSign,
    items: [
      { key: 'config-paiements', label: 'Configuration paiements', icon: DollarSign },
      { key: 'categories-depenses', label: 'Catégories de dépenses', icon: Tag },
      { key: 'fournisseurs', label: 'Fournisseurs', icon: Truck },
    ],
  },
  {
    key: 'users-security',
    label: 'Utilisateurs & Sécurité',
    icon: Shield,
    items: [
      { key: 'users', label: 'Utilisateurs', icon: Users },
      { key: 'roles-permissions', label: 'Rôles & Permissions', icon: Shield },
      { key: 'securite', label: 'Sécurité', icon: Shield },
      { key: 'audit', label: 'Journal d\'audit', icon: Shield },
    ],
  },
  {
    key: 'communications',
    label: 'Communications',
    icon: Bell,
    items: [{ key: 'notifications', label: 'Notifications', icon: Bell }],
  },
  {
    key: 'system',
    label: 'Système',
    icon: Database,
    items: [
      { key: 'apparence', label: 'Apparence', icon: Palette },
      { key: 'donnees', label: 'Données', icon: Database },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Overview Stats                                                    */
/* ------------------------------------------------------------------ */

const OVERVIEW_GROUPS = [
  {
    title: 'Institution',
    description: 'Informations de l\'établissement',
    icon: School,
    color: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    section: 'institution' as SettingsSection,
  },
  {
    title: 'Académique',
    description: 'Filières, niveaux, classes, matières, années scolaires',
    icon: GraduationCap,
    color: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    section: 'filieres' as SettingsSection,
  },
  {
    title: 'Financier',
    description: 'Configuration paiements, catégories, fournisseurs',
    icon: DollarSign,
    color: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    section: 'config-paiements' as SettingsSection,
  },
  {
    title: 'Utilisateurs & Sécurité',
    description: 'Comptes, rôles, permissions, sécurité, audit',
    icon: Shield,
    color: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    section: 'users' as SettingsSection,
  },
  {
    title: 'Communications',
    description: 'Notifications et alertes',
    icon: Bell,
    color: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    section: 'notifications' as SettingsSection,
  },
  {
    title: 'Système',
    description: 'Apparence et gestion des données',
    icon: Database,
    color: 'bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    section: 'donnees' as SettingsSection,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SettingsView() {
  const settingsSection = useAppStore((s) => s.settingsSection);
  const setSettingsSection = useAppStore((s) => s.setSettingsSection);

  // Accordion state: one group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>('institution');

  // Auto schema-sync: ensure all required tables exist before rendering
  const [schemaReady, setSchemaReady] = useState<boolean | null>(null);
  const [syncMessage, setSyncMessage] = useState('');

  const ensureSchema = useCallback(async () => {
    try {
      setSyncMessage('Vérification de la base de données…');
      const checkRes = await fetch('/api/setup/sync-schema');
      if (!checkRes.ok) {
        // Auth might not be ready yet; allow render and let individual API calls handle auth
        setSchemaReady(true);
        return;
      }
      const checkData = await checkRes.json();
      if (checkData.allTablesExist) {
        setSchemaReady(true);
        return;
      }

      // Tables are missing — run the sync
      setSyncMessage(`Création de ${checkData.missingCount} table(s) manquante(s)…`);
      const syncRes = await fetch('/api/setup/sync-schema', { method: 'POST' });
      if (syncRes.ok) {
        setSchemaReady(true);
      } else {
        // Sync failed but still allow render (some sections may work)
        setSchemaReady(true);
        console.warn('[Settings] Schema sync returned non-OK, proceeding anyway');
      }
    } catch {
      // Network error or other issue — allow render
      setSchemaReady(true);
    }
  }, []);

  useEffect(() => {
    ensureSchema();
  }, [ensureSchema]);

  // Show loading while schema is being synced
  if (schemaReady === null) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{syncMessage || 'Initialisation…'}</span>
      </div>
    );
  }

  const handleNavClick = (key: SettingsSection) => {
    setSettingsSection(key);
    // Auto-expand the parent group
    const group = NAV_GROUPS.find((g) =>
      g.standalone ? g.key === key : g.items.some((i) => i.key === key),
    );
    if (group && !group.standalone) setOpenGroup(group.key);
  };

  /* ---- Render section content ---- */
  const renderSection = () => {
    switch (settingsSection) {
      case 'overview': return <OverviewDashboard onClick={handleNavClick} />;
      case 'institution': return <GeneralSettings />;
      case 'filieres': return <FilieresSettings />;
      case 'niveaux': return <NiveauxSettings />;
      case 'classes': return <ClassesSettings />;
      case 'matieres': return <MatieresSettings />;
      case 'annees-scolaires': return <AnneesScolairesSettings />;
      case 'config-paiements': return <ConfigPaiementsSettings />;
      case 'categories-depenses': return <CategoriesDepensesSettings />;
      case 'fournisseurs': return <FournisseursSettings />;
      case 'users': return <UsersManagement />;
      case 'roles-permissions': return <RolesPermissionsSettings />;
      case 'securite': return <SecuriteSettings />;
      case 'audit': return <AuditSettings />;
      case 'notifications': return <NotificationsSettings />;
      case 'apparence': return <ApparenceSettings />;
      case 'donnees': return <DonneesSettings />;
      default: return <OverviewDashboard onClick={handleNavClick} />;
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col">
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-0.5 px-2">
            {NAV_GROUPS.map((group) => {
              // Standalone item (overview)
              if (group.standalone) {
                const Icon = group.icon!;
                const isActive = settingsSection === group.key;
                return (
                  <button
                    key={group.key}
                    onClick={() => handleNavClick(group.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-[#8B1C2D]/10 text-[#8B1C2D] dark:text-[#8B1C2D] font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-[#8B1C2D]/15' : 'bg-muted/50'}`}>
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#8B1C2D]' : ''}`} />
                    </div>
                    <span>{group.label}</span>
                  </button>
                );
              }

              // Expandable group
              const isGroupOpen = openGroup === group.key;
              const isGroupActive = group.items.some((i) => i.key === settingsSection);
              const GroupIcon = group.icon!;

              return (
                <div key={group.key}>
                  <button
                    onClick={() => setOpenGroup(isGroupOpen ? null : group.key)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                      isGroupActive
                        ? 'text-[#8B1C2D] dark:text-[#8B1C2D]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`transition-transform ${isGroupOpen ? 'rotate-90' : ''}`}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </span>
                    <GroupIcon className="h-3.5 w-3.5" />
                    <span>{group.label}</span>
                  </button>

                  {isGroupOpen && (
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = settingsSection === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleNavClick(item.key)}
                            className={`w-full flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-[#8B1C2D]/10 text-[#8B1C2D] dark:text-[#8B1C2D] font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 w-0.5 h-4 bg-[#8B1C2D] rounded-r" />
                            )}
                            <ItemIcon className={`h-4 w-4 ${isActive ? 'text-[#8B1C2D]' : 'text-muted-foreground/60'}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {renderSection()}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview Dashboard                                                  */
/* ------------------------------------------------------------------ */

function OverviewDashboard({ onClick }: { onClick: (key: SettingsSection) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-sm text-muted-foreground">Configurer et gérer l&apos;application IPVE</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OVERVIEW_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <Card
              key={group.section}
              className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
              onClick={() => onClick(group.section)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${group.color} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${group.iconColor}`} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{group.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick access - all items as compact list */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Accès rapide</h3>
          <div className="flex flex-wrap gap-2">
            {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
              <Button
                key={item.key}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onClick(item.key)}
              >
                <item.icon className="mr-1.5 h-3.5 w-3.5" />
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
