import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId') || '';
    const periodId = searchParams.get('periodId') || '';
    const studentId = searchParams.get('studentId') || '';

    const where: any = {};
    if (subjectId) where.subjectId = subjectId;
    if (periodId) where.periodId = periodId;
    if (studentId) where.studentId = studentId;

    const grades = await db.grade.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        subject: { select: { id: true, name: true, code: true, coefficient: true } },
        period: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate averages per student if no specific filter
    if (!studentId) {
      const studentAverages: Record<string, { student: any; avg: number; rank: number }> = {};
      for (const grade of grades) {
        const key = grade.studentId;
        if (!studentAverages[key]) {
          studentAverages[key] = { student: grade.student, avg: 0, rank: 0 };
        }
        studentAverages[key].avg += (grade.score / grade.maxScore) * 20;
      }
      // Sort by average to get ranking
      const sorted = Object.values(studentAverages)
        .map(s => ({ ...s, avg: Math.round((s.avg / 3) * 100) / 100 }))
        .sort((a, b) => b.avg - a.avg);
      sorted.forEach((s, i) => (s.rank = i + 1));

      return json({ grades, rankings: sorted });
    }

    return json({ grades });
  } catch (error) {
    console.error('Grades API error:', error);
    return NextResponse.json({ error: 'Failed to load grades' }, { status: 500 });
  }
}
