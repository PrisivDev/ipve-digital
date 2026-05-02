/**
 * IPVE Digital — Student Card Service
 * Complete student card lifecycle management: generation, status changes,
 * printing, and renewal.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type { StudentCardStatus, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudentCardFilters {
  search?: string;
  status?: StudentCardStatus;
  studentId?: string;
  page?: number;
  limit?: number;
}

export interface StudentCardDto {
  id: string;
  cardNumber: string;
  studentId: string;
  status: StudentCardStatus;
  issueDate: string;
  expiryDate: string | null;
  printCount: number;
  lastPrintedAt: string | null;
  revokedReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    photoUrl: string | null;
    filiereName: string | null;
    levelName: string | null;
    className: string | null;
  };
}

export interface StudentCardDetailDto extends StudentCardDto {
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    photoUrl: string | null;
    filiereName: string | null;
    levelName: string | null;
    className: string | null;
  };
}

export interface StatusCounts {
  total: number;
  active: number;
  lost: number;
  expired: number;
  cancelled: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: StatusCounts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCardWithStudent(card: {
  id: string;
  cardNumber: string;
  studentId: string;
  status: StudentCardStatus;
  issueDate: Date;
  expiryDate: Date | null;
  printCount: number;
  lastPrintedAt: Date | null;
  revokedReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    photoUrl: string | null;
    filiere?: { name: string } | null;
    level?: { name: string } | null;
    class?: { name: string } | null;
  };
}): StudentCardDto {
  return {
    id: card.id,
    cardNumber: card.cardNumber,
    studentId: card.studentId,
    status: card.status,
    issueDate: card.issueDate.toISOString(),
    expiryDate: card.expiryDate?.toISOString() ?? null,
    printCount: card.printCount,
    lastPrintedAt: card.lastPrintedAt?.toISOString() ?? null,
    revokedReason: card.revokedReason,
    notes: card.notes,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    student: {
      id: card.student.id,
      studentNumber: card.student.studentNumber,
      firstName: card.student.firstName,
      lastName: card.student.lastName,
      gender: card.student.gender,
      photoUrl: card.student.photoUrl,
      filiereName: card.student.filiere?.name ?? null,
      levelName: card.student.level?.name ?? null,
      className: card.student.class?.name ?? null,
    },
  };
}

/**
 * Generate a unique card number in the format CARD-YYYY-XXXXX.
 */
async function generateCardNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CARD-${year}-`;

  const lastCard = await db.studentCard.findFirst({
    where: { cardNumber: { startsWith: prefix } },
    orderBy: { cardNumber: 'desc' },
    select: { cardNumber: true },
  });

  const lastNum = lastCard
    ? parseInt(lastCard.cardNumber.split('-').pop()!, 10)
    : 0;
  const nextNum = lastNum + 1;

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// ---------------------------------------------------------------------------
// Student Card Service
// ---------------------------------------------------------------------------

export const studentCardService = {
  /**
   * List all student cards with filters, search, and pagination.
   * Search matches on student first/last name or card number.
   */
  async getAll(
    filters: StudentCardFilters,
  ): Promise<PaginatedResult<StudentCardDto>> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100); // cap at 100
    const skip = (page - 1) * limit;

    const where: Prisma.StudentCardWhereInput = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { cardNumber: { contains: term, mode: 'insensitive' } },
        { student: { firstName: { contains: term, mode: 'insensitive' } } },
        { student: { lastName: { contains: term, mode: 'insensitive' } } },
        {
          student: {
            studentNumber: { contains: term, mode: 'insensitive' },
          },
        },
      ];
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const cards = await db.studentCard.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true,
            filiere: { select: { name: true } },
            level: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });
    const total = await db.studentCard.count({ where });
    // Always count ALL cards regardless of filter for stats
    const statusGroups = await db.studentCard.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const data: StudentCardDto[] = cards.map(formatCardWithStudent);

    const counts: StatusCounts = {
      total: statusGroups.reduce((sum, g) => sum + g._count.status, 0),
      active: statusGroups.find((g) => g.status === 'ACTIVE')?._count.status ?? 0,
      lost: statusGroups.find((g) => g.status === 'LOST')?._count.status ?? 0,
      expired: statusGroups.find((g) => g.status === 'EXPIRED')?._count.status ?? 0,
      cancelled: statusGroups.find((g) => g.status === 'CANCELLED')?._count.status ?? 0,
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
   * Get a single card by ID with full student details (includes class).
   */
  async getById(id: string): Promise<StudentCardDetailDto> {
    const card = await db.studentCard.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true,
            filiere: { select: { name: true } },
            level: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    if (!card) {
      throw new Error('Carte étudiant non trouvée');
    }

    return formatCardWithStudent(card) as StudentCardDetailDto;
  },

  /**
   * Get all cards for a specific student.
   */
  async getByStudentId(studentId: string): Promise<StudentCardDto[]> {
    const cards = await db.studentCard.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true,
            filiere: { select: { name: true } },
            level: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    return cards.map(formatCardWithStudent);
  },

  /**
   * Generate a new student card.
   * Auto-generates card number, sets issue date to now, status to ACTIVE.
   * Default expiry is 1 year from now.
   * Verifies student exists and is ACTIVE or ENROLLED.
   */
  async generate(data: {
    studentId: string;
    expiryDate?: string;
  }): Promise<StudentCardDetailDto> {
    // Verify student exists and has an eligible status
    const student = await db.student.findUnique({
      where: { id: data.studentId },
      select: { id: true, status: true },
    });

    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    if (student.status !== 'ACTIVE' && student.status !== 'ENROLLED') {
      throw new Error(
        'Impossible de générer une carte pour un étudiant inactif ou non inscrit',
      );
    }

    const cardNumber = await generateCardNumber();

    const now = new Date();
    const expiryDate = data.expiryDate
      ? new Date(data.expiryDate)
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const card = await db.studentCard.create({
      data: {
        cardNumber,
        studentId: data.studentId,
        status: 'ACTIVE',
        issueDate: now,
        expiryDate,
      },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true,
            filiere: { select: { name: true } },
            level: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    return formatCardWithStudent(card) as StudentCardDetailDto;
  },

  /**
   * Update the status of a card.
   * ACTIVE → LOST, EXPIRED, CANCELLED
   * Sets revokedReason for LOST or CANCELLED transitions.
   */
  async updateStatus(
    id: string,
    status: StudentCardStatus,
    reason?: string,
  ): Promise<StudentCardDetailDto> {
    const existing = await db.studentCard.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Carte étudiant non trouvée');
    }

    // Validate status transitions
    const allowedTransitions: Record<StudentCardStatus, StudentCardStatus[]> = {
      ACTIVE: ['LOST', 'EXPIRED', 'CANCELLED'],
      LOST: ['CANCELLED', 'ACTIVE'], // can reactivate or cancel
      EXPIRED: ['CANCELLED', 'ACTIVE'], // can reactivate or cancel
      CANCELLED: [], // terminal state
    };

    if (!allowedTransitions[existing.status]?.includes(status)) {
      throw new Error(
        `Transition de statut invalide: ${existing.status} → ${status}`,
      );
    }

    const updateData: Prisma.StudentCardUpdateInput = { status };

    // Set revoked reason for LOST or CANCELLED
    if ((status === 'LOST' || status === 'CANCELLED') && reason) {
      updateData.revokedReason = reason;
    }
    if (status === 'LOST' && !reason) {
      updateData.revokedReason = 'Perdue';
    }

    // Clear revoked reason if reactivating
    if (status === 'ACTIVE') {
      updateData.revokedReason = null;
    }

    const card = await db.studentCard.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true,
            filiere: { select: { name: true } },
            level: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    return formatCardWithStudent(card) as StudentCardDetailDto;
  },

  /**
   * Record a print for a card: increments printCount and sets lastPrintedAt.
   */
  async recordPrint(id: string): Promise<StudentCardDetailDto> {
    const existing = await db.studentCard.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Carte étudiant non trouvée');
    }

    const card = await db.studentCard.update({
      where: { id },
      data: {
        printCount: { increment: 1 },
        lastPrintedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            gender: true,
            photoUrl: true,
            filiere: { select: { name: true } },
            level: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    return formatCardWithStudent(card) as StudentCardDetailDto;
  },

  /**
   * Renew a card: for LOST or EXPIRED cards, create a new card for the same
   * student and mark the old card as CANCELLED with reason "Renouvelée".
   * Returns the newly created card.
   */
  async renew(id: string): Promise<StudentCardDetailDto> {
    const existing = await db.studentCard.findUnique({
      where: { id },
      select: { id: true, studentId: true, status: true, expiryDate: true },
    });

    if (!existing) {
      throw new Error('Carte étudiant non trouvée');
    }

    if (existing.status !== 'LOST' && existing.status !== 'EXPIRED') {
      throw new Error(
        'Seules les cartes PERDUES ou EXPIRÉES peuvent être renouvelées',
      );
    }

    // Use a transaction to ensure atomicity: cancel old + create new
    const [cancelledCard, newCard] = await db.$transaction([
      // Mark old card as cancelled
      db.studentCard.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          revokedReason: 'Renouvelée',
        },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              lastName: true,
              gender: true,
              photoUrl: true,
              filiere: { select: { name: true } },
              level: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
        },
      }),

      // Create new card
      (async () => {
        const cardNumber = await generateCardNumber();
        const now = new Date();

        // Calculate new expiry: 1 year from now, or preserve original expiry + 1 year
        let expiryDate: Date;
        if (existing.expiryDate) {
          const originalExpiry = new Date(existing.expiryDate);
          expiryDate = new Date(
            originalExpiry.getFullYear() + 1,
            originalExpiry.getMonth(),
            originalExpiry.getDate(),
          );
        } else {
          expiryDate = new Date(
            now.getFullYear() + 1,
            now.getMonth(),
            now.getDate(),
          );
        }

        return db.studentCard.create({
          data: {
            cardNumber,
            studentId: existing.studentId,
            status: 'ACTIVE',
            issueDate: now,
            expiryDate,
          },
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                gender: true,
                photoUrl: true,
                filiere: { select: { name: true } },
                level: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
          },
        });
      })(),
    ]);

    // Return the new card
    return formatCardWithStudent(newCard) as StudentCardDetailDto;
  },
};

export default studentCardService;
