'use client';

import { DocumentTemplate } from './DocumentTemplate';

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

interface CertificatScolariteProps {
  student: StudentData;
  institutionSettings?: InstitutionSettings | null;
  showPrintButton?: boolean;
}

// ─── Component ─────────────────────────────────────────────

export function CertificatScolarite({
  student,
  institutionSettings,
  showPrintButton = false,
}: CertificatScolariteProps) {
  const fullName = `${student.lastName} ${student.firstName}`.toUpperCase().trim();
  const year = institutionSettings?.academicYear ?? '2025-2026';
  const schoolName = institutionSettings?.schoolName ?? "Institut Polytechnique Vase d'Élites (IPVE)";
  const filiere = student.filiereName ?? '—';
  const level = student.levelName ?? '—';
  const className = student.className ?? '—';

  return (
    <DocumentTemplate
      title="CERTIFICAT DE SCOLARITÉ"
      subtitle={`Année académique ${year}`}
      referenceNumber={`N° ${student.studentNumber}/SCOL/${new Date().getFullYear()}`}
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
        <div className="my-6 py-3 rounded-lg" style={{ background: '#1B4F72' }}>
          <p className="text-center text-xl font-extrabold text-white tracking-wide">
            {fullName}
          </p>
        </div>

        {/* Statement */}
        <p className="text-justify indent-8">
          suit régulièrement les cours de <strong className="text-gray-900">{filiere}</strong>, niveau{' '}
          <strong className="text-gray-900">{level}</strong>, classe <strong className="text-gray-900">{className}</strong> pour
          l&apos;année académique <strong className="text-gray-900">{year}</strong>.
        </p>

        {/* Conduct */}
        <p className="text-justify indent-8">
          L&apos;élève a un taux de fréquentation satisfaisant et se comporte
          convenablement au sein de l&apos;établissement.
        </p>

        {/* Details Table */}
        <div className="my-6 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-[13px]">
            <tbody>
              <DetailRow label="Matricule" value={student.studentNumber} />
              <DetailRow label="Filière" value={filiere} />
              <DetailRow label="Niveau" value={level} />
              <DetailRow label="Classe" value={className} />
            </tbody>
          </table>
        </div>

        {/* Closing */}
        <p className="text-justify indent-8 mt-6">
          Ce certificat est délivré pour valoir ce que de droit.
        </p>
      </div>
    </DocumentTemplate>
  );
}

// ─── Detail Row Sub-component ──────────────────────────────

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  const isEven = label === 'Filière' || label === 'Classe';
  return (
    <tr className={isEven ? 'bg-gray-50/80' : ''}>
      <td className="py-2.5 px-4 font-semibold text-gray-500 align-top whitespace-nowrap w-[160px]">
        {label}
      </td>
      <td className="py-2.5 px-4 text-gray-900 font-semibold border-l border-gray-100">
        {value ?? '—'}
      </td>
    </tr>
  );
}
