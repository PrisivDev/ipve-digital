'use client';

import { useRef, type ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_INSTITUTION,
  BRAND_COLOR,
  BRAND_ORANGE,
  todayFormatted,
  buildDocumentHTML,
  openPrintWindow,
} from '@/lib/print-utils';

// ─── Types ─────────────────────────────────────────────────

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

interface DocumentTemplateProps {
  title: string;
  subtitle?: string;
  referenceNumber?: string;
  children: ReactNode;
  institutionSettings?: InstitutionSettings | null;
  footerText?: string;
  signatureName?: string;
  showPrintButton?: boolean;
}

// ─── Document Template Component ───────────────────────────

export function DocumentTemplate({
  title,
  subtitle,
  referenceNumber,
  children,
  institutionSettings,
  footerText,
  signatureName = 'Le Directeur',
  showPrintButton = false,
}: DocumentTemplateProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  const settings = {
    ...DEFAULT_INSTITUTION,
    ...institutionSettings,
  };

  const city = (settings as any).city ?? settings.address ?? 'ABIDJAN';
  const footer = footerText ?? `Fait à Abidjan, le ${todayFormatted()}`;

  const handlePrint = () => {
    if (!documentRef.current) return;
    const docHTML = documentRef.current.innerHTML;
    const fullHTML = buildDocumentHTML(docHTML, {
      title: title,
    });
    openPrintWindow(fullHTML, title);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={documentRef}
        className="no-page-break bg-white shadow-xl"
        style={{
          width: '210mm',
          minWidth: '210mm',
          minHeight: '297mm',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* ═══════════════════════════════════════════════════════
            HEADER — Identique à la carte étudiante
            ═══════════════════════════════════════════════════════ */}
        <div
          className="flex flex-col items-center pt-8 pb-5 px-6 relative"
          style={{ background: BRAND_COLOR }}
        >
          {/* Logo */}
          <div className="mb-2">
            <img
              src={settings.logoUrl}
              alt="Logo IPVE"
              className="w-[60px] h-[60px] rounded-full object-cover border-2 border-white/30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Institution Name */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/80 leading-tight text-center">
            {settings.schoolName?.toUpperCase() ?? 'INSTITUT POLYTECHNIQUE'}
          </p>
          <p
            className="text-2xl font-extrabold text-white leading-tight mt-1 tracking-wide"
          >
            {settings.shortName ?? 'IPVE'}
          </p>
          <p className="text-xs text-white/60 leading-tight mt-0.5 font-medium tracking-wide">
            {city}
          </p>
        </div>

        {/* Orange Divider */}
        <div className="h-[5px]" style={{ background: BRAND_ORANGE }} />

        {/* ═══════════════════════════════════════════════════════
            BODY — Contenu du document
            ═══════════════════════════════════════════════════════ */}
        <div className="px-10 py-8">
          {/* Title */}
          <div className="text-center mb-6">
            <h1
              className="text-[20px] font-extrabold uppercase tracking-[0.12em]"
              style={{ color: BRAND_COLOR }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1.5 font-medium">{subtitle}</p>
            )}
          </div>

          {/* Reference */}
          {referenceNumber && (
            <div className="text-right text-xs text-gray-400 mb-5 font-mono">
              {referenceNumber}
            </div>
          )}

          {/* Body Content */}
          <div className="mt-2">{children}</div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SIGNATURE BLOCK
            ═══════════════════════════════════════════════════════ */}
        <div className="px-10 pb-6">
          <div className="mt-10 flex justify-between gap-12">
            <div className="text-center flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {signatureName}
              </p>
              <div className="border-b-2 border-dashed mx-auto" style={{ borderColor: BRAND_COLOR + '40', width: '180px' }} />
              <p className="text-xs text-gray-400 mt-1.5">
                Cachet et signature
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Le Secrétaire
              </p>
              <div className="border-b-2 border-dashed mx-auto" style={{ borderColor: BRAND_COLOR + '40', width: '180px' }} />
              <p className="text-xs text-gray-400 mt-1.5">
                Cachet et signature
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════ */}
        <div className="px-10 pb-6">
          <div className="h-px bg-gray-200 mb-4" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[11px] text-gray-400">
              {[settings.address, settings.website].filter(Boolean).join(' | ')}
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              {footer}
            </p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      {showPrintButton && (
        <Button
          onClick={handlePrint}
          className="no-print gap-2 bg-[#1B4F72] hover:bg-[#153A56] text-white shadow-lg"
          size="sm"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      )}
    </div>
  );
}
