// ================================================================
// IPVE Digital — Payment Types
// Gestion des paiements, plans de paiement et relances
// Devise : FCFA (XOF) — pas de décimales
// ================================================================

// ─── Enums (mirror Prisma) ────────────────────────────────────

export type PaymentMethod =
  | 'CASH'
  | 'MTN_MOMO'
  | 'ORANGE_MONEY'
  | 'WAVE'
  | 'BANK_TRANSFER'
  | 'CHEQUE';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'CANCELLED';

export type TrancheStatus = 'PAYÉ' | 'PARTIEL' | 'EN_RETARD' | 'EN_ATTENTE';

// ─── UI Label Maps (French) ───────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  MTN_MOMO: 'MTN Mobile Money',
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  BANK_TRANSFER: 'Virement bancaire',
  CHEQUE: 'Chèque',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  COMPLETED: 'Complété',
  PARTIALLY_REFUNDED: 'Remboursé partiellement',
  REFUNDED: 'Remboursé',
  CANCELLED: 'Annulé',
};

export const TRANCHE_STATUS_LABELS: Record<TrancheStatus, string> = {
  PAYÉ: 'Payé',
  PARTIEL: 'Partiel',
  EN_RETARD: 'En retard',
  EN_ATTENTE: 'En attente',
};

// ─── DTOs ─────────────────────────────────────────────────────

export interface RecordPaymentDto {
  studentId: string;
  trancheId?: string;
  amountPaid: number;
  paymentDate: string; // ISO date
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receivedBy?: string;
  notes?: string;
}

export interface CreatePaymentPlanDto {
  name: string;
  levelId: string;
  academicYearId: string;
  totalAmount: number;
  currency?: string;
  tranches: CreateTrancheDto[];
}

export interface CreateTrancheDto {
  trancheNumber: number;
  name: string;
  amount: number;
  dueDate?: string;
  isMandatory?: boolean;
}

export interface SendReminderDto {
  studentIds?: string[];
  trancheIds?: string[];
  channel: ('SMS' | 'EMAIL')[];
  customMessage?: string;
  daysBeforeDue?: number;
  includeOverdue?: boolean;
}

// ─── Filters ──────────────────────────────────────────────────

export interface PaymentFilters {
  search?: string;
  studentId?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  receivedBy?: string;
  page?: number;
  limit?: number;
}

export interface UnpaidFilters {
  filiereId?: string;
  levelId?: string;
  trancheId?: string;
  minAmount?: number;
  maxAmount?: number;
  includeOverdue?: boolean;
  page?: number;
  limit?: number;
}

export interface PaymentReportFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'filiere' | 'method' | 'cashier';
  paymentMethod?: PaymentMethod;
}

// ─── Response Types ───────────────────────────────────────────

export interface TrancheSummary {
  trancheId: string;
  trancheNumber: number;
  trancheName: string;
  amountDue: number;
  amountPaid: number;
  remaining: number;
  status: TrancheStatus;
  dueDate: string | null;
  overdueDays: number | null;
}

export interface StudentPaymentStatus {
  studentId: string;
  studentName: string;
  studentNumber: string;
  filiereName: string | null;
  levelName: string | null;
  tranches: TrancheSummary[];
  totalDue: number;
  totalPaid: number;
  balance: number;
  globalStatus: 'À jour' | 'Partiel' | 'En retard';
}

export interface PaymentListItem {
  id: string;
  paymentNumber: string;
  studentName: string;
  studentNumber: string;
  trancheName: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  status: PaymentStatus;
  receivedByName: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentDetail extends PaymentListItem {
  studentId: string;
  trancheId: string;
  studentFirstName: string;
  studentLastName: string;
  filiereName: string | null;
  levelName: string | null;
  receivedBy: string | null;
  journalEntryId: string | null;
}

export interface UnpaidSummary {
  studentId: string;
  studentName: string;
  studentNumber: string;
  filiereName: string | null;
  levelName: string | null;
  studentPhone: string | null;
  studentEmail: string | null;
  trancheId: string;
  trancheName: string;
  trancheNumber: number;
  amountDue: number;
  amountPaid: number;
  remaining: number;
  dueDate: string | null;
  overdueDays: number | null;
  status: TrancheStatus;
}

export interface PaymentReport {
  totalCollected: number;
  totalRefunded: number;
  netRevenue: number;
  paymentCount: number;
  averageAmount: number;
  byMethod: Record<PaymentMethod, { count: number; total: number }>;
  byMonth: { month: string; total: number; count: number }[];
  byFiliere: { filiereName: string; total: number; count: number }[];
  recentPayments: PaymentListItem[];
}

export interface PaymentDashboardData {
  totalCollectedMonth: number;
  totalCollectedPreviousMonth: number;
  monthOverMonthChange: number; // percentage
  totalUnpaid: number;
  unpaidStudentCount: number;
  estimatedTreasury: number;
  topDebtors: UnpaidSummary[];
  revenueChart: { month: string; total: number }[];
  recentPayments: PaymentListItem[];
  byMethod: { method: PaymentMethod; label: string; count: number; total: number }[];
}

export interface PaymentPlanListItem {
  id: string;
  name: string;
  levelName: string;
  filiereName: string;
  academicYearName: string;
  totalAmount: number;
  trancheCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentPlanDetail extends PaymentPlanListItem {
  tranches: {
    id: string;
    trancheNumber: number;
    name: string;
    amount: number;
    dueDate: string | null;
    isMandatory: boolean;
  }[];
}

export interface ReminderResult {
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  details: {
    studentId: string;
    studentName: string;
    channel: 'SMS' | 'EMAIL';
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
  }[];
}

export interface PaymentAllocation {
  trancheId: string;
  trancheName: string;
  trancheNumber: number;
  amountDue: number;
  amountAllocated: number;
  fullyCovered: boolean;
}

// ─── Shared ───────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Formatting helpers ───────────────────────────────────────

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' F';
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    CASH: '💰',
    MTN_MOMO: '📱',
    ORANGE_MONEY: '🟠',
    WAVE: '🌊',
    BANK_TRANSFER: '🏦',
    CHEQUE: '📝',
  };
  return icons[method];
}
