import { auth } from '@/lib/auth';
import { getTrainingHistory } from '@/lib/services/training.service';
import type { Metadata } from 'next';
import HistoryClient from './HistoryClient';

export const metadata: Metadata = { title: 'Training History' };

export default async function HistoryPage() {
  const session = await auth();
  const userId = Number(session!.user!.id);
  const history = await getTrainingHistory(userId, 50);

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Training History</h1>
          <p className="page-subtitle">Your last 50 training attempts</p>
        </div>
        <div className="history-stats">
          <span className="hs-item">
            <span className="hs-val">{history.length}</span> attempts
          </span>
          <span className="hs-item">
            <span className="hs-val" style={{ color: 'var(--color-success)' }}>
              {history.filter((h) => h.is_correct).length}
            </span> correct
          </span>
          <span className="hs-item">
            <span className="hs-val" style={{ color: 'var(--color-danger)' }}>
              {history.filter((h) => !h.is_correct).length}
            </span> incorrect
          </span>
        </div>
      </div>

      <HistoryClient history={history} />

      <style>{`
        .page-container { padding:2rem; max-width:1200px; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; gap:1rem; flex-wrap:wrap; }
        .page-title { font-size:1.75rem; font-weight:800; margin:0; }
        .page-subtitle { font-size:0.875rem; color:var(--text-secondary); margin:0.25rem 0 0; }
        .history-stats { display:flex; gap:1.5rem; }
        .hs-item { font-size:0.85rem; color:var(--text-secondary); }
        .hs-val { font-weight:800; font-size:1rem; color:var(--text-primary); }
      `}</style>
    </div>
  );
}
