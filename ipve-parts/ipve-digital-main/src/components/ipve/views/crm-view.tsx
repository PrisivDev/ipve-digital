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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {crmTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {crmTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
