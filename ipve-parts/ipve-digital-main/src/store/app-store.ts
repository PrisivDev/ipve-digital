import { create } from 'zustand';

export type Module = 'dashboard' | 'crm' | 'erp' | 'lms' | 'settings';
export type CrmSection = 'students' | 'prospects' | 'parents' | 'teachers' | 'employees' | 'enrollments' | 'admissions' | 'student-cards' | 'communications';
export type ErpSection = 'finance' | 'payments' | 'expenses' | 'budgets' | 'accounting' | 'payroll' | 'unpaid';
export type LmsSection = 'grades' | 'attendance' | 'timetable' | 'programs' | 'subjects' | 'report-cards';
export type SettingsSection =
  // Académique
  | 'filieres' | 'niveaux' | 'classes' | 'matieres' | 'annees-scolaires'
  // Financier
  | 'config-paiements' | 'categories-depenses' | 'fournisseurs'
  // Utilisateurs & Sécurité
  | 'users' | 'roles-permissions' | 'securite' | 'audit'
  // Institution
  | 'institution'
  // Communications
  | 'notifications'
  // Système
  | 'apparence' | 'donnees'
  | 'overview';

interface AppState {
  activeModule: Module;
  crmSection: CrmSection;
  erpSection: ErpSection;
  lmsSection: LmsSection;
  settingsSection: SettingsSection;
  sidebarOpen: boolean;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
    avatar?: string;
  } | null;

  setActiveModule: (module: Module) => void;
  setCrmSection: (section: CrmSection) => void;
  setErpSection: (section: ErpSection) => void;
  setLmsSection: (section: LmsSection) => void;
  setSettingsSection: (section: SettingsSection) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentUser: (user: AppState['currentUser']) => void;
  navigateTo: (module: Module, section?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  crmSection: 'students',
  erpSection: 'finance',
  lmsSection: 'grades',
  settingsSection: 'overview',
  sidebarOpen: false,
  currentUser: {
    id: '1',
    firstName: 'Kouadio',
    lastName: 'Amani',
    email: 'admin@ipve.edu.ci',
    roleName: 'Administrateur',
  },

  setActiveModule: (module) => set({ activeModule: module }),
  setCrmSection: (section) => set({ crmSection: section, activeModule: 'crm' }),
  setErpSection: (section) => set({ erpSection: section, activeModule: 'erp' }),
  setLmsSection: (section) => set({ lmsSection: section, activeModule: 'lms' }),
  setSettingsSection: (section) => set({ settingsSection: section, activeModule: 'settings' }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentUser: (user) => set({ currentUser: user }),
  navigateTo: (module, section) => {
    const update: Partial<AppState> = { activeModule: module };
    if (module === 'crm' && section) update.crmSection = section as CrmSection;
    if (module === 'erp' && section) update.erpSection = section as ErpSection;
    if (module === 'lms' && section) update.lmsSection = section as LmsSection;
    if (module === 'settings' && section) update.settingsSection = section as SettingsSection;
    set(update);
  },
}));
