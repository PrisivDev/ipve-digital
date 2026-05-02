/**
 * IPVE Digital — Prospect / Admissions CRM Types
 * Shared TypeScript types for the prospect management module.
 */

// Prospect status enum matching Prisma
export type ProspectStatus =
  | 'NOUVEAU'
  | 'CONTACTE'
  | 'INTERESSE'
  | 'DOSSIER_RECU'
  | 'ADMIS'
  | 'CONVERTI'
  | 'ABANDONNE';

export type ProspectSource =
  | 'WEBSITE'
  | 'RECOMMENDATION'
  | 'SOCIAL_MEDIA'
  | 'FACEBOOK'
  | 'WHATSAPP'
  | 'WALK_IN'
  | 'EVENT'
  | 'ADVERTISEMENT'
  | 'PARTNER'
  | 'OTHER';

export type InteractionType =
  | 'APPEL'
  | 'EMAIL'
  | 'VISITE'
  | 'SMS'
  | 'WHATSAPP_MSG'
  | 'NOTE'
  | 'RENDEZ_VOUS';

export type InteractionDirection = 'INCOMING' | 'OUTGOING';

// Status labels for UI
export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  NOUVEAU: 'Nouveau',
  CONTACTE: 'Contacté',
  INTERESSE: 'Intéressé',
  DOSSIER_RECU: 'Dossier reçu',
  ADMIS: 'Admis',
  CONVERTI: 'Converti',
  ABANDONNE: 'Abandonné',
};

export const PROSPECT_SOURCE_LABELS: Record<ProspectSource, string> = {
  WEBSITE: 'Site web',
  RECOMMENDATION: 'Bouche-à-oreille',
  SOCIAL_MEDIA: 'Réseaux sociaux',
  FACEBOOK: 'Facebook',
  WHATSAPP: 'WhatsApp',
  WALK_IN: 'Visite directe',
  EVENT: 'Salon étudiant',
  ADVERTISEMENT: 'Publicité',
  PARTNER: 'Partenaire',
  OTHER: 'Autre',
};

// Status order for Kanban pipeline
export const PROSPECT_STATUS_ORDER: ProspectStatus[] = [
  'NOUVEAU',
  'CONTACTE',
  'INTERESSE',
  'DOSSIER_RECU',
  'ADMIS',
  'CONVERTI',
  'ABANDONNE',
];

// Valid status transitions
export const PROSPECT_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  NOUVEAU: ['CONTACTE', 'ABANDONNE'],
  CONTACTE: ['INTERESSE', 'NOUVEAU', 'ABANDONNE'],
  INTERESSE: ['DOSSIER_RECU', 'CONTACTE', 'ABANDONNE'],
  DOSSIER_RECU: ['ADMIS', 'INTERESSE', 'ABANDONNE'],
  ADMIS: ['CONVERTI'],
  CONVERTI: [],
  ABANDONNE: ['NOUVEAU', 'CONTACTE'],
};

// DTOs
export interface CreateProspectDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  source?: ProspectSource;
  filiereInterest?: string;
  levelInterest?: string;
  notes?: string;
  assignedTo?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  nationality?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export type UpdateProspectDto = Partial<CreateProspectDto>;

export interface ProspectFilters {
  search?: string;
  status?: ProspectStatus;
  source?: ProspectSource;
  assignedTo?: string;
  filiereInterest?: string;
  page?: number;
  limit?: number;
}

export interface AddInteractionDto {
  type: InteractionType;
  subject?: string;
  content: string;
  direction?: InteractionDirection;
  conductedBy?: string;
}

// API response types
export interface ProspectListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  source: ProspectSource;
  status: ProspectStatus;
  filiereInterest: string | null;
  levelInterest: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  lastContactAt: string | null;
  createdAt: string;
  daysSinceContact: number | null;
}

export interface ProspectDetail extends ProspectListItem {
  dateOfBirth: string | null;
  gender: 'MALE' | 'FEMALE';
  nationality: string;
  address: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  convertedAt: string | null;
  convertedStudentId: string | null;
  notes: string | null;
  interactions: ProspectInteractionItem[];
}

export interface ProspectInteractionItem {
  id: string;
  type: InteractionType;
  subject: string | null;
  content: string;
  direction: InteractionDirection;
  conductedBy: string | null;
  conductorName: string | null;
  createdAt: string;
}

export interface ConversionStats {
  totalProspects: number;
  totalConverted: number;
  totalAbandoned: number;
  conversionRate: number;
  byStatus: Record<ProspectStatus, number>;
  bySource: Record<string, number>;
  byMonth: { month: string; prospects: number; converted: number }[];
  weeklyNew: number;
  monthlyNew: number;
  inactiveProspects: number;
}

export interface KanbanColumn {
  status: ProspectStatus;
  label: string;
  count: number;
  prospects: ProspectListItem[];
}

// Re-use paginated result from student types
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
