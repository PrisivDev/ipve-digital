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
      avgGradeResult,
      attendanceCountResult,
      monthlyRevenueRaw,
      attendanceBySubjectRaw,
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
        where: { filiereId: { not: null } },
      }).catch((): unknown[] => []),
      // Real avg grade from Grade table
      db.grade.aggregate({ _avg: { score: true } }).catch(() => ({ _avg: { score: null } })),
      // Attendance rate: count PRESENT vs total
      db.attendance.groupBy({ by: ['status'], _count: { id: true } }).catch((): unknown[] => []),
      // Monthly revenue (last 6 months)
      db.payment.groupBy({
        by: ['paymentDate'],
        where: { status: 'COMPLETED' },
        _sum: { amountPaid: true },
      }).catch((): unknown[] => []),
      // Attendance by subject
      db.attendance.groupBy({
        by: ['subjectId'],
        _count: { id: true },
      }).catch((): unknown[] => []),
    ]);

    const paidExpenses = await db.expense.count({ where: { status: 'PAID' } }).catch(() => 0);
    const revenue = Number(totalRevenueResult._sum.amountPaid || 0);
    const expenses = Number(totalExpenseResult._sum.amount || 0);

    // ── Compute real avgGrade ──
    const avgGrade = avgGradeResult._avg.score ? Number(avgGradeResult._avg.score) : 0;

    // ── Compute real attendanceRate ──
    const attendanceCounts = attendanceCountResult as { status: string; _count: { id: number } }[];
    const totalAttendance = attendanceCounts.reduce((sum, c) => sum + c._count.id, 0);
    const presentCount = attendanceCounts.find(c => c.status === 'PRESENT')?._count.id || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // ── Compute monthlyRevenue (last 6 months) ──
    const monthlyRevenuePayments = monthlyRevenueRaw as { paymentDate: Date; _sum: { amountPaid: number | null } }[];
    const now = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    // Determine the month range from actual payment/expense data, defaulting to last 6 months
    const allDates = [
      ...monthlyRevenuePayments.map(p => new Date(p.paymentDate).getTime()),
    ];
    const allExpensesRaw = await db.expense.findMany({
      where: { status: 'PAID' },
      select: { expenseDate: true },
    }).catch((): { expenseDate: Date }[] => []);
    allDates.push(...allExpensesRaw.map(e => new Date(e.expenseDate).getTime()));

    let refDate = now;
    if (allDates.length > 0) {
      const maxDate = new Date(Math.max(...allDates));
      // Use the max date as reference, but cap at now
      refDate = maxDate > now ? now : maxDate;
    }

    const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = `${monthNames[month]} ${year}`;

      const monthRevenue = monthlyRevenuePayments
        .filter(p => {
          const pd = new Date(p.paymentDate);
          return pd.getFullYear() === year && pd.getMonth() === month;
        })
        .reduce((sum, p) => sum + Number(p._sum.amountPaid || 0), 0);

      monthlyRevenue.push({ month: label, revenue: monthRevenue, expenses: 0 });
    }

    // Compute monthly expenses
    const monthlyExpensesRaw = await db.expense.groupBy({
      by: ['expenseDate'],
      where: { status: 'PAID' },
      _sum: { amount: true },
    }).catch((): unknown[] => []);

    const monthlyExpenses = monthlyExpensesRaw as { expenseDate: Date; _sum: { amount: number | null } }[];
    for (const entry of monthlyRevenue) {
      const parts = entry.month.split(' ');
      const monthIdx = monthNames.indexOf(parts[0]);
      const year = parseInt(parts[1], 10);
      entry.expenses = monthlyExpenses
        .filter(e => {
          const ed = new Date(e.expenseDate);
          return ed.getFullYear() === year && ed.getMonth() === monthIdx;
        })
        .reduce((sum, e) => sum + Number(e._sum.amount || 0), 0);
    }

    // ── Compute attendanceBySubject ──
    // attendanceBySubjectRaw groups by subjectId (which is actually ClassSubject ID)
    const attendanceBySubjectData = attendanceBySubjectRaw as { subjectId: string; _count: { id: number } }[];
    const classSubjectIds = attendanceBySubjectData.map(d => d.subjectId);

    // Get ClassSubject -> Subject mapping to resolve actual subject names
    const classSubjects = await db.classSubject.findMany({
      where: { id: { in: classSubjectIds } },
      select: { id: true, subjectId: true },
    }).catch((): { id: string; subjectId: string }[] => []);

    const csToSubjectMap = new Map(classSubjects.map(cs => [cs.id, cs.subjectId]));
    const actualSubjectIds = [...new Set(classSubjects.map(cs => cs.subjectId))];

    const subjects = await db.subject.findMany({
      where: { id: { in: actualSubjectIds } },
      select: { id: true, name: true },
    }).catch((): { id: string; name: string }[] => []);

    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

    // Get attendance breakdown per classSubject (subjectId in attendance)
    const attendanceBySubjectFull = await db.attendance.groupBy({
      by: ['subjectId', 'status'],
      _count: { id: true },
      where: { subjectId: { in: classSubjectIds } },
    }).catch((): unknown[] => []);

    const attBySubjFull = attendanceBySubjectFull as { subjectId: string; status: string; _count: { id: number } }[];

    const subjectAttendanceMap = new Map<string, { total: number; present: number }>();
    for (const record of attBySubjFull) {
      const existing = subjectAttendanceMap.get(record.subjectId) || { total: 0, present: 0 };
      existing.total += record._count.id;
      if (record.status === 'PRESENT') existing.present += record._count.id;
      subjectAttendanceMap.set(record.subjectId, existing);
    }

    const attendanceBySubject: { subject: string; taux: number }[] = [];
    for (const [csId, counts] of subjectAttendanceMap) {
      const realSubjectId = csToSubjectMap.get(csId);
      const name = realSubjectId ? (subjectMap.get(realSubjectId) || 'Inconnu') : 'Inconnu';
      const taux = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;
      attendanceBySubject.push({ subject: name, taux });
    }

    // ── Fix studentsByProgram to include filiere name ──
    const studentsByProgramRaw = studentsByFiliereResult as { filiereId: string; _count: { id: number } }[];
    const filiereIds = studentsByProgramRaw.map(d => d.filiereId);

    const filieres = await db.filiere.findMany({
      where: { id: { in: filiereIds } },
      select: { id: true, name: true },
    }).catch((): { id: string; name: string }[] => []);

    const filiereMap = new Map(filieres.map(f => [f.id, f.name]));

    const studentsByProgram = studentsByProgramRaw.map(d => ({
      filiereId: d.filiereId,
      filiereName: filiereMap.get(d.filiereId) || 'Inconnu',
      _count: d._count,
    }));

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
        avgGrade,
        attendanceRate,
      },
      recentPayments: recentPaymentsResult,
      notifications: recentNotificationsResult,
      studentsByProgram,
      unreadNotifications: activeNotifications,
      monthlyRevenue,
      attendanceBySubject,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[Dashboard] API error:', errMessage);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
