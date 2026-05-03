'use client';

import {
  School,
  GraduationCap,
  DollarSign,
  Shield,
  Bell,
  Database,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore, type SettingsSection } from '@/store/app-store';

const OVERVIEW_GROUPS = [
  {
    title: 'Institution',
    description: 'Informations de l\'établissement, logo, coordonnées',
    icon: School,
    color: 'bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-600 dark:text-red-400',
    section: 'institution' as SettingsSection,
  },
  {
    title: 'Académique',
    description: 'Filières, niveaux, classes, matières, années scolaires',
    icon: GraduationCap,
    color: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    section: 'filieres' as SettingsSection,
  },
  {
    title: 'Financier',
    description: 'Configuration paiements, catégories de dépenses, fournisseurs',
    icon: DollarSign,
    color: 'bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-600 dark:text-green-400',
    section: 'config-paiements' as SettingsSection,
  },
  {
    title: 'Utilisateurs & Sécurité',
    description: 'Comptes, rôles, permissions, sécurité, journal d\'audit',
    icon: Shield,
    color: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    section: 'users' as SettingsSection,
  },
  {
    title: 'Communications',
    description: 'Notifications et alertes',
    icon: Bell,
    color: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    section: 'notifications' as SettingsSection,
  },
  {
    title: 'Système',
    description: 'Apparence, thèmes et gestion des données',
    icon: Database,
    color: 'bg-teal-50 dark:bg-teal-950/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
    section: 'donnees' as SettingsSection,
  },
];

export function OverviewSettings() {
  const setSettingsSection = useAppStore((s) => s.setSettingsSection);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Bienvenue dans les paramètres de IPVE Digital. Sélectionnez une catégorie ci-dessous
        ou utilisez les onglets ci-dessus pour naviguer.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OVERVIEW_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <Card
              key={group.section}
              className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => setSettingsSection(group.section)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${group.color} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className={`h-5 w-5 ${group.iconColor}`} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
