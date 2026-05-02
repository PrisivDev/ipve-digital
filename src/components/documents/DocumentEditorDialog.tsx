'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Eye, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useInstitutionSettings } from '@/hooks/useInstitutionSettings';
import { StudentCardPrint, type StudentCardData } from './StudentCardPrint';
import { AttestationInscription } from './AttestationInscription';
import { CertificatScolarite } from './CertificatScolarite';
import { ReleveNotes } from './ReleveNotes';
import { AttestationPresence } from './AttestationPresence';

// ─── Types ─────────────────────────────────────────────────

export interface EditableStudentData {
  firstName: string;
  lastName: string;
  studentNumber: string;
  dateOfBirth: string;
  gender: string;
  photoUrl: string;
  filiereName: string;
  levelName: string;
  className: string;
  enrollmentDate: string;
}

export type DocumentType =
  | 'carte-etudiant'
  | 'attestation-inscription'
  | 'certificat-scolarite'
  | 'releve-notes'
  | 'attestation-presence';

interface DocumentEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: DocumentType;
  initialData: {
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
  };
  grades?: any[];
  attendance?: any;
  cardNumber?: string;
  cardStatus?: string;
}

// ─── Labels ────────────────────────────────────────────────

const DOC_LABELS: Record<DocumentType, { title: string; icon: string }> = {
  'carte-etudiant': { title: 'Carte d\'identité étudiante', icon: '🪪' },
  'attestation-inscription': { title: 'Attestation d\'inscription', icon: '📋' },
  'certificat-scolarite': { title: 'Certificat de scolarité', icon: '📜' },
  'releve-notes': { title: 'Relevé des notes', icon: '📊' },
  'attestation-presence': { title: 'Attestation de présence', icon: '✅' },
};

const DOC_COLORS: Record<DocumentType, string> = {
  'carte-etudiant': 'bg-[#1B4F72]',
  'attestation-inscription': 'bg-emerald-600',
  'certificat-scolarite': 'bg-blue-600',
  'releve-notes': 'bg-purple-600',
  'attestation-presence': 'bg-amber-600',
};

// ─── Component ─────────────────────────────────────────────

export function DocumentEditorDialog({
  open,
  onOpenChange,
  documentType,
  initialData,
  grades,
  attendance,
  cardNumber,
  cardStatus,
}: DocumentEditorDialogProps) {
  const { data: institutionSettings } = useInstitutionSettings();
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<EditableStudentData>({
    firstName: initialData.firstName ?? '',
    lastName: initialData.lastName ?? '',
    studentNumber: initialData.studentNumber ?? '',
    dateOfBirth: initialData.dateOfBirth ?? '',
    gender: initialData.gender ?? '',
    photoUrl: initialData.photoUrl ?? '',
    filiereName: initialData.filiereName ?? '',
    levelName: initialData.levelName ?? '',
    className: initialData.className ?? '',
    enrollmentDate: initialData.enrollmentDate ?? '',
  });

  const [activeTab, setActiveTab] = useState<string>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(0.75);

  // Calculate scale to fit document in preview container
  const updateScale = useCallback(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const isCard = documentType === 'carte-etudiant';
    const docWidth = isCard ? 340 : 794; // 210mm ≈ 794px
    const padding = 48;
    const availableWidth = container.clientWidth - padding;

    if (availableWidth >= docWidth) {
      setScale(1);
    } else {
      setScale(Math.max(0.4, availableWidth / docWidth));
    }
  }, [documentType]);

  // Sync form data when initialData or documentType changes
  const dataKey = `${initialData.studentId}-${documentType}`;
  const prevDataKeyRef = useRef(dataKey);
  useEffect(() => {
    if (prevDataKeyRef.current === dataKey) return;
    prevDataKeyRef.current = dataKey;
    const timer = setTimeout(() => {
      setFormData({
        firstName: initialData.firstName ?? '',
        lastName: initialData.lastName ?? '',
        studentNumber: initialData.studentNumber ?? '',
        dateOfBirth: initialData.dateOfBirth ?? '',
        gender: initialData.gender ?? '',
        photoUrl: initialData.photoUrl ?? '',
        filiereName: initialData.filiereName ?? '',
        levelName: initialData.levelName ?? '',
        className: initialData.className ?? '',
        enrollmentDate: initialData.enrollmentDate ?? '',
      });
      setActiveTab('edit');
      setIsFullscreen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [dataKey, initialData]);

  // Recalculate scale on tab change and resize
  useEffect(() => {
    if (activeTab === 'preview' || isFullscreen) {
      const timer = setTimeout(updateScale, 80);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isFullscreen, updateScale]);

  // Handle ESC key to exit fullscreen + lock body scroll
  useEffect(() => {
    if (!isFullscreen) return;
    // Lock body scroll when fullscreen is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isFullscreen]);

  const updateField = (field: keyof EditableStudentData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStudentData = (): StudentCardData => ({
    firstName: formData.firstName,
    lastName: formData.lastName,
    studentNumber: formData.studentNumber,
    dateOfBirth: formData.dateOfBirth || null,
    gender: formData.gender || null,
    photoUrl: formData.photoUrl || null,
    filiereName: formData.filiereName || null,
    levelName: formData.levelName || null,
    className: formData.className || null,
    enrollmentDate: formData.enrollmentDate || null,
  });

  const docLabel = DOC_LABELS[documentType];
  const docColor = DOC_COLORS[documentType];

  const renderDocumentPreview = (showPrint: boolean = false) => {
    switch (documentType) {
      case 'carte-etudiant':
        return (
          <StudentCardPrint
            student={getStudentData()}
            status={cardStatus}
            cardNumber={cardNumber}
            institutionSettings={institutionSettings}
            showPrintButton={showPrint}
          />
        );
      case 'attestation-inscription':
        return (
          <AttestationInscription
            student={getStudentData()}
            institutionSettings={institutionSettings}
            showPrintButton={showPrint}
          />
        );
      case 'certificat-scolarite':
        return (
          <CertificatScolarite
            student={getStudentData()}
            institutionSettings={institutionSettings}
            showPrintButton={showPrint}
          />
        );
      case 'releve-notes':
        return (
          <ReleveNotes
            student={getStudentData()}
            grades={grades}
            institutionSettings={institutionSettings}
            showPrintButton={showPrint}
          />
        );
      case 'attestation-presence':
        return (
          <AttestationPresence
            student={getStudentData()}
            attendance={attendance}
            institutionSettings={institutionSettings}
            showPrintButton={showPrint}
          />
        );
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      {/* ─── Main Dialog ─── */}
      <Dialog open={open && !isFullscreen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-hidden p-0 flex flex-col">
          {/* ─── Header ─── */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${docColor} flex items-center justify-center text-white text-sm`}>
                  {docLabel.icon}
                </div>
                {docLabel.title}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] font-normal">
                  {formData.lastName} {formData.firstName}
                </Badge>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === 'edit'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === 'preview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Aperçu
                  </button>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* ─── Content Area ─── */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* ─── Edit Panel ─── */}
            {activeTab === 'edit' && (
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-4 rounded-full" style={{ background: '#1B4F72' }} />
                      <h4 className="text-sm font-semibold text-gray-700">Identité de l&apos;étudiant</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                      <FieldGroup label="Nom" value={formData.lastName} onChange={(v) => updateField('lastName', v)} placeholder="KONÉ" />
                      <FieldGroup label="Prénom" value={formData.firstName} onChange={(v) => updateField('firstName', v)} placeholder="Aminata" />
                      <FieldGroup label="Matricule" value={formData.studentNumber} onChange={(v) => updateField('studentNumber', v)} placeholder="IPVE-2024-0016" />
                      <SelectField label="Sexe" value={formData.gender} onChange={(v) => updateField('gender', v)} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} />
                      <FieldGroup label="Date de naissance" value={formData.dateOfBirth} onChange={(v) => updateField('dateOfBirth', v)} placeholder="16/05/2004" />
                      <FieldGroup label="URL Photo" value={formData.photoUrl} onChange={(v) => updateField('photoUrl', v)} placeholder="https://..." />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-4 rounded-full" style={{ background: '#f59e0b' }} />
                      <h4 className="text-sm font-semibold text-gray-700">Informations académiques</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                      <FieldGroup label="Filière" value={formData.filiereName} onChange={(v) => updateField('filiereName', v)} placeholder="Gestion & Commerce" />
                      <FieldGroup label="Niveau" value={formData.levelName} onChange={(v) => updateField('levelName', v)} placeholder="BTS 1 Informatique" />
                      <FieldGroup label="Classe" value={formData.className} onChange={(v) => updateField('className', v)} placeholder="L1 Geco - Groupe A" />
                      <FieldGroup label="Date d'inscription" value={formData.enrollmentDate} onChange={(v) => updateField('enrollmentDate', v)} placeholder="01/10/2024" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-xs text-gray-400">Modifier les informations puis consulter l&apos;aperçu</p>
                    <Button onClick={() => setActiveTab('preview')} className="gap-2 bg-[#1B4F72] hover:bg-[#153A56] text-white">
                      <Eye className="h-4 w-4" />
                      Voir l&apos;aperçu
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* ─── Preview Panel ─── */}
            {activeTab === 'preview' && (
              <div className="h-full flex flex-col">
                <div className="shrink-0 px-6 py-2.5 border-b bg-gray-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Aperçu du document</span>
                    {scale < 1 && (
                      <Badge variant="outline" className="text-[10px] ml-1">{Math.round(scale * 100)}%</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-gray-600 hover:text-gray-900" onClick={() => setActiveTab('edit')}>
                      <Pencil className="h-3 w-3" /> Modifier
                    </Button>
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <Maximize2 className="h-3 w-3" /> Plein écran
                    </button>
                  </div>
                </div>
                <div
                  ref={previewContainerRef}
                  className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
                  style={{ background: '#d4d4d4' }}
                >
                  <div className="py-6 px-4 flex justify-center">
                    <div style={{ zoom: scale }}>
                      <DocumentPreviewWrapper renderDocument={renderDocumentPreview} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Fullscreen Preview Overlay (portal to body) ─── */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex flex-col"
          style={{ zIndex: 99999, background: '#1a1a1a' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFullscreen();
          }}
        >
          {/* Fullscreen Header */}
          <div
            className="flex items-center justify-between px-6 py-3 shrink-0"
            style={{ background: '#111', borderBottom: '1px solid #333' }}
          >
            <div className="flex items-center gap-3">
              <div className={`h-7 w-7 rounded-md ${docColor} flex items-center justify-center text-white text-xs`}>
                {docLabel.icon}
              </div>
              <span className="text-sm font-medium text-white">{docLabel.title}</span>
              <Badge variant="outline" className="text-[10px] text-gray-400" style={{ borderColor: '#444' }}>
                {formData.lastName} {formData.firstName}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); closeFullscreen(); setActiveTab('edit'); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minimize2 className="h-3.5 w-3.5" /> Réduire
              </button>
              <div style={{ width: 1, height: 20, background: '#444' }} />
              <button
                onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <X className="h-4 w-4" /> Fermer
              </button>
            </div>
          </div>

          {/* Fullscreen Document - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="flex justify-center py-10 px-8">
              <div className="rounded-lg overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                {renderDocumentPreview(true)}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Preview Wrapper ──

function DocumentPreviewWrapper({
  renderDocument,
}: {
  renderDocument: (showPrint: boolean) => React.ReactNode;
}) {
  return (
    <div className="rounded-lg shadow-2xl overflow-hidden border border-gray-300/50">
      {renderDocument(false)}
    </div>
  );
}

// ─── Field Sub-components ──────────────────────────────────

function FieldGroup({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 text-sm bg-white border-gray-200 focus:border-[#1B4F72]" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm bg-white border-gray-200"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
        <SelectContent>{options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
