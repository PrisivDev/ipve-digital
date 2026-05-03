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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
        {/* Modern tab bar */}
        <div className="relative">
          <div className="flex gap-0.5 overflow-x-auto pb-px scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-0.5 min-w-0">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = settingsSection === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setSettingsSection(tab.value)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0',
                      isActive
                        ? 'text-foreground bg-muted shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-[#1B4F72]')} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-border/60" />
        </div>

        {settingsTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
