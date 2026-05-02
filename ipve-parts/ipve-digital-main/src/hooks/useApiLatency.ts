'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────

export interface ApiCallInfo {
  id: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  ok: boolean;
}

export interface LatencyStats {
  activeCalls: number;
  lastDuration: number | null;
  averageDuration: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  totalCalls: number;
  recentCalls: ApiCallInfo[];
}

// ─── Store (module-level singleton — shared across all components) ──

const listeners = new Set<() => void>();
const MAX_HISTORY = 50;

const store = {
  calls: [] as ApiCallInfo[],
  _idCounter: 0,
};

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function addCall(call: ApiCallInfo) {
  store.calls = [call, ...store.calls].slice(0, MAX_HISTORY);
  notifyListeners();
}

function updateCall(id: string, update: Partial<ApiCallInfo>) {
  store.calls = store.calls.map((c) =>
    c.id === id ? { ...c, ...update } : c
  );
  notifyListeners();
}

function removeCall(id: string) {
  store.calls = store.calls.filter((c) => c.id !== id);
  notifyListeners();
}

// ─── Compute stats ─────────────────────────────────────────────────

function computeStats(): LatencyStats {
  const active = store.calls.filter((c) => !c.endTime);
  const completed = store.calls.filter((c) => c.endTime && c.duration !== undefined);
  const recent = store.calls.slice(0, 8);

  return {
    activeCalls: active.length,
    lastDuration: completed.length > 0 ? completed[0].duration ?? null : null,
    averageDuration:
      completed.length > 0
        ? Math.round(completed.reduce((sum, c) => sum + (c.duration ?? 0), 0) / completed.length)
        : null,
    minDuration:
      completed.length > 0
        ? Math.min(...completed.map((c) => c.duration ?? Infinity))
        : null,
    maxDuration:
      completed.length > 0
        ? Math.max(...completed.map((c) => c.duration ?? 0))
        : null,
    totalCalls: completed.length,
    recentCalls: recent,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────

/**
 * Track API latency in real-time.
 *
 * Returns `stats` with active/avg/min/max durations and `recentCalls`.
 * Automatically tracks all `fetch()` calls made via React Query.
 */
export function useApiLatency(): LatencyStats & {
  startCall: (url: string, method?: string) => string;
  endCall: (id: string, status: number) => void;
  isAnyLoading: boolean;
} {
  const [stats, setStats] = useState<LatencyStats>(computeStats);

  useEffect(() => {
    const listener = () => setStats(computeStats());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const startCall = useCallback((url: string, method = 'GET') => {
    const id = `api_${++store._idCounter}_${Date.now()}`;
    const call: ApiCallInfo = {
      id,
      url: url.replace(/https?:\/\/[^/]+/, ''),
      method,
      startTime: Date.now(),
      ok: true,
    };
    addCall(call);
    return id;
  }, []);

  const endCall = useCallback((id: string, status: number) => {
    const call = store.calls.find((c) => c.id === id);
    if (!call) return;

    const endTime = Date.now();
    updateCall(id, {
      endTime,
      duration: endTime - call.startTime,
      status,
      ok: status >= 200 && status < 400,
    });

    // Auto-remove after 3 seconds to keep UI clean
    setTimeout(() => removeCall(id), 3000);
  }, []);

  return {
    ...stats,
    startCall,
    endCall,
    isAnyLoading: stats.activeCalls > 0,
  };
}

// ─── React Query integration ───────────────────────────────────────

/**
 * Installs a global fetch interceptor that tracks API latency.
 * Call once in the root component.
 */
export function useApiLatencyTracker() {
  const { startCall, endCall } = useApiLatency();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
      const method = args[1]?.method?.toUpperCase() ?? 'GET';

      // Only track API calls
      if (!url.includes('/api/')) {
        return originalFetch.apply(window, args);
      }

      // Each call gets its own id (closure-scoped, not shared)
      const callId = startCall(url, method);

      try {
        const response = await originalFetch.apply(window, args);
        endCall(callId, response.status);
        return response;
      } catch (error) {
        endCall(callId, 0);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [startCall, endCall]);
}
