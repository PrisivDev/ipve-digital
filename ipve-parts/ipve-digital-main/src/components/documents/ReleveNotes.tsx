'use client';

import { DocumentTemplate } from './DocumentTemplate';
import { BRAND_COLOR } from '@/lib/print-utils';

// ─── Types ─────────────────────────────────────────────────

interface StudentData {
  firstName: string;
  lastName: string;
  studentNumber: string;
  dateOfBirth?: string | null;
  gender?: string;
  photoUrl?: string | null;
  filiereName?: string | null;
  levelName?: string | null;
  className?: string | null;
  enrollmentDate?: string | null;
}

interface GradeEntry {
  subjectName: string;
  evaluationType: string;
  score: number;
  maxScore: number;
  coefficient: number;
  periodName: string;
}

interface InstitutionSettings {
  schoolName?: string;
  shortName?: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  academicYear?: string;
}

interface ReleveNotesProps {
  student: StudentData;
  grades?: GradeEntry[];
  overallAverage?: number | null;
  institutionSettings?: InstitutionSettings | null;
  showPrintButton?: boolean;
}

// ─── Component ─────────────────────────────────────────────

export function ReleveNotes({
  student,
  grades,
  overallAverage,
  institutionSettings,
  showPrintButton = false,
}: ReleveNotesProps) {
  const fullName = `${student.lastName} ${student.firstName}`.toUpperCase().trim();
  const year = institutionSettings?.academicYear ?? '2025-2026';

  const hasGrades = grades && grades.length > 0;

  const calculatedAverage =
    overallAverage ??
    (hasGrades
      ? grades!.reduce((acc, g) => {
          const score20 = (g.score / g.maxScore) * 20;
          return acc + score20 * g.coefficient;
        }, 0) /
        grades!.reduce((acc, g) => acc + g.coefficient, 0)
      : null);

  const getMention = (avg: number) => {
    if (avg >= 16) return { text: 'Très Bien', color: '#15803d' };
    if (avg >= 14) return { text: 'Bien', color: '#16a34a' };
    if (avg >= 12) return { text: 'Assez Bien', color: '#2563eb' };
    if (avg >= 10) return { text: 'Passable', color: '#d97706' };
    return { text: 'Insuffisant', color: '#dc2626' };
  };

  return (
    <DocumentTemplate
      title="RELEVÉ DES NOTES"
      subtitle={`Année académique ${year}`}
      referenceNumber={`N° ${student.studentNumber}/NOTES/${new Date().getFullYear()}`}
      institutionSettings={institutionSettings}
      showPrintButton={showPrintButton}
    >
      <div className="space-y-5 text-[13px] text-gray-700">
        {/* Student Info Bar */}
        <div className="my-4 py-3 px-5 rounded-lg flex items-center justify-between" style={{ background: '#f8fafc' }}>
          <div className="flex gap-6">
            <InfoItem label="Élève" value={fullName} />
            <InfoItem label="Matricule" value={student.studentNumber} />
          </div>
          <div className="flex gap-6">
            <InfoItem label="Filière" value={student.filiereName ?? '—'} />
            <InfoItem label="Niveau" value={student.levelName ?? '—'} />
          </div>
        </div>

        {/* Grades Table */}
        {hasGrades ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: BRAND_COLOR }}>
                  <th className="text-left py-3 px-4 font-semibold text-white">Matière</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Type</th>
                  <th className="text-center py-3 px-4 font-semibold text-white">Note/20</th>
                  <th className="text-center py-3 px-4 font-semibold text-white">Coef</th>
                  <th className="text-right py-3 px-4 font-semibold text-white">Note pondérée</th>
                </tr>
              </thead>
              <tbody>
                {grades!.map((g, i) => {
                  const score20 = (g.score / g.maxScore) * 20;
                  const weighted = score20 * g.coefficient;
                  const isEven = i % 2 === 1;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 ${isEven ? 'bg-gray-50/60' : ''}`}
                    >
                      <td className="py-2.5 px-4 font-medium text-gray-800">{g.subjectName}</td>
                      <td className="py-2.5 px-4 text-gray-500">{g.evaluationType}</td>
                      <td className="py-2.5 px-4 text-center">
                        <GradeBadge score={score20} />
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold">{g.coefficient}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-gray-800">
                        {weighted.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 text-center py-12 rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-base text-gray-400">Aucune note disponible pour cette période.</p>
          </div>
        )}

        {/* Overall Average */}
        {calculatedAverage !== null && (
          <div className="mt-5 flex items-center justify-between rounded-lg p-5 border-2" style={{ borderColor: getMention(calculatedAverage).color + '40' }}>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Moyenne générale</span>
              <span
                className="text-2xl font-extrabold"
                style={{ color: getMention(calculatedAverage).color }}
              >
                {calculatedAverage.toFixed(2)}/20
              </span>
            </div>
            <span
              className="text-sm font-bold px-4 py-1.5 rounded-full"
              style={{
                color: getMention(calculatedAverage).color,
                background: getMention(calculatedAverage).color + '15',
              }}
            >
              {getMention(calculatedAverage).text}
            </span>
          </div>
        )}
      </div>
    </DocumentTemplate>
  );
}

// ─── Sub-components ────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
      <p className="text-[13px] font-bold text-gray-800">{value}</p>
    </div>
  );
}

function GradeBadge({ score }: { score: number }) {
  let style: React.CSSProperties;
  let label: string;

  if (score >= 16) {
    style = { background: '#dcfce7', color: '#15803d' };
    label = 'TB';
  } else if (score >= 12) {
    style = { background: '#dbeafe', color: '#1d4ed8' };
    label = 'B';
  } else if (score >= 10) {
    style = { background: '#fef3c7', color: '#d97706' };
    label = 'P';
  } else {
    style = { background: '#fee2e2', color: '#dc2626' };
    label = 'I';
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={style}>
      {score.toFixed(1)}
      <span className="opacity-60 text-[9px]">{label}</span>
    </span>
  );
}
