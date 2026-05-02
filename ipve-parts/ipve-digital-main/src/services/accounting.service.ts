/**
 * IPVE Digital — OHADA Accounting Service
 * Comptabilité OHADA • Partie double • Plan comptable SYSCOA
 * Server-side only module.
 *
 * All amounts in FCFA (XOF), rounded to integers.
 */

import { db } from '@/lib/db';
import type {
  CreateJournalEntryDto,
  CreateChartOfAccountDto,
  JournalFilters,
  LedgerFilters,
  TrialBalanceFilters,
  IncomeStatementFilters,
  AccountType,
  NormalBalance,
  JournalType,
  ReferenceType,
  JournalEntryDetail,
  JournalEntryListItem,
  JournalEntryLineDto,
  LedgerEntry,
  LedgerResult,
  TrialBalanceRow,
  TrialBalance,
  IncomeStatementRow,
  IncomeStatement,
  BalanceSheetRow,
  BalanceSheetSection,
  BalanceSheet,
  ChartOfAccountItem,
  ChartOfAccountFlat,
  PaginatedResult,
} from '@/types/accounting.types';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

/** Generate journal entry number: JNL-YYYY-XXXXXX */
async function generateEntryNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JNL-${year}-`;
  const count = await db.journalEntry.count({
    where: { entryNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(6, '0')}`;
}

/** Look up a ChartOfAccount by accountNumber and return its UUID id */
async function getAccountIdByNumber(accountNumber: string): Promise<string> {
  const account = await db.chartOfAccount.findUnique({
    where: { accountNumber },
    select: { id: true, isActive: true },
  });
  if (!account) {
    throw new Error(`Compte ${accountNumber} introuvable dans le plan comptable`);
  }
  if (!account.isActive) {
    throw new Error(`Compte ${accountNumber} est désactivé`);
  }
  return account.id;
}

/** Compute the running balance for an account */
function computeBalance(
  totalDebit: number,
  totalCredit: number,
  normalBalance: NormalBalance,
): number {
  if (normalBalance === 'DEBIT') {
    return totalDebit - totalCredit;
  }
  return totalCredit - totalDebit;
}

/** Determine if an account number is a standard OHADA account (starts with a digit ≤ 8) */
function isStandardAccount(accountNumber: string): boolean {
  const firstChar = accountNumber.charAt(0);
  return firstChar >= '0' && firstChar <= '8';
}

/** OHADA chart of accounts to seed */
const OHADA_CHART: Array<{
  number: string;
  name: string;
  cls: string;
  type: AccountType;
  balance: NormalBalance;
}> = [
  // ── Classe 1 — Capitaux ──
  { number: '101000', name: 'Capital social', cls: '1', type: 'EQUITY', balance: 'CREDIT' },
  { number: '104000', name: "Capital appelé non versé", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
  { number: '106000', name: 'Réserves', cls: '1', type: 'EQUITY', balance: 'CREDIT' },
  { number: '108000', name: "Compte de l'exploitant", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
  { number: '120000', name: "Résultat de l'exercice", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
  { number: '121000', name: "Résultat de l'exercice — Perte", cls: '1', type: 'EQUITY', balance: 'DEBIT' },
  { number: '131000', name: "Subventions d'équipement", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
  { number: '163000', name: 'Écarts de réévaluation', cls: '1', type: 'EQUITY', balance: 'CREDIT' },

  // ── Classe 2 — Immobilisations ──
  { number: '201000', name: "Frais d'établissement", cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '203000', name: 'Frais de recherche et développement', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '211000', name: 'Terrains', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '213000', name: 'Constructions', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '215000', name: 'Installations techniques', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '218000', name: 'Autres immobilisations corporelles', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '231000', name: 'Immobilisations en concession', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '241000', name: 'Avances et acomptes sur immobilisations', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '261000', name: 'Titres de participation', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '271000', name: 'Prêts et créances', cls: '2', type: 'ASSET', balance: 'DEBIT' },
  { number: '281000', name: 'Amortissements immobilisations corporelles', cls: '2', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '283000', name: 'Amortissements immobilisations incorporelles', cls: '2', type: 'LIABILITY', balance: 'CREDIT' },

  // ── Classe 3 — Stocks ──
  { number: '310000', name: 'Stocks de marchandises', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '311000', name: 'Matières premières', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '315000', name: 'Autres approvisionnements', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '321000', name: 'Produits finis', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '351000', name: 'Services en cours', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '361000', name: "Stocks provenant d'immobilisations", cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '371000', name: 'Marchandises reçues', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '381000', name: 'Achats stockés', cls: '3', type: 'ASSET', balance: 'DEBIT' },
  { number: '391000', name: 'Provisions pour dépréciation des stocks', cls: '3', type: 'LIABILITY', balance: 'CREDIT' },

  // ── Classe 4 — Tiers ──
  { number: '401000', name: 'Fournisseurs', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '402000', name: 'Fournisseurs — Effets à payer', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '404000', name: "Fournisseurs d'immobilisations", cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '411000', name: 'Clients', cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '412000', name: 'Clients — Effets à recevoir', cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '416000', name: 'Clients douteux', cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '421000', name: 'Personnel — Rémunérations dues', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '431000', name: 'CNPS', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '441000', name: 'État — Subventions à recevoir', cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '442000', name: 'État — Impôts et taxes', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '445000', name: 'TVA récupérable', cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '447000', name: 'État — ITS', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '451000', name: 'Associés — Opérations courantes', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '455000', name: 'Associés — Apports', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '462000', name: 'Associés — Comptes courants', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '471000', name: "Comptes d'attente", cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '476000', name: 'Différences de conversion — Actif', cls: '4', type: 'ASSET', balance: 'DEBIT' },
  { number: '481000', name: 'Charges à payer', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
  { number: '486000', name: 'Provisions pour charges', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },

  // ── Classe 5 — Financiers ──
  { number: '521000', name: 'Banque principale', cls: '5', type: 'ASSET', balance: 'DEBIT' },
  { number: '522000', name: 'Banque secondaire', cls: '5', type: 'ASSET', balance: 'DEBIT' },
  { number: '531000', name: 'Chèques postaux', cls: '5', type: 'ASSET', balance: 'DEBIT' },
  { number: '571000', name: 'Caisse', cls: '5', type: 'ASSET', balance: 'DEBIT' },
  { number: '581000', name: 'Virements internes', cls: '5', type: 'ASSET', balance: 'DEBIT' },
  { number: '582000', name: "Régies d'avances", cls: '5', type: 'ASSET', balance: 'DEBIT' },
  { number: '591000', name: 'Provisions pour dépréciation comptes financiers', cls: '5', type: 'LIABILITY', balance: 'CREDIT' },

  // ── Classe 6 — Charges ──
  { number: '601000', name: 'Achats de marchandises', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '602000', name: 'Achats de matières premières', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '604000', name: "Achats d'études et prestations", cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '605000', name: 'Achats de matériel', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '611000', name: 'Sous-traitance générale', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '613000', name: 'Loyers', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '621000', name: 'Personnel extérieur', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '623000', name: 'Publicité', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '624000', name: 'Transports', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '625000', name: 'Déplacements', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '626000', name: 'Frais postaux', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '627000', name: 'Services bancaires', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '631000', name: 'Loyers', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '632000', name: 'Charges locatives', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '633000', name: 'Redevances', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '641000', name: 'Impôts et taxes directs', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '642000', name: 'Impôts et taxes indirects', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '651000', name: 'Redevances de crédit-bail', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '661000', name: 'Rémunérations du personnel', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '664000', name: 'Charges sociales patronales', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '671000', name: "Charges exceptionnelles sur opérations", cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '675000', name: 'Valeurs comptables des éléments cédés', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '681000', name: 'Dotations aux amortissements', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '691000', name: 'Dotations aux provisions', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
  { number: '698000', name: 'Dotations — Impôts différés', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },

  // ── Classe 7 — Produits ──
  { number: '701000', name: 'Ventes de marchandises', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '706000', name: 'Prestations de services', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '707000', name: 'Ventes de produits finis', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '708000', name: "Produits des activités annexes", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '713000', name: 'Variation des stocks', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '722000', name: 'Production immobilisée', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '731000', name: "Subventions d'exploitation", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '736000', name: "Subventions d'équilibre", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '751000', name: 'Revenus des valeurs mobilières', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '758000', name: 'Produits divers de gestion courante', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '761000', name: 'Revenus des immobilisations', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '771000', name: "Produits exceptionnels sur opérations", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '775000', name: "Produits des cessions d'éléments d'actif", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '781000', name: 'Reprises sur amortissements et provisions', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
  { number: '796000', name: 'Reprises — Impôts différés', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
];

// ────────────────────────────────────────────────────────────────
// Accounting Service
// ────────────────────────────────────────────────────────────────

export const accountingService = {

  // ── Journal Entries ──────────────────────────────────────────

  /**
   * Create a journal entry.
   * Validates Σ debits === Σ credits (MANDATORY).
   * Generates entry number: JNL-YYYY-XXXXXX.
   */
  async createJournalEntry(data: CreateJournalEntryDto): Promise<JournalEntryDetail> {
    if (!data.lines || data.lines.length < 2) {
      throw new Error('Une écriture doit contenir au moins 2 lignes');
    }

    const totalDebit = data.lines.reduce((sum, l) => sum + Math.round(l.debitAmount), 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + Math.round(l.creditAmount), 0);

    if (totalDebit !== totalCredit) {
      throw new Error(
        `L'écriture n'est pas équilibrée: Total Débit = ${totalDebit.toLocaleString('fr-FR')} F, Total Crédit = ${totalCredit.toLocaleString('fr-FR')} F`,
      );
    }

    if (totalDebit === 0) {
      throw new Error("Le montant de l'écriture doit être supérieur à 0");
    }

    // Resolve all account IDs sequentially to avoid Supabase connection pool exhaustion
    const lineData: { accountId: string; debitAmount: number; creditAmount: number; description: string | null; lineOrder: number }[] = [];
    for (let idx = 0; idx < data.lines.length; idx++) {
      const line = data.lines[idx];
      const accountId = await getAccountIdByNumber(
        // accountId in the DTO is the account number string
        typeof (line as Record<string, unknown>).accountNumber === 'string'
          ? (line as Record<string, unknown>).accountNumber as string
          : line.accountId,
      );
      lineData.push({
        accountId,
        debitAmount: Math.round(line.debitAmount),
        creditAmount: Math.round(line.creditAmount),
        description: line.description ?? null,
        lineOrder: idx + 1,
      });
    }

    const entryNumber = await generateEntryNumber();

    const entry = await db.$transaction(async (tx) => {
      const created = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: new Date(data.entryDate),
          description: data.description,
          journalType: data.journalType,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          createdBy: data.createdBy ?? null,
          lines: { create: lineData },
        },
        include: {
          lines: {
            include: { account: { select: { accountNumber: true, accountName: true } } },
            orderBy: { lineOrder: 'asc' },
          },
        },
      });
      return created;
    });

    return this.formatEntryDetail(entry);
  },

  /**
   * Validate a journal entry (irreversible).
   */
  async validateEntry(id: string, userId: string): Promise<JournalEntryDetail> {
    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: { account: { select: { accountNumber: true, accountName: true } } },
          orderBy: { lineOrder: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new Error('Écriture non trouvée');
    }

    if (entry.isValidated) {
      throw new Error('Cette écriture est déjà validée');
    }

    // Verify balanced
    const totalDebit = entry.lines.reduce((sum, l) => sum + toDecimal(l.debitAmount), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + toDecimal(l.creditAmount), 0);
    if (totalDebit !== totalCredit) {
      throw new Error(
        `Impossible de valider: écriture non équilibrée (Débit=${totalDebit}, Crédit=${totalCredit})`,
      );
    }

    const updated = await db.journalEntry.update({
      where: { id },
      data: {
        isValidated: true,
        validatedBy: userId,
      },
      include: {
        lines: {
          include: { account: { select: { accountNumber: true, accountName: true } } },
          orderBy: { lineOrder: 'asc' },
        },
      },
    });

    return this.formatEntryDetail(updated);
  },

  /**
   * Get paginated journal entries with filters.
   */
  async getJournal(filters: JournalFilters): Promise<PaginatedResult<JournalEntryListItem>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.entryDate = dateFilter;
    }

    if (filters.journalType) where.journalType = filters.journalType;
    if (filters.isValidated !== undefined) where.isValidated = filters.isValidated;
    if (filters.referenceType) where.referenceType = filters.referenceType;

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { entryNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const entries = await db.journalEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { entryDate: 'desc' },
      include: {
        lines: {
          select: { debitAmount: true, creditAmount: true },
        },
      },
    });
    const total = await db.journalEntry.count({ where });

    const data: JournalEntryListItem[] = entries.map((entry) => {
      const totalDebit = entry.lines.reduce((sum, l) => sum + toDecimal(l.debitAmount), 0);
      const totalCredit = entry.lines.reduce((sum, l) => sum + toDecimal(l.creditAmount), 0);

      return {
        id: entry.id,
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate.toISOString(),
        description: entry.description,
        journalType: entry.journalType as JournalType,
        referenceType: entry.referenceType as ReferenceType | null,
        referenceId: entry.referenceId,
        isValidated: entry.isValidated,
        totalDebit,
        totalCredit,
        createdBy: entry.createdBy,
        validatedBy: entry.validatedBy,
        createdAt: entry.createdAt.toISOString(),
        lineCount: entry.lines.length,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get full journal entry detail by ID.
   */
  async getJournalEntryById(id: string): Promise<JournalEntryDetail> {
    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: { account: { select: { accountNumber: true, accountName: true } } },
          orderBy: { lineOrder: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new Error('Écriture non trouvée');
    }

    return this.formatEntryDetail(entry);
  },

  /**
   * Delete a non-validated journal entry and all its lines.
   */
  async deleteEntry(id: string): Promise<void> {
    const entry = await db.journalEntry.findUnique({ where: { id } });

    if (!entry) {
      throw new Error('Écriture non trouvée');
    }

    if (entry.isValidated) {
      throw new Error('Impossible de supprimer une écriture validée');
    }

    await db.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({ where: { entryId: id } });
      await tx.journalEntry.delete({ where: { id } });
    });
  },

  // ── Auto-generation methods (called from other services) ────

  /**
   * Create a payment journal entry.
   * CASH/WAVE/MTN_MOMO/ORANGE_MONEY → D 571000 C 706000
   * BANK_TRANSFER/CHEQUE → D 521000 C 706000
   */
  async createPaymentEntry(
    paymentId: string,
    amount: number,
    method: string,
    studentName: string,
    paymentNumber: string,
    date: Date,
    createdBy?: string,
  ): Promise<string> {
    const amt = Math.round(amount);
    const debitAccountNumber = ['BANK_TRANSFER', 'CHEQUE'].includes(method) ? '521000' : '571000';
    const creditAccountNumber = '706000';

    const debitAccountId = await getAccountIdByNumber(debitAccountNumber);
    const creditAccountId = await getAccountIdByNumber(creditAccountNumber);

    const entryNumber = await generateEntryNumber();

    const entry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate: date,
        description: `Paiement scolarité — ${studentName} — ${paymentNumber}`,
        journalType: 'CASH',
        referenceType: 'PAYMENT',
        referenceId: paymentId,
        createdBy: createdBy ?? null,
        lines: {
          create: [
            {
              accountId: debitAccountId,
              debitAmount: amt,
              creditAmount: 0,
              description: `${paymentNumber} — ${method}`,
              lineOrder: 1,
            },
            {
              accountId: creditAccountId,
              debitAmount: 0,
              creditAmount: amt,
              description: `Scolarité — ${studentName}`,
              lineOrder: 2,
            },
          ],
        },
      },
    });

    return entry.id;
  },

  /**
   * Create an expense journal entry.
   * D [accountId] C 401000
   */
  async createExpenseEntry(
    expenseId: string,
    description: string,
    amount: number,
    accountId: string,
    createdBy?: string,
  ): Promise<string> {
    const amt = Math.round(amount);
    // accountId here is the ChartOfAccount UUID (expense account to debit)
    const supplierAccountId = await getAccountIdByNumber('401000');

    const entryNumber = await generateEntryNumber();

    const entry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(),
        description,
        journalType: 'PURCHASES',
        referenceType: 'EXPENSE',
        referenceId: expenseId,
        createdBy: createdBy ?? null,
        lines: {
          create: [
            {
              accountId,
              debitAmount: amt,
              creditAmount: 0,
              description,
              lineOrder: 1,
            },
            {
              accountId: supplierAccountId,
              debitAmount: 0,
              creditAmount: amt,
              description: `Fournisseur — ${description}`,
              lineOrder: 2,
            },
          ],
        },
      },
    });

    return entry.id;
  },

  /**
   * Create a payroll journal entry.
   * For each employee:
   *   D 661000 (gross) C 431000 (cnps emp) C 447000 (its) C 571000 (net pay)
   * Separate entry for employer charges:
   *   D 664000 C 431000 (cnps employer)
   */
  async createPayrollEntry(
    payrollRunId: string,
    entries: Array<{
      employeeName: string;
      grossSalary: number;
      cnpsEmployee: number;
      itsTax: number;
      netPay: number;
      cnpsEmployer: number;
    }>,
    createdBy?: string,
  ): Promise<string> {
    const salaryAccountId = await getAccountIdByNumber('661000');
    const cnpsAccountId = await getAccountIdByNumber('431000');
    const itsAccountId = await getAccountIdByNumber('447000');
    const cashAccountId = await getAccountIdByNumber('571000');
    const employerChargesAccountId = await getAccountIdByNumber('664000');

    const entryNumber = await generateEntryNumber();
    const today = new Date();

    // Build lines for salary entries
    const lines: Array<{
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description: string;
      lineOrder: number;
    }> = [];

    let lineOrder = 1;
    let totalEmployerCharges = 0;

    for (const emp of entries) {
      const gross = Math.round(emp.grossSalary);
      const cnpsEmp = Math.round(emp.cnpsEmployee);
      const its = Math.round(emp.itsTax);
      const net = Math.round(emp.netPay);
      const cnpsEmpr = Math.round(emp.cnpsEmployer);

      // D 661000 (gross salary)
      lines.push({
        accountId: salaryAccountId,
        debitAmount: gross,
        creditAmount: 0,
        description: `Salaire brut — ${emp.employeeName}`,
        lineOrder: lineOrder++,
      });

      // C 431000 (CNPS employee)
      if (cnpsEmp > 0) {
        lines.push({
          accountId: cnpsAccountId,
          debitAmount: 0,
          creditAmount: cnpsEmp,
          description: `CNPS salarié — ${emp.employeeName}`,
          lineOrder: lineOrder++,
        });
      }

      // C 447000 (ITS)
      if (its > 0) {
        lines.push({
          accountId: itsAccountId,
          debitAmount: 0,
          creditAmount: its,
          description: `ITS — ${emp.employeeName}`,
          lineOrder: lineOrder++,
        });
      }

      // C 571000 (net pay)
      if (net > 0) {
        lines.push({
          accountId: cashAccountId,
          debitAmount: 0,
          creditAmount: net,
          description: `Salaire net — ${emp.employeeName}`,
          lineOrder: lineOrder++,
        });
      }

      totalEmployerCharges += cnpsEmpr;
    }

    // Employer charges entry
    if (totalEmployerCharges > 0) {
      lines.push({
        accountId: employerChargesAccountId,
        debitAmount: totalEmployerCharges,
        creditAmount: 0,
        description: 'Charges sociales patronales',
        lineOrder: lineOrder++,
      });

      lines.push({
        accountId: cnpsAccountId,
        debitAmount: 0,
        creditAmount: totalEmployerCharges,
        description: 'CNPS patronal',
        lineOrder: lineOrder++,
      });
    }

    const entry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate: today,
        description: `Paie — ${entries.length} employé(s)`,
        journalType: 'OD',
        referenceType: 'PAYROLL',
        referenceId: payrollRunId,
        createdBy: createdBy ?? null,
        lines: { create: lines },
      },
    });

    return entry.id;
  },

  // ── Ledger (Grand Livre) ─────────────────────────────────────

  /**
   * Get ledger for a specific account.
   * Computes running balance based on normalBalance.
   * Includes initial balance (sum of all lines before filter startDate).
   */
  async getLedger(accountId: string, filters: LedgerFilters): Promise<LedgerResult> {
    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId },
      select: {
        accountNumber: true,
        accountName: true,
        accountType: true,
        normalBalance: true,
      },
    });

    if (!account) {
      throw new Error('Compte non trouvé');
    }

    // Base query: validated entries only, for this account
    const baseWhere: Record<string, unknown> = {
      accountId,
      entry: { isValidated: true },
    };

    if (filters.startDate) {
      baseWhere.entry = {
        ...baseWhere.entry as object,
        entryDate: { gte: new Date(filters.startDate) },
      };
    }
    if (filters.endDate) {
      const existing = baseWhere.entry as Record<string, unknown>;
      if (existing.entryDate) {
        (existing.entryDate as Record<string, unknown>).lte = new Date(filters.endDate);
      } else {
        baseWhere.entry = {
          ...baseWhere.entry as object,
          entryDate: { lte: new Date(filters.endDate) },
        };
      }
    }

    // Get filtered lines
    const lines = await db.journalEntryLine.findMany({
      where: baseWhere,
      include: {
        entry: {
          select: {
            entryNumber: true,
            entryDate: true,
            description: true,
            journalType: true,
          },
        },
      },
      orderBy: { entry: { entryDate: 'asc' } },
    });

    // Compute initial balance (all validated lines before startDate)
    let initialBalance = 0;
    if (filters.startDate) {
      const beforeLines = await db.journalEntryLine.findMany({
        where: {
          accountId,
          entry: {
            isValidated: true,
            entryDate: { lt: new Date(filters.startDate) },
          },
        },
      });

      const totalDebitBefore = beforeLines.reduce((s, l) => s + toDecimal(l.debitAmount), 0);
      const totalCreditBefore = beforeLines.reduce((s, l) => s + toDecimal(l.creditAmount), 0);
      initialBalance = computeBalance(totalDebitBefore, totalCreditBefore, account.normalBalance as NormalBalance);
    } else {
      // No start date: compute from ALL validated lines before the first in the set
      const allValidatedLines = await db.journalEntryLine.findMany({
        where: {
          accountId,
          entry: { isValidated: true },
        },
      });

      // Actually, if no start date, initial balance is 0 (we show everything)
      // But we still need to compute running balance from 0
      const allDebit = allValidatedLines.reduce((s, l) => s + toDecimal(l.debitAmount), 0);
      const allCredit = allValidatedLines.reduce((s, l) => s + toDecimal(l.creditAmount), 0);

      // initial balance = balance of all lines before the first line's date
      if (lines.length > 0) {
        const firstDate = lines[0].entry.entryDate;
        const beforeLines = allValidatedLines.filter(
          l => l.entry.entryDate < firstDate,
        );
        const totalDebitBefore = beforeLines.reduce((s, l) => s + toDecimal(l.debitAmount), 0);
        const totalCreditBefore = beforeLines.reduce((s, l) => s + toDecimal(l.creditAmount), 0);
        initialBalance = computeBalance(totalDebitBefore, totalCreditBefore, account.normalBalance as NormalBalance);
      }
    }

    // Build ledger entries with running balance
    let runningBalance = initialBalance;
    const ledgerEntries: LedgerEntry[] = [];
    let finalDebit = 0;
    let finalCredit = 0;

    for (const line of lines) {
      const debit = toDecimal(line.debitAmount);
      const credit = toDecimal(line.creditAmount);
      finalDebit += debit;
      finalCredit += credit;

      runningBalance += computeBalance(debit, credit, account.normalBalance as NormalBalance);

      ledgerEntries.push({
        id: line.id,
        entryNumber: line.entry.entryNumber,
        entryDate: line.entry.entryDate.toISOString(),
        description: line.entry.description,
        journalType: line.entry.journalType as JournalType,
        debitAmount: debit,
        creditAmount: credit,
        runningBalance,
      });
    }

    return {
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType as AccountType,
      normalBalance: account.normalBalance as NormalBalance,
      initialBalance,
      entries: ledgerEntries,
      finalDebit,
      finalCredit,
      finalBalance: runningBalance,
    };
  },

  // ── Trial Balance (Balance Générale) ────────────────────────

  /**
   * Get trial balance for all accounts up to a given date.
   */
  async getTrialBalance(filters: TrialBalanceFilters): Promise<TrialBalance> {
    const date = filters.date ? new Date(filters.date) : new Date();

    // Get all validated journal entry lines up to this date
    const allLines = await db.journalEntryLine.findMany({
      where: {
        entry: {
          isValidated: true,
          entryDate: { lte: date },
        },
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            accountName: true,
            accountClass: true,
            accountType: true,
          },
        },
      },
    });

    // Aggregate by account
    const accountMap = new Map<string, {
      accountNumber: string;
      accountName: string;
      accountClass: string;
      accountType: AccountType;
      totalDebit: number;
      totalCredit: number;
    }>();

    for (const line of allLines) {
      const key = line.accountId;
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          accountNumber: line.account.accountNumber,
          accountName: line.account.accountName,
          accountClass: line.account.accountClass,
          accountType: line.account.accountType as AccountType,
          totalDebit: 0,
          totalCredit: 0,
        });
      }
      const acc = accountMap.get(key)!;
      acc.totalDebit += toDecimal(line.debitAmount);
      acc.totalCredit += toDecimal(line.creditAmount);
    }

    // Build rows
    let rows: TrialBalanceRow[] = Array.from(accountMap.values()).map((acc) => ({
      accountNumber: acc.accountNumber,
      accountName: acc.accountName,
      accountClass: acc.accountClass,
      accountType: acc.accountType,
      totalDebit: Math.round(acc.totalDebit),
      totalCredit: Math.round(acc.totalCredit),
      balanceDebit: Math.max(0, Math.round(acc.totalDebit - acc.totalCredit)),
      balanceCredit: Math.max(0, Math.round(acc.totalCredit - acc.totalDebit)),
    }));

    // Filter onlyMoved
    if (filters.onlyMoved) {
      rows = rows.filter((r) => r.totalDebit > 0 || r.totalCredit > 0);
    }

    // Sort by account number
    rows.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));

    const totalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);
    const totalBalanceDebit = rows.reduce((s, r) => s + r.balanceDebit, 0);
    const totalBalanceCredit = rows.reduce((s, r) => s + r.balanceCredit, 0);

    return {
      date: date.toISOString(),
      rows,
      totalDebit,
      totalCredit,
      totalBalanceDebit,
      totalBalanceCredit,
      isBalanced: totalBalanceDebit === totalBalanceCredit,
    };
  },

  // ── Income Statement (Compte de Résultat) ──────────────────

  /**
   * Get income statement (Classe 6 = Charges, Classe 7 = Produits).
   */
  async getIncomeStatement(filters: IncomeStatementFilters): Promise<IncomeStatement> {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    const lines = await db.journalEntryLine.findMany({
      where: {
        entry: {
          isValidated: true,
          entryDate: { gte: startDate, lte: endDate },
        },
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            accountName: true,
            accountClass: true,
          },
        },
      },
    });

    // Aggregate revenues (Classe 7) and expenses (Classe 6)
    const revenueMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    for (const line of lines) {
      const cls = line.account.accountClass;
      const credit = toDecimal(line.creditAmount);
      const debit = toDecimal(line.debitAmount);

      if (cls === '7') {
        // Revenue: normally credit
        const key = line.account.accountNumber;
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + credit - debit);
      } else if (cls === '6') {
        // Expense: normally debit
        const key = line.account.accountNumber;
        expenseMap.set(key, (expenseMap.get(key) ?? 0) + debit - credit);
      }
    }

    const revenues: IncomeStatementRow[] = [];
    for (const [accountNumber, amount] of revenueMap) {
      if (amount === 0) continue;
      const account = lines.find(l => l.account.accountNumber === accountNumber)?.account;
      revenues.push({
        accountNumber,
        accountName: account?.accountName ?? '',
        amount: Math.round(amount),
      });
    }

    const expenses: IncomeStatementRow[] = [];
    for (const [accountNumber, amount] of expenseMap) {
      if (amount === 0) continue;
      const account = lines.find(l => l.account.accountNumber === accountNumber)?.account;
      expenses.push({
        accountNumber,
        accountName: account?.accountName ?? '',
        amount: Math.round(amount),
      });
    }

    revenues.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
    expenses.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      revenues,
      totalRevenue,
      expenses,
      totalExpenses,
      netResult: totalRevenue - totalExpenses,
    };
  },

  // ── Balance Sheet (Bilan) ──────────────────────────────────

  /**
   * Get balance sheet.
   * Actif: ASSET accounts (classes 2, 3, 5 with DEBIT balance)
   * Passif: LIABILITY accounts (class 4 with CREDIT balance)
   * Capitaux propres: EQUITY accounts (class 1 with CREDIT balance)
   */
  async getBalanceSheet(date: string): Promise<BalanceSheet> {
    const balanceDate = new Date(date);

    const lines = await db.journalEntryLine.findMany({
      where: {
        entry: {
          isValidated: true,
          entryDate: { lte: balanceDate },
        },
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            accountName: true,
            accountClass: true,
            accountType: true,
            normalBalance: true,
          },
        },
      },
    });

    // Aggregate by account
    const accountBalances = new Map<string, {
      accountNumber: string;
      accountName: string;
      accountClass: string;
      accountType: AccountType;
      normalBalance: NormalBalance;
      totalDebit: number;
      totalCredit: number;
    }>();

    for (const line of lines) {
      const key = line.accountId;
      if (!accountBalances.has(key)) {
        accountBalances.set(key, {
          accountNumber: line.account.accountNumber,
          accountName: line.account.accountName,
          accountClass: line.account.accountClass,
          accountType: line.account.accountType as AccountType,
          normalBalance: line.account.normalBalance as NormalBalance,
          totalDebit: 0,
          totalCredit: 0,
        });
      }
      const acc = accountBalances.get(key)!;
      acc.totalDebit += toDecimal(line.debitAmount);
      acc.totalCredit += toDecimal(line.creditAmount);
    }

    const assetRows: BalanceSheetRow[] = [];
    const liabilityRows: BalanceSheetRow[] = [];
    const equityRows: BalanceSheetRow[] = [];

    for (const acc of accountBalances.values()) {
      const balance = computeBalance(
        acc.totalDebit,
        acc.totalCredit,
        acc.normalBalance,
      );
      const roundedBalance = Math.round(balance);
      if (roundedBalance === 0) continue;

      const row: BalanceSheetRow = {
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        amount: roundedBalance,
      };

      if (acc.accountType === 'ASSET') {
        // Only include positive balance for asset accounts
        if (roundedBalance > 0) {
          assetRows.push(row);
        }
      } else if (acc.accountType === 'LIABILITY') {
        // Only include positive balance for liability accounts
        if (roundedBalance > 0) {
          liabilityRows.push(row);
        }
      } else if (acc.accountType === 'EQUITY') {
        if (roundedBalance > 0) {
          equityRows.push(row);
        }
      }
    }

    assetRows.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
    liabilityRows.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
    equityRows.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));

    const totalAssets = assetRows.reduce((s, r) => s + r.amount, 0);
    const totalLiabilities = liabilityRows.reduce((s, r) => s + r.amount, 0);
    const totalEquity = equityRows.reduce((s, r) => s + r.amount, 0);

    const assets: BalanceSheetSection = {
      label: 'Actif',
      rows: assetRows,
      total: totalAssets,
    };

    const liabilities: BalanceSheetSection = {
      label: 'Passif',
      rows: liabilityRows,
      total: totalLiabilities,
    };

    const equity: BalanceSheetSection = {
      label: 'Capitaux Propres',
      rows: equityRows,
      total: totalEquity,
    };

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      date: balanceDate.toISOString(),
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilitiesAndEquity,
      isBalanced: totalAssets === totalLiabilitiesAndEquity,
    };
  },

  // ── Chart of Accounts ──────────────────────────────────────

  /**
   * Get all accounts (flat list) with current balance.
   */
  async getAllAccounts(includeInactive: boolean = false): Promise<ChartOfAccountFlat[]> {
    const accounts = await db.chartOfAccount.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: { select: { accountName: true } },
      },
      orderBy: { accountNumber: 'asc' },
    });

    // Compute balances for all accounts at once
    const allLines = await db.journalEntryLine.findMany({
      where: {
        entry: { isValidated: true },
      },
      select: {
        accountId: true,
        debitAmount: true,
        creditAmount: true,
      },
    });

    const balanceMap = new Map<string, { totalDebit: number; totalCredit: number }>();
    for (const line of allLines) {
      if (!balanceMap.has(line.accountId)) {
        balanceMap.set(line.accountId, { totalDebit: 0, totalCredit: 0 });
      }
      const b = balanceMap.get(line.accountId)!;
      b.totalDebit += toDecimal(line.debitAmount);
      b.totalCredit += toDecimal(line.creditAmount);
    }

    // Get normalBalance for all accounts
    const allAccounts = await db.chartOfAccount.findMany({
      select: { id: true, normalBalance: true },
    });
    const normalBalanceMap = new Map(allAccounts.map(a => [a.id, a.normalBalance as NormalBalance]));

    const result: ChartOfAccountFlat[] = accounts.map((acc) => {
      const bal = balanceMap.get(acc.id) ?? { totalDebit: 0, totalCredit: 0 };
      const normalBal = normalBalanceMap.get(acc.id) ?? 'DEBIT';

      return {
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        accountClass: acc.accountClass,
        accountType: acc.accountType as AccountType,
        parentId: acc.parentId,
        parentName: acc.parent?.accountName ?? null,
        normalBalance: acc.normalBalance as NormalBalance,
        isActive: acc.isActive,
        currentBalance: Math.round(
          computeBalance(bal.totalDebit, bal.totalCredit, normalBal),
        ),
        isStandard: isStandardAccount(acc.accountNumber),
      };
    });

    return result;
  },

  /**
   * Get account tree (hierarchical structure).
   */
  async getAccountTree(): Promise<ChartOfAccountItem[]> {
    const flatAccounts = await this.getAllAccounts(true);

    const accountMap = new Map<string, ChartOfAccountItem>();
    const roots: ChartOfAccountItem[] = [];

    for (const acc of flatAccounts) {
      accountMap.set(acc.id, {
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        accountClass: acc.accountClass,
        accountType: acc.accountType,
        parentId: acc.parentId,
        normalBalance: acc.normalBalance,
        isActive: acc.isActive,
        currentBalance: acc.currentBalance,
        children: [],
      });
    }

    for (const item of accountMap.values()) {
      if (item.parentId && accountMap.has(item.parentId)) {
        accountMap.get(item.parentId)!.children!.push(item);
      } else {
        roots.push(item);
      }
    }

    // Sort: roots and children by account number
    const sortTree = (items: ChartOfAccountItem[]) => {
      items.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          sortTree(item.children);
        }
      }
    };
    sortTree(roots);

    return roots;
  },

  /**
   * Get a single account by its number.
   */
  async getAccountByNumber(accountNumber: string): Promise<ChartOfAccountItem | null> {
    const account = await db.chartOfAccount.findUnique({
      where: { accountNumber },
      include: {
        parent: { select: { accountName: true } },
      },
    });

    if (!account) return null;

    // Compute balance
    const lines = await db.journalEntryLine.findMany({
      where: {
        accountId: account.id,
        entry: { isValidated: true },
      },
      select: { debitAmount: true, creditAmount: true },
    });

    const totalDebit = lines.reduce((s, l) => s + toDecimal(l.debitAmount), 0);
    const totalCredit = lines.reduce((s, l) => s + toDecimal(l.creditAmount), 0);

    return {
      id: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountClass: account.accountClass,
      accountType: account.accountType as AccountType,
      parentId: account.parentId,
      normalBalance: account.normalBalance as NormalBalance,
      isActive: account.isActive,
      currentBalance: Math.round(
        computeBalance(totalDebit, totalCredit, account.normalBalance as NormalBalance),
      ),
      children: [],
    };
  },

  /**
   * Search accounts by number or name (case-insensitive).
   */
  async searchAccounts(query: string): Promise<ChartOfAccountFlat[]> {
    if (!query || query.trim().length === 0) {
      return this.getAllAccounts(false);
    }

    const term = query.trim();

    const accounts = await db.chartOfAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { accountNumber: { contains: term, mode: 'insensitive' } },
          { accountName: { contains: term, mode: 'insensitive' } },
        ],
      },
      include: {
        parent: { select: { accountName: true } },
      },
      orderBy: { accountNumber: 'asc' },
      take: 50,
    });

    // Compute balances
    const accountIds = accounts.map(a => a.id);
    const lines = await db.journalEntryLine.findMany({
      where: {
        accountId: { in: accountIds },
        entry: { isValidated: true },
      },
      select: { accountId: true, debitAmount: true, creditAmount: true },
    });

    const balanceMap = new Map<string, { totalDebit: number; totalCredit: number }>();
    for (const line of lines) {
      if (!balanceMap.has(line.accountId)) {
        balanceMap.set(line.accountId, { totalDebit: 0, totalCredit: 0 });
      }
      const b = balanceMap.get(line.accountId)!;
      b.totalDebit += toDecimal(line.debitAmount);
      b.totalCredit += toDecimal(line.creditAmount);
    }

    return accounts.map((acc) => {
      const bal = balanceMap.get(acc.id) ?? { totalDebit: 0, totalCredit: 0 };
      return {
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        accountClass: acc.accountClass,
        accountType: acc.accountType as AccountType,
        parentId: acc.parentId,
        parentName: acc.parent?.accountName ?? null,
        normalBalance: acc.normalBalance as NormalBalance,
        isActive: acc.isActive,
        currentBalance: Math.round(
          computeBalance(bal.totalDebit, bal.totalCredit, acc.normalBalance as NormalBalance),
        ),
        isStandard: isStandardAccount(acc.accountNumber),
      };
    });
  },

  /**
   * Create a new chart of account.
   */
  async createAccount(data: CreateChartOfAccountDto): Promise<ChartOfAccountItem> {
    // Check if account number already exists
    const existing = await db.chartOfAccount.findUnique({
      where: { accountNumber: data.accountNumber },
    });

    if (existing) {
      throw new Error(`Le compte ${data.accountNumber} existe déjà`);
    }

    // Check if it's a standard account
    if (isStandardAccount(data.accountNumber)) {
      throw new Error('Impossible de modifier un compte standard OHADA');
    }

    // Validate parent if provided
    if (data.parentId) {
      const parent = await db.chartOfAccount.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new Error('Compte parent non trouvé');
      }
    }

    const account = await db.chartOfAccount.create({
      data: {
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        accountClass: data.accountClass,
        accountType: data.accountType,
        parentId: data.parentId ?? null,
        normalBalance: data.normalBalance,
        isActive: true,
      },
    });

    return {
      id: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountClass: account.accountClass,
      accountType: account.accountType as AccountType,
      parentId: account.parentId,
      normalBalance: account.normalBalance as NormalBalance,
      isActive: account.isActive,
      currentBalance: 0,
      children: [],
    };
  },

  // ── Initialization ──────────────────────────────────────────

  /**
   * Seed complete OHADA chart of accounts (idempotent via upsert).
   */
  async initializeChartOfAccounts(): Promise<void> {
    const count = await db.chartOfAccount.count();
    if (count > 0) {
      console.log('ℹ️  Plan comptable déjà initialisé — mise à jour des comptes standards');
    }

    for (const acc of OHADA_CHART) {
      await db.chartOfAccount.upsert({
        where: { accountNumber: acc.number },
        update: {
          accountName: acc.name,
          accountClass: acc.cls,
          accountType: acc.type,
          normalBalance: acc.balance,
          isActive: true,
        },
        create: {
          accountNumber: acc.number,
          accountName: acc.name,
          accountClass: acc.cls,
          accountType: acc.type,
          normalBalance: acc.balance,
          isActive: true,
        },
      });
    }

    console.log(`✅ ${OHADA_CHART.length} comptes OHADA initialisés/mis à jour`);
  },

  // ── Internal Helpers ────────────────────────────────────────

  /** Format a full entry with Prisma includes into JournalEntryDetail */
  formatEntryDetail(entry: {
    id: string;
    entryNumber: string;
    entryDate: Date;
    description: string;
    journalType: string;
    referenceType: string | null;
    referenceId: string | null;
    isValidated: boolean;
    createdBy: string | null;
    validatedBy: string | null;
    createdAt: Date;
    lines: Array<{
      id: string;
      accountId: string;
      debitAmount: number | { toNumber: () => number };
      creditAmount: number | { toNumber: () => number };
      description: string | null;
      lineOrder: number;
      account: { accountNumber: string; accountName: string } | null;
    }>;
  }): JournalEntryDetail {
    const totalDebit = entry.lines.reduce((sum, l) => sum + toDecimal(l.debitAmount), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + toDecimal(l.creditAmount), 0);

    const linesDto: JournalEntryLineDto[] = entry.lines.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      accountNumber: l.account?.accountNumber ?? '',
      accountName: l.account?.accountName ?? '',
      debitAmount: toDecimal(l.debitAmount),
      creditAmount: toDecimal(l.creditAmount),
      description: l.description,
      lineOrder: l.lineOrder,
    }));

    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate.toISOString(),
      description: entry.description,
      journalType: entry.journalType as JournalType,
      referenceType: entry.referenceType as ReferenceType | null,
      referenceId: entry.referenceId,
      isValidated: entry.isValidated,
      totalDebit,
      totalCredit,
      createdBy: entry.createdBy,
      validatedBy: entry.validatedBy,
      createdAt: entry.createdAt.toISOString(),
      lineCount: entry.lines.length,
      lines: linesDto,
    };
  },
};
