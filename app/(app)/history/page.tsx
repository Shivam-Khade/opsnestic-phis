import { auth } from '@/lib/auth';
import { getTrainingHistory } from '@/lib/services/training.service';
import type { Metadata } from 'next';

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

      {history.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in-up">
          <div style={{ fontSize: '3rem' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No training history yet. Start a session to begin!
          </p>
        </div>
      ) : (
        <div className="history-table-wrapper glass-card animate-fade-in-up stagger-1">
          <table className="history-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Type</th>
                <th>Your Call</th>
                <th>Result</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((attempt, i) => (
                <tr key={attempt.id} className={`animate-fade-in-up stagger-${Math.min((i % 5) + 1, 5)}`}>
                  <td className="subject-cell">{(attempt as any).subject}</td>
                  <td><span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{(attempt as any).category_name}</span></td>
                  <td><span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>{(attempt as any).difficulty_name}</span></td>
                  <td>
                    {(attempt as any).is_phishing
                      ? <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Phishing</span>
                      : <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Legit</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {attempt.user_decision}
                    </span>
                  </td>
                  <td>
                    {attempt.is_correct
                      ? <span className="result-correct">✓ Correct</span>
                      : <span className="result-incorrect">✗ Incorrect</span>}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                      {attempt.score}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(attempt.responded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .page-container { padding:2rem; max-width:1200px; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; gap:1rem; flex-wrap:wrap; }
        .page-title { font-size:1.75rem; font-weight:800; margin:0; }
        .page-subtitle { font-size:0.875rem; color:var(--text-secondary); margin:0.25rem 0 0; }
        .history-stats { display:flex; gap:1.5rem; }
        .hs-item { font-size:0.85rem; color:var(--text-secondary); }
        .hs-val { font-weight:800; font-size:1rem; color:var(--text-primary); }
        .empty-state { padding:4rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .history-table-wrapper { overflow-x:auto; border-radius:var(--radius-lg); }
        .history-table { width:100%; border-collapse:collapse; }
        .history-table th { padding:0.875rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); border-bottom:1px solid var(--border-subtle); white-space:nowrap; }
        .history-table td { padding:0.875rem 1rem; border-bottom:1px solid var(--border-subtle); vertical-align:middle; }
        .history-table tr:last-child td { border-bottom:none; }
        .history-table tr:hover td { background:var(--bg-hover); }
        .subject-cell { font-size:0.8rem; color:var(--text-primary); max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .result-correct { font-size:0.8rem; font-weight:600; color:var(--color-success); }
        .result-incorrect { font-size:0.8rem; font-weight:600; color:var(--color-danger); }
      `}</style>
    </div>
  );
}
