'use client';

import { useState } from 'react';
import { resetUserProgress } from '@/app/(app)/profile/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { RotateCcw } from 'lucide-react';

export default function ResetProgressButton() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const { success, error: toastError, dismiss } = useToast();

  function handleClickReset() {
    // Show confirm toast with action button
    const id = success('Reset training progress?', 'This action cannot be undone. Click "Confirm" to proceed.');
    // Show a confirm toast manually using the base toast function
    setConfirming(true);
    // We simulate a confirm workflow with an action toast
    const confirmId = (window as any)._toastConfirmId;
    if (confirmId) dismiss(confirmId);
  }

  async function handleConfirmReset() {
    setConfirming(false);
    setLoading(true);
    try {
      await resetUserProgress();
      success('Progress reset', 'All training data has been cleared successfully.');
      router.refresh();
    } catch {
      toastError('Reset failed', 'Could not reset your progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Are you sure?</span>
        <button
          onClick={handleConfirmReset}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: '#fff', background: 'var(--color-danger)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
        >
          {loading ? 'Resetting…' : 'Yes, Reset'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClickReset}
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--color-danger)';
        (e.currentTarget as HTMLElement).style.color = '#fff';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
        (e.currentTarget as HTMLElement).style.color = 'var(--color-danger)';
      }}
    >
      <RotateCcw size={13} />
      {loading ? 'Resetting…' : 'Reset Progress'}
    </button>
  );
}
