import { NextRequest, NextResponse } from 'next/server';
import { studentCardService } from '@/services/student-card.service';
import type { StudentCardStatus } from '@prisma/client';
import { json } from '@/lib/json';

// GET /api/student-cards/[id] — single card with student details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const card = await studentCardService.getById(id);
    return json(card);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erreur';
    if (message === 'Carte étudiant non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error('GET /api/student-cards/[id] error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/student-cards/[id] — update card status or notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, reason, notes } = body;

    // If notes are provided, update them separately
    if (notes !== undefined) {
      // Combine status update and notes update
      if (status) {
        // Validate status is a valid StudentCardStatus
        const validStatuses: StudentCardStatus[] = ['ACTIVE', 'LOST', 'EXPIRED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` },
            { status: 400 },
          );
        }
        const card = await studentCardService.updateStatus(id, status, reason);
        // Also update notes if provided
        if (notes !== null) {
          const { db } = await import('@/lib/db');
          const updated = await db.studentCard.update({
            where: { id },
            data: { notes },
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
          return json({
            id: updated.id,
            cardNumber: updated.cardNumber,
            studentId: updated.studentId,
            status: updated.status,
            issueDate: updated.issueDate.toISOString(),
            expiryDate: updated.expiryDate?.toISOString() ?? null,
            printCount: updated.printCount,
            lastPrintedAt: updated.lastPrintedAt?.toISOString() ?? null,
            revokedReason: updated.revokedReason,
            notes: updated.notes,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            student: {
              id: updated.student.id,
              studentNumber: updated.student.studentNumber,
              firstName: updated.student.firstName,
              lastName: updated.student.lastName,
              gender: updated.student.gender,
              photoUrl: updated.student.photoUrl,
              filiereName: updated.student.filiere?.name ?? null,
              levelName: updated.student.level?.name ?? null,
              className: updated.student.class?.name ?? null,
            },
          });
        }
        return json(card);
      }

      // Only notes update
      const { db } = await import('@/lib/db');
      const existing = await db.studentCard.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Carte étudiant non trouvée' },
          { status: 404 },
        );
      }
      const updated = await db.studentCard.update({
        where: { id },
        data: { notes },
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
      return json({
        id: updated.id,
        cardNumber: updated.cardNumber,
        studentId: updated.studentId,
        status: updated.status,
        issueDate: updated.issueDate.toISOString(),
        expiryDate: updated.expiryDate?.toISOString() ?? null,
        printCount: updated.printCount,
        lastPrintedAt: updated.lastPrintedAt?.toISOString() ?? null,
        revokedReason: updated.revokedReason,
        notes: updated.notes,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        student: {
          id: updated.student.id,
          studentNumber: updated.student.studentNumber,
          firstName: updated.student.firstName,
          lastName: updated.student.lastName,
          gender: updated.student.gender,
          photoUrl: updated.student.photoUrl,
          filiereName: updated.student.filiere?.name ?? null,
          levelName: updated.student.level?.name ?? null,
          className: updated.student.class?.name ?? null,
        },
      });
    }

    // Status update only
    if (status) {
      const validStatuses: StudentCardStatus[] = ['ACTIVE', 'LOST', 'EXPIRED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` },
          { status: 400 },
        );
      }
      const card = await studentCardService.updateStatus(id, status, reason);
      return json(card);
    }

    return NextResponse.json(
      { error: 'Aucune donnée à mettre à jour (fournir status ou notes)' },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error('PUT /api/student-cards/[id] error:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
    if (message === 'Carte étudiant non trouvée') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
