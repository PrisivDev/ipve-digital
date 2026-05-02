import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { json } from '@/lib/json';

export async function GET() {
  try {
    const attendance = await db.attendance.findMany({
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    // Calculate stats
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    const absent = attendance.filter(a => a.status === 'ABSENT').length;
    const late = attendance.filter(a => a.status === 'LATE').length;
    const excused = attendance.filter(a => a.status === 'EXCUSED').length;

    return json({
      records: attendance,
      stats: {
        total,
        present,
        absent,
        late,
        excused,
        rate: total > 0 ? ((present + excused) / total * 100).toFixed(1) : 0,
        absentRate: total > 0 ? ((absent + late) / total * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 });
  }
}
