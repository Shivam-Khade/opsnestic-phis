'use client';

import { useState } from 'react';
import { resetUserProgress } from '@/app/(app)/profile/actions';
import { useRouter } from 'next/navigation';

export default function ResetProgressButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!confirm('Are you sure you want to completely reset your training progress? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await resetUserProgress();
      router.refresh(); // Refresh the page to show empty state
    } catch (err) {
      console.error(err);
      alert('Failed to reset progress');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="reset-btn"
      title="Reset all training progress"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      {loading ? 'Resetting...' : 'Reset Progress'}

      <style jsx>{`
        .reset-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-danger);
          background: var(--color-danger-10);
          border: 1px solid rgba(225, 29, 72, 0.2);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .reset-btn:hover:not(:disabled) {
          background: var(--color-danger);
          color: #ffffff;
        }
        .reset-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </button>
  );
}
