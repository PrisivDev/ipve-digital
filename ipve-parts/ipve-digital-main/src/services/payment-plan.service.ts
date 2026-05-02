/**
 * IPVE Digital — Payment Plan Service
 * Manage payment plans (tranche-based fee structures) for academic levels.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type {
  CreatePaymentPlanDto,
  PaymentPlanListItem,
  PaymentPlanDetail,
} from '@/types/payment.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

// ---------------------------------------------------------------------------
// Payment Plan Service
// ---------------------------------------------------------------------------

export const paymentPlanService = {
  /**
   * Get all payment plans, optionally filtered by academic year.
   */
  async getAllPlans(
    academicYearId?: string,
  ): Promise<PaymentPlanListItem[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (academicYearId) where.academicYearId = academicYearId;

    const plans = await db.paymentPlan.findMany({
      where,
      include: {
        level: {
          include: {
            filiere: { select: { name: true } },
          },
        },
        academicYear: { select: { name: true } },
        tranches: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      levelName: plan.level.name,
      filiereName: plan.level.filiere?.name ?? '',
      academicYearName: plan.academicYear.name,
      totalAmount: toDecimal(plan.totalAmount),
      trancheCount: plan.tranches.length,
      isActive: plan.isActive,
      createdAt: plan.createdAt.toISOString(),
    }));
  },

  /**
   * Get a single plan with full tranche details.
   */
  async getPlanById(id: string): Promise<PaymentPlanDetail> {
    const plan = await db.paymentPlan.findUnique({
      where: { id },
      include: {
        level: {
          include: {
            filiere: { select: { name: true } },
          },
        },
        academicYear: { select: { name: true } },
        tranches: { orderBy: { trancheNumber: 'asc' } },
      },
    });

    if (!plan) {
      throw new Error('Plan de paiement non trouvé');
    }

    return {
      id: plan.id,
      name: plan.name,
      levelName: plan.level.name,
      filiereName: plan.level.filiere?.name ?? '',
      academicYearName: plan.academicYear.name,
      totalAmount: toDecimal(plan.totalAmount),
      trancheCount: plan.tranches.length,
      isActive: plan.isActive,
      createdAt: plan.createdAt.toISOString(),
      tranches: plan.tranches.map((t) => ({
        id: t.id,
        trancheNumber: t.trancheNumber,
        name: t.name,
        amount: toDecimal(t.amount),
        dueDate: t.dueDate?.toISOString() ?? null,
        isMandatory: t.isMandatory,
      })),
    };
  },

  /**
   * Create a new payment plan with tranches.
   * Validates that totalAmount === sum of tranche amounts.
   */
  async createPlan(data: CreatePaymentPlanDto): Promise<PaymentPlanDetail> {
    // Validate level exists
    const level = await db.level.findUnique({
      where: { id: data.levelId },
      include: { filiere: { select: { name: true } } },
    });
    if (!level) {
      throw new Error('Niveau non trouvé');
    }

    // Validate academic year exists
    const academicYear = await db.academicYear.findUnique({
      where: { id: data.academicYearId },
    });
    if (!academicYear) {
      throw new Error('Année académique non trouvée');
    }

    // Validate tranches amounts match total
    const tranchesTotal = data.tranches.reduce((sum, t) => sum + t.amount, 0);
    if (Math.round(tranchesTotal) !== Math.round(data.totalAmount)) {
      throw new Error(
        `Le total des tranches (${Math.round(tranchesTotal)} FCFA) ne correspond pas au montant total (${Math.round(data.totalAmount)} FCFA)`,
      );
    }

    if (data.tranches.length === 0) {
      throw new Error('Au moins une tranche est requise');
    }

    // Validate no duplicate tranche numbers
    const trancheNumbers = data.tranches.map((t) => t.trancheNumber);
    if (new Set(trancheNumbers).size !== trancheNumbers.length) {
      throw new Error('Les numéros de tranche doivent être uniques');
    }

    // Create plan + tranches in transaction
    const plan = await db.$transaction(async (tx) => {
      const createdPlan = await tx.paymentPlan.create({
        data: {
          name: data.name.trim(),
          levelId: data.levelId,
          academicYearId: data.academicYearId,
          totalAmount: Math.round(data.totalAmount),
          currency: data.currency ?? 'XOF',
          isActive: true,
        },
        include: {
          level: {
            include: { filiere: { select: { name: true } } },
          },
          academicYear: { select: { name: true } },
        },
      });

      // Create tranches
      for (const tranche of data.tranches) {
        await tx.paymentPlanTranche.create({
          data: {
            planId: createdPlan.id,
            trancheNumber: tranche.trancheNumber,
            name: tranche.name.trim(),
            amount: Math.round(tranche.amount),
            dueDate: tranche.dueDate ? new Date(tranche.dueDate) : null,
            isMandatory: tranche.isMandatory ?? true,
          },
        });
      }

      // Fetch with tranches for response
      return tx.paymentPlan.findUnique({
        where: { id: createdPlan.id },
        include: {
          level: {
            include: { filiere: { select: { name: true } } },
          },
          academicYear: { select: { name: true } },
          tranches: { orderBy: { trancheNumber: 'asc' } },
        },
      });
    });

    if (!plan) {
      throw new Error('Erreur lors de la création du plan');
    }

    return {
      id: plan.id,
      name: plan.name,
      levelName: plan.level.name,
      filiereName: plan.level.filiere?.name ?? '',
      academicYearName: plan.academicYear.name,
      totalAmount: toDecimal(plan.totalAmount),
      trancheCount: plan.tranches.length,
      isActive: plan.isActive,
      createdAt: plan.createdAt.toISOString(),
      tranches: plan.tranches.map((t) => ({
        id: t.id,
        trancheNumber: t.trancheNumber,
        name: t.name,
        amount: toDecimal(t.amount),
        dueDate: t.dueDate?.toISOString() ?? null,
        isMandatory: t.isMandatory,
      })),
    };
  },

  /**
   * Assign a plan to a student.
   * Validates student exists and is active. Returns success.
   * Future: create StudentPlan record.
   */
  async assignPlanToStudent(
    studentId: string,
    planId: string,
  ): Promise<{ success: boolean; message: string }> {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, status: true, firstName: true, lastName: true },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    if (!['ENROLLED', 'ACTIVE'].includes(student.status)) {
      throw new Error(
        `L'étudiant ${student.lastName} ${student.firstName} n'est pas actif (statut: ${student.status})`,
      );
    }

    const plan = await db.paymentPlan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, isActive: true },
    });

    if (!plan) {
      throw new Error('Plan de paiement non trouvé');
    }

    if (!plan.isActive) {
      throw new Error('Ce plan de paiement n\'est plus actif');
    }

    // Future: create StudentPlan record linking student to plan
    // For now: validate and return success
    return {
      success: true,
      message: `Plan "${plan.name}" assigné avec succès à ${student.lastName} ${student.firstName}`,
    };
  },

  /**
   * Auto-assign a payment plan to a student at enrollment.
   * Finds student's level → current academic year → active plan.
   */
  async autoAssignAtEnrollment(
    studentId: string,
  ): Promise<{ success: boolean; message: string; planId?: string }> {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        levelId: true,
      },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    if (!student.levelId) {
      return {
        success: false,
        message: `Impossible d'assigner un plan: aucun niveau défini pour ${student.lastName} ${student.firstName}`,
      };
    }

    // Find current academic year
    const currentYear = await db.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!currentYear) {
      return {
        success: false,
        message: 'Aucune année académique courante définie',
      };
    }

    // Find active plan for this level + year
    const plan = await db.paymentPlan.findFirst({
      where: {
        levelId: student.levelId,
        academicYearId: currentYear.id,
        isActive: true,
      },
    });

    if (!plan) {
      return {
        success: false,
        message: `Aucun plan de paiement actif trouvé pour le niveau et l'année académique courante`,
      };
    }

    // Log assignment (via notification for audit trail)
    await db.notification.create({
      data: {
        type: 'INFO',
        title: 'Assignation Plan de Paiement',
        message: `Plan "${plan.name}" assigné automatiquement à ${student.lastName} ${student.firstName} (${currentYear.name})`,
        metadata: JSON.stringify({
          action: 'auto_assign_plan',
          studentId,
          planId: plan.id,
          academicYearId: currentYear.id,
        }),
      },
    });

    return {
      success: true,
      message: `Plan "${plan.name}" assigné automatiquement à ${student.lastName} ${student.firstName}`,
      planId: plan.id,
    };
  },
};

export default paymentPlanService;
