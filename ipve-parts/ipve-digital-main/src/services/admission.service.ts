/**
 * IPVE Digital — Admission Service
 * Complete admission management with status workflow and student enrollment.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type { AdmissionStatus } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdmissionFilters {
  search?: string;
  status?: AdmissionStatus;
  filiereId?: string;
  levelId?: string;
  page?: number;
  limit?: number;
}

export interface CreateAdmissionDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  nationality?: string;
  address?: string;
  phone: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  filiereId: string;
  levelId: string;
  previousSchool?: string;
  previousDiploma?: string;
  notes?: string;
}

export interface UpdateAdmissionDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  gender?: 'MALE' | 'FEMALE';
  nationality?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  filiereId?: string;
  levelId?: string;
  previousSchool?: string;
  previousDiploma?: string;
  notes?: string;
  status?: AdmissionStatus;
}

export interface AdmissionListItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  email: string | null;
  status: string;
  filiereName: string;
  filiereCode: string;
  levelName: string;
  createdAt: string;
}

export interface AdmissionDetail {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  nationality: string;
  address: string | null;
  phone: string;
  email: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  filiereId: string;
  levelId: string;
  previousSchool: string | null;
  previousDiploma: string | null;
  notes: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decisionNote: string | null;
  enrolledStudentId: string | null;
  filiereName: string;
  filiereCode: string;
  levelName: string;
  reviewedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
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

function formatAdmissionListItem(row: {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  email: string | null;
  status: string;
  filiere: { name: string; code: string };
  level: { name: string };
  createdAt: Date;
}): AdmissionListItem {
  return {
    id: row.id,
    admissionNumber: row.admissionNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    gender: row.gender as AdmissionListItem['gender'],
    phone: row.phone,
    email: row.email,
    status: row.status as AdmissionListItem['status'],
    filiereName: row.filiere.name,
    filiereCode: row.filiere.code,
    levelName: row.level.name,
    createdAt: row.createdAt.toISOString(),
  };
}

function formatAdmissionDetail(row: {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  nationality: string;
  address: string | null;
  phone: string;
  email: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  filiereId: string;
  levelId: string;
  previousSchool: string | null;
  previousDiploma: string | null;
  notes: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  decisionNote: string | null;
  enrolledStudentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  filiere: { name: string; code: string };
  level: { name: string };
  reviewedByUser?: { firstName: string; lastName: string } | null;
}): AdmissionDetail {
  return {
    id: row.id,
    admissionNumber: row.admissionNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth?.toISOString() ?? null,
    gender: row.gender as AdmissionDetail['gender'],
    nationality: row.nationality,
    address: row.address,
    phone: row.phone,
    email: row.email,
    parentName: row.parentName,
    parentPhone: row.parentPhone,
    parentEmail: row.parentEmail,
    filiereId: row.filiereId,
    levelId: row.levelId,
    previousSchool: row.previousSchool,
    previousDiploma: row.previousDiploma,
    notes: row.notes,
    status: row.status as AdmissionDetail['status'],
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    decisionNote: row.decisionNote,
    enrolledStudentId: row.enrolledStudentId,
    filiereName: row.filiere.name,
    filiereCode: row.filiere.code,
    levelName: row.level.name,
    reviewedByName: row.reviewedByUser
      ? `${row.reviewedByUser.firstName} ${row.reviewedByUser.lastName}`
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Generate a sequential admission number: ADM-YYYY-XXXXX
 */
async function generateAdmissionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const lastAdmission = await db.admission.findFirst({
    where: { admissionNumber: { startsWith: prefix } },
    orderBy: { admissionNumber: 'desc' },
    select: { admissionNumber: true },
  });
  const lastNum = lastAdmission
    ? parseInt(lastAdmission.admissionNumber.split('-').pop()!, 10)
    : 0;
  const nextNum = lastNum + 1;
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * Generate a sequential student number: STU-YYYY-XXXXX
 */
async function generateStudentNumber(): Promise<string> {
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
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * Define valid status transitions.
 */
const VALID_TRANSITIONS: Record<string, AdmissionStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['ENROLLED'],
  REJECTED: [],
  CANCELLED: [],
  ENROLLED: [],
};

// ---------------------------------------------------------------------------
// Admission Service
// ---------------------------------------------------------------------------

export const admissionService = {
  /**
   * Get all admissions with filters, search, and pagination.
   */
  async getAll(
    filters: AdmissionFilters,
  ): Promise<PaginatedResult<AdmissionListItem>> {
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
        { admissionNumber: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.filiereId) {
      where.filiereId = filters.filiereId;
    }
    if (filters.levelId) {
      where.levelId = filters.levelId;
    }

    // Parallel queries (3 concurrent — within connection_limit=3)
    const [admissions, total, statusGroups] = await Promise.all([
      db.admission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          filiere: { select: { name: true, code: true } },
          level: { select: { name: true } },
        },
      }),
      db.admission.count({ where }),
      db.admission.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const data = admissions.map(formatAdmissionListItem);

    const counts = {
      total: statusGroups.reduce((sum, g) => sum + g._count.status, 0),
      draft: statusGroups.find((g) => g.status === 'DRAFT')?._count.status ?? 0,
      submitted: statusGroups.find((g) => g.status === 'SUBMITTED')?._count.status ?? 0,
      accepted: statusGroups.find((g) => g.status === 'ACCEPTED')?._count.status ?? 0,
      rejected: statusGroups.find((g) => g.status === 'REJECTED')?._count.status ?? 0,
      enrolled: statusGroups.find((g) => g.status === 'ENROLLED')?._count.status ?? 0,
    };

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    };
  },

  /**
   * Get a single admission by ID with full details and relations.
   */
  async getById(id: string): Promise<AdmissionDetail> {
    const admission = await db.admission.findUnique({
      where: { id },
      include: {
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        reviewedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!admission) {
      throw new Error('Candidature non trouvée');
    }

    return formatAdmissionDetail(admission);
  },

  /**
   * Create a new admission. Auto-generates admissionNumber.
   */
  async create(data: CreateAdmissionDto): Promise<AdmissionDetail> {
    const admissionNumber = await generateAdmissionNumber();

    const admission = await db.admission.create({
      data: {
        admissionNumber,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : undefined,
        gender: data.gender ?? 'MALE',
        nationality: data.nationality ?? 'Ivoirienne',
        address: data.address ?? undefined,
        phone: data.phone.trim(),
        email: data.email?.trim() ?? undefined,
        parentName: data.parentName ?? undefined,
        parentPhone: data.parentPhone ?? undefined,
        parentEmail: data.parentEmail ?? undefined,
        filiereId: data.filiereId,
        levelId: data.levelId,
        previousSchool: data.previousSchool ?? undefined,
        previousDiploma: data.previousDiploma ?? undefined,
        notes: data.notes ?? undefined,
        status: 'DRAFT',
      },
      include: {
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        reviewedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return formatAdmissionDetail(admission);
  },

  /**
   * Update an existing admission (partial update).
   * Only DRAFT or SUBMITTED admissions can be updated.
   */
  async update(
    id: string,
    data: UpdateAdmissionDto,
  ): Promise<AdmissionDetail> {
    const existing = await db.admission.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Candidature non trouvée');
    }

    // Only DRAFT or SUBMITTED can have data edited
    if (
      existing.status !== 'DRAFT' &&
      existing.status !== 'SUBMITTED'
    ) {
      throw new Error(
        'Impossible de modifier une candidature dont le statut est ' +
          existing.status,
      );
    }

    // Build update data — skip undefined fields
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined)
      updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined)
      updateData.lastName = data.lastName.trim();
    if (data.dateOfBirth !== undefined)
      updateData.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.email !== undefined)
      updateData.email = data.email?.trim() ?? null;
    if (data.parentName !== undefined)
      updateData.parentName = data.parentName;
    if (data.parentPhone !== undefined)
      updateData.parentPhone = data.parentPhone;
    if (data.parentEmail !== undefined)
      updateData.parentEmail = data.parentEmail;
    if (data.filiereId !== undefined)
      updateData.filiereId = data.filiereId;
    if (data.levelId !== undefined) updateData.levelId = data.levelId;
    if (data.previousSchool !== undefined)
      updateData.previousSchool = data.previousSchool;
    if (data.previousDiploma !== undefined)
      updateData.previousDiploma = data.previousDiploma;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const admission = await db.admission.update({
      where: { id },
      data: updateData,
      include: {
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        reviewedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return formatAdmissionDetail(admission);
  },

  /**
   * Update admission status with reviewer info.
   * Validates state transitions and auto-sets reviewedBy / reviewedAt.
   */
  async updateStatus(
    id: string,
    status: AdmissionStatus,
    reviewerId: string | null,
    decisionNote?: string,
  ): Promise<AdmissionDetail> {
    const existing = await db.admission.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Candidature non trouvée');
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(status)) {
      throw new Error(
        `Transition invalide: ${existing.status} → ${status}`,
      );
    }

    // Validate reviewer
    if (
      (status === 'UNDER_REVIEW' ||
        status === 'ACCEPTED' ||
        status === 'REJECTED') &&
      !reviewerId
    ) {
      throw new Error(
        'Un réviseur authentifié est requis pour cette action',
      );
    }

    const admission = await db.admission.update({
      where: { id },
      data: {
        status,
        reviewedBy:
          status === 'UNDER_REVIEW' ||
          status === 'ACCEPTED' ||
          status === 'REJECTED'
            ? reviewerId
            : existing.reviewedBy,
        reviewedAt:
          status === 'UNDER_REVIEW' ||
          status === 'ACCEPTED' ||
          status === 'REJECTED'
            ? new Date()
            : existing.reviewedAt,
        decisionNote:
          decisionNote !== undefined
            ? decisionNote
            : existing.decisionNote,
      },
      include: {
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        reviewedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return formatAdmissionDetail(admission);
  },

  /**
   * Enroll an ACCEPTED admission — creates a Student record and links it.
   * Sets admission status to ENROLLED.
   */
  async enroll(id: string): Promise<AdmissionDetail> {
    const existing = await db.admission.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Candidature non trouvée');
    }

    if (existing.status !== 'ACCEPTED') {
      throw new Error(
        'Seules les candidatures acceptées peuvent être inscrites',
      );
    }

    if (existing.enrolledStudentId) {
      throw new Error('Cette candidature est déjà inscrite');
    }

    const studentNumber = await generateStudentNumber();

    // Create User account if email is provided
    let userId: string | null = null;
    if (existing.email) {
      const studentRole = await db.role.findUnique({
        where: { name: 'STUDENT' },
      });

      if (studentRole) {
        const passwordHash = await hashPassword('Etudiant@2025');
        const user = await db.user.create({
          data: {
            email: existing.email.toLowerCase().trim(),
            passwordHash,
            firstName: existing.firstName,
            lastName: existing.lastName,
            roleId: studentRole.id,
            isActive: true,
          },
        });
        userId = user.id;
      }
    }

    // Create Student record
    const student = await db.student.create({
      data: {
        studentNumber,
        userId,
        firstName: existing.firstName,
        lastName: existing.lastName,
        dateOfBirth: existing.dateOfBirth,
        gender: existing.gender,
        nationality: existing.nationality,
        address: existing.address,
        enrollmentDate: new Date(),
        status: 'ENROLLED',
        filiereId: existing.filiereId,
        levelId: existing.levelId,
        parentName: existing.parentName,
        parentPhone: existing.parentPhone,
        parentEmail: existing.parentEmail,
      },
    });

    // Update admission with enrolledStudentId and status
    const admission = await db.admission.update({
      where: { id },
      data: {
        status: 'ENROLLED',
        enrolledStudentId: student.id,
      },
      include: {
        filiere: { select: { name: true, code: true } },
        level: { select: { name: true } },
        reviewedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return formatAdmissionDetail(admission);
  },

  /**
   * Delete an admission — only DRAFT or CANCELLED can be deleted.
   */
  async remove(id: string): Promise<void> {
    const existing = await db.admission.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Candidature non trouvée');
    }

    if (
      existing.status !== 'DRAFT' &&
      existing.status !== 'CANCELLED'
    ) {
      throw new Error(
        'Seules les candidatures en brouillon ou annulées peuvent être supprimées',
      );
    }

    await db.admission.delete({ where: { id } });
  },
};

export default admissionService;
