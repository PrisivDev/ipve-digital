'use client';

import {
  Users,
  UserPlus,
  Phone,
  BookOpen,
  Briefcase,
  FileText,
  FileCheck,
  IdCard,
  MessageSquare,
} from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAppStore, type CrmSection } from '@/store/app-store';
import { StudentsSection } from '@/components/ipve/crm/students-section';
import { ProspectsSection } from '@/components/ipve/crm/prospects-section';
import { ParentsSection } from '@/components/ipve/crm/parents-section';
import { TeachersSection } from '@/components/ipve/crm/teachers-section';
import { EmployeesSection } from '@/components/ipve/crm/employees-section';
import { EnrollmentsSection } from '@/components/ipve/crm/enrollments-section';
import { AdmissionsSection } from '@/components/ipve/crm/admissions-section';
import { StudentCardsSection } from '@/components/ipve/crm/student-cards-section';
import { CommunicationsSection } from '@/components/ipve/crm/communications-section';

const crmTabs = [
  { value: 'students', label: 'Étudiants', icon: Users },
  { value: 'prospects', label: 'Prospects', icon: UserPlus },
  { value: 'parents', label: 'Parents', icon: Phone },
  { value: 'teachers', label: 'Enseignants', icon: BookOpen },
  { value: 'employees', label: 'Employes', icon: Briefcase },
  { value: 'enrollments', label: 'Inscriptions', icon: FileText },
  { value: 'admissions', label: 'Admissions', icon: FileCheck },
  { value: 'student-cards', label: 'Cartes', icon: IdCard },
  { value: 'communications', label: 'Communications', icon: MessageSquare },
] as const;

function SectionRenderer({ section }: { section: CrmSection }) {
  switch (section) {
    case 'students':
      return <StudentsSection />;
    case 'prospects':
      return <ProspectsSection />;
    case 'parents':
      return <ParentsSection />;
    case 'teachers':
      return <TeachersSection />;
    case 'employees':
      return <EmployeesSection />;
    case 'enrollments':
      return <EnrollmentsSection />;
    case 'admissions':
      return <AdmissionsSection />;
    case 'student-cards':
      return <StudentCardsSection />;
    case 'communications':
      return <CommunicationsSection />;
  }
}

export function CrmView() {
  const { crmSection, setCrmSection } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">CRM</h2>
        <p className="text-sm text-muted-foreground">Gestion des contacts et des relations</p>
      </div>

      <Tabs value={crmSection} onValueChange={(v) => setCrmSection(v as CrmSection)}>
        {/* Modern tab bar */}
        <div className="relative">
          <div className="flex gap-0.5 overflow-x-auto pb-px scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-0.5 min-w-0">
              {crmTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = crmSection === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setCrmSection(tab.value)}
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

        {crmTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
