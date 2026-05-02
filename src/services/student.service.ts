/**
 * IPVE Digital — Student Service
 * Complete student management service with financial, grades, and attendance summaries.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type {
  CreateStudentDto,
  UpdateStudentDto,
  StudentFilters,
  PaginatedResult,
  StudentListItem,
  StudentDetail,
  PaymentStatusBadge,
  FinancialSummary,
  GradeSummary,
  GradeEntry,
  AttendanceSummary,
  AttendanceRecord,
} from '@/types/student.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

function formatStudentListItem(student: {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date | null;
  photoUrl: string | null;
  status: string;
  enrollmentDate: Date | null;
  filiere?: { name: string; code: string } | null;
  level?: { name: string } | null;
  class?: { name: string } | null;
  parentName: string | null;
  parentPhone: string | null;
}): StudentListItem {
  return {
    id: student.id,
    studentNumber: student.studentNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender as StudentListItem['gender'],
    dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
    photoUrl: student.photoUrl,
    status: student.status as StudentListItem['status'],
    enrollmentDate: student.enrollmentDate?.toISOString() ?? null,
    filiereName: student.filiere?.name ?? null,
    filiereCode: student.filiere?.code ?? null,
    levelName: student.level?.name ?? null,
    className: student.class?.name ?? null,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    paymentStatus: null, // populated separately for list
  };
}

function formatStudentDetail(student: {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  nationality: string;
  address: string | null;
  photoUrl: string | null;
  enrollmentDate: Date | null;
  status: string;
  filiereId: string | null;
  levelId: string | null;
  classId: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  emergencyContact: string | null;
  medicalNotes: string | null;
  scholarship: boolean;
  scholarshipPct: number | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; email: string } | null;
  filiere?: { name: string; code: string } | null;
  level?: { name: string } | null;
  class?: { name: string } | null;
}): StudentDetail {
  return {
    id: student.id,
    studentNumber: student.studentNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
    gender: student.gender as StudentDetail['gender'],
    nationality: student.nationality,
    address: student.address,
    photoUrl: student.photoUrl,
    enrollmentDate: student.enrollmentDate?.toISOString() ?? null,
    status: student.status as StudentDetail['status'],
    filiereId: student.filiereId,
    levelId: student.levelId,
    classId: student.classId,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    parentEmail: student.parentEmail,
    emergencyContact: student.emergencyContact,
    medicalNotes: student.medicalNotes,
    scholarship: student.scholarship,
    scholarshipPct: student.scholarshipPct,
    userId: student.user?.id ?? null,
    userEmail: student.user?.email ?? null,
    filiereName: student.filiere?.name ?? null,
    filiereCode: student.filiere?.code ?? null,
    levelName: student.level?.name ?? null,
    className: student.class?.name ?? null,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Student Service
// ---------------------------------------------------------------------------

export const studentService = {
  /**
   * Get all students with filters, search, and pagination.
   */
  async getAll(filters: StudentFilters): Promise<PaginatedResult<StudentListItem>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { studentNumber: { contains: term, mode: 'insensitive' } },
        { parentEmail: { contains: term, mode: 'insensitive' } },
        { parentPhone: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }
    if (filters.filiereId) {
      where.filiereId = filters.filiereId;
    }
    if (filters.levelId) {
      where.levelId = filters.levelId;
    }
    if (filters.classId) {
      where.classId = filters.classId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const students = await db.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        class: { select: { name: true } },
      },
    });
    const total = await db.student.count({ where });

    // Batch-compute payment status for all students in a single query set
    // (avoids N+1: one DB call per student)
    const paymentBadges = await batchStudentPaymentBadges(students.map((s) => s.id));

    const data: StudentListItem[] = students.map((s) => {
      const item = formatStudentListItem(s);
      item.paymentStatus = paymentBadges[s.id] ?? null;
      return item;
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
   * Get a single student by ID with full details.
   */
  async getById(id: string): Promise<StudentDetail> {
    const student = await db.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    return formatStudentDetail(student);
  },

  /**
   * Create a new student. Auto-generates studentNumber as STU-YYYY-XXXXX.
   * If email is provided, creates a User account with STUDENT role.
   */
  async create(data: CreateStudentDto): Promise<StudentDetail> {
    // Generate student number
    const year = new Date().getFullYear();
    const prefix = `STU-${year}-`;
    const lastStudent = await db.student.findFirst({
      where: { studentNumber: { startsWith: prefix } },
      orderBy: { studentNumber: 'desc' },
      select: { studentNumber: true },
    });
    const lastNum = lastStudent
      ? parseInt(lastStudent.studentNumber.split('-').pop()!, 10)
      : 0;
    const nextNum = lastNum + 1;
    const studentNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;

    // Create User if email is provided
    let userId: string | undefined;
    if (data.email) {
      const { hash } = await import('bcryptjs');
      const studentRole = await db.role.findUnique({ where: { name: 'STUDENT' } });

      if (studentRole) {
        const passwordHash = await hash('Etudiant@2025', 10);
        const user = await db.user.create({
          data: {
            email: data.email.toLowerCase().trim(),
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            roleId: studentRole.id,
            isActive: true,
          },
        });
        userId = user.id;
      }
    }

    // Create student record
    const student = await db.student.create({
      data: {
        studentNumber,
        userId: userId ?? null,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender ?? 'MALE',
        nationality: data.nationality ?? 'Ivoirienne',
        address: data.address ?? undefined,
        photoUrl: data.photoUrl ?? undefined,
        enrollmentDate: data.enrollmentDate
          ? new Date(data.enrollmentDate)
          : new Date(),
        status: 'ENROLLED',
        filiereId: data.filiereId ?? undefined,
        levelId: data.levelId ?? undefined,
        classId: data.classId ?? undefined,
        parentName: data.parentName ?? undefined,
        parentPhone: data.parentPhone ?? undefined,
        parentEmail: data.parentEmail ?? undefined,
        emergencyContact: data.emergencyContact ?? undefined,
        medicalNotes: data.medicalNotes ?? undefined,
        scholarship: data.scholarship ?? false,
        scholarshipPct: data.scholarshipPct ?? undefined,
      },
      include: {
        user: { select: { id: true, email: true } },
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    return formatStudentDetail(student);
  },

  /**
   * Update an existing student.
   */
  async update(id: string, data: UpdateStudentDto): Promise<StudentDetail> {
    // Verify student exists
    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Étudiant non trouvé');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.enrollmentDate !== undefined) updateData.enrollmentDate = data.enrollmentDate ? new Date(data.enrollmentDate) : null;
    if (data.filiereId !== undefined) updateData.filiereId = data.filiereId;
    if (data.levelId !== undefined) updateData.levelId = data.levelId;
    if (data.classId !== undefined) updateData.classId = data.classId;
    if (data.parentName !== undefined) updateData.parentName = data.parentName;
    if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone;
    if (data.parentEmail !== undefined) updateData.parentEmail = data.parentEmail;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    if (data.medicalNotes !== undefined) updateData.medicalNotes = data.medicalNotes;
    if (data.scholarship !== undefined) updateData.scholarship = data.scholarship;
    if (data.scholarshipPct !== undefined) updateData.scholarshipPct = data.scholarshipPct;

    // If email is provided and student doesn't have a user account yet, create one
    if (data.email && !existing.userId) {
      const { hash } = await import('bcryptjs');
      const studentRole = await db.role.findUnique({ where: { name: 'STUDENT' } });
      if (studentRole) {
        const passwordHash = await hash('Etudiant@2025', 10);
        const user = await db.user.create({
          data: {
            email: data.email.toLowerCase().trim(),
            passwordHash,
            firstName: data.firstName || existing.firstName,
            lastName: data.lastName || existing.lastName,
            roleId: studentRole.id,
            isActive: true,
          },
        });
        updateData.userId = user.id;
      }
    }

    const student = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true } },
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    return formatStudentDetail(student);
  },

  /**
   * Soft delete a student by setting status to DROPPED.
   */
  async remove(id: string): Promise<void> {
    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Étudiant non trouvé');
    }

    await db.student.update({
      where: { id },
      data: { status: 'DROPPED' },
    });
  },

  /**
   * Get financial summary for a student.
   * Queries PaymentPlan → PaymentPlanTranche → Payment for the student's level.
   */
  async getFinancialSummary(id: string): Promise<FinancialSummary> {
    const student = await db.student.findUnique({
      where: { id },
      select: { id: true, levelId: true },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    let totalDue = 0;
    let totalPaid = 0;
    const tranches: FinancialSummary['tranches'] = [];

    if (student.levelId) {
      // Find payment plans for this level (prefer current academic year)
      const currentYear = await db.academicYear.findFirst({
        where: { isCurrent: true },
      });

      const planWhere: Record<string, unknown> = {
        levelId: student.levelId,
        isActive: true,
      };
      if (currentYear) {
        planWhere.academicYearId = currentYear.id;
      }

      const plan = await db.paymentPlan.findFirst({
        where: planWhere,
        include: {
          tranches: {
            orderBy: { trancheNumber: 'asc' },
          },
        },
      });

      if (plan) {
        // Batch: fetch ALL payments for ALL tranches in ONE query (avoids N+1)
        const trancheIds = plan.tranches.map((t) => t.id);
        const allTranchePayments = await db.payment.findMany({
          where: {
            studentId: id,
            trancheId: { in: trancheIds },
            status: { in: ['PENDING', 'COMPLETED'] },
          },
          orderBy: { paymentDate: 'desc' },
        });

        // Group payments by trancheId in memory
        const paymentsByTranche = new Map<string, typeof allTranchePayments>();
        for (const p of allTranchePayments) {
          const list = paymentsByTranche.get(p.trancheId) ?? [];
          list.push(p);
          paymentsByTranche.set(p.trancheId, list);
        }

        for (const tranche of plan.tranches) {
          const amount = toDecimal(tranche.amount);
          totalDue += amount;

          const payments = paymentsByTranche.get(tranche.id) ?? [];

          let paidAmount = 0;
          const paymentEntries: FinancialSummary['tranches'][0]['payments'] = [];

          for (const p of payments) {
            const pAmount = toDecimal(p.amountPaid);
            paidAmount += pAmount;
            paymentEntries.push({
              id: p.id,
              amount: pAmount,
              date: p.paymentDate.toISOString(),
              method: p.paymentMethod,
            });
          }

          totalPaid += paidAmount;

          tranches.push({
            trancheId: tranche.id,
            trancheNumber: tranche.trancheNumber,
            name: tranche.name,
            amount,
            dueDate: tranche.dueDate?.toISOString() ?? null,
            paidAmount,
            status: paidAmount >= amount
              ? 'paid'
              : paidAmount > 0
                ? 'partial'
                : 'unpaid',
            payments: paymentEntries,
          });
        }
      }
    }

    // Also count any standalone payments not linked to a plan tranche
    // (fallback for direct payments)
    const planTrancheIds = tranches.map((t) => t.trancheId);
    const standalonePayments = planTrancheIds.length > 0
      ? await db.payment.findMany({
          where: {
            studentId: id,
            trancheId: { notIn: planTrancheIds },
            status: { in: ['PENDING', 'COMPLETED'] },
          },
        })
      : [];

    for (const p of standalonePayments) {
      const pAmount = toDecimal(p.amountPaid);
      totalPaid += pAmount;
    }

    return {
      studentId: id,
      totalDue,
      totalPaid,
      remaining: Math.max(0, totalDue - totalPaid),
      tranches,
    };
  },

  /**
   * Get grades for a student with optional academic year and period filters.
   */
  async getGrades(
    id: string,
    academicYearId?: string,
    periodId?: string,
  ): Promise<GradeSummary> {
    const student = await db.student.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    const where: Record<string, unknown> = { studentId: id };
    if (academicYearId) where.academicYearId = academicYearId;
    if (periodId) where.periodId = periodId;

    const grades = await db.grade.findMany({
      where,
      include: {
        period: { select: { name: true } },
        classSubject: {
          include: {
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: [{ periodId: 'asc' }, { evaluationType: 'asc' }],
    });

    const gradeEntries: GradeEntry[] = grades.map((g) => ({
      id: g.id,
      subjectName: g.classSubject?.subject?.name ?? 'Matière inconnue',
      evaluationType: g.evaluationType,
      score: toDecimal(g.score),
      maxScore: toDecimal(g.maxScore),
      coefficient: toDecimal(g.coefficient),
      periodName: g.period?.name ?? 'Période inconnue',
      isValidated: g.isValidated,
    }));

    // Calculate weighted average
    let totalWeightedScore = 0;
    let totalCoefficient = 0;
    for (const g of gradeEntries) {
      const normalizedScore = g.maxScore > 0 ? (g.score / g.maxScore) * 20 : 0;
      totalWeightedScore += normalizedScore * g.coefficient;
      totalCoefficient += g.coefficient;
    }
    const overallAverage =
      totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : null;

    return {
      studentId: id,
      academicYearId,
      periodId,
      grades: gradeEntries,
      overallAverage: overallAverage !== null
        ? Math.round(overallAverage * 100) / 100
        : null,
    };
  },

  /**
   * Get attendance summary for a student.
   */
  async getAttendance(id: string): Promise<AttendanceSummary> {
    const student = await db.student.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    const records = await db.attendance.findMany({
      where: { studentId: id },
      include: {
        classSubject: {
          include: {
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    const attendanceRecords: AttendanceRecord[] = records.map((r) => {
      switch (r.status) {
        case 'PRESENT': present++; break;
        case 'ABSENT': absent++; break;
        case 'LATE': late++; break;
        case 'EXCUSED': excused++; break;
        default: break;
      }

      return {
        id: r.id,
        date: r.date.toISOString(),
        subjectName: r.classSubject?.subject?.name ?? 'Matière inconnue',
        status: r.status,
        justification: r.justification ?? undefined,
      };
    });

    const totalSessions = records.length;
    const rate =
      totalSessions > 0
        ? Math.round(((present + late) / totalSessions) * 10000) / 100
        : 100;

    return {
      studentId: id,
      totalSessions,
      present,
      absent,
      late,
      excused,
      rate,
      records: attendanceRecords,
    };
  },
};

// ---------------------------------------------------------------------------
// Internal helper: batch-compute payment status badges for multiple students
// ---------------------------------------------------------------------------

async function batchStudentPaymentBadges(
  studentIds: string[],
): Promise<Record<string, PaymentStatusBadge | null>> {
  const result: Record<string, PaymentStatusBadge | null> = {};

  // Short-circuit if no students
  if (studentIds.length === 0) return result;

  // 1. Get all students' levelIds in one query
  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, levelId: true },
  });

  // Separate students by levelId
  const studentsByLevel = new Map<string, string[]>();
  const studentsNoLevel: string[] = [];

  for (const s of students) {
    if (!s.levelId) {
      studentsNoLevel.push(s.id);
    } else {
      const arr = studentsByLevel.get(s.levelId) ?? [];
      arr.push(s.id);
      studentsByLevel.set(s.levelId, arr);
    }
  }

  // No-level students get null badge
  for (const id of studentsNoLevel) {
    result[id] = null;
  }

  if (studentsByLevel.size === 0) return result;

  // 2. Get current academic year (1 query)
  const currentYear = await db.academicYear.findFirst({
    where: { isCurrent: true },
  });

  // 3. Get active payment plans for all relevant levels (1 query)
  const levelIds = [...studentsByLevel.keys()];
  const planWhere: Record<string, unknown> = {
    levelId: { in: levelIds },
    isActive: true,
  };
  if (currentYear) {
    planWhere.academicYearId = currentYear.id;
  }

  const plans = await db.paymentPlan.findMany({
    where: planWhere,
    include: { tranches: true },
  });

  if (plans.length === 0) {
    // No plans → everyone has null badge
    for (const ids of studentsByLevel.values()) {
      for (const id of ids) result[id] = null;
    }
    return result;
  }

  // Map levelId → plan
  const planByLevel = new Map(plans.map((p) => [p.levelId, p]));

  // 4. Collect all tranche IDs across all plans
  const allTrancheIds: string[] = [];
  const planTrancheIdsByLevel = new Map<string, string[]>();

  for (const plan of plans) {
    const tIds = plan.tranches.map((t) => t.id);
    allTrancheIds.push(...tIds);
    planTrancheIdsByLevel.set(plan.levelId, tIds);
  }

  // 5. Get ALL payments for ALL students + ALL relevant tranches (1 query)
  const payments = await db.payment.findMany({
    where: {
      studentId: { in: studentIds },
      trancheId: { in: allTrancheIds },
      status: { in: ['PENDING', 'COMPLETED'] },
    },
  });

  // 6. Compute per-student totals
  const paidByStudent = new Map<string, number>();
  for (const p of payments) {
    paidByStudent.set(
      p.studentId,
      (paidByStudent.get(p.studentId) ?? 0) + toDecimal(p.amountPaid),
    );
  }

  // 7. Build badges
  for (const [levelId, stuIds] of studentsByLevel) {
    const plan = planByLevel.get(levelId);
    if (!plan) {
      for (const id of stuIds) result[id] = null;
      continue;
    }

    const totalDue = plan.tranches.reduce(
      (sum, t) => sum + toDecimal(t.amount),
      0,
    );

    for (const id of stuIds) {
      const totalPaid = paidByStudent.get(id) ?? 0;
      const remaining = Math.max(0, totalDue - totalPaid);

      let status: PaymentStatusBadge['status'];
      let label: string;
      if (totalDue === 0) {
        result[id] = null;
      } else if (totalPaid >= totalDue) {
        status = 'up_to_date';
        label = 'À jour';
        result[id] = { label, status, totalDue, totalPaid, remaining };
      } else if (totalPaid > 0) {
        status = 'partial';
        label = 'Partiel';
        result[id] = { label, status, totalDue, totalPaid, remaining };
      } else {
        status = 'overdue';
        label = 'Impayé';
        result[id] = { label, status, totalDue, totalPaid, remaining };
      }
    }
  }

  return result;
}

export default studentService;
