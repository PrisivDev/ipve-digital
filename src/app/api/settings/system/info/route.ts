import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/system/info — system statistics
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const studentCount = await db.student.count();
    const employeeCount = await db.employee.count();
    const userCount = await db.user.count();
    const filiereCount = await db.filiere.count();
    const levelCount = await db.level.count();
    const classCount = await db.class.count();
    const subjectCount = await db.subject.count();
    const academicYearCount = await db.academicYear.count();
    const paymentCount = await db.payment.count();
    const expenseCount = await db.expense.count();
    const notificationCount = await db.notification.count();
    const auditLogCount = await db.auditLog.count();
    const admissionCount = await db.admission.count();
    const prospectCount = await db.prospect.count();
    const scheduleCount = await db.schedule.count();
    const gradeCount = await db.grade.count();
    const attendanceCount = await db.attendance.count();

    const currentYear = await db.academicYear.findFirst({ where: { isCurrent: true } });

    const activeStudents = await db.student.count({ where: { status: 'ACTIVE' } });
    const activeUsers = await db.user.count({ where: { isActive: true } });
    const completedPayments = await db.payment.count({ where: { status: 'COMPLETED' } });
    const pendingPayments = await db.payment.count({ where: { status: 'PENDING' } });

    return json({
      success: true,
      data: {
        counts: {
          students: studentCount,
          activeStudents,
          employees: employeeCount,
          users: userCount,
          activeUsers,
          filieres: filiereCount,
          levels: levelCount,
          classes: classCount,
          subjects: subjectCount,
          academicYears: academicYearCount,
          payments: paymentCount,
          completedPayments,
          pendingPayments,
          expenses: expenseCount,
          notifications: notificationCount,
          auditLogs: auditLogCount,
          admissions: admissionCount,
          prospects: prospectCount,
          schedules: scheduleCount,
          grades: gradeCount,
          attendance: attendanceCount,
        },
        currentYear: currentYear ? {
          id: currentYear.id,
          name: currentYear.name,
          startDate: currentYear.startDate.toISOString(),
          endDate: currentYear.endDate.toISOString(),
        } : null,
        lastSync: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET system info error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
