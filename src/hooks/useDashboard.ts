'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';

// ─── Types ──────────────────────────────────────────────────

export interface DashboardApiData {
  students: { total: number; active: number };
  teachers: { total: number };
  programs: { total: number };
  prospects: { total: number; new: number };
  payments: { total: number; revenue: number };
  expenses: { total: number; amount: number };
  finances: { revenue: number; expenses: number; margin: number; cash: number };
  academics: { totalGrades: number; avgGrade: number; attendanceRate: number };
  recentPayments: {
    id: string;
    amountPaid: number;
    paymentDate: string;
    status: string;
    student: { firstName: string; lastName: string; studentNumber: string } | null;
    tranche: { name: string } | null;
  }[];
  notifications: Record<string, unknown>[];
  studentsByProgram: { filiereId: string; filiereName: string; _count: { id: number } }[];
  unreadNotifications: number;
  monthlyRevenue: { month: string; revenue: number; expenses: number }[];
  attendanceBySubject: { subject: string; taux: number }[];
}

// ─── Hook ───────────────────────────────────────────────────

export function useDashboard() {
  return useQuery<DashboardApiData>({
    queryKey: ['dashboard'],
    queryFn: () =>
      apiFetch('/api/dashboard').then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    staleTime: 60_000, // 1 min
    refetchInterval: 5 * 60 * 1000, // 5 min
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
