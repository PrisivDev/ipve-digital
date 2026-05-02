/**
 * IPVE Digital — Prospect / Admissions CRM Service
 * Complete prospect pipeline management with conversion tracking and analytics.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type {
  ProspectStatus,
  ProspectSource,
  CreateProspectDto,
  UpdateProspectDto,
  ProspectFilters,
  AddInteractionDto,
  PaginatedResult,
  ProspectListItem,
  ProspectDetail,
  ProspectInteractionItem,
  ConversionStats,
  KanbanColumn,
} from '@/types/prospect.types';
import {
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUS_ORDER,
  PROSPECT_TRANSITIONS,
} from '@/types/prospect.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatProspectListItem(prospect: {
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
  lastContactAt: Date | null;
  createdAt: Date;
  assignedToUser?: { firstName: string; lastName: string } | null;
}): ProspectListItem {
  const now = new Date();
  const lastContact = prospect.lastContactAt
    ? new Date(prospect.lastContactAt)
    : null;
  const daysSinceContact = lastContact
    ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    id: prospect.id,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    email: prospect.email,
    phone: prospect.phone,
    source: prospect.source as ProspectSource,
    status: prospect.status as ProspectStatus,
    filiereInterest: prospect.filiereInterest,
    levelInterest: prospect.levelInterest,
    assignedTo: prospect.assignedTo,
    assigneeName: prospect.assignedToUser
      ? `${prospect.assignedToUser.firstName} ${prospect.assignedToUser.lastName}`
      : null,
    lastContactAt: prospect.lastContactAt?.toISOString() ?? null,
    createdAt: prospect.createdAt.toISOString(),
    daysSinceContact,
  };
}

function formatProspectDetail(prospect: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  source: ProspectSource;
  status: ProspectStatus;
  filiereInterest: string | null;
  levelInterest: string | null;
  notes: string | null;
  assignedTo: string | null;
  convertedAt: Date | null;
  convertedStudentId: string | null;
  dateOfBirth: Date | null;
  gender: string;
  nationality: string;
  address: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  lastContactAt: Date | null;
  createdAt: Date;
  assignedToUser?: { firstName: string; lastName: string } | null;
  interactions?: {
    id: string;
    type: string;
    subject: string | null;
    content: string;
    direction: string | null;
    conductedBy: string | null;
    createdAt: Date;
    conductedByUser?: { firstName: string; lastName: string } | null;
  }[];
}): ProspectDetail {
  const now = new Date();
  const lastContact = prospect.lastContactAt
    ? new Date(prospect.lastContactAt)
    : null;
  const daysSinceContact = lastContact
    ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    id: prospect.id,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    email: prospect.email,
    phone: prospect.phone,
    source: prospect.source as ProspectSource,
    status: prospect.status as ProspectStatus,
    filiereInterest: prospect.filiereInterest,
    levelInterest: prospect.levelInterest,
    assignedTo: prospect.assignedTo,
    assigneeName: prospect.assignedToUser
      ? `${prospect.assignedToUser.firstName} ${prospect.assignedToUser.lastName}`
      : null,
    lastContactAt: prospect.lastContactAt?.toISOString() ?? null,
    createdAt: prospect.createdAt.toISOString(),
    daysSinceContact,
    dateOfBirth: prospect.dateOfBirth?.toISOString() ?? null,
    gender: prospect.gender as ProspectDetail['gender'],
    nationality: prospect.nationality,
    address: prospect.address,
    parentName: prospect.parentName,
    parentPhone: prospect.parentPhone,
    parentEmail: prospect.parentEmail,
    convertedAt: prospect.convertedAt?.toISOString() ?? null,
    convertedStudentId: prospect.convertedStudentId,
    notes: prospect.notes,
    interactions: (prospect.interactions ?? []).map((i) => ({
      id: i.id,
      type: i.type as ProspectInteractionItem['type'],
      subject: i.subject,
      content: i.content,
      direction: (i.direction ?? 'OUTGOING') as ProspectInteractionItem['direction'],
      conductedBy: i.conductedBy,
      conductorName: i.conductedByUser
        ? `${i.conductedByUser.firstName} ${i.conductedByUser.lastName}`
        : null,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}

function formatInteractionItem(
  interaction: {
    id: string;
    type: string;
    subject: string | null;
    content: string;
    direction: string | null;
    conductedBy: string | null;
    createdAt: Date;
    conductedByUser?: { firstName: string; lastName: string } | null;
  },
): ProspectInteractionItem {
  return {
    id: interaction.id,
    type: interaction.type as ProspectInteractionItem['type'],
    subject: interaction.subject,
    content: interaction.content,
    direction: (interaction.direction ?? 'OUTGOING') as ProspectInteractionItem['direction'],
    conductedBy: interaction.conductedBy,
    conductorName: interaction.conductedByUser
      ? `${interaction.conductedByUser.firstName} ${interaction.conductedByUser.lastName}`
      : null,
    createdAt: interaction.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Prospect Service
// ---------------------------------------------------------------------------

export const prospectService = {
  /**
   * Get all prospects with filters, search, and pagination.
   */
  async getAll(filters: ProspectFilters): Promise<PaginatedResult<ProspectListItem>> {
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
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.source) {
      where.source = filters.source;
    }
    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }
    if (filters.filiereInterest) {
      where.filiereInterest = filters.filiereInterest;
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const prospects = await db.prospect.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedToUser: { select: { firstName: true, lastName: true } },
      },
    });
    const total = await db.prospect.count({ where });

    const data: ProspectListItem[] = prospects.map((p) =>
      formatProspectListItem(p),
    );

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
   * Get a single prospect by ID with full details and interactions.
   */
  async getById(id: string): Promise<ProspectDetail> {
    const prospect = await db.prospect.findUnique({
      where: { id },
      include: {
        assignedToUser: { select: { firstName: true, lastName: true } },
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            conductedByUser: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!prospect) {
      throw new Error('Prospect non trouvé');
    }

    return formatProspectDetail(prospect);
  },

  /**
   * Create a new prospect. Defaults status to NOUVEAU.
   */
  async create(data: CreateProspectDto): Promise<ProspectDetail> {
    // Validate required fields
    if (!data.firstName?.trim()) {
      throw new Error('Le prénom est requis');
    }
    if (!data.lastName?.trim()) {
      throw new Error('Le nom est requis');
    }
    if (!data.phone?.trim()) {
      throw new Error('Le téléphone est requis');
    }

    const prospect = await db.prospect.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() ?? undefined,
        phone: data.phone.trim(),
        source: data.source ?? 'OTHER',
        status: 'NOUVEAU',
        filiereInterest: data.filiereInterest ?? undefined,
        levelInterest: data.levelInterest ?? undefined,
        notes: data.notes ?? undefined,
        assignedTo: data.assignedTo ?? undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender ?? 'MALE',
        nationality: data.nationality ?? 'Ivoirienne',
        address: data.address ?? undefined,
        parentName: data.parentName ?? undefined,
        parentPhone: data.parentPhone ?? undefined,
        parentEmail: data.parentEmail ?? undefined,
      },
      include: {
        assignedToUser: { select: { firstName: true, lastName: true } },
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            conductedByUser: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return formatProspectDetail(prospect);
  },

  /**
   * Update an existing prospect.
   */
  async update(id: string, data: UpdateProspectDto): Promise<ProspectDetail> {
    // Verify prospect exists
    const existing = await db.prospect.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Prospect non trouvé');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() ?? null;
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.source !== undefined) updateData.source = data.source;
    if (data.filiereInterest !== undefined) updateData.filiereInterest = data.filiereInterest ?? null;
    if (data.levelInterest !== undefined) updateData.levelInterest = data.levelInterest ?? null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo ?? null;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.address !== undefined) updateData.address = data.address ?? null;
    if (data.parentName !== undefined) updateData.parentName = data.parentName ?? null;
    if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone ?? null;
    if (data.parentEmail !== undefined) updateData.parentEmail = data.parentEmail ?? null;

    const prospect = await db.prospect.update({
      where: { id },
      data: updateData,
      include: {
        assignedToUser: { select: { firstName: true, lastName: true } },
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            conductedByUser: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return formatProspectDetail(prospect);
  },

  /**
   * Update prospect status with transition validation.
   * If notes provided, auto-creates an interaction.
   */
  async updateStatus(
    id: string,
    status: ProspectStatus,
    notes?: string,
  ): Promise<ProspectDetail> {
    // Verify prospect exists
    const existing = await db.prospect.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Prospect non trouvé');
    }

    // Validate transition
    const allowedTransitions = PROSPECT_TRANSITIONS[existing.status as ProspectStatus] ?? [];
    if (!allowedTransitions.includes(status)) {
      throw new Error(
        `Transition non autorisée : ${PROSPECT_STATUS_LABELS[existing.status as ProspectStatus]} → ${PROSPECT_STATUS_LABELS[status]}`,
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = { status };

    // If converting, set convertedAt
    if (status === 'CONVERTI') {
      updateData.convertedAt = new Date();
    }

    const prospect = await db.prospect.update({
      where: { id },
      data: updateData,
      include: {
        assignedToUser: { select: { firstName: true, lastName: true } },
        interactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            conductedByUser: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Auto-create interaction if notes provided
    if (notes?.trim()) {
      await db.prospectInteraction.create({
        data: {
          prospectId: id,
          type: 'NOTE',
          content: notes.trim(),
          direction: 'OUTGOING',
        },
      });

      // Re-fetch with the new interaction
      const updated = await db.prospect.findUnique({
        where: { id },
        include: {
          assignedToUser: { select: { firstName: true, lastName: true } },
          interactions: {
            orderBy: { createdAt: 'desc' },
            include: {
              conductedByUser: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      return formatProspectDetail(updated!);
    }

    return formatProspectDetail(prospect);
  },

  /**
   * Convert a prospect into a student.
   * Prospect must have status ADMIS.
   * Creates a Student record and links it back to the prospect.
   */
  async convert(
    id: string,
    studentData: {
      filiereId: string;
      levelId: string;
      classId: string;
      scholarship?: boolean;
      scholarshipPct?: number;
    },
  ): Promise<{ studentId: string; studentNumber: string }> {
    // Verify prospect exists and is ADMIS
    const prospect = await db.prospect.findUnique({ where: { id } });
    if (!prospect) {
      throw new Error('Prospect non trouvé');
    }
    if (prospect.status !== 'ADMIS') {
      throw new Error('Seuls les prospects avec le statut ADMIS peuvent être convertis');
    }

    // Generate student number: STU-YYYY-XXXXX
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

    // Create student record
    const student = await db.student.create({
      data: {
        studentNumber,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        dateOfBirth: prospect.dateOfBirth,
        gender: prospect.gender,
        nationality: prospect.nationality,
        address: prospect.address,
        parentName: prospect.parentName,
        parentPhone: prospect.parentPhone,
        parentEmail: prospect.parentEmail,
        enrollmentDate: new Date(),
        status: 'ENROLLED',
        filiereId: studentData.filiereId,
        levelId: studentData.levelId,
        classId: studentData.classId,
        scholarship: studentData.scholarship ?? false,
        scholarshipPct: studentData.scholarshipPct ?? undefined,
      },
    });

    // Update prospect to CONVERTI
    await db.prospect.update({
      where: { id },
      data: {
        status: 'CONVERTI',
        convertedAt: new Date(),
        convertedStudentId: student.id,
      },
    });

    return {
      studentId: student.id,
      studentNumber,
    };
  },

  /**
   * Add an interaction to a prospect and update lastContactAt.
   */
  async addInteraction(
    prospectId: string,
    data: AddInteractionDto,
  ): Promise<ProspectInteractionItem> {
    // Verify prospect exists
    const prospect = await db.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) {
      throw new Error('Prospect non trouvé');
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const interaction = await db.prospectInteraction.create({
      data: {
        prospectId,
        type: data.type,
        subject: data.subject ?? undefined,
        content: data.content,
        direction: data.direction ?? 'OUTGOING',
        conductedBy: data.conductedBy ?? undefined,
      },
      include: {
        conductedByUser: { select: { firstName: true, lastName: true } },
      },
    });
    await db.prospect.update({
      where: { id: prospectId },
      data: { lastContactAt: new Date() },
    });

    return formatInteractionItem(interaction);
  },

  /**
   * Get Kanban board data: prospects grouped by status (excluding CONVERTI).
   */
  async getKanbanData(filters?: ProspectFilters): Promise<KanbanColumn[]> {
    // Build where clause from filters (but exclude CONVERTI status)
    const where: Record<string, unknown> = {
      status: { not: 'CONVERTI' },
    };

    if (filters?.search) {
      const term = filters.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (filters?.source) {
      where.source = filters.source;
    }
    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }
    if (filters?.filiereInterest) {
      where.filiereInterest = filters.filiereInterest;
    }
    // Do not apply status filter for Kanban — we want all statuses (except CONVERTI)

    // Fetch all matching prospects
    const prospects = await db.prospect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedToUser: { select: { firstName: true, lastName: true } },
      },
    });

    // Group by status
    const grouped = new Map<ProspectStatus, ProspectListItem[]>();
    for (const status of PROSPECT_STATUS_ORDER) {
      grouped.set(status, []);
    }

    for (const p of prospects) {
      const status = p.status as ProspectStatus;
      const list = grouped.get(status);
      if (list) {
        list.push(formatProspectListItem(p));
      }
    }

    // Build columns in pipeline order
    const columns: KanbanColumn[] = PROSPECT_STATUS_ORDER.map((status) => {
      const items = grouped.get(status) ?? [];
      return {
        status,
        label: PROSPECT_STATUS_LABELS[status],
        count: items.length,
        prospects: items,
      };
    });

    return columns;
  },

  /**
   * Get conversion statistics and pipeline analytics.
   * Uses SQL GROUP BY / COUNT instead of loading all rows into memory.
   */
  async getConversionStats(): Promise<ConversionStats> {
    const now = new Date();

    // ── Batch 1: Aggregate queries ─────────────────────────────────
    const [statusGroups, sourceGroups] = await Promise.all([
      db.prospect.groupBy({ by: ['status'], _count: { status: true } }),
      db.prospect.groupBy({ by: ['source'], _count: { source: true } }),
    ]);

    // By status counts
    const byStatus: Record<ProspectStatus, number> = {
      NOUVEAU: 0,
      CONTACTE: 0,
      INTERESSE: 0,
      DOSSIER_RECU: 0,
      ADMIS: 0,
      CONVERTI: 0,
      ABANDONNE: 0,
    };
    let totalProspects = 0;
    for (const g of statusGroups) {
      byStatus[g.status as ProspectStatus] = g._count.status;
      totalProspects += g._count.status;
    }

    const totalConverted = byStatus.CONVERTI;
    const totalAbandoned = byStatus.ABANDONNE;
    const conversionRate =
      totalProspects > 0
        ? Math.round((totalConverted / totalProspects) * 10000) / 100
        : 0;

    // By source counts
    const bySource: Record<string, number> = {};
    for (const g of sourceGroups) {
      bySource[g.source] = g._count.source;
    }

    // ── Batch 2: Time-based counts (parallel) ──────────────────────
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weeklyNew, monthlyNew, inactiveProspects] = await Promise.all([
      db.prospect.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.prospect.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.prospect.count({
        where: {
          status: { notIn: ['CONVERTI', 'ABANDONNE'] },
          OR: [
            { lastContactAt: null },
            { lastContactAt: { lt: sevenDaysAgo } },
          ],
        },
      }),
    ]);

    // ── Batch 3: Monthly breakdown (6 parallel count queries) ──────
    const monthCounts = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59, 999);
        return db.prospect.count({
          where: { createdAt: { gte: monthStart, lte: monthEnd } },
        });
      }),
    );

    const byMonth: ConversionStats['byMonth'] = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthLabel = monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      byMonth.push({
        month: monthLabel,
        prospects: monthCounts[i],
        converted: 0, // Would need a separate GROUP BY per month; not worth the cost
      });
    }

    return {
      totalProspects,
      totalConverted,
      totalAbandoned,
      conversionRate,
      byStatus,
      bySource,
      byMonth,
      weeklyNew,
      monthlyNew,
      inactiveProspects,
    };
  },
};

export default prospectService;
