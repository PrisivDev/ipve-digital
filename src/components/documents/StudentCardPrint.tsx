'use client';

import { useRef } from 'react';
import { User, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_INSTITUTION,
  BRAND_COLOR,
  BRAND_ORANGE,
  formatDateFR,
  buildDocumentHTML,
  openPrintWindow,
} from '@/lib/print-utils';

// ─── Types ─────────────────────────────────────────────────

export interface StudentCardData {
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

interface StudentCardPrintProps {
  student: StudentCardData;
  status?: string;
  cardNumber?: string;
  institutionSettings?: {
    schoolName?: string;
    shortName?: string;
    logoUrl?: string;
    address?: string;
    city?: string;
    website?: string;
    academicYear?: string;
  } | null;
  showPrintButton?: boolean;
}

// ─── Student Card Component ────────────────────────────────

export function StudentCardPrint({
  student,
  status,
  cardNumber,
  institutionSettings,
  showPrintButton = false,
}: StudentCardPrintProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const settings = {
    ...DEFAULT_INSTITUTION,
    ...institutionSettings,
  };

  const fullName = `${student.lastName} ${student.firstName}`.trim();
  const dob = formatDateFR(student.dateOfBirth);
  const enrollment = formatDateFR(student.enrollmentDate);
  const genderLabel =
    student.gender === 'MALE' || student.gender === 'M'
      ? 'Masculin'
      : student.gender === 'FEMALE' || student.gender === 'F'
        ? 'Féminin'
        : student.gender || '—';

  const isActive = status === 'ACTIVE';
  const city = (settings as any).city ?? settings.address ?? 'ABIDJAN';

  const qrValue = JSON.stringify({
    student: student.studentNumber,
    name: fullName,
    card: cardNumber ?? student.studentNumber,
    institution: settings.shortName,
  });

  const handlePrintCard = () => {
    if (!cardRef.current) return;
    const cardHTML = cardRef.current.innerHTML;
    const fullHTML = buildDocumentHTML(cardHTML, {
      title: `Carte - ${fullName}`,
    });
    openPrintWindow(fullHTML, `Carte - ${fullName}`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ─── Card Preview ─── */}
      <div
        ref={cardRef}
        className="print-card-full relative rounded-xl overflow-hidden shadow-2xl border border-gray-200"
        style={{
          width: '340px',
          height: '540px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* ─── Header ─── */}
        <div
          className="flex flex-col items-center pt-5 pb-4 px-4 relative"
          style={{ background: BRAND_COLOR }}
        >
          {/* Logo */}
          <div className="mb-2">
            <img
              src={settings.logoUrl}
              alt="Logo IPVE"
              className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Institution Name */}
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 leading-tight text-center">
            {settings.schoolName?.toUpperCase() ?? 'INSTITUT POLYTECHNIQUE'}
          </p>
          <p className="text-lg font-extrabold text-white leading-tight mt-0.5 tracking-wide">
            {settings.shortName ?? 'IPVE'}
          </p>
          <p className="text-[11px] text-white/60 leading-tight mt-0.5 font-medium">
            {city}
          </p>

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wide ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
              }`}
            >
              {isActive ? 'ACTIF' : status ?? 'INACTIF'}
            </span>
          </div>
        </div>

        {/* Orange Divider */}
        <div className="h-1" style={{ background: BRAND_ORANGE }} />

        {/* ─── Body ─── */}
        <div className="bg-white px-5 py-4 flex flex-col gap-3" style={{ height: 'calc(100% - 140px)' }}>
          {/* Title */}
          <p
            className="text-center text-[13px] font-extrabold uppercase tracking-[0.15em]"
            style={{ color: BRAND_COLOR }}
          >
            Carte d&apos;identité étudiante
          </p>

          {/* Photo + Info Row */}
          <div className="flex gap-4">
            {/* Photo */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="w-[100px] h-[120px] bg-blue-50/50 border-2 rounded-lg flex flex-col items-center justify-center overflow-hidden" style={{ borderColor: BRAND_COLOR + '40' }}>
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <User className="h-10 w-10 text-blue-300/60" />
                    <span className="text-[9px] text-blue-300 mt-1">Photo</span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="p-1.5 bg-white rounded border border-gray-100">
                <QRCodeSVG
                  value={qrValue}
                  size={64}
                  bgColor="transparent"
                  fgColor={BRAND_COLOR}
                  level="M"
                />
              </div>
            </div>

            {/* Info Fields */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="space-y-2.5">
                <InfoField label="NOM & PRÉNOM" value={fullName} bold />
                <InfoField label="MATRICULE" value={cardNumber ?? student.studentNumber} />
                <InfoField label="FILIÈRE" value={student.filiereName} />
                <InfoField label="NIVEAU" value={student.levelName} />
                <InfoField label="CLASSE" value={student.className} />
                <InfoField label="NAISSANCE" value={dob} />
                <InfoField label="SEXE" value={genderLabel} />
                <InfoField label="INSCRIPTION" value={enrollment} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="mt-auto bg-gray-50/80 px-5 py-2.5 flex items-center justify-between absolute bottom-0 left-0 right-0 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 font-medium">
            {settings.website ?? 'ipve.edu.ci'}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            Année académique {settings.academicYear ?? '2025-2026'}
          </span>
        </div>
      </div>

      {/* ─── Print Button ─── */}
      {showPrintButton && (
        <Button
          onClick={handlePrintCard}
          className="no-print gap-2 bg-[#1B4F72] hover:bg-[#153A56] text-white"
          size="sm"
        >
          <Printer className="h-4 w-4" />
          Imprimer la carte
        </Button>
      )}
    </div>
  );
}

// ─── Info Field Sub-component ──────────────────────────────

function InfoField({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string | null | undefined;
  bold?: boolean;
}) {
  return (
    <div className="leading-tight">
      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
      <p className={`text-[13px] truncate ${bold ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-800'}`}>
        {value ?? '—'}
      </p>
    </div>
  );
}
