'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PaymentFilters,
  UnpaidFilters,
  PaymentMethod,
  PaymentListItem,
  PaymentDetail,
  StudentPaymentStatus,
  UnpaidSummary,
  PaymentDashboardData,
  PaymentPlanListItem,
  PaymentPlanDetail,
  RecordPaymentDto,
  CreatePaymentPlanDto,
  SendReminderDto,
  ReminderResult,
  PaginatedResult,
} from '@/types/payment.types';
import { PAYMENT_METHOD_LABELS, getPaymentMethodIcon } from '@/types/payment.types';
import { apiFetchJson } from '@/lib/api-fetch';

const PAYMENTS_BASE = '/api/payments';
const PLANS_BASE = '/api/payment-plans';

// ─── Query helpers ─────────────────────────────────────────

function buildParams(obj: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && val !== '') {
      params.set(key, String(val));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ─── Queries ───────────────────────────────────────────────

export function usePayments(filters: PaymentFilters) {
  const qs = buildParams({
    search: filters.search,
    studentId: filters.studentId,
    paymentMethod: filters.paymentMethod,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
    receivedBy: filters.receivedBy,
    page: filters.page,
    limit: filters.limit,
  });
  return useQuery<PaginatedResult<PaymentListItem>>({
    queryKey: ['payments', filters],
    queryFn: () => apiFetchJson(`${PAYMENTS_BASE}${qs}`),
  });
}

export function usePayment(id: string | null) {
  return useQuery<PaymentDetail>({
    queryKey: ['payment', id],
    queryFn: () => apiFetchJson(`${PAYMENTS_BASE}/${id}`),
    enabled: !!id,
  });
}

export function useStudentPaymentStatus(
  studentId: string | null,
  academicYearId?: string
) {
  const qs = academicYearId ? `?academicYearId=${academicYearId}` : '';
  return useQuery<StudentPaymentStatus>({
    queryKey: ['student-payment-status', studentId, academicYearId],
    queryFn: () =>
      apiFetchJson(`${PAYMENTS_BASE}/student/${studentId}${qs}`),
    enabled: !!studentId,
  });
}

export function useUnpaidStudents(filters: UnpaidFilters) {
  const qs = buildParams({
    filiereId: filters.filiereId,
    levelId: filters.levelId,
    trancheId: filters.trancheId,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    includeOverdue: filters.includeOverdue,
    page: filters.page,
    limit: filters.limit,
  });
  return useQuery<PaginatedResult<UnpaidSummary>>({
    queryKey: ['unpaid-students', filters],
    queryFn: () => apiFetchJson(`${PAYMENTS_BASE}/unpaid${qs}`),
  });
}

export function usePaymentDashboard() {
  return useQuery<PaymentDashboardData>({
    queryKey: ['payment-dashboard'],
    queryFn: () => apiFetchJson(`${PAYMENTS_BASE}/dashboard`),
    staleTime: 60_000, // 1 min
    refetchInterval: 5 * 60 * 1000, // 5 min instead of 60s
  });
}

export function usePaymentPlans(academicYearId?: string) {
  const qs = academicYearId ? `?academicYearId=${academicYearId}` : '';
  return useQuery<PaymentPlanListItem[]>({
    queryKey: ['payment-plans', academicYearId],
    queryFn: () => apiFetchJson(`${PLANS_BASE}${qs}`),
  });
}

export function usePaymentPlan(id: string | null) {
  return useQuery<PaymentPlanDetail>({
    queryKey: ['payment-plan', id],
    queryFn: () => apiFetchJson(`${PLANS_BASE}/${id}`),
    enabled: !!id,
  });
}

// ─── Mutations ─────────────────────────────────────────────

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation<PaymentDetail, Error, RecordPaymentDto>({
    mutationFn: (data) =>
      apiFetchJson(PAYMENTS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment-dashboard'] });
      qc.invalidateQueries({ queryKey: ['unpaid-students'] });
      qc.invalidateQueries({ queryKey: ['student-payment-status'] });
    },
  });
}

export function useCancelPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetchJson(`${PAYMENTS_BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment-dashboard'] });
    },
  });
}

export function useSendReminders() {
  const qc = useQueryClient();
  return useMutation<ReminderResult, Error, SendReminderDto>({
    mutationFn: (data) =>
      apiFetchJson(`${PAYMENTS_BASE}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unpaid-students'] });
    },
  });
}

export function useCreatePaymentPlan() {
  const qc = useQueryClient();
  return useMutation<PaymentPlanDetail, Error, CreatePaymentPlanDto>({
    mutationFn: (data) =>
      apiFetchJson(PLANS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: string;
}

export function usePaymentMethodOptions(): PaymentMethodOption[] {
  return (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method],
    icon: getPaymentMethodIcon(method),
  }));
}

// ─── Student search for autocomplete ───────────────────────

export function useStudentSearch(search: string) {
  return useQuery<{ data: { id: string; studentName: string; studentNumber: string; filiereName: string | null }[] }>({
    queryKey: ['student-search', search],
    queryFn: () =>
      apiFetchJson(`/api/students?search=${encodeURIComponent(search)}&limit=10`),
    enabled: search.length >= 2,
    staleTime: 10_000,
  });
}
