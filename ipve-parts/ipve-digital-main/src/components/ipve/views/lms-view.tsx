'use client';

import {
  ClipboardList,
  Clock,
  CalendarDays,
  BookMarked,
  BookOpen,
  FileBarChart,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type LmsSection } from '@/store/app-store';
import { GradesSection } from '@/components/ipve/lms/grades-section';
import { AttendanceSection } from '@/components/ipve/lms/attendance-section';
import { TimetableSection } from '@/components/ipve/lms/timetable-section';
import { ProgramsSection } from '@/components/ipve/lms/programs-section';
import { SubjectsSection } from '@/components/ipve/lms/subjects-section';
import { ReportCardsSection } from '@/components/ipve/lms/report-cards-section';

const lmsTabs = [
  { value: 'grades', label: 'Notes', icon: ClipboardList },
  { value: 'attendance', label: 'Assiduité', icon: Clock },
  { value: 'timetable', label: 'Emploi du temps', icon: CalendarDays },
  { value: 'programs', label: 'Programmes', icon: BookMarked },
  { value: 'subjects', label: 'Matières', icon: BookOpen },
  { value: 'report-cards', label: 'Bulletins', icon: FileBarChart },
] as const;

function SectionRenderer({ section }: { section: LmsSection }) {
  switch (section) {
    case 'grades':
      return <GradesSection />;
    case 'attendance':
      return <AttendanceSection />;
    case 'timetable':
      return <TimetableSection />;
    case 'programs':
      return <ProgramsSection />;
    case 'subjects':
      return <SubjectsSection />;
    case 'report-cards':
      return <ReportCardsSection />;
  }
}

export function LmsView() {
  const { lmsSection, setLmsSection } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">LMS</h2>
        <p className="text-sm text-muted-foreground">Gestion académique et pédagogique</p>
      </div>

      <Tabs value={lmsSection} onValueChange={(v) => setLmsSection(v as LmsSection)}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {lmsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {lmsTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
