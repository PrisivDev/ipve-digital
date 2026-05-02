import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// GET /api/settings/system/export — export data summary as JSON
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const students = await db.student.findMany({
      select: { id: true, studentNumber: true, firstName: true, lastName: true, status: true, filiereId: true, levelId: true, classId: true },
      take: 5000,
    });

    const filieres = await db.filiere.findMany({ select: { id: true, name: true, code: true, isActive: true } });
    const levels = await db.level.findMany({ select: { id: true, name: true, filiereId: true, yearNumber: true, tuitionFee: true } });
    const classes = await db.class.findMany({ select: { id: true, name: true, levelId: true, capacity: true, academicYearId: true } });
    const subjects = await db.subject.findMany({ select: { id: true, name: true, code: true, isActive: true } });
    const academicYears = await db.academicYear.findMany({ select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true } });

    const payments = await db.payment.findMany({
      select: { id: true, paymentNumber: true, studentId: true, amountPaid: true, paymentDate: true, paymentMethod: true, status: true },
      take: 5000,
    });

    const expenseCategories = await db.expenseCategory.findMany({ select: { id: true, name: true, code: true, isActive: true } });
    const suppliers = await db.supplier.findMany({ select: { id: true, name: true, phone: true, email: true, isActive: true } });

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: auth.email,
      institution: {
        filieres,
        levels,
        classes,
        subjects,
        academicYears,
      },
      people: {
        students,
      },
      finance: {
        payments,
        expenseCategories,
        suppliers,
      },
    };

    return json({ success: true, data: exportData });
  } catch (error) {
    console.error('[SETTINGS] GET system export error:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
