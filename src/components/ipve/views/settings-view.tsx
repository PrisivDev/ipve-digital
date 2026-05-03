'use client';

import {
  LayoutDashboard,
  School,
  GraduationCap,
  BookOpen,
  List,
  CalendarDays,
  DollarSign,
  Tag,
  Truck,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type SettingsSection } from '@/store/app-store';
import { OverviewSettings } from '@/components/ipve/settings/overview-settings';
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

const settingsTabs = [
  // Vue d'ensemble
  { value: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  // Institution
  { value: 'institution', label: 'Institution', icon: School },
  // Académique
  { value: 'filieres', label: 'Filières', icon: BookOpen },
  { value: 'niveaux', label: 'Niveaux', icon: List },
  { value: 'classes', label: 'Classes', icon: Users },
  { value: 'matieres', label: 'Matières', icon: GraduationCap },
  { value: 'annees-scolaires', label: 'Années scolaires', icon: CalendarDays },
  // Financier
  { value: 'config-paiements', label: 'Config paiements', icon: DollarSign },
  { value: 'categories-depenses', label: 'Cat. dépenses', icon: Tag },
  { value: 'fournisseurs', label: 'Fournisseurs', icon: Truck },
  // Utilisateurs & Sécurité
  { value: 'users', label: 'Utilisateurs', icon: Users },
  { value: 'roles-permissions', label: 'Rôles & Permissions', icon: Shield },
  { value: 'securite', label: 'Sécurité', icon: Shield },
  { value: 'audit', label: 'Audit', icon: Database },
  // Communications
  { value: 'notifications', label: 'Notifications', icon: Bell },
  // Système
  { value: 'apparence', label: 'Apparence', icon: Palette },
  { value: 'donnees', label: 'Données', icon: Database },
] as const;

function SectionRenderer({ section }: { section: SettingsSection }) {
  switch (section) {
    case 'overview':
      return <OverviewSettings />;
    case 'institution':
      return <GeneralSettings />;
    case 'filieres':
      return <FilieresSettings />;
    case 'niveaux':
      return <NiveauxSettings />;
    case 'classes':
      return <ClassesSettings />;
    case 'matieres':
      return <MatieresSettings />;
    case 'annees-scolaires':
      return <AnneesScolairesSettings />;
    case 'config-paiements':
      return <ConfigPaiementsSettings />;
    case 'categories-depenses':
      return <CategoriesDepensesSettings />;
    case 'fournisseurs':
      return <FournisseursSettings />;
    case 'users':
      return <UsersManagement />;
    case 'roles-permissions':
      return <RolesPermissionsSettings />;
    case 'securite':
      return <SecuriteSettings />;
    case 'audit':
      return <AuditSettings />;
    case 'notifications':
      return <NotificationsSettings />;
    case 'apparence':
      return <ApparenceSettings />;
    case 'donnees':
      return <DonneesSettings />;
    default:
      return <OverviewSettings />;
  }
}

export function SettingsView() {
  const { settingsSection, setSettingsSection } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-sm text-muted-foreground">Configurer et gérer l&apos;application IPVE</p>
      </div>

      <Tabs value={settingsSection} onValueChange={(v) => setSettingsSection(v as SettingsSection)}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {settingsTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
