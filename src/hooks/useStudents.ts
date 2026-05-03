'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';

const BASE = '/api/students';

export interface StudentFilters {
  search?: string;
  filiereId?: string;
  levelId?: string;
  classId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fetch students list with filters + pagination
export function useStudents(filters: StudentFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.filiereId) params.set('filiereId', filters.filiereId);
  if (filters.levelId) params.set('levelId', filters.levelId);
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery<PaginatedResponse<any>>({
    queryKey: ['students', filters],
    queryFn: () =>
      apiFetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
  });
}

// Fetch single student
export function useStudent(id: string | null) {
  return useQuery<any>({
    queryKey: ['student', id],
    queryFn: () =>
      apiFetch(`${BASE}/${id}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

// Fetch financial summary
export function useStudentFinancialSummary(id: string | null) {
  return useQuery<any>({
    queryKey: ['student-financial', id],
    queryFn: () =>
      apiFetch(`${BASE}/${id}/financial-summary`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

// Fetch grades
export function useStudentGrades(
  id: string | null,
  academicYearId?: string,
  periodId?: string
) {
  const params = new URLSearchParams();
  if (academicYearId) params.set('academicYearId', academicYearId);
  if (periodId) params.set('periodId', periodId);
  return useQuery<any>({
    queryKey: ['student-grades', id, academicYearId, periodId],
    queryFn: () =>
      apiFetch(`${BASE}/${id}/grades?${params}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

// Fetch attendance
export function useStudentAttendance(id: string | null) {
  return useQuery<any>({
    queryKey: ['student-attendance', id],
    queryFn: () =>
      apiFetch(`${BASE}/${id}/attendance`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

// Create student
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Update student
export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['student', vars.id] });
    },
  });
}

// Delete student (soft)
export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${BASE}/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Fetch filieres for filter dropdowns (real data from DB)
export function useFilieres() {
  return useQuery<{ id: string; name: string; code: string }[]>({
    queryKey: ['filieres'],
    queryFn: () =>
      apiFetch('/api/references')
        .then((r) => {
          if (!r.ok) throw new Error('Erreur chargement filieres');
          return r.json();
        })
        .then((data) => data.filieres ?? []),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch levels for a given filiere (real data from DB, filtered server-side)
export function useLevels(filiereId?: string) {
  return useQuery<{ id: string; name: string; filiereId: string }[]>({
    queryKey: ['levels', filiereId],
    queryFn: () =>
      apiFetch(`/api/references${filiereId ? `?filiereId=${filiereId}` : ''}`)
        .then((r) => {
          if (!r.ok) throw new Error('Erreur chargement niveaux');
          return r.json();
        })
        .then((data) => data.levels ?? []),
    enabled: !!filiereId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch classes for a given level (real data from DB, filtered server-side)
export function useClasses(levelId?: string) {
  return useQuery<{ id: string; name: string; levelId: string }[]>({
    queryKey: ['classes', levelId],
    queryFn: () =>
      apiFetch(`/api/references${levelId ? `?levelId=${levelId}` : ''}`)
        .then((r) => {
          if (!r.ok) throw new Error('Erreur chargement classes');
          return r.json();
        })
        .then((data) => data.classes ?? []),
    enabled: !!levelId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
