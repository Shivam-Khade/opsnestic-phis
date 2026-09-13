'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = opts.duration ?? 4500;
    setToasts((prev) => [...prev, { ...opts, id }]);
    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
    return id;
  }, [dismiss]);

  const success  = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error    = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message, duration: 6000 }), [toast]);
  const warning  = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info     = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast]);
  const dismissAll = useCallback(() => { setToasts([]); timers.current.forEach(clearTimeout); timers.current.clear(); }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
  if (type === 'error') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
  if (type === 'warning') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
    success: { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  icon: '#10b981', bar: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: '#ef4444', bar: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: '#f59e0b', bar: '#f59e0b' },
    info:    { bg: 'rgba(79,70,229,0.08)',   border: 'rgba(79,70,229,0.25)',   icon: '#4f46e5', bar: '#4f46e5' },
  };
  const c = colors[t.type];

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'flex-start',
        padding: '1rem 1rem 1rem 1rem',
        background: 'var(--toast-bg, rgba(255,255,255,0.92))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.bar}`,
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        animation: 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        width: '360px',
        maxWidth: '90vw',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle tinted bg */}
      <div style={{ position: 'absolute', inset: 0, background: c.bg, borderRadius: '12px', pointerEvents: 'none' }} />

      {/* Icon */}
      <div style={{ color: c.icon, flexShrink: 0, marginTop: '1px', position: 'relative' }}>
        <ToastIcon type={t.type} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--toast-title, #0f172a)', lineHeight: 1.4 }}>{t.title}</p>
        {t.message && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--toast-msg, #475569)', lineHeight: 1.5 }}>{t.message}</p>}
        {t.action && (
          <button
            onClick={() => { t.action!.onClick(); onDismiss(t.id); }}
            style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: c.icon, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            {t.action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(t.id)}
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--toast-dismiss, #94a3b8)', padding: '2px', position: 'relative', lineHeight: 1, borderRadius: '4px', transition: 'color 0.15s' }}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Container ─────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .dark { --toast-bg: rgba(15,23,42,0.92); --toast-title: #f1f5f9; --toast-msg: #94a3b8; --toast-dismiss: #64748b; }
      `}</style>
    </>
  );
}
