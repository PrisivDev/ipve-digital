/**
 * IPVE Digital — Payroll Service
 * OHADA-compliant payroll calculations for Côte d'Ivoire.
 * Generates payroll runs, calculates deductions (CNPS, ITS, CMU)
 * and employer charges.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type { PayrollStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// OHADA Constants (Côte d'Ivoire)
// ---------------------------------------------------------------------------

const CNPS_EMPLOYEE_RATE = 0.063;      // 6.3%
const CNPS_EMPLOYER_RATE = 0.12;        // 12% (8% retirement + 4% family)
const CMU_EMPLOYEE_RATE = 0.015;        // 1.5%
const CMU_CEILING = 1_500_000;          // 1,500,000 FCFA monthly ceiling
const ACCIDENT_WORK_RATE = 0.02;        // 2%
const TAX_PROFESSIONAL_RATE = 0.012;    // 1.2%
const FPC_RATE = 0.004;                 // 0.4%

// ---------------------------------------------------------------------------
// ITS (Impôt sur Traitement et Salaire) Progressive Table
// ---------------------------------------------------------------------------

/**
 * Calculate ITS from monthly taxable income (excluding transport allowance).
 * Uses progressive brackets, then divides annual tax by 12.
 */
function calculateITS(monthlyTaxable: number): number {
  const annualTaxable = monthlyTaxable * 12;

  let annualITS = 0;

  if (annualTaxable <= 0) return 0;

  if (annualTaxable <= 500_000) {
    annualITS = 0;
  } else if (annualTaxable <= 1_600_000) {
    annualITS = (annualTaxable - 500_000) * 0.10;
  } else if (annualTaxable <= 3_200_000) {
    annualITS = (1_100_000 * 0.10) + (annualTaxable - 1_600_000) * 0.15;
  } else if (annualTaxable <= 5_600_000) {
    annualITS = (1_100_000 * 0.10) + (1_600_000 * 0.15) + (annualTaxable - 3_200_000) * 0.20;
  } else if (annualTaxable <= 10_000_000) {
    annualITS = (1_100_000 * 0.10) + (1_600_000 * 0.15) + (2_400_000 * 0.20) + (annualTaxable - 5_600_000) * 0.25;
  } else {
    annualITS = (1_100_000 * 0.10) + (1_600_000 * 0.15) + (2_400_000 * 0.20) + (4_400_000 * 0.25) + (annualTaxable - 10_000_000) * 0.30;
  }

  return Math.round(annualITS / 12);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratePayrollDto {
  month: number;   // 1-12
  year: number;    // e.g. 2025
  bonuses?: Array<{
    employeeId: string;
    amount: number;
  }>;
}

export interface PayrollRunFilters {
  year?: number;
  status?: PayrollStatus;
  page?: number;
  limit?: number;
}

export interface PayrollRunListItem {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerCharges: number;
  payslipCount: number;
  validatedBy: string | null;
  paymentDate: string | null;
  createdAt: string;
}

export interface PayrollRunDetail extends PayrollRunListItem {
  payslips: PayslipDetail[];
}

export interface PayslipDetail {
  id: string;
  employeeId: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeNumber: string;
  department: string;
  position: string | null;
  baseSalary: number;
  transportAllowance: number;
  housingAllowance: number;
  otherBonuses: number;
  grossSalary: number;
  cnpsEmployee: number;
  itsTax: number;
  cmuEmployee: number;
  totalDeductions: number;
  netSalary: number;
  cnpsEmployer: number;
  accidentWork: number;
  taxProfessional: number;
  fpc: number;
  totalEmployerCost: number;
  pdfUrl: string | null;
}

export interface PaginatedPayrollRuns {
  data: PayrollRunListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

const MONTH_NAMES_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function getMonthLabel(month: number): string {
  return MONTH_NAMES_FR[month] ?? '';
}

// ---------------------------------------------------------------------------
// Payroll Service
// ---------------------------------------------------------------------------

export const payrollService = {
  /**
   * List payroll runs with filters.
   */
  async getAll(filters: PayrollFilters): Promise<PaginatedPayrollRuns> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;

    // Sequential queries to avoid Supabase connection pool exhaustion
    const runs = await db.payrollRun.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        payslips: { select: { id: true } },
        validatedByUser: { select: { firstName: true, lastName: true } },
      },
    });
    const total = await db.payrollRun.count({ where });

    const data: PayrollRunListItem[] = runs.map((run) => ({
      id: run.id,
      month: run.month,
      year: run.year,
      status: run.status as PayrollStatus,
      totalGross: toDecimal(run.totalGross),
      totalDeductions: toDecimal(run.totalDeductions),
      totalNet: toDecimal(run.totalNet),
      totalEmployerCharges: toDecimal(run.totalEmployerCharges),
      payslipCount: run.payslips.length,
      validatedBy: run.validatedByUser
        ? `${run.validatedByUser.firstName} ${run.validatedByUser.lastName}`
        : null,
      paymentDate: run.paymentDate?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
    }));

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get a single payroll run with all payslips and employee info.
   */
  async getById(id: string): Promise<PayrollRunDetail> {
    const run = await db.payrollRun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeNumber: true,
                department: true,
                position: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        validatedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    if (!run) {
      throw new Error('Exercice de paie non trouvé');
    }

    const payslips: PayslipDetail[] = run.payslips.map((ps) => ({
      id: ps.id,
      employeeId: ps.employeeId,
      employeeFirstName: ps.employee.firstName,
      employeeLastName: ps.employee.lastName,
      employeeNumber: ps.employee.employeeNumber,
      department: ps.employee.department,
      position: ps.employee.position,
      baseSalary: toDecimal(ps.baseSalary),
      transportAllowance: toDecimal(ps.transportAllowance),
      housingAllowance: toDecimal(ps.housingAllowance),
      otherBonuses: toDecimal(ps.otherBonuses),
      grossSalary: toDecimal(ps.grossSalary),
      cnpsEmployee: toDecimal(ps.cnpsEmployee),
      itsTax: toDecimal(ps.itsTax),
      cmuEmployee: toDecimal(ps.cmuEmployee),
      totalDeductions: toDecimal(ps.totalDeductions),
      netSalary: toDecimal(ps.netSalary),
      cnpsEmployer: toDecimal(ps.cnpsEmployer),
      accidentWork: toDecimal(ps.accidentWork),
      taxProfessional: toDecimal(ps.taxProfessional),
      fpc: toDecimal(ps.fpc),
      totalEmployerCost: toDecimal(ps.totalEmployerCost),
      pdfUrl: ps.pdfUrl,
    }));

    return {
      id: run.id,
      month: run.month,
      year: run.year,
      status: run.status as PayrollStatus,
      totalGross: toDecimal(run.totalGross),
      totalDeductions: toDecimal(run.totalDeductions),
      totalNet: toDecimal(run.totalNet),
      totalEmployerCharges: toDecimal(run.totalEmployerCharges),
      payslipCount: payslips.length,
      payslips,
      validatedBy: run.validatedByUser
        ? `${run.validatedByUser.firstName} ${run.validatedByUser.lastName}`
        : null,
      paymentDate: run.paymentDate?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
    };
  },

  /**
   * Generate payroll run for a given month/year.
   * Uses Prisma transaction for atomicity.
   * Checks no existing run for same month/year.
   */
  async generate(
    dto: GeneratePayrollDto,
    createdByUserId: string,
  ): Promise<PayrollRunDetail> {
    // Validate month/year
    if (dto.month < 1 || dto.month > 12) {
      throw new Error('Le mois doit être entre 1 et 12');
    }

    // Check no existing run for this month/year
    const existing = await db.payrollRun.findUnique({
      where: { month_year: { month: dto.month, year: dto.year } },
    });
    if (existing) {
      throw new Error(
        `Un exercice de paie existe déjà pour ${getMonthLabel(dto.month)} ${dto.year}`,
      );
    }

    // Build bonus map for quick lookup
    const bonusMap = new Map<string, number>();
    if (dto.bonuses) {
      for (const b of dto.bonuses) {
        bonusMap.set(b.employeeId, (bonusMap.get(b.employeeId) ?? 0) + b.amount);
      }
    }

    // Get all active employees
    const activeEmployees = await db.employee.findMany({
      where: { isActive: true },
    });

    if (activeEmployees.length === 0) {
      throw new Error('Aucun employé actif trouvé pour générer la paie');
    }

    // Calculate payslips for each employee
    let runTotalGross = 0;
    let runTotalDeductions = 0;
    let runTotalNet = 0;
    let runTotalEmployerCharges = 0;

    const payslipData = activeEmployees.map((emp) => {
      const baseSalary = toDecimal(emp.baseSalary);
      const transportAllowance = emp.transportAllowance ? toDecimal(emp.transportAllowance) : 0;
      const housingAllowance = emp.housingAllowance ? toDecimal(emp.housingAllowance) : 0;
      const otherBonuses = bonusMap.get(emp.id) ?? 0;

      // Gross salary = all earnings
      const grossSalary = baseSalary + transportAllowance + housingAllowance + otherBonuses;

      // --- Employee deductions ---
      // CNPS: 6.3% of base salary only (NOT on transport/transport allowance)
      // Actually in Côte d'Ivoire, CNPS is calculated on brut professionnel
      // which excludes transport allowance (indemnité de transport)
      const taxableBase = baseSalary + housingAllowance + otherBonuses;
      const cnpsEmployee = Math.round(taxableBase * CNPS_EMPLOYEE_RATE);

      // ITS: on taxable income (brut professionnel - CNPS employee)
      const itsTaxable = taxableBase - cnpsEmployee;
      const itsTax = calculateITS(Math.max(0, itsTaxable));

      // CMU: 1.5% of base, capped at 1,500,000 FCFA base
      const cmuBase = Math.min(taxableBase, CMU_CEILING);
      const cmuEmployee = Math.round(cmuBase * CMU_EMPLOYEE_RATE);

      const totalDeductions = cnpsEmployee + itsTax + cmuEmployee;
      const netSalary = grossSalary - totalDeductions;

      // --- Employer charges ---
      // CNPS Employeur: 12% of brut professionnel
      const cnpsEmployer = Math.round(taxableBase * CNPS_EMPLOYER_RATE);

      // Accident du travail: 2% of brut professionnel
      const accidentWork = Math.round(taxableBase * ACCIDENT_WORK_RATE);

      // Taxe professionnelle: 1.2% of brut professionnel
      const taxProfessional = Math.round(taxableBase * TAX_PROFESSIONAL_RATE);

      // FPC: 0.4% of brut professionnel
      const fpc = Math.round(taxableBase * FPC_RATE);

      const totalEmployerCost = cnpsEmployer + accidentWork + taxProfessional + fpc;

      // Accumulate run totals
      runTotalGross += grossSalary;
      runTotalDeductions += totalDeductions;
      runTotalNet += netSalary;
      runTotalEmployerCharges += totalEmployerCost;

      return {
        employeeId: emp.id,
        baseSalary,
        transportAllowance,
        housingAllowance,
        otherBonuses,
        grossSalary,
        cnpsEmployee,
        itsTax,
        cmuEmployee,
        totalDeductions,
        netSalary,
        cnpsEmployer,
        accidentWork,
        taxProfessional,
        fpc,
        totalEmployerCost,
      };
    });

    // Create payroll run and payslips in a transaction
    const payrollRun = await db.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          month: dto.month,
          year: dto.year,
          status: 'DRAFT',
          totalGross: runTotalGross,
          totalDeductions: runTotalDeductions,
          totalNet: runTotalNet,
          totalEmployerCharges: runTotalEmployerCharges,
          payslips: {
            create: payslipData,
          },
        },
        include: {
          payslips: {
            include: {
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                  employeeNumber: true,
                  department: true,
                  position: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return run;
    });

    // Return formatted detail
    const payslips: PayslipDetail[] = payrollRun.payslips.map((ps) => ({
      id: ps.id,
      employeeId: ps.employeeId,
      employeeFirstName: ps.employee.firstName,
      employeeLastName: ps.employee.lastName,
      employeeNumber: ps.employee.employeeNumber,
      department: ps.employee.department,
      position: ps.employee.position,
      baseSalary: toDecimal(ps.baseSalary),
      transportAllowance: toDecimal(ps.transportAllowance),
      housingAllowance: toDecimal(ps.housingAllowance),
      otherBonuses: toDecimal(ps.otherBonuses),
      grossSalary: toDecimal(ps.grossSalary),
      cnpsEmployee: toDecimal(ps.cnpsEmployee),
      itsTax: toDecimal(ps.itsTax),
      cmuEmployee: toDecimal(ps.cmuEmployee),
      totalDeductions: toDecimal(ps.totalDeductions),
      netSalary: toDecimal(ps.netSalary),
      cnpsEmployer: toDecimal(ps.cnpsEmployer),
      accidentWork: toDecimal(ps.accidentWork),
      taxProfessional: toDecimal(ps.taxProfessional),
      fpc: toDecimal(ps.fpc),
      totalEmployerCost: toDecimal(ps.totalEmployerCost),
      pdfUrl: ps.pdfUrl,
    }));

    return {
      id: payrollRun.id,
      month: payrollRun.month,
      year: payrollRun.year,
      status: payrollRun.status as PayrollStatus,
      totalGross: toDecimal(payrollRun.totalGross),
      totalDeductions: toDecimal(payrollRun.totalDeductions),
      totalNet: toDecimal(payrollRun.totalNet),
      totalEmployerCharges: toDecimal(payrollRun.totalEmployerCharges),
      payslipCount: payslips.length,
      payslips,
      validatedBy: null,
      paymentDate: null,
      createdAt: payrollRun.createdAt.toISOString(),
    };
  },

  /**
   * Validate a payroll run (DRAFT → VALIDATED).
   * This is an irreversible operation.
   */
  async validate(
    id: string,
    validatedByUserId: string,
  ): Promise<PayrollRunDetail> {
    const existing = await db.payrollRun.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Exercice de paie non trouvé');
    }

    if (existing.status !== 'DRAFT') {
      throw new Error(
        `Impossible de valider un exercice en statut "${existing.status}". Seul un brouillon peut être validé.`,
      );
    }

    const run = await db.payrollRun.update({
      where: { id },
      data: {
        status: 'VALIDATED',
        validatedBy: validatedByUserId,
      },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeNumber: true,
                department: true,
                position: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        validatedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    const payslips: PayslipDetail[] = run.payslips.map((ps) => ({
      id: ps.id,
      employeeId: ps.employeeId,
      employeeFirstName: ps.employee.firstName,
      employeeLastName: ps.employee.lastName,
      employeeNumber: ps.employee.employeeNumber,
      department: ps.employee.department,
      position: ps.employee.position,
      baseSalary: toDecimal(ps.baseSalary),
      transportAllowance: toDecimal(ps.transportAllowance),
      housingAllowance: toDecimal(ps.housingAllowance),
      otherBonuses: toDecimal(ps.otherBonuses),
      grossSalary: toDecimal(ps.grossSalary),
      cnpsEmployee: toDecimal(ps.cnpsEmployee),
      itsTax: toDecimal(ps.itsTax),
      cmuEmployee: toDecimal(ps.cmuEmployee),
      totalDeductions: toDecimal(ps.totalDeductions),
      netSalary: toDecimal(ps.netSalary),
      cnpsEmployer: toDecimal(ps.cnpsEmployer),
      accidentWork: toDecimal(ps.accidentWork),
      taxProfessional: toDecimal(ps.taxProfessional),
      fpc: toDecimal(ps.fpc),
      totalEmployerCost: toDecimal(ps.totalEmployerCost),
      pdfUrl: ps.pdfUrl,
    }));

    return {
      id: run.id,
      month: run.month,
      year: run.year,
      status: run.status as PayrollStatus,
      totalGross: toDecimal(run.totalGross),
      totalDeductions: toDecimal(run.totalDeductions),
      totalNet: toDecimal(run.totalNet),
      totalEmployerCharges: toDecimal(run.totalEmployerCharges),
      payslipCount: payslips.length,
      payslips,
      validatedBy: run.validatedByUser
        ? `${run.validatedByUser.firstName} ${run.validatedByUser.lastName}`
        : null,
      paymentDate: run.paymentDate?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
    };
  },
};

export default payrollService;
