'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = '/api/parents';

export interface ParentChild {
  studentId: string;
  studentName: string;
  filiere: string | null;
  level: string | null;
  status: string;
}

export interface Parent {
  id: string;
  parentPhone: string;
  parentName: string | null;
  parentEmail: string | null;
  emergencyContact: string | null;
  childrenCount: number;
  children: ParentChild[];
}

export interface ParentsFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ParentsResponse {
  parents: Parent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateParentPayload {
  parentPhone: string;
  parentName?: string | null;
  parentEmail?: string | null;
  emergencyContact?: string | null;
}

// ─── Query ──────────────────────────────────────────────

export function useParents(filters: ParentsFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery<ParentsResponse>({
    queryKey: ['parents', filters],
    queryFn: () =>
      fetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    staleTime: 60 * 1000,
  });
}

// ─── Mutation ───────────────────────────────────────────

export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateParentPayload) =>
      fetch(BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parents'] });
    },
  });
}
