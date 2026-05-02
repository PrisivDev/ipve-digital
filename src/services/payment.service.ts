/**
 * IPVE Digital — Payment Service
 * Core payment operations: recording, cancelling, listing, dashboard, reports, reminders.
 * All amounts in FCFA (XOF) — no decimals.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type {
  RecordPaymentDto,
  PaymentFilters,
  UnpaidFilters,
  PaymentReportFilters,
  SendReminderDto,
  StudentPaymentStatus,
  TrancheSummary,
  PaymentListItem,
  PaymentDetail,
  UnpaidSummary,
  PaymentDashboardData,
  PaymentReport,
  PaginatedResult,
  ReminderResult,
  TrancheStatus,
  PaymentMethod,
} from '@/types/payment.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

/** Generate payment number: PV-YYYY-XXXXX */
async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PV-${year}-`;
  const count = await db.payment.count({
    where: { paymentNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
}

/** Compute tranche status based on paid amount and due date */
function computeTrancheStatus(
  amountPaid: number,
  amountDue: number,
  dueDate: Date | null,
): { status: TrancheStatus; overdueDays: number | null } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (amountPaid >= amountDue) {
    return { status: 'PAYÉ', overdueDays: null };
  }
  if (amountPaid > 0) {
    if (dueDate && new Date(dueDate) < today) {
      const diff = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'EN_RETARD', overdueDays: diff };
    }
    return { status: 'PARTIEL', overdueDays: null };
  }
  // No payment at all
  if (dueDate && new Date(dueDate) < today) {
    const diff = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'EN_RETARD', overdueDays: diff };
  }
  return { status: 'EN_ATTENTE', overdueDays: null };
}

/** Get OHADA debit account for a given payment method */
function getDebitAccount(method: PaymentMethod): string {
  switch (method) {
    case 'CASH':
    case 'WAVE':
      return '571000';
    case 'MTN_MOMO':
    case 'ORANGE_MONEY':
      return '571000';
    case 'BANK_TRANSFER':
    case 'CHEQUE':
      return '521000';
    default:
      return '571000';
  }
}

/** Get start and end of a month */
function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ---------------------------------------------------------------------------
// Payment Service
// ---------------------------------------------------------------------------

export const paymentService = {
  /**
   * Get payment status for a specific student.
   * Finds PaymentPlan for student's level + current academic year, computes tranche summaries.
   */
  async getStudentPaymentStatus(
    studentId: string,
    academicYearId?: string,
  ): Promise<StudentPaymentStatus> {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        filiere: { select: { name: true } },
        level: { select: { name: true } },
      },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    // Determine academic year
    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await db.academicYear.findFirst({ where: { isCurrent: true } });
      yearId = currentYear?.id;
    }

    // Default response
    const emptyResult: StudentPaymentStatus = {
      studentId: student.id,
      studentName: `${student.lastName} ${student.firstName}`,
      studentNumber: student.studentNumber,
      filiereName: student.filiere?.name ?? null,
      levelName: student.level?.name ?? null,
      tranches: [],
      totalDue: 0,
      totalPaid: 0,
      balance: 0,
      globalStatus: 'En retard',
    };

    if (!student.levelId || !yearId) return emptyResult;

    // Find active plan for this level + year
    const plan = await db.paymentPlan.findFirst({
      where: {
        levelId: student.levelId,
        academicYearId: yearId,
        isActive: true,
      },
      include: {
        tranches: { orderBy: { trancheNumber: 'asc' } },
      },
    });

    if (!plan) return emptyResult;

    // Build tranche summaries
    const tranches: TrancheSummary[] = [];
    let totalDue = 0;
    let totalPaid = 0;
    let hasOverdue = false;
    let allPaid = true;

    for (const tranche of plan.tranches) {
      const amountDue = toDecimal(tranche.amount);

      // Sum completed/pending payments for this student + tranche
      const payments = await db.payment.findMany({
        where: {
          studentId,
          trancheId: tranche.id,
          status: { in: ['PENDING', 'COMPLETED'] },
        },
      });

      const amountPaid = payments.reduce((sum, p) => sum + toDecimal(p.amountPaid), 0);
      const remaining = Math.max(0, amountDue - amountPaid);
      const { status, overdueDays } = computeTrancheStatus(amountPaid, amountDue, tranche.dueDate);

      if (status === 'EN_RETARD') hasOverdue = true;
      if (status !== 'PAYÉ') allPaid = false;

      totalDue += amountDue;
      totalPaid += amountPaid;

      tranches.push({
        trancheId: tranche.id,
        trancheNumber: tranche.trancheNumber,
        trancheName: tranche.name,
        amountDue,
        amountPaid,
        remaining,
        status,
        dueDate: tranche.dueDate?.toISOString() ?? null,
        overdueDays,
      });
    }

    let globalStatus: StudentPaymentStatus['globalStatus'];
    if (allPaid) {
      globalStatus = 'À jour';
    } else if (hasOverdue) {
      globalStatus = 'En retard';
    } else {
      globalStatus = 'Partiel';
    }

    return {
      studentId: student.id,
      studentName: `${student.lastName} ${student.firstName}`,
      studentNumber: student.studentNumber,
      filiereName: student.filiere?.name ?? null,
      levelName: student.level?.name ?? null,
      tranches,
      totalDue,
      totalPaid,
      balance: Math.max(0, totalDue - totalPaid),
      globalStatus,
    };
  },

  /**
   * Record a payment. Validates amount, generates number, creates payment + OHADA journal entry.
   */
  async recordPayment(data: RecordPaymentDto): Promise<PaymentDetail> {
    if (!data.amountPaid || data.amountPaid <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: data.studentId },
      include: {
        filiere: { select: { name: true } },
        level: { select: { name: true } },
      },
    });
    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    // Determine tranche
    let trancheId = data.trancheId;
    if (!trancheId) {
      // Find first unpaid tranche chronologically for this student's plan
      const plan = await db.paymentPlan.findFirst({
        where: {
          levelId: student.levelId,
          isActive: true,
        },
        include: {
          tranches: { orderBy: { trancheNumber: 'asc' } },
        },
      });

      if (plan) {
        for (const t of plan.tranches) {
          const payments = await db.payment.findMany({
            where: {
              studentId: data.studentId,
              trancheId: t.id,
              status: { in: ['PENDING', 'COMPLETED'] },
            },
          });
          const paid = payments.reduce((sum, p) => sum + toDecimal(p.amountPaid), 0);
          if (paid < toDecimal(t.amount)) {
            trancheId = t.id;
            break;
          }
        }
      }

      if (!trancheId) {
        throw new Error('Aucune tranche impayée trouvée pour cet étudiant');
      }
    } else {
      // Verify tranche exists
      const tranche = await db.paymentPlanTranche.findUnique({ where: { id: trancheId } });
      if (!tranche) {
        throw new Error('Tranche non trouvée');
      }
    }

    const paymentNumber = await generatePaymentNumber();
    const amount = Math.round(data.amountPaid);

    // Create Payment + Journal Entry in transaction
    const payment = await db.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          paymentNumber,
          studentId: data.studentId,
          trancheId: trancheId!,
          amountPaid: amount,
          paymentDate: new Date(data.paymentDate),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber ?? null,
          receivedBy: data.receivedBy ?? null,
          notes: data.notes ?? null,
          status: 'COMPLETED',
        },
        include: {
          student: true,
          tranche: true,
          receivedByUser: { select: { firstName: true, lastName: true } },
        },
      });

      // Create OHADA journal entry
      const debitAccount = getDebitAccount(data.paymentMethod);
      const creditAccount = '706000'; // Scolarité
      const today = new Date();
      const entryNumber = `JE-${today.getFullYear()}-${String(Date.now()).slice(-6)}`;

      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: new Date(data.paymentDate),
          description: `Paiement scolarité - ${student.lastName} ${student.firstName} - ${paymentNumber}`,
          journalType: 'CASH',
          referenceType: 'PAYMENT',
          referenceId: p.id,
          createdBy: data.receivedBy ?? null,
          lines: {
            create: [
              {
                accountId: debitAccount,
                debitAmount: amount,
                creditAmount: 0,
                description: `${paymentNumber} - ${data.paymentMethod}`,
                lineOrder: 1,
              },
              {
                accountId: creditAccount,
                debitAmount: 0,
                creditAmount: amount,
                description: `Scolarité - ${student.lastName} ${student.firstName}`,
                lineOrder: 2,
              },
            ],
          },
        },
      });

      return p;
    });

    // Format the response
    const tranche = await db.paymentPlanTranche.findUnique({
      where: { id: payment.trancheId },
    });

    // Find the original journal entry for this payment
    const journalEntry = await db.journalEntry.findFirst({
      where: { referenceType: 'PAYMENT', referenceId: payment.id },
    });

    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      studentName: `${payment.student.lastName} ${payment.student.firstName}`,
      studentNumber: payment.student.studentNumber,
      trancheName: tranche?.name ?? '',
      amountPaid: toDecimal(payment.amountPaid),
      paymentDate: payment.paymentDate.toISOString(),
      paymentMethod: payment.paymentMethod as PaymentMethod,
      referenceNumber: payment.referenceNumber,
      status: payment.status as PaymentDetail['status'],
      receivedByName: payment.receivedByUser
        ? `${payment.receivedByUser.firstName} ${payment.receivedByUser.lastName}`
        : null,
      receiptUrl: payment.receiptUrl,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      studentId: payment.studentId,
      trancheId: payment.trancheId,
      studentFirstName: payment.student.firstName,
      studentLastName: payment.student.lastName,
      filiereName: student.filiere?.name ?? null,
      levelName: student.level?.name ?? null,
      receivedBy: payment.receivedBy,
      journalEntryId: journalEntry?.id ?? null,
    };
  },

  /**
   * Cancel a payment (soft cancel). Creates reversing journal entry.
   */
  async cancelPayment(
    id: string,
    reason: string,
    cancelledBy: string,
  ): Promise<PaymentDetail> {
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            filiere: { select: { name: true } },
            level: { select: { name: true } },
          },
        },
        tranche: true,
        receivedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    if (payment.status === 'CANCELLED') {
      throw new Error('Ce paiement est déjà annulé');
    }

    const amount = toDecimal(payment.amountPaid);

    // Update payment + create reversing journal entry in transaction
    await db.$transaction(async (tx) => {
      // Soft cancel the payment
      await tx.payment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: payment.notes
            ? `${payment.notes}\n\n[ANNULÉ] ${reason}`
            : `[ANNULÉ] ${reason}`,
        },
      });

      // Find original journal entry
      const originalEntry = await tx.journalEntry.findFirst({
        where: { referenceType: 'PAYMENT', referenceId: id },
        include: { lines: true },
      });

      if (originalEntry) {
        // Create reversing entry (swap debit/credit)
        const today = new Date();
        const revNumber = `JE-REV-${today.getFullYear()}-${String(Date.now()).slice(-6)}`;

        await tx.journalEntry.create({
          data: {
            entryNumber: revNumber,
            entryDate: today,
            description: `Annulation - ${payment.paymentNumber} - ${reason}`,
            journalType: 'OD',
            referenceType: 'PAYMENT',
            referenceId: id,
            createdBy: cancelledBy,
            lines: {
              create: originalEntry.lines.map((line, idx) => ({
                accountId: line.accountId,
                debitAmount: line.creditAmount,
                creditAmount: line.debitAmount,
                description: `Reversal of line ${idx + 1} from ${payment.paymentNumber}`,
                lineOrder: idx + 1,
              })),
            },
          },
        });
      }
    });

    // Return the updated payment
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      studentName: `${payment.student.lastName} ${payment.student.firstName}`,
      studentNumber: payment.student.studentNumber,
      trancheName: payment.tranche.name,
      amountPaid: amount,
      paymentDate: payment.paymentDate.toISOString(),
      paymentMethod: payment.paymentMethod as PaymentMethod,
      referenceNumber: payment.referenceNumber,
      status: 'CANCELLED',
      receivedByName: payment.receivedByUser
        ? `${payment.receivedByUser.firstName} ${payment.receivedByUser.lastName}`
        : null,
      receiptUrl: payment.receiptUrl,
      notes: payment.notes
        ? `${payment.notes}\n\n[ANNULÉ] ${reason}`
        : `[ANNULÉ] ${reason}`,
      createdAt: payment.createdAt.toISOString(),
      studentId: payment.studentId,
      trancheId: payment.trancheId,
      studentFirstName: payment.student.firstName,
      studentLastName: payment.student.lastName,
      filiereName: payment.student.filiere?.name ?? null,
      levelName: payment.student.level?.name ?? null,
      receivedBy: payment.receivedBy,
      journalEntryId: null,
    };
  },

  /**
   * Get paginated list of payments with filters.
   */
  async getPayments(filters: PaymentFilters): Promise<PaginatedResult<PaymentListItem>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { student: { firstName: { contains: term, mode: 'insensitive' } } },
        { student: { lastName: { contains: term, mode: 'insensitive' } } },
        { student: { studentNumber: { contains: term, mode: 'insensitive' } } },
        { paymentNumber: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.status) where.status = filters.status;
    if (filters.receivedBy) where.receivedBy = filters.receivedBy;

    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.paymentDate = dateFilter;
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const payments = await db.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        tranche: { select: { name: true } },
        receivedByUser: { select: { firstName: true, lastName: true } },
      },
    });
    const total = await db.payment.count({ where });

    const data: PaymentListItem[] = payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      studentName: `${p.student.lastName} ${p.student.firstName}`,
      studentNumber: p.student.studentNumber,
      trancheName: p.tranche.name,
      amountPaid: toDecimal(p.amountPaid),
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod as PaymentMethod,
      referenceNumber: p.referenceNumber,
      status: p.status as PaymentListItem['status'],
      receivedByName: p.receivedByUser
        ? `${p.receivedByUser.firstName} ${p.receivedByUser.lastName}`
        : null,
      receiptUrl: p.receiptUrl,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }));

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
   * Get full payment detail by ID.
   */
  async getPaymentById(id: string): Promise<PaymentDetail> {
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            filiere: { select: { name: true } },
            level: { select: { name: true } },
          },
        },
        tranche: true,
        receivedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    const journalEntry = await db.journalEntry.findFirst({
      where: { referenceType: 'PAYMENT', referenceId: payment.id },
    });

    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      studentName: `${payment.student.lastName} ${payment.student.firstName}`,
      studentNumber: payment.student.studentNumber,
      trancheName: payment.tranche.name,
      amountPaid: toDecimal(payment.amountPaid),
      paymentDate: payment.paymentDate.toISOString(),
      paymentMethod: payment.paymentMethod as PaymentMethod,
      referenceNumber: payment.referenceNumber,
      status: payment.status as PaymentDetail['status'],
      receivedByName: payment.receivedByUser
        ? `${payment.receivedByUser.firstName} ${payment.receivedByUser.lastName}`
        : null,
      receiptUrl: payment.receiptUrl,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      studentId: payment.studentId,
      trancheId: payment.trancheId,
      studentFirstName: payment.student.firstName,
      studentLastName: payment.student.lastName,
      filiereName: payment.student.filiere?.name ?? null,
      levelName: payment.student.level?.name ?? null,
      receivedBy: payment.receivedBy,
      journalEntryId: journalEntry?.id ?? null,
    };
  },

  /**
   * Get list of unpaid students with tranche details.
   */
  async getUnpaidStudents(filters: UnpaidFilters): Promise<PaginatedResult<UnpaidSummary>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    // Find all active payment plans with tranches
    const plans = await db.paymentPlan.findMany({
      where: { isActive: true },
      include: {
        level: {
          include: {
            filiere: { select: { name: true } },
          },
        },
        tranches: { orderBy: { trancheNumber: 'asc' } },
      },
    });

    // Build list of unpaid items per student per tranche
    const unpaidItems: UnpaidSummary[] = [];

    for (const plan of plans) {
      for (const tranche of plan.tranches) {
        const amountDue = toDecimal(tranche.amount);

        // Find all students in this level with active payments
        const studentPayments = await db.payment.groupBy({
          by: ['studentId'],
          where: {
            trancheId: tranche.id,
            status: { in: ['PENDING', 'COMPLETED'] },
          },
          _sum: { amountPaid: true },
        });

        // Also find all students enrolled at this level
        const studentsAtLevel = await db.student.findMany({
          where: {
            levelId: plan.levelId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            parentPhone: true,
            parentEmail: true,
          },
        });

        for (const student of studentsAtLevel) {
          const paidRecord = studentPayments.find(
            (sp) => sp.studentId === student.id,
          );
          const amountPaid = paidRecord?._sum.amountPaid
            ? toDecimal(paidRecord._sum.amountPaid)
            : 0;

          // Already fully paid — skip
          if (amountPaid >= amountDue) continue;

          // Apply filters
          if (filters.filiereId && plan.level.filiereId !== filters.filiereId) continue;
          if (filters.levelId && plan.levelId !== filters.levelId) continue;
          if (filters.trancheId && tranche.id !== filters.trancheId) continue;

          const remaining = Math.max(0, amountDue - amountPaid);
          if (filters.minAmount !== undefined && remaining < filters.minAmount) continue;
          if (filters.maxAmount !== undefined && remaining > filters.maxAmount) continue;

          const { status, overdueDays } = computeTrancheStatus(
            amountPaid,
            amountDue,
            tranche.dueDate,
          );

          // Filter out non-overdue if requested
          if (filters.includeOverdue && status !== 'EN_RETARD') continue;

          unpaidItems.push({
            studentId: student.id,
            studentName: `${student.lastName} ${student.firstName}`,
            studentNumber: student.studentNumber,
            filiereName: plan.level.filiere?.name ?? null,
            levelName: plan.level.name,
            studentPhone: student.parentPhone,
            studentEmail: student.parentEmail,
            trancheId: tranche.id,
            trancheName: tranche.name,
            trancheNumber: tranche.trancheNumber,
            amountDue,
            amountPaid,
            remaining,
            dueDate: tranche.dueDate?.toISOString() ?? null,
            overdueDays,
            status,
          });
        }
      }
    }

    // Deduplicate (a student might appear multiple times for different tranches — that's correct)
    // Sort by overdue days descending
    unpaidItems.sort((a, b) => {
      if (filters.includeOverdue) {
        return (b.overdueDays ?? 0) - (a.overdueDays ?? 0);
      }
      return a.trancheNumber - b.trancheNumber;
    });

    const total = unpaidItems.length;
    const data = unpaidItems.slice(skip, skip + limit);

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
   * Get payment dashboard data.
   */
  async getPaymentDashboard(): Promise<PaymentDashboardData> {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = getMonthRange(now);

    // Previous month range
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);

    // Current month collections
    const monthPayments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        paymentDate: { gte: monthStart, lte: monthEnd },
      },
    });
    const totalCollectedMonth = monthPayments.reduce(
      (sum, p) => sum + toDecimal(p.amountPaid),
      0,
    );

    // Previous month collections
    const prevMonthPayments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        paymentDate: { gte: prevStart, lte: prevEnd },
      },
    });
    const totalCollectedPreviousMonth = prevMonthPayments.reduce(
      (sum, p) => sum + toDecimal(p.amountPaid),
      0,
    );

    // Month-over-month change
    const monthOverMonthChange =
      totalCollectedPreviousMonth > 0
        ? Math.round(
            ((totalCollectedMonth - totalCollectedPreviousMonth) /
              totalCollectedPreviousMonth) *
              10000,
          ) / 100
        : totalCollectedMonth > 0
          ? 100
          : 0;

    // Total unpaid (sum of all remaining tranche amounts)
    const plans = await db.paymentPlan.findMany({
      where: { isActive: true },
      include: { tranches: true },
    });

    let totalUnpaid = 0;
    const studentUnpaidSet = new Set<string>();

    for (const plan of plans) {
      for (const tranche of plan.tranches) {
        const amountDue = toDecimal(tranche.amount);

        // Sum payments per student for this tranche
        const payments = await db.payment.findMany({
          where: {
            trancheId: tranche.id,
            status: { in: ['PENDING', 'COMPLETED'] },
          },
        });

        // Group by student
        const byStudent: Record<string, number> = {};
        for (const p of payments) {
          byStudent[p.studentId] = (byStudent[p.studentId] || 0) + toDecimal(p.amountPaid);
        }

        // Find all students at this level
        const students = await db.student.findMany({
          where: {
            levelId: plan.levelId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
          },
          select: { id: true },
        });

        for (const s of students) {
          const paid = byStudent[s.id] || 0;
          const remaining = Math.max(0, amountDue - paid);
          if (remaining > 0) {
            totalUnpaid += remaining;
            studentUnpaidSet.add(s.id);
          }
        }
      }
    }

    const unpaidStudentCount = studentUnpaidSet.size;

    // Total refunded this month (for estimated treasury)
    const refundedMonth = await db.payment.findMany({
      where: {
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
        paymentDate: { gte: monthStart, lte: monthEnd },
      },
    });
    const totalRefundedMonth = refundedMonth.reduce(
      (sum, p) => sum + toDecimal(p.amountPaid),
      0,
    );

    const estimatedTreasury = totalCollectedMonth - totalRefundedMonth;

    // Top 5 debtors (students with highest overdue amounts)
    const allUnpaid = await paymentService.getUnpaidStudents({
      includeOverdue: true,
      page: 1,
      limit: 5,
    });
    const topDebtors = allUnpaid.data;

    // Revenue chart — 12 months
    const revenueChart: { month: string; total: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { start, end } = getMonthRange(d);
      const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      const monthPmts = await db.payment.findMany({
        where: {
          status: 'COMPLETED',
          paymentDate: { gte: start, lte: end },
        },
      });
      const monthTotal = monthPmts.reduce(
        (sum, p) => sum + toDecimal(p.amountPaid),
        0,
      );

      revenueChart.push({ month: monthLabel, total: monthTotal });
    }

    // Recent payments (10 most recent)
    const recentResult = await paymentService.getPayments({ page: 1, limit: 10 });
    const recentPayments = recentResult.data;

    // By method distribution
    const methodPayments = await db.payment.groupBy({
      by: ['paymentMethod'],
      where: { status: 'COMPLETED' },
      _sum: { amountPaid: true },
      _count: true,
    });

    const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
      CASH: 'Espèces',
      MTN_MOMO: 'MTN Mobile Money',
      ORANGE_MONEY: 'Orange Money',
      WAVE: 'Wave',
      BANK_TRANSFER: 'Virement bancaire',
      CHEQUE: 'Chèque',
    };

    const byMethod = methodPayments.map((mp) => ({
      method: mp.paymentMethod as PaymentMethod,
      label: PAYMENT_METHOD_LABELS[mp.paymentMethod as PaymentMethod] ?? mp.paymentMethod,
      count: mp._count,
      total: mp._sum.amountPaid ? toDecimal(mp._sum.amountPaid) : 0,
    }));

    return {
      totalCollectedMonth,
      totalCollectedPreviousMonth,
      monthOverMonthChange,
      totalUnpaid,
      unpaidStudentCount,
      estimatedTreasury,
      topDebtors,
      revenueChart,
      recentPayments,
      byMethod,
    };
  },

  /**
   * Get payment report with groupings and aggregations.
   */
  async getPaymentReport(filters: PaymentReportFilters): Promise<PaymentReport> {
    const where: Record<string, unknown> = { status: 'COMPLETED' };

    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.paymentDate = dateFilter;
    }
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

    const payments = await db.payment.findMany({
      where,
      include: {
        student: {
          include: { filiere: { select: { name: true } } },
        },
        receivedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Also get refunded amounts
    const refundWhere: Record<string, unknown> = {
      status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
    };
    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      refundWhere.paymentDate = dateFilter;
    }
    const refundPayments = await db.payment.findMany({ where: refundWhere });
    const totalRefunded = refundPayments.reduce(
      (sum, p) => sum + toDecimal(p.amountPaid),
      0,
    );

    const totalCollected = payments.reduce(
      (sum, p) => sum + toDecimal(p.amountPaid),
      0,
    );

    // By method
    const methodMap: Record<string, { count: number; total: number }> = {};
    const allMethods: PaymentMethod[] = [
      'CASH',
      'MTN_MOMO',
      'ORANGE_MONEY',
      'WAVE',
      'BANK_TRANSFER',
      'CHEQUE',
    ];
    for (const m of allMethods) {
      methodMap[m] = { count: 0, total: 0 };
    }
    for (const p of payments) {
      const key = p.paymentMethod;
      if (!methodMap[key]) methodMap[key] = { count: 0, total: 0 };
      methodMap[key].count++;
      methodMap[key].total += toDecimal(p.amountPaid);
    }
    const byMethod = methodMap as unknown as Record<PaymentMethod, { count: number; total: number }>;

    // By month
    const monthMap: Record<string, { month: string; total: number; count: number }> = {};
    for (const p of payments) {
      const key = p.paymentDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthMap[key]) monthMap[key] = { month: key, total: 0, count: 0 };
      monthMap[key].total += toDecimal(p.amountPaid);
      monthMap[key].count++;
    }
    const byMonth = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // By filiere
    const filiereMap: Record<string, { filiereName: string; total: number; count: number }> = {};
    for (const p of payments) {
      const fName = p.student.filiere?.name ?? 'Non assigné';
      if (!filiereMap[fName]) filiereMap[fName] = { filiereName: fName, total: 0, count: 0 };
      filiereMap[fName].total += toDecimal(p.amountPaid);
      filiereMap[fName].count++;
    }
    const byFiliere = Object.values(filiereMap).sort((a, b) => b.total - a.total);

    // Recent payments (last 10)
    const recentPayments: PaymentListItem[] = payments.slice(0, 10).map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      studentName: `${p.student.lastName} ${p.student.firstName}`,
      studentNumber: p.student.studentNumber,
      trancheName: '', // simplified for report
      amountPaid: toDecimal(p.amountPaid),
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod as PaymentMethod,
      referenceNumber: p.referenceNumber,
      status: p.status as PaymentListItem['status'],
      receivedByName: p.receivedByUser
        ? `${p.receivedByUser.firstName} ${p.receivedByUser.lastName}`
        : null,
      receiptUrl: p.receiptUrl,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    }));

    return {
      totalCollected,
      totalRefunded,
      netRevenue: totalCollected - totalRefunded,
      paymentCount: payments.length,
      averageAmount:
        payments.length > 0
          ? Math.round(totalCollected / payments.length)
          : 0,
      byMethod,
      byMonth,
      byFiliere,
      recentPayments,
    };
  },

  /**
   * Send reminders to students with due/overdue tranches.
   * Creates Notification records (mock send for now).
   */
  async sendReminders(dto: SendReminderDto): Promise<ReminderResult> {
    const result: ReminderResult = {
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      details: [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find matching tranches based on criteria
    const plans = await db.paymentPlan.findMany({
      where: { isActive: true },
      include: { tranches: true, level: true },
    });

    const targetStudentTranches: {
      studentId: string;
      studentName: string;
      trancheId: string;
      trancheName: string;
      dueDate: Date | null;
      remaining: number;
      overdueDays: number | null;
    }[] = [];

    for (const plan of plans) {
      for (const tranche of plan.tranches) {
        const amountDue = toDecimal(tranche.amount);

        const payments = await db.payment.findMany({
          where: {
            trancheId: tranche.id,
            status: { in: ['PENDING', 'COMPLETED'] },
          },
        });

        const byStudent: Record<string, number> = {};
        for (const p of payments) {
          byStudent[p.studentId] = (byStudent[p.studentId] || 0) + toDecimal(p.amountPaid);
        }

        // If specific trancheIds were requested, filter
        if (dto.trancheIds && dto.trancheIds.length > 0) {
          if (!dto.trancheIds.includes(tranche.id)) continue;
        }

        const students = await db.student.findMany({
          where: {
            levelId: plan.levelId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
            ...(dto.studentIds ? { id: { in: dto.studentIds } } : {}),
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            parentEmail: true,
          },
        });

        for (const s of students) {
          const paid = byStudent[s.id] || 0;
          if (paid >= amountDue) continue;

          const remaining = amountDue - paid;
          const { overdueDays } = computeTrancheStatus(paid, amountDue, tranche.dueDate);

          // Filter by daysBeforeDue or overdue
          if (dto.daysBeforeDue !== undefined && dto.daysBeforeDue > 0 && !dto.includeOverdue) {
            if (!tranche.dueDate) continue;
            const daysUntilDue = Math.ceil(
              (new Date(tranche.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );
            if (daysUntilDue > dto.daysBeforeDue || daysUntilDue < 0) continue;
          }

          if (dto.includeOverdue && !overdueDays) continue;

          targetStudentTranches.push({
            studentId: s.id,
            studentName: `${s.lastName} ${s.firstName}`,
            trancheId: tranche.id,
            trancheName: tranche.name,
            dueDate: tranche.dueDate,
            remaining,
            overdueDays,
          });
        }
      }
    }

    // Create notifications for each target
    for (const target of targetStudentTranches) {
      for (const channel of dto.channel) {
        const student = await db.student.findUnique({
          where: { id: target.studentId },
          select: { userId: true, parentPhone: true, parentEmail: true },
        });

        // Determine if we should skip (no contact info)
        if (channel === 'SMS' && !student?.parentPhone) {
          result.skippedCount++;
          result.details.push({
            studentId: target.studentId,
            studentName: target.studentName,
            channel,
            status: 'skipped',
            error: 'Aucun numéro de téléphone',
          });
          continue;
        }
        if (channel === 'EMAIL' && !student?.parentEmail) {
          result.skippedCount++;
          result.details.push({
            studentId: target.studentId,
            studentName: target.studentName,
            channel,
            status: 'skipped',
            error: 'Aucune adresse email',
          });
          continue;
        }

        // Build message
        const dueDateStr = target.dueDate
          ? new Date(target.dueDate).toLocaleDateString('fr-FR')
          : 'N/A';
        const customMsg = dto.customMessage || '';

        const message = target.overdueDays
          ? `Rappel: ${target.trancheName} de ${new Intl.NumberFormat('fr-FR').format(Math.round(target.remaining))} FCFA en retard de ${target.overdueDays}j. ${dueDateStr}. ${customMsg}`
          : `Rappel: ${target.trancheName} de ${new Intl.NumberFormat('fr-FR').format(Math.round(target.remaining))} FCFA due le ${dueDateStr}. ${customMsg}`;

        try {
          await db.notification.create({
            data: {
              userId: student?.userId ?? null,
              type: 'PAYMENT_REMINDER',
              title: channel === 'SMS' ? 'SMS Relance Paiement' : 'Email Relance Paiement',
              message,
              metadata: JSON.stringify({
                channel,
                studentId: target.studentId,
                trancheId: target.trancheId,
                remaining: target.remaining,
                overdueDays: target.overdueDays,
              }),
            },
          });

          result.sentCount++;
          result.details.push({
            studentId: target.studentId,
            studentName: target.studentName,
            channel,
            status: 'sent',
          });
        } catch {
          result.failedCount++;
          result.details.push({
            studentId: target.studentId,
            studentName: target.studentName,
            channel,
            status: 'failed',
            error: 'Erreur lors de la création de la notification',
          });
        }
      }
    }

    return result;
  },
};

export default paymentService;
