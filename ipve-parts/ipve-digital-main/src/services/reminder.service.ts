/**
 * IPVE Digital — Reminder Service
 * Automated reminder processing for payment tranches.
 * Templates keyed by reminder window: J-7, J0, J+3, J+10, J+30.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type { UnpaidSummary, TrancheStatus } from '@/types/payment.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

// ---------------------------------------------------------------------------
// Reminder Templates
// ---------------------------------------------------------------------------

export interface ReminderTemplate {
  label: string;
  /** SMS message — must be < 160 chars */
  sms: string;
  emailSubject: string;
  emailBody: string;
}

export const REMINDER_TEMPLATES: Record<string, ReminderTemplate> = {
  'J-7': {
    label: '7 jours avant échéance',
    sms: 'IPVE Digital: Rappel - votre paiement est dû dans 7 jours. Merci de régulariser.',
    emailSubject: '⚠️ Rappel de paiement — Échéance dans 7 jours',
    emailBody:
      'Bonjour {{parentName}},\n\nNous vous rappelons que le paiement de la tranche "{{trancheName}}" ({{amount}} FCFA) est dû le {{dueDate}}.\n\nMerci de procéder au règlement avant cette date.\n\nCordialement,\nIPVE Digital',
  },
  'J0': {
    label: 'Jour d\'échéance',
    sms: 'IPVE Digital: Votre paiement est dû aujourd\'hui. Veuillez régulariser svp.',
    emailSubject: '🔴 Paiement dû aujourd\'hui — IPVE Digital',
    emailBody:
      'Bonjour {{parentName}},\n\nLa tranche "{{trancheName}}" ({{amount}} FCFA) est due aujourd\'hui.\n\nVeuillez procéder au règlement dans les plus brefs délais.\n\nCordialement,\nIPVE Digital',
  },
  'J+3': {
    label: '3 jours de retard',
    sms: 'IPVE Digital: Retard de paiement de 3 jours. Veuillez régulariser rapidement.',
    emailSubject: '⚠️ Retard de paiement — 3 jours — IPVE Digital',
    emailBody:
      'Bonjour {{parentName}},\n\nNous vous informons que la tranche "{{trancheName}}" ({{amount}} FCFA) présente un retard de 3 jours.\n\nNous vous prions de bien vouloir régulariser votre situation dans les plus brefs délais.\n\nCordialement,\nIPVE Digital',
  },
  'J+10': {
    label: '10 jours de retard',
    sms: 'IPVE Digital: ALERTE - retard paiement 10j. Contactez le secrétariat svp.',
    emailSubject: '🔴 ALERTE — Retard de paiement de 10 jours — IPVE Digital',
    emailBody:
      'Bonjour {{parentName}},\n\nURGENT: La tranche "{{trancheName}}" ({{amount}} FCFA) présente un retard de 10 jours.\n\nNous vous demandons de contacter le secrétariat au plus vite pour convenir d\'un échéancier.\n\nCordialement,\nIPVE Digital',
  },
  'J+30': {
    label: '30 jours de retard',
    sms: 'IPVE Digital: DERNIER AVIS - retard 30j. Saisine possible. Régularisez svp.',
    emailSubject: '🚨 DERNIER AVIS — Retard de 30 jours — IPVE Digital',
    emailBody:
      'Bonjour {{parentName}},\n\nDERNIER AVIS: La tranche "{{trancheName}}" ({{amount}} FCFA) présente un retard de 30 jours.\n\nEn l\'absence de régularisation, des mesures complémentaires pourront être engagées.\n\nMerci de contacter le secrétariat immédiatement.\n\nCordialement,\nIPVE Digital',
  },
};

// ---------------------------------------------------------------------------
// Reminder Service
// ---------------------------------------------------------------------------

export const reminderService = {
  /**
   * Process reminders for all tranches that are due within 7 days or overdue.
   * Determines which template applies and creates Notification records.
   * Returns a summary of processed reminders.
   */
  async processReminders(): Promise<{
    processed: number;
    created: number;
    skipped: number;
    details: { templateKey: string; count: number }[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = {
      processed: 0,
      created: 0,
      skipped: 0,
      details: [] as { templateKey: string; count: number }[],
    };

    // Find all active payment plans with tranches
    const plans = await db.paymentPlan.findMany({
      where: { isActive: true },
      include: {
        tranches: {
          where: {
            OR: [
              { dueDate: { gte: today } },  // has a due date today or in future
              { dueDate: { lt: today } },   // overdue
            ],
          },
          orderBy: { trancheNumber: 'asc' },
        },
        level: true,
      },
    });

    const templateKeys = ['J-7', 'J0', 'J+3', 'J+10', 'J+30'];

    for (const plan of plans) {
      for (const tranche of plan.tranches) {
        if (!tranche.dueDate) continue;

        const dueDate = new Date(tranche.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Determine which template applies
        let templateKey: string | null = null;

        if (diffDays === -30) templateKey = 'J+30';
        else if (diffDays === -10) templateKey = 'J+10';
        else if (diffDays === -3) templateKey = 'J+3';
        else if (diffDays === 0) templateKey = 'J0';
        else if (diffDays > 0 && diffDays <= 7) templateKey = 'J-7';

        if (!templateKey) continue;

        const template = REMINDER_TEMPLATES[templateKey];
        if (!template) continue;

        // Find students with unpaid amounts for this tranche
        const tranchePayments = await db.payment.findMany({
          where: {
            trancheId: tranche.id,
            status: { in: ['PENDING', 'COMPLETED'] },
          },
        });

        const byStudent: Record<string, number> = {};
        for (const p of tranchePayments) {
          byStudent[p.studentId] = (byStudent[p.studentId] || 0) + toDecimal(p.amountPaid);
        }

        const students = await db.student.findMany({
          where: {
            levelId: plan.levelId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            parentName: true,
            parentEmail: true,
            phone: true,
          },
        });

        for (const student of students) {
          const paid = byStudent[student.id] || 0;
          const amountDue = toDecimal(tranche.amount);
          if (paid >= amountDue) continue;

          result.processed++;

          const remaining = Math.max(0, amountDue - paid);
          const amountStr = new Intl.NumberFormat('fr-FR').format(Math.round(remaining));
          const dueDateStr = new Date(tranche.dueDate).toLocaleDateString('fr-FR');

          // Check if we already sent this exact reminder today
          const existingReminder = await db.notification.findFirst({
            where: {
              type: 'PAYMENT_REMINDER',
              createdAt: { gte: today },
              message: { contains: templateKey, mode: 'insensitive' },
            },
          });

          if (existingReminder) {
            result.skipped++;
            continue;
          }

          // Create notification
          try {
            await db.notification.create({
              data: {
                userId: student.userId ?? null,
                type: 'PAYMENT_REMINDER',
                title: `${template.label} — ${tranche.name}`,
                message: `[${templateKey}] ${template.sms} (Montant restant: ${amountStr} FCFA — Échéance: ${dueDateStr})`,
                metadata: JSON.stringify({
                  templateKey,
                  studentId: student.id,
                  trancheId: tranche.id,
                  planId: plan.id,
                  remaining,
                  overdueDays: Math.max(0, -diffDays),
                  diffDays,
                }),
              },
            });
            result.created++;
          } catch {
            result.skipped++;
          }
        }

        // Track by template
        const existingDetail = result.details.find((d) => d.templateKey === templateKey);
        if (existingDetail) {
          existingDetail.count++;
        } else {
          result.details.push({ templateKey, count: 1 });
        }
      }
    }

    return result;
  },

  /**
   * Get the queue of tranches that need reminders.
   * Returns tranches due in 7 days, today, or overdue by 3/10/30 days.
   */
  async getReminderQueue(): Promise<{
    queue: {
      templateKey: string;
      templateLabel: string;
      tranches: UnpaidSummary[];
    }[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queues: {
      templateKey: string;
      templateLabel: string;
      tranches: UnpaidSummary[];
    }[] = [];

    // Initialize queues for each template
    for (const key of ['J-7', 'J0', 'J+3', 'J+10', 'J+30']) {
      queues.push({
        templateKey: key,
        templateLabel: REMINDER_TEMPLATES[key]?.label ?? key,
        tranches: [],
      });
    }

    // Find all active payment plans with tranches having due dates
    const plans = await db.paymentPlan.findMany({
      where: { isActive: true },
      include: {
        tranches: {
          where: {
            dueDate: { not: null },
          },
          orderBy: { trancheNumber: 'asc' },
        },
        level: {
          include: {
            filiere: { select: { name: true } },
          },
        },
      },
    });

    for (const plan of plans) {
      for (const tranche of plan.tranches) {
        if (!tranche.dueDate) continue;

        const dueDate = new Date(tranche.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Determine which queue this belongs to
        let queueIdx = -1;
        if (diffDays > 0 && diffDays <= 7) queueIdx = 0;       // J-7
        else if (diffDays === 0) queueIdx = 1;                  // J0
        else if (diffDays === -3) queueIdx = 2;                 // J+3
        else if (diffDays === -10) queueIdx = 3;                // J+10
        else if (diffDays === -30) queueIdx = 4;                // J+30

        if (queueIdx === -1) continue;

        const amountDue = toDecimal(tranche.amount);

        // Find unpaid students for this tranche
        const tranchePayments = await db.payment.findMany({
          where: {
            trancheId: tranche.id,
            status: { in: ['PENDING', 'COMPLETED'] },
          },
        });

        const byStudent: Record<string, number> = {};
        for (const p of tranchePayments) {
          byStudent[p.studentId] = (byStudent[p.studentId] || 0) + toDecimal(p.amountPaid);
        }

        const students = await db.student.findMany({
          where: {
            levelId: plan.levelId,
            status: { in: ['ENROLLED', 'ACTIVE'] },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            phone: true,
            parentEmail: true,
          },
        });

        for (const student of students) {
          const paid = byStudent[student.id] || 0;
          if (paid >= amountDue) continue;

          const remaining = Math.max(0, amountDue - paid);
          const overdueDays = diffDays < 0 ? Math.abs(diffDays) : null;

          let status: TrancheStatus;
          if (paid >= amountDue) status = 'PAYÉ';
          else if (diffDays < 0) status = 'EN_RETARD';
          else if (paid > 0) status = 'PARTIEL';
          else status = 'EN_ATTENTE';

          queues[queueIdx].tranches.push({
            studentId: student.id,
            studentName: `${student.lastName} ${student.firstName}`,
            studentNumber: student.studentNumber,
            filiereName: plan.level.filiere?.name ?? null,
            levelName: plan.level.name,
            studentPhone: student.phone,
            studentEmail: student.parentEmail,
            trancheId: tranche.id,
            trancheName: tranche.name,
            trancheNumber: tranche.trancheNumber,
            amountDue,
            amountPaid: paid,
            remaining,
            dueDate: tranche.dueDate?.toISOString() ?? null,
            overdueDays,
            status,
          });
        }
      }
    }

    // Filter out empty queues
    return {
      queue: queues.filter((q) => q.tranches.length > 0),
    };
  },
};

export default reminderService;
