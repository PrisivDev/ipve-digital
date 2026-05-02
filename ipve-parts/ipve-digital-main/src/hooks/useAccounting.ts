'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  JournalFilters,
  LedgerFilters,
  TrialBalanceFilters,
  IncomeStatementFilters,
  CreateJournalEntryDto,
  CreateChartOfAccountDto,
  JournalEntryListItem,
  JournalEntryDetail,
  LedgerResult,
  TrialBalance,
  IncomeStatement,
  BalanceSheet,
  ChartOfAccountItem,
  ChartOfAccountFlat,
  PaginatedResult,
} from '@/types/accounting.types';

const BASE = '/api/accounting';

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

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    return Promise.reject(err);
  }
  return res.json();
}

// ─── Queries ───────────────────────────────────────────────

export function useJournal(filters: JournalFilters) {
  const qs = buildParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    journalType: filters.journalType,
    isValidated: filters.isValidated,
    search: filters.search,
    referenceType: filters.referenceType,
    page: filters.page,
    limit: filters.limit,
  });
  return useQuery<PaginatedResult<JournalEntryListItem>>({
    queryKey: ['accounting-journal', filters],
    queryFn: () => apiFetch(`${BASE}/journal${qs}`),
  });
}

export function useJournalEntry(id: string | null) {
  return useQuery<JournalEntryDetail>({
    queryKey: ['accounting-journal-entry', id],
    queryFn: () => apiFetch(`${BASE}/journal/${id}`),
    enabled: !!id,
  });
}

export function useLedger(accountId: string | null, filters: LedgerFilters) {
  const qs = buildParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  return useQuery<LedgerResult>({
    queryKey: ['accounting-ledger', accountId, filters],
    queryFn: () => apiFetch(`${BASE}/ledger?accountId=${accountId}${qs ? '&' + qs.slice(1) : ''}`),
    enabled: !!accountId,
  });
}

export function useTrialBalance(filters: TrialBalanceFilters) {
  const qs = buildParams({
    date: filters.date,
    onlyMoved: filters.onlyMoved,
  });
  return useQuery<TrialBalance>({
    queryKey: ['accounting-trial-balance', filters],
    queryFn: () => apiFetch(`${BASE}/trial-balance${qs}`),
  });
}

export function useIncomeStatement(filters: IncomeStatementFilters) {
  const qs = buildParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  return useQuery<IncomeStatement>({
    queryKey: ['accounting-income-statement', filters],
    queryFn: () => apiFetch(`${BASE}/income-statement${qs}`),
  });
}

export function useBalanceSheet(date: string) {
  return useQuery<BalanceSheet>({
    queryKey: ['accounting-balance-sheet', date],
    queryFn: () => apiFetch(`${BASE}/balance-sheet?date=${date}`),
    enabled: !!date,
  });
}

export function useChartOfAccounts(tree?: boolean, search?: string) {
  const qs = buildParams({ tree, search });
  return useQuery<ChartOfAccountItem[]>({
    queryKey: ['accounting-chart', tree, search],
    queryFn: () => apiFetch(`${BASE}/chart-of-accounts${qs}`),
  });
}

export function useAccountByNumber(accountNumber: string) {
  return useQuery<ChartOfAccountFlat>({
    queryKey: ['accounting-account-by-number', accountNumber],
    queryFn: () => apiFetch(`${BASE}/chart-of-accounts?search=${encodeURIComponent(accountNumber)}`),
    enabled: !!accountNumber,
    select: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return null;
    },
  });
}

// ─── Mutations ─────────────────────────────────────────────

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation<JournalEntryDetail, Error, CreateJournalEntryDto>({
    mutationFn: (data) =>
      apiFetch(`${BASE}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-journal'] });
      qc.invalidateQueries({ queryKey: ['accounting-ledger'] });
      qc.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      qc.invalidateQueries({ queryKey: ['accounting-income-statement'] });
      qc.invalidateQueries({ queryKey: ['accounting-balance-sheet'] });
    },
  });
}

export function useValidateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${BASE}/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-journal'] });
      qc.invalidateQueries({ queryKey: ['accounting-journal-entry'] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${BASE}/journal/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-journal'] });
      qc.invalidateQueries({ queryKey: ['accounting-ledger'] });
      qc.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation<ChartOfAccountFlat, Error, CreateChartOfAccountDto>({
    mutationFn: (data) =>
      apiFetch(`${BASE}/chart-of-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-chart'] });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────

export function useAccountSearch(query: string, debounceMs = 300) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery<ChartOfAccountFlat[]>({
    queryKey: ['account-search', debounced],
    queryFn: () =>
      apiFetch<ChartOfAccountFlat[]>(
        `${BASE}/chart-of-accounts?search=${encodeURIComponent(debounced)}`
      ),
    enabled: debounced.length >= 1,
    staleTime: 10_000,
  });
}
