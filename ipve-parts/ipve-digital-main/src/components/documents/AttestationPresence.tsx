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

interface AttendanceData {
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
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

interface AttestationPresenceProps {
  student: StudentData;
  attendance?: AttendanceData | null;
  institutionSettings?: InstitutionSettings | null;
  showPrintButton?: boolean;
}

// ─── Component ─────────────────────────────────────────────

export function AttestationPresence({
  student,
  attendance,
  institutionSettings,
  showPrintButton = false,
}: AttestationPresenceProps) {
  const fullName = `${student.lastName} ${student.firstName}`.toUpperCase().trim();
  const year = institutionSettings?.academicYear ?? '2025-2026';
  const schoolName = institutionSettings?.schoolName ?? "Institut Polytechnique Vase d'Élites (IPVE)";
  const className = student.className ?? '—';

  const att = attendance ?? {
    totalSessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    rate: 0,
  };

  const rate = att.rate ?? 0;
  const isSatisfactory = rate >= 75;
  const judgment = isSatisfactory ? 'satisfaisant' : 'insuffisant';
  const judgmentColor = isSatisfactory ? '#16a34a' : '#dc2626';

  return (
    <DocumentTemplate
      title="ATTESTATION DE PRÉSENCE"
      subtitle={`Année académique ${year}`}
      referenceNumber={`N° ${student.studentNumber}/PRES/${new Date().getFullYear()}`}
      institutionSettings={institutionSettings}
      showPrintButton={showPrintButton}
    >
      <div className="space-y-5 text-[13px] leading-[1.8] text-gray-700">
        {/* Introduction */}
        <p className="text-justify indent-8">
          Je soussigné(e), Directeur de la{' '}
          <strong className="text-gray-900">{schoolName}</strong>, certifie que :
        </p>

        {/* Student Name — Highlighted */}
        <div className="my-6 py-3 rounded-lg" style={{ background: BRAND_COLOR }}>
          <p className="text-center text-xl font-extrabold text-white tracking-wide">
            {fullName}
          </p>
        </div>

        {/* Statement */}
        <p className="text-justify indent-8">
          a assisté aux cours de la classe <strong className="text-gray-900">{className}</strong> pour
          l&apos;année académique <strong className="text-gray-900">{year}</strong>.
        </p>

        {/* Attendance Stats */}
        <div className="my-6 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: BRAND_COLOR }}>
                <th className="text-center py-3 px-4 font-semibold text-white">Total séances</th>
                <th className="text-center py-3 px-4 font-semibold text-white">Présent</th>
                <th className="text-center py-3 px-4 font-semibold text-white">Absent</th>
                <th className="text-center py-3 px-4 font-semibold text-white">En retard</th>
                <th className="text-center py-3 px-4 font-semibold text-white">Taux</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50/60">
                <td className="text-center py-4 px-4 font-bold text-gray-800 text-base">
                  {att.totalSessions}
                </td>
                <td className="text-center py-4 px-4 font-bold text-emerald-600 text-base">
                  {att.present}
                </td>
                <td className="text-center py-4 px-4 font-bold text-red-600 text-base">
                  {att.absent}
                </td>
                <td className="text-center py-4 px-4 font-bold text-amber-600 text-base">
                  {att.late}
                </td>
                <td className="text-center py-4 px-4">
                  <span
                    className="inline-flex items-center justify-center w-16 h-9 rounded-full text-[13px] font-extrabold"
                    style={{
                      color: judgmentColor,
                      background: judgmentColor + '15',
                    }}
                  >
                    {rate.toFixed(0)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Judgment */}
        <p className="text-justify indent-8">
          Le taux de présence de <strong className="text-gray-900">{rate.toFixed(1)}%</strong> est jugé{' '}
          <strong style={{ color: judgmentColor }}>
            {judgment}
          </strong>
          .
        </p>

        {/* Closing */}
        <p className="text-justify indent-8 mt-6">
          En foi de quoi, la présente attestation lui est délivrée pour servir
          et valoir ce que de droit.
        </p>
      </div>
    </DocumentTemplate>
  );
}
