'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ProspectFilters,
  ProspectStatus,
  AddInteractionDto,
  CreateProspectDto,
  UpdateProspectDto,
} from '@/types/prospect.types';

const BASE = '/api/prospects';

// ─── Queries ─────────────────────────────────────────────

export function useProspects(filters: ProspectFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.source) params.set('source', filters.source);
  if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
  if (filters.filiereInterest) params.set('filiereInterest', filters.filiereInterest);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery({
    queryKey: ['prospects', filters],
    queryFn: () =>
      fetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
  });
}

export function useProspect(id: string | null) {
  return useQuery({
    queryKey: ['prospect', id],
    queryFn: () =>
      fetch(`${BASE}/${id}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
  });
}

export function useProspectInteractions(prospectId: string | null) {
  return useQuery({
    queryKey: ['prospect-interactions', prospectId],
    queryFn: () =>
      fetch(`${BASE}/${prospectId}/interactions`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!prospectId,
  });
}

export function useKanbanData(filters?: Omit<ProspectFilters, 'page' | 'limit' | 'status'>) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.source) params.set('source', filters.source);
  if (filters?.assignedTo) params.set('assignedTo', filters.assignedTo);
  if (filters?.filiereInterest) params.set('filiereInterest', filters.filiereInterest);

  const qs = params.toString();
  return useQuery({
    queryKey: ['prospects-kanban', filters],
    queryFn: () =>
      fetch(`${BASE}/kanban${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
  });
}

export function useConversionStats() {
  return useQuery({
    queryKey: ['prospects-stats'],
    queryFn: () =>
      fetch(`${BASE}/stats`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    staleTime: 2 * 60 * 1000, // 2 min — stats don't change frequently
    refetchInterval: 5 * 60 * 1000, // 5 min instead of 30s
  });
}

// ─── Mutations ───────────────────────────────────────────

export function useCreateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProspectDto) =>
      fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospects-kanban'] });
      qc.invalidateQueries({ queryKey: ['prospects-stats'] });
    },
  });
}

export function useUpdateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProspectDto }) =>
      fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospects-kanban'] });
      qc.invalidateQueries({ queryKey: ['prospect', vars.id] });
    },
  });
}

export function useUpdateProspectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ProspectStatus;
      notes?: string;
    }) =>
      fetch(`${BASE}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospects-kanban'] });
      qc.invalidateQueries({ queryKey: ['prospects-stats'] });
    },
  });
}

export function useConvertProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      studentData,
    }: {
      id: string;
      studentData: {
        filiereId: string;
        levelId: string;
        classId: string;
        scholarship?: boolean;
        scholarshipPct?: number;
      };
    }) =>
      fetch(`${BASE}/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospects-kanban'] });
      qc.invalidateQueries({ queryKey: ['prospects-stats'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`${BASE}/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['prospects-kanban'] });
      qc.invalidateQueries({ queryKey: ['prospects-stats'] });
    },
  });
}

export function useAddInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      prospectId,
      data,
    }: {
      prospectId: string;
      data: AddInteractionDto;
    }) =>
      fetch(`${BASE}/${prospectId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['prospect', vars.prospectId] });
      qc.invalidateQueries({ queryKey: ['prospect-interactions', vars.prospectId] });
      qc.invalidateQueries({ queryKey: ['prospects-stats'] });
    },
  });
}
