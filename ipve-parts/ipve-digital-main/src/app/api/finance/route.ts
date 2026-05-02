import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { json } from '@/lib/json';

export async function GET() {
  try {
    // Sequential queries to avoid Supabase connection pool exhaustion (max 3 connections)
    const totalRevenue = await db.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amountPaid: true },
    });
    const totalExpensesResult = await db.expense.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });
    const recentPayments = await db.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: 50,
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        tranche: { select: { name: true } },
      },
    });
    const recentExpenses = await db.expense.findMany({
      orderBy: { expenseDate: 'desc' },
      take: 50,
      include: {
        category: { select: { name: true } },
      },
    });
    const studentCount = await db.student.count({ where: { status: 'ACTIVE' } });

    const revenue = Number(totalRevenue._sum.amountPaid || 0);
    const expenses = Number(totalExpensesResult._sum.amount || 0);

    return json({
      revenue,
      expenses,
      margin: revenue - expenses,
      marginRate: revenue > 0 ? ((revenue - expenses) / revenue * 100).toFixed(1) : 0,
      cash: revenue - expenses * 0.7,
      studentCount,
      payments: recentPayments.map((p) => ({
        id: p.id,
        student: `${p.student.firstName} ${p.student.lastName}`,
        studentNumber: p.student.studentNumber,
        amount: Number(p.amountPaid),
        date: p.paymentDate,
        method: p.paymentMethod,
        tranche: p.tranche.name,
      })),
      expenseList: recentExpenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        date: e.expenseDate,
        category: e.category.name,
        status: e.status,
      })),
    });
  } catch (error) {
    console.error('Finance API error:', error);
    return NextResponse.json({ error: 'Failed to load finance data' }, { status: 500 });
  }
}
