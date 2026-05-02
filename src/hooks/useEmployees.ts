'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = '/api/employees';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string | null;
  contractType: string;
  baseSalary: number;
  isActive: boolean;
  hireDate: string;
  terminationDate: string | null;
  userId: string | null;
  userEmail: string | null;
}

export interface EmployeeDetail extends EmployeeListItem {
  dateOfBirth: string | null;
  transportAllowance: number;
  housingAllowance: number;
  bankName: string | null;
  bankAccount: string | null;
  cnpsNumber: string | null;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployees {
  data: EmployeeListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** List employees with pagination, search, department and status filters. */
export function useEmployees(filters: EmployeeFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.department) params.set('department', filters.department);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery<{ success: boolean; data: PaginatedEmployees }>({
    queryKey: ['employees', filters],
    queryFn: () =>
      fetch(`${BASE}${qs ? `?${qs}` : ''}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    staleTime: 2 * 60 * 1000,
  });
}

/** Get a single employee by ID. */
export function useEmployee(id: string | null) {
  return useQuery<{ success: boolean; data: EmployeeDetail }>({
    queryKey: ['employee', id],
    queryFn: () =>
      fetch(`${BASE}/${id}`).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/** Create a new employee. */
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

/** Update an existing employee. */
export function useUpdateEmployee() {
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
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', vars.id] });
    },
  });
}

/** Soft-delete (deactivate) an employee. */
export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`${BASE}/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
