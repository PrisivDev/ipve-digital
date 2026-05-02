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

interface AttestationInscriptionProps {
  student: StudentData;
  institutionSettings?: InstitutionSettings | null;
  showPrintButton?: boolean;
}

// ─── Component ─────────────────────────────────────────────

export function AttestationInscription({
  student,
  institutionSettings,
  showPrintButton = false,
}: AttestationInscriptionProps) {
  const fullName = `${student.lastName} ${student.firstName}`.toUpperCase().trim();
  const year = institutionSettings?.academicYear ?? '2025-2026';
  const schoolName = institutionSettings?.schoolName ?? "Institut Polytechnique Vase d'Élites (IPVE)";

  return (
    <DocumentTemplate
      title="ATTESTATION D'INSCRIPTION"
      subtitle={`Année académique ${year}`}
      referenceNumber={`N° ${student.studentNumber}/ADM/${new Date().getFullYear()}`}
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
          est régulièrement inscrit(e) à notre établissement pour l&apos;année
          académique <strong className="text-gray-900">{year}</strong>.
        </p>

        {/* Details Table */}
        <div className="my-6 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-[13px]">
            <tbody>
              <DetailRow label="Matricule" value={student.studentNumber} />
              <DetailRow label="Filière" value={student.filiereName} />
              <DetailRow label="Niveau" value={student.levelName} />
              <DetailRow label="Classe" value={student.className} />
              <DetailRow label="Date d'inscription" value={student.enrollmentDate} />
            </tbody>
          </table>
        </div>

        {/* Closing */}
        <p className="text-justify indent-8 mt-6">
          En foi de quoi, la présente attestation lui est délivrée pour servir
          et valoir ce que de droit.
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
