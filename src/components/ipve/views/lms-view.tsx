'use client';

import {
  ClipboardList,
  Clock,
  CalendarDays,
  BookMarked,
  BookOpen,
  FileBarChart,
} from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
        {/* Modern tab bar */}
        <div className="relative">
          <div className="flex gap-0.5 overflow-x-auto pb-px scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-0.5 min-w-0">
              {lmsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = lmsSection === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setLmsSection(tab.value)}
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

        {lmsTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <SectionRenderer section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
