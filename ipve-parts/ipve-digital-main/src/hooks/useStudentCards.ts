'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = '/api/student-cards';

export interface StudentCardFilters {
  search?: string;
  status?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedStudentCardResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts?: {
    total: number;
    active: number;
    lost: number;
    expired: number;
    cancelled: number;
  };
}

// Fetch student cards list with filters + pagination
export function useStudentCards(filters: StudentCardFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery<PaginatedStudentCardResponse>({
    queryKey: ['student-cards', filters],
    queryFn: () =>
      fetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
  });
}

// Fetch single student card
export function useStudentCard(id: string | null) {
  return useQuery<any>({
    queryKey: ['student-card', id],
    queryFn: () =>
      fetch(`${BASE}/${id}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

// Generate student card
export function useGenerateStudentCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; expiryDate?: string }) =>
      fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['student-cards'] });
      // Also refresh the student so their profile reflects the new card
      qc.invalidateQueries({ queryKey: ['students', vars.studentId] });
      qc.invalidateQueries({ queryKey: ['student', vars.studentId] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Update student card
export function useUpdateStudentCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['student-cards'] });
      qc.invalidateQueries({ queryKey: ['student-card', vars.id] });
    },
  });
}

// Record card print
export function useRecordCardPrint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`${BASE}/${id}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['student-cards'] });
      qc.invalidateQueries({ queryKey: ['student-card', id] });
    },
  });
}

// Renew student card
export function useRenewStudentCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) =>
      fetch(`${BASE}/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['student-cards'] });
      qc.invalidateQueries({ queryKey: ['student-card', vars.id] });
    },
  });
}
