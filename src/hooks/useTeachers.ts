'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';

const BASE = '/api/teachers';

export interface TeacherFilters {
  search?: string;
  status?: string; // 'active' | 'inactive' | ''
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleName: string;
  totalSubjects: number;
  totalHours: number;
  subjects: { name: string; code: string; className: string; hoursPerWeek: number }[];
  contract: {
    type: string;
    department: string;
    baseSalary: number;
    hireDate: string;
    position: string | null;
  } | null;
}

export function useTeachers(filters: TeacherFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);

  const qs = params.toString();
  return useQuery<{ teachers: Teacher[] }>({
    queryKey: ['teachers', filters],
    queryFn: () =>
      apiFetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
  });
}

export interface CreateTeacherPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  contractType?: string;
  department?: string;
  position?: string;
  baseSalary?: number | string;
  hireDate?: string;
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeacherPayload) =>
      apiFetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}
