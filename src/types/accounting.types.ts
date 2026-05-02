// ================================================================
// IPVE Digital — Accounting Types (OHADA)
// Comptabilité OHADA • Partie double • Plan comptable
// ================================================================

// ─── Enums (mirror Prisma) ────────────────────────────────────

export type JournalType =
  | 'SALES'
  | 'PURCHASES'
  | 'BANK'
  | 'CASH'
  | 'OD'
  | 'GENERAL';

export type ReferenceType =
  | 'PAYMENT'
  | 'EXPENSE'
  | 'PAYROLL'
  | 'ADJUSTMENT'
  | 'INVOICE';

export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

// ─── UI Label Maps (French) ───────────────────────────────────

export const JOURNAL_TYPE_LABELS: Record<JournalType, string> = {
  SALES: 'Journal des Ventes (ACH)',
  PURCHASES: 'Journal des Achats',
  BANK: 'Journal de Banque',
  CASH: 'Journal de Caisse',
  OD: 'Opérations Diverses',
  GENERAL: 'Journal Général',
};

export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  PAYMENT: 'Paiement',
  EXPENSE: 'Dépense',
  PAYROLL: 'Paie',
  ADJUSTMENT: 'Ajustement',
  INVOICE: 'Facture',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Actif',
  LIABILITY: 'Passif',
  EQUITY: 'Capitaux Propres',
  REVENUE: 'Produits',
  EXPENSE: 'Charges',
};

export const ACCOUNT_CLASS_LABELS: Record<string, string> = {
  '1': 'Classe 1 — Capitaux',
  '2': 'Classe 2 — Immobilisations',
  '3': 'Classe 3 — Stocks',
  '4': 'Classe 4 — Tiers',
  '5': 'Classe 5 — Financiers',
  '6': 'Classe 6 — Charges',
  '7': 'Classe 7 — Produits',
  '8': 'Classe 8 — HAO',
};

// ─── DTOs ─────────────────────────────────────────────────────

export interface CreateJournalEntryDto {
  entryDate: string; // ISO date
  description: string;
  journalType: JournalType;
  referenceType?: ReferenceType;
  referenceId?: string;
  createdBy?: string;
  lines: {
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }[];
}

export interface CreateChartOfAccountDto {
  accountNumber: string;
  accountName: string;
  accountClass: string;
  accountType: AccountType;
  parentId?: string;
  normalBalance: NormalBalance;
}

// ─── Filters ──────────────────────────────────────────────────

export interface JournalFilters {
  startDate?: string;
  endDate?: string;
  journalType?: JournalType;
  isValidated?: boolean;
  search?: string;
  referenceType?: ReferenceType;
  page?: number;
  limit?: number;
}

export interface LedgerFilters {
  startDate?: string;
  endDate?: string;
}

export interface TrialBalanceFilters {
  date?: string; // ISO date — defaults to now
  onlyMoved?: boolean; // only accounts with movements
}

export interface IncomeStatementFilters {
  startDate: string;
  endDate: string;
}

// ─── Response Types ───────────────────────────────────────────

export interface JournalEntryLineDto {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string | null;
  lineOrder: number;
}

export interface JournalEntryListItem {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  journalType: JournalType;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  isValidated: boolean;
  totalDebit: number;
  totalCredit: number;
  createdBy: string | null;
  validatedBy: string | null;
  createdAt: string;
  lineCount: number;
}

export interface JournalEntryDetail extends JournalEntryListItem {
  lines: JournalEntryLineDto[];
}

export interface LedgerEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  journalType: JournalType;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

export interface LedgerResult {
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  initialBalance: number;
  entries: LedgerEntry[];
  finalDebit: number;
  finalCredit: number;
  finalBalance: number;
}

export interface TrialBalanceRow {
  accountNumber: string;
  accountName: string;
  accountClass: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  balanceDebit: number;
  balanceCredit: number;
}

export interface TrialBalance {
  date: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  totalBalanceDebit: number;
  totalBalanceCredit: number;
  isBalanced: boolean;
}

export interface IncomeStatementRow {
  accountNumber: string;
  accountName: string;
  amount: number;
}

export interface IncomeStatement {
  startDate: string;
  endDate: string;
  revenues: IncomeStatementRow[];
  totalRevenue: number;
  expenses: IncomeStatementRow[];
  totalExpenses: number;
  netResult: number; // positive = bénéfice, negative = perte
}

export interface BalanceSheetRow {
  accountNumber: string;
  accountName: string;
  amount: number;
}

export interface BalanceSheetSection {
  label: string;
  rows: BalanceSheetRow[];
  total: number;
}

export interface BalanceSheet {
  date: string;
  assets: BalanceSheetSection;  // Actif
  liabilities: BalanceSheetSection;  // Passif
  equity: BalanceSheetSection;  // Capitaux propres
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface ChartOfAccountItem {
  id: string;
  accountNumber: string;
  accountName: string;
  accountClass: string;
  accountType: AccountType;
  parentId: string | null;
  normalBalance: NormalBalance;
  isActive: boolean;
  currentBalance: number; // computed from journal lines
  children?: ChartOfAccountItem[];
}

export interface ChartOfAccountFlat {
  id: string;
  accountNumber: string;
  accountName: string;
  accountClass: string;
  accountType: AccountType;
  parentId: string | null;
  parentName: string | null;
  normalBalance: NormalBalance;
  isActive: boolean;
  currentBalance: number;
  isStandard: boolean; // OHADA standard = non modifiable
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

export function getJournalTypeColor(type: JournalType): string {
  const map: Record<JournalType, string> = {
    SALES: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PURCHASES: 'bg-orange-100 text-orange-700 border-orange-200',
    BANK: 'bg-blue-100 text-blue-700 border-blue-200',
    CASH: 'bg-amber-100 text-amber-700 border-amber-200',
    OD: 'bg-purple-100 text-purple-700 border-purple-200',
    GENERAL: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return map[type];
}

export function getAccountTypeColor(type: AccountType): string {
  const map: Record<AccountType, string> = {
    ASSET: 'bg-blue-100 text-blue-700 border-blue-200',
    LIABILITY: 'bg-red-100 text-red-700 border-red-200',
    EQUITY: 'bg-green-100 text-green-700 border-green-200',
    REVENUE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    EXPENSE: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return map[type];
}
