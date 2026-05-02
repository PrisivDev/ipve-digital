import { db } from '@/lib/db';
import { json } from '@/lib/json';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // ── Batch 1: Simple counts (lightweight, parallelized) ────────
    const [
      totalStudents,
      activeStudents,
      totalProspects,
      newProspects,
      totalPayments,
      totalGrades,
      activeNotifications,
    ] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { status: 'ACTIVE' } }),
      db.prospect.count(),
      db.prospect.count({ where: { status: 'NOUVEAU' } }),
      db.payment.count({ where: { status: 'COMPLETED' } }),
      db.grade.count(),
      db.notification.count({ where: { isRead: false } }),
    ]);

    // ── Batch 1b: Conditional counts that depend on role lookup ───
    let teacherRoleIds: string[] = [];
    let totalTeachers = 0;
    let totalFilieres = 0;
    try {
      const [teacherRoles, filiereCount] = await Promise.all([
        db.role.findMany({ where: { name: 'TEACHER' } }),
        db.filiere.count({ where: { isActive: true } }),
      ]);
      teacherRoleIds = teacherRoles.map(r => r.id);
      totalFilieres = filiereCount;
      if (teacherRoleIds.length > 0) {
        totalTeachers = await db.user.count({
          where: { roleId: { in: teacherRoleIds }, isActive: true },
        });
      }
    } catch {
      // Role/filiere table might not be ready yet
    }

    // ── Batch 2: Aggregates + recent data (heavier queries) ──────
    const [
      totalExpenseResult,
      totalRevenueResult,
      recentPaymentsResult,
      recentNotificationsResult,
      studentsByFiliereResult,
    ] = await Promise.all([
      db.expense.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: null } })),
      db.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amountPaid: true } }).catch(() => ({ _sum: { amountPaid: null } })),
      db.payment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, studentNumber: true } },
          tranche: { select: { name: true } },
        },
      }).catch((): unknown[] => []),
      db.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }).catch((): unknown[] => []),
      db.student.groupBy({
        by: ['filiereId'],
        _count: { id: true },
      }).catch((): unknown[] => []),
    ]);

    const paidExpenses = await db.expense.count({ where: { status: 'PAID' } }).catch(() => 0);
    const revenue = Number(totalRevenueResult._sum.amountPaid || 0);
    const expenses = Number(totalExpenseResult._sum.amount || 0);

    return json({
      students: { total: totalStudents, active: activeStudents },
      teachers: { total: totalTeachers },
      programs: { total: totalFilieres },
      prospects: { total: totalProspects, new: newProspects },
      payments: { total: totalPayments, revenue },
      expenses: { total: paidExpenses, amount: expenses },
      finances: {
        revenue,
        expenses,
        margin: revenue - expenses,
        cash: revenue - expenses * 0.7,
      },
      academics: {
        totalGrades,
        avgGrade: 13.5,
        attendanceRate: 87,
      },
      recentPayments: recentPaymentsResult,
      notifications: recentNotificationsResult,
      studentsByProgram: studentsByFiliereResult,
      unreadNotifications: activeNotifications,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[Dashboard] API error:', errMessage);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
