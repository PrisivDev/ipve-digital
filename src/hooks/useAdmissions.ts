'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';

const BASE = '/api/admissions';

export interface AdmissionFilters {
  search?: string;
  status?: string;
  filiereId?: string;
  levelId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAdmissionResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts?: {
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    accepted: number;
    rejected: number;
    cancelled: number;
    enrolled: number;
  };
}

// Fetch admissions list with filters + pagination
export function useAdmissions(filters: AdmissionFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.filiereId) params.set('filiereId', filters.filiereId);
  if (filters.levelId) params.set('levelId', filters.levelId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery<PaginatedAdmissionResponse>({
    queryKey: ['admissions', filters],
    queryFn: () =>
      apiFetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
  });
}

// Fetch single admission
export function useAdmission(id: string | null) {
  return useQuery<any>({
    queryKey: ['admission', id],
    queryFn: () =>
      apiFetch(`${BASE}/${id}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

// Create admission
export function useCreateAdmission() {
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
      qc.invalidateQueries({ queryKey: ['admissions'] });
    },
  });
}

// Update admission
export function useUpdateAdmission() {
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
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['admission', vars.id] });
    },
  });
}

// Delete admission
export function useDeleteAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${BASE}/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] });
    },
  });
}

// Update admission status
export function useUpdateAdmissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, decisionNote }: { id: string; status: string; decisionNote?: string }) =>
      apiFetch(`${BASE}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decisionNote }),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['admission', vars.id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Enroll admission (convert to student)
export function useEnrollAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) =>
      apiFetch(`${BASE}/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['admission', vars.id] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// Fetch filieres for filter/form dropdowns (real data from DB)
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
