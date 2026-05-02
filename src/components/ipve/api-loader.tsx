'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useApiLatency, useApiLatencyTracker } from '@/hooks/useApiLatency';
import { cn } from '@/lib/utils';
import { Zap, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// ─── Latency color coding ──────────────────────────────────────────

function getLatencyColor(ms: number): string {
  if (ms < 200) return 'text-emerald-500';
  if (ms < 500) return 'text-amber-500';
  if (ms < 1000) return 'text-orange-500';
  return 'text-red-500';
}

function getLatencyBg(ms: number): string {
  if (ms < 200) return 'bg-emerald-500/10 border-emerald-500/20';
  if (ms < 500) return 'bg-amber-500/10 border-amber-500/20';
  if (ms < 1000) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getLatencyLabel(ms: number): string {
  if (ms < 100) return 'Excellent';
  if (ms < 200) return 'Rapide';
  if (ms < 500) return 'Correct';
  if (ms < 1000) return 'Lent';
  return 'Très lent';
}

function getBarColor(ms: number): string {
  if (ms < 200) return 'bg-emerald-500';
  if (ms < 500) return 'bg-amber-500';
  if (ms < 1000) return 'bg-orange-500';
  return 'bg-red-500';
}

function getGlowColor(ms: number): string {
  if (ms < 200) return 'shadow-emerald-500/20';
  if (ms < 500) return 'shadow-amber-500/20';
  if (ms < 1000) return 'shadow-orange-500/20';
  return 'shadow-red-500/20';
}

// ─── Animated Pulse Dot ────────────────────────────────────────────

function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--maroon)] opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--maroon)]" />
    </span>
  );
}

// ─── Top Progress Bar (NProgress-style) ────────────────────────────

function ApiProgressBar() {
  const { isAnyLoading, lastDuration, activeCalls } = useApiLatency();

  return (
    <AnimatePresence>
      {isAnyLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background track */}
          <div className="absolute inset-0 bg-muted/30" />

          {/* Animated gradient bar */}
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 shadow-lg',
              lastDuration && lastDuration < 200
                ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400'
                : lastDuration && lastDuration < 500
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-[var(--gold)] via-[var(--maroon)] to-[var(--gold)]'
            )}
            initial={{ width: '0%' }}
            animate={{
              width: ['0%', '30%', '60%', '85%'],
              transition: {
                duration: 3,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'reverse',
              },
            }}
            style={{
              boxShadow: '0 0 12px var(--gold), 0 0 4px var(--maroon)',
            }}
          />

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ['-80px', '100vw'] }}
            transition={{
              duration: 1.2,
              ease: 'linear',
              repeat: Infinity,
              repeatDelay: 0.3,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Latency Badge (mini indicator) ────────────────────────────────

function LatencyBadge() {
  const { lastDuration, isAnyLoading, activeCalls } = useApiLatency();

  return (
    <AnimatePresence mode="wait">
      {isAnyLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--maroon)]/10 border border-[var(--maroon)]/20"
        >
          <PulseDot />
          <span className="text-xs font-medium text-[var(--maroon)] tabular-nums">
            {activeCalls} requête{activeCalls > 1 ? 's' : ''}
          </span>
        </motion.div>
      ) : lastDuration !== null ? (
        <motion.div
          key={`done-${lastDuration}`}
          initial={{ opacity: 0, scale: 0.9, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
            getLatencyBg(lastDuration)
          )}
        >
          <Zap className={cn('h-3 w-3', getLatencyColor(lastDuration))} />
          <span className={cn('text-xs font-semibold tabular-nums', getLatencyColor(lastDuration))}>
            {lastDuration}ms
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Expanded Latency Panel ────────────────────────────────────────

function LatencyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stats = useApiLatency();

  if (!open) return null;

  const maxDur = Math.max(
    100,
    ...stats.recentCalls
      .filter((c) => c.duration !== undefined)
      .map((c) => c.duration as number)
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className={cn(
            'absolute top-full right-0 mt-2 w-80 rounded-xl border bg-background/95 backdrop-blur-xl',
            'shadow-xl shadow-black/10 border-border/50 overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--gold)]" />
                Moniteur API
              </h3>
              <button
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-px bg-border/50">
            {[
              {
                label: 'Moyenne',
                value: stats.averageDuration !== null ? `${stats.averageDuration}ms` : '—',
                color: stats.averageDuration !== null ? getLatencyColor(stats.averageDuration) : 'text-muted-foreground',
              },
              {
                label: 'Min',
                value: stats.minDuration !== null ? `${stats.minDuration}ms` : '—',
                color: stats.minDuration !== null ? getLatencyColor(stats.minDuration) : 'text-muted-foreground',
              },
              {
                label: 'Max',
                value: stats.maxDuration !== null ? `${stats.maxDuration}ms` : '—',
                color: stats.maxDuration !== null ? getLatencyColor(stats.maxDuration) : 'text-muted-foreground',
              },
            ].map((item) => (
              <div key={item.label} className="bg-background px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {item.label}
                </p>
                <p className={cn('text-sm font-bold tabular-nums mt-0.5', item.color)}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Recent calls */}
          <div className="px-4 py-3 max-h-64 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Appels récents
            </p>
            <AnimatePresence initial={false}>
              {stats.recentCalls.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Aucun appel API détecté
                </p>
              ) : (
                stats.recentCalls.map((call) => {
                  const isActive = !call.endTime;
                  const dur = call.duration ?? 0;
                  const barWidth = maxDur > 0 ? Math.max(4, (dur / maxDur) * 100) : 0;

                  return (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0"
                    >
                      {/* Method badge */}
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0',
                          call.method === 'GET'
                            ? 'bg-blue-500/10 text-blue-600'
                            : call.method === 'POST'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : call.method === 'PUT'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-red-500/10 text-red-600'
                        )}
                      >
                        {call.method}
                      </span>

                      {/* URL */}
                      <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                        {call.url}
                      </span>

                      {/* Duration bar + label */}
                      {isActive ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full bg-[var(--gold)] rounded-full"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{
                                duration: 1,
                                ease: 'linear',
                                repeat: Infinity,
                              }}
                              style={{ width: '40%' }}
                            />
                          </div>
                          <span className="text-[10px] text-[var(--maroon)] font-medium tabular-nums w-8 text-right">
                            {'...'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={cn(
                                'h-full rounded-full',
                                getBarColor(dur)
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                          </div>
                          <span className={cn('text-[10px] font-semibold tabular-nums w-10 text-right', getLatencyColor(dur))}>
                            {dur}ms
                          </span>
                        </div>
                      )}

                      {/* Status dot */}
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          isActive
                            ? 'bg-[var(--gold)] animate-pulse'
                            : call.ok
                              ? 'bg-emerald-500'
                              : 'bg-red-500'
                        )}
                      />
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              {stats.totalCalls} appels effectués · Qualité :{' '}
              <span className={cn('font-semibold', stats.lastDuration !== null ? getLatencyColor(stats.lastDuration) : '')}>
                {stats.lastDuration !== null ? getLatencyLabel(stats.lastDuration) : '—'}
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Content Loading Overlay ──────────────────────────────────────

function ContentLoadingOverlay() {
  const { isAnyLoading, activeCalls, lastDuration } = useApiLatency();
  const [showOverlay, setShowOverlay] = useState(false);
  const loadingStartRef = useRef<number>(0);

  useEffect(() => {
    if (isAnyLoading) {
      loadingStartRef.current = Date.now();
      // Only show overlay after 800ms of sustained loading (avoids flicker for fast calls)
      const timer = setTimeout(() => setShowOverlay(true), 800);
      return () => clearTimeout(timer);
    } else {
      // Keep overlay visible for at least 300ms to avoid flash
      const elapsed = Date.now() - loadingStartRef.current;
      const delay = elapsed > 800 ? 300 : 0;
      const timer = setTimeout(() => setShowOverlay(false), delay);
      return () => clearTimeout(timer);
    }
  }, [isAnyLoading]);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          {/* Subtle backdrop pulse */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[var(--maroon)]/[0.02] via-transparent to-[var(--gold)]/[0.02]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Floating loader pill */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn(
                'flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl shadow-black/10',
                'bg-card/90 backdrop-blur-xl border-border/50'
              )}
            >
              {/* Spinner */}
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--maroon)]" />
              </div>

              {/* Text */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  Chargement en cours…
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {activeCalls} requête{activeCalls > 1 ? 's' : ''} active{activeCalls > 1 ? 's' : ''}
                </span>
              </div>

              {/* Animated dots */}
              <div className="flex items-center gap-1 ml-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top-right mini timer */}
          <div className="absolute top-16 right-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 shadow-lg"
            >
              <ContentTimer isActive={isAnyLoading} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Live Timer for content overlay ────────────────────────────────

function ContentTimer({ isActive }: { isActive: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const displayElapsed = isActive ? elapsed : 0;

  const seconds = (displayElapsed / 1000).toFixed(1);
  const colorClass = displayElapsed < 2000 ? 'text-emerald-500' : displayElapsed < 5000 ? 'text-amber-500' : 'text-red-500';

  return (
    <span className={cn('text-xs font-mono font-semibold tabular-nums', colorClass)}>
      {seconds}s
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────

/**
 * ApiLoader — Modern API latency tracker & visual indicator.
 *
 * Features:
 *   - Top progress bar (NProgress-style with gradient + shimmer)
 *   - Latency badge in header showing last call duration
 *   - Expandable panel with real-time call monitoring
 *   - Color-coded latency: green (<200ms), yellow (<500ms), orange (<1s), red (1s+)
 *
 * Usage: Just add <ApiLoader /> in the AppShell header area.
 */
export function ApiLoader() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { isAnyLoading } = useApiLatency();

  return (
    <>
      {/* Global fetch interceptor — install once */}
      <ApiLatencyInterceptor />

      {/* Top progress bar */}
      <ApiProgressBar />

      {/* Content-area loading overlay */}
      <ContentLoadingOverlay />

      {/* Badge + Panel toggle */}
      <div className="relative">
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          onMouseEnter={() => isAnyLoading || setPanelOpen(true)}
          className={cn(
            'flex items-center gap-1 rounded-full transition-all duration-200',
            panelOpen && 'ring-2 ring-[var(--gold)]/30 ring-offset-1 ring-offset-background'
          )}
        >
          <LatencyBadge />
          <ChevronDown
            className={cn(
              'h-3 w-3 text-muted-foreground transition-transform duration-200',
              panelOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Expanded panel */}
        <LatencyPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      </div>
    </>
  );
}

// ─── Internal: Fetch interceptor installer ─────────────────────────

function ApiLatencyInterceptor() {
  useApiLatencyTracker();
  return null;
}
