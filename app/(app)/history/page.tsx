import { auth } from '@/lib/auth';
import { getTrainingHistory } from '@/lib/services/training.service';
import type { Metadata } from 'next';
import HistoryClient from './HistoryClient';

export const metadata: Metadata = { title: 'Training History' };

export default async function HistoryPage() {
  const session = await auth();
  const userId = Number(session!.user!.id);
  const history = await getTrainingHistory(userId, 50);

  const correct = history.filter((h) => h.is_correct).length;
  const incorrect = history.filter((h) => !h.is_correct).length;

  return (
    <div style={{ padding: '2.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem', letterSpacing: '-0.025em' }}>
            Training <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>History</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>Your last 50 training attempts</p>
        </div>

        {/* Quick stats pills */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-glass)', borderRadius: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{history.length}</span>
            <span style={{ color: 'var(--text-muted)' }}>attempts</span>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{correct}</span>
            <span style={{ color: 'var(--text-muted)' }}>correct</span>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
            <span style={{ fontWeight: 700, color: '#ef4444' }}>{incorrect}</span>
            <span style={{ color: 'var(--text-muted)' }}>incorrect</span>
          </div>
        </div>
      </div>

      <HistoryClient history={history} />

      <style>{`
        @media (max-width: 768px) {
          div[style*="padding: 2.5rem 3rem"] { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
