'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  GraduationCap,
  Settings,
  ChevronDown,
  UserPlus,
  UserCheck,
  Phone,
  BookOpen,
  FileText,
  FileCheck,
  IdCard,
  MessageSquare,
  CreditCard,
  Receipt,
  PiggyBank,
  Calculator,
  Banknote,
  AlertTriangle,
  ClipboardList,
  Clock,
  CalendarDays,
  BookMarked,
  FileBarChart,
  LogOut,
  School,
  List,
  Tag,
  Truck,
  Shield,
  Bell,
  Palette,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type Module, type CrmSection, type ErpSection, type LmsSection, type SettingsSection } from '@/store/app-store';
import { useAuthStore } from '@/stores/auth.store';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface SubItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
}

interface ModuleGroup {
  id: Module;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
}

const moduleGroups: ModuleGroup[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    subItems: [
      { label: 'Étudiants', icon: UserCheck, section: 'students' },
      { label: 'Prospects', icon: UserPlus, section: 'prospects' },
      { label: 'Parents', icon: Phone, section: 'parents' },
      { label: 'Enseignants', icon: BookOpen, section: 'teachers' },
      { label: 'Inscriptions', icon: FileText, section: 'enrollments' },
      { label: 'Admissions', icon: FileCheck, section: 'admissions' },
      { label: 'Cartes étudiant', icon: IdCard, section: 'student-cards' },
      { label: 'Communications', icon: MessageSquare, section: 'communications' },
    ],
  },
  {
    id: 'erp',
    label: 'ERP',
    icon: Wallet,
    subItems: [
      { label: 'Finances', icon: LayoutDashboard, section: 'finance' },
      { label: 'Paiements', icon: CreditCard, section: 'payments' },
      { label: 'Dépenses', icon: Receipt, section: 'expenses' },
      { label: 'Budgets', icon: PiggyBank, section: 'budgets' },
      { label: 'Comptabilité', icon: Calculator, section: 'accounting' },
      { label: 'Paie', icon: Banknote, section: 'payroll' },
      { label: 'Impayés', icon: AlertTriangle, section: 'unpaid' },
    ],
  },
  {
    id: 'lms',
    label: 'LMS',
    icon: GraduationCap,
    subItems: [
      { label: 'Notes', icon: ClipboardList, section: 'grades' },
      { label: 'Assiduité', icon: Clock, section: 'attendance' },
      { label: 'Emploi du temps', icon: CalendarDays, section: 'timetable' },
      { label: 'Programmes', icon: BookMarked, section: 'programs' },
      { label: 'Matières', icon: BookOpen, section: 'subjects' },
      { label: 'Bulletins', icon: FileBarChart, section: 'report-cards' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    subItems: [
      { label: 'Vue d\'ensemble', icon: LayoutDashboard, section: 'overview' },
      { label: 'Institution', icon: School, section: 'institution' },
      { label: 'Filières', icon: BookOpen, section: 'filieres' },
      { label: 'Niveaux', icon: List, section: 'niveaux' },
      { label: 'Classes', icon: Users, section: 'classes' },
      { label: 'Matières', icon: BookMarked, section: 'matieres' },
      { label: 'Années scolaires', icon: CalendarDays, section: 'annees-scolaires' },
      { label: 'Config paiements', icon: CreditCard, section: 'config-paiements' },
      { label: 'Cat. dépenses', icon: Tag, section: 'categories-depenses' },
      { label: 'Fournisseurs', icon: Truck, section: 'fournisseurs' },
      { label: 'Utilisateurs', icon: UserCheck, section: 'users' },
      { label: 'Rôles & Permissions', icon: Shield, section: 'roles-permissions' },
      { label: 'Sécurité', icon: Shield, section: 'securite' },
      { label: 'Audit', icon: FileText, section: 'audit' },
      { label: 'Notifications', icon: Bell, section: 'notifications' },
      { label: 'Apparence', icon: Palette, section: 'apparence' },
      { label: 'Données', icon: Database, section: 'donnees' },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { activeModule, crmSection, erpSection, lmsSection, settingsSection, setActiveModule, setCrmSection, setErpSection, setLmsSection, setSettingsSection } = useAppStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Single expanded module — only one accordion open at a time
  // Default to 'crm' on first render, but will follow activeModule
  const [expandedId, setExpandedId] = useState<Module | null>('crm');

  const userInitials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : 'IP';
  const userDisplayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
  const userRole = user?.roleName ?? '';

  const hasSubItems = (id: Module) => !!moduleGroups.find(g => g.id === id)?.subItems;

  // A group is expanded if it matches the expandedId
  const isExpanded = (id: Module) => expandedId === id;

  const isSubItemActive = (groupId: Module, section: string) => {
    if (groupId === 'crm') return crmSection === section;
    if (groupId === 'erp') return erpSection === section;
    if (groupId === 'lms') return lmsSection === section;
    if (groupId === 'settings') return settingsSection === section;
    return false;
  };

  // Check if any sub-item within a group is currently active
  const hasActiveChild = (id: Module) => {
    const group = moduleGroups.find(g => g.id === id);
    if (!group?.subItems) return false;
    return group.subItems.some(sub => isSubItemActive(id, sub.section));
  };

  const handleGroupClick = (id: Module) => {
    if (hasSubItems(id)) {
      // Accordion toggle — only one open at a time
      setExpandedId(prev => (prev === id ? null : id));
    } else {
      // Standalone module — just activate
      setActiveModule(id);
    }
    onNavigate?.();
  };

  const handleSubItemClick = (groupId: Module, section: string) => {
    setActiveModule(groupId);
    if (groupId === 'crm') setCrmSection(section as CrmSection);
    if (groupId === 'erp') setErpSection(section as ErpSection);
    if (groupId === 'lms') setLmsSection(section as LmsSection);
    if (groupId === 'settings') setSettingsSection(section as SettingsSection);
    // Ensure parent accordion stays open
    setExpandedId(groupId);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/15 shadow-lg">
          <Image
            src="/logo-ipve.png"
            alt="IPVE Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            IPVE
          </span>
          <span className="text-[10px] text-sidebar-foreground/50 leading-none font-medium">
            Vase d'Élites
          </span>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar py-3 px-3">
        <div className="flex flex-col gap-0.5">
          {moduleGroups.map((group) => {
            const isStandalone = !group.subItems || group.subItems.length === 0;
            const isActive = activeModule === group.id && isStandalone;
            const expanded = isExpanded(group.id);
            const activeChild = hasActiveChild(group.id);
            const Icon = group.icon;

            return (
              <div key={group.id}>
                {/* Module header */}
                <button
                  onClick={() => handleGroupClick(group.id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                    // Standalone active (dashboard, settings) — full highlight
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      // Group with active child — subtle highlight on header only
                      : activeChild
                        ? 'text-sidebar-foreground font-semibold'
                        // Group expanded but no active child
                        : expanded
                          ? 'text-sidebar-foreground/90'
                          // Default idle state
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  {/* Left indicator bar — only for standalone active */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-sidebar-primary" />
                  )}

                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                      isActive
                        ? 'text-sidebar-primary'
                        : activeChild
                          ? 'text-sidebar-primary'
                          : expanded
                            ? 'text-sidebar-foreground/70'
                            : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
                    )}
                  />
                  <span className="flex-1 text-left">{group.label}</span>

                  {/* Accordion chevron — only for groups with sub-items */}
                  {group.subItems && (
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-sidebar-foreground/35 transition-transform duration-250 ease-out',
                        expanded && 'rotate-180 text-sidebar-foreground/60'
                      )}
                    />
                  )}
                </button>

                {/* Sub-items accordion — smooth open/close */}
                {group.subItems && (
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-in-out',
                      expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-3 mt-0.5 pl-3.5 border-l border-sidebar-border/25 flex flex-col gap-px py-1">
                        {group.subItems.map((sub) => {
                          const subActive = isSubItemActive(group.id, sub.section);
                          const SubIcon = sub.icon;
                          return (
                            <button
                              key={sub.section}
                              onClick={() => handleSubItemClick(group.id, sub.section)}
                              className={cn(
                                'group/sub relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-all duration-150',
                                // Active sub-item — highlight only this one
                                subActive
                                  ? 'bg-sidebar-primary/10 text-sidebar-foreground font-medium'
                                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/85'
                              )}
                            >
                              {/* Active sub-indicator dot */}
                              {subActive && (
                                <div className="absolute -left-[15px] top-1/2 -translate-y-1/2 h-3.5 w-[2.5px] rounded-r-full bg-sidebar-primary" />
                              )}
                              <SubIcon
                                className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-colors duration-150',
                                  subActive
                                    ? 'text-sidebar-primary'
                                    : 'text-sidebar-foreground/40 group-hover/sub:text-sidebar-foreground/70'
                                )}
                              />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer: User profile */}
      <div className="mt-auto">
        <Separator className="opacity-30 bg-sidebar-border" />
        <div className="p-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl bg-sidebar-accent/40 hover:bg-sidebar-accent/60 px-3 py-2.5 transition-colors duration-200 group"
            onClick={() => logout()}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold ring-1 ring-sidebar-primary/20">
              {userInitials}
            </div>
            <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
              <span className="text-[13px] font-medium text-sidebar-foreground truncate">
                {userDisplayName}
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 font-normal">
                {userRole}
              </span>
            </div>
            <LogOut className="h-4 w-4 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 border-r border-sidebar-border/40 bg-sidebar flex-col h-screen sticky top-0 shadow-lg shadow-black/10">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <div className="lg:hidden">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border/40 bg-sidebar transition-transform duration-300 ease-in-out shadow-2xl shadow-black/30 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onNavigate={() => onOpenChange(false)} />
      </aside>
    </div>
  );
}
