'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryClient({ history }: { history: any[] }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [scenarioDetails, setScenarioDetails] = useState<any | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  const difficultyColor: Record<string, string> = {
    beginner: 'var(--color-success)',
    intermediate: 'var(--color-warning)',
    advanced: 'var(--color-danger)',
  };

  const openScenario = async (scenarioId: number) => {
    setSelectedScenarioId(scenarioId);
    setLoadingScenario(true);
    setScenarioDetails(null);
    setShowHeaders(false);
    
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`);
      if (res.ok) {
        const data = await res.json();
        setScenarioDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScenario(false);
    }
  };

  const closeModal = () => {
    setSelectedScenarioId(null);
    setScenarioDetails(null);
  };

  return (
    <>
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
                <tr 
                  key={attempt.id} 
                  className={`animate-fade-in-up stagger-${Math.min((i % 5) + 1, 5)}`}
                  onClick={() => openScenario(attempt.scenario_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="subject-cell">{attempt.subject}</td>
                  <td><span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{attempt.category_name}</span></td>
                  <td><span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>{attempt.difficulty_name}</span></td>
                  <td>
                    {attempt.is_phishing
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

      {selectedScenarioId && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            {loadingScenario ? (
              <div className="modal-loader">
                <div className="spinner-sm" style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-primary)' }}></div>
                <p>Loading scenario...</p>
              </div>
            ) : scenarioDetails ? (
              <div className="email-panel">
                <div className="email-toolbar">
                  <div className="toolbar-left">
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scenario Record</span>
                  </div>
                  <div className="toolbar-badges">
                    <span className="badge badge-cyan">{scenarioDetails.category_name}</span>
                    <span className="badge" style={{ 
                        background: `${difficultyColor[scenarioDetails.difficulty_slug]}15`, 
                        color: difficultyColor[scenarioDetails.difficulty_slug], 
                        border: `1px solid ${difficultyColor[scenarioDetails.difficulty_slug]}30` 
                      }}>
                      {scenarioDetails.difficulty_name}
                    </span>
                  </div>
                </div>

                <div className="email-header">
                  <h1 className="email-subject">{scenarioDetails.subject}</h1>
                  <button className="toggle-headers-btn" onClick={() => setShowHeaders(!showHeaders)}>
                    {showHeaders ? '▾ Hide details' : '▸ Show details'}
                  </button>

                  {showHeaders && (
                    <div className="email-headers">
                      <div className="header-row">
                        <span className="header-key">From</span>
                        <span className="header-val header-from">{scenarioDetails.sender}</span>
                      </div>
                      <div className="header-row">
                        <span className="header-key">To</span>
                        <span className="header-val">{scenarioDetails.recipient}</span>
                      </div>
                    </div>
                  )}

                  {!showHeaders && (
                    <div className="email-from-preview">
                      <div className="sender-avatar">{scenarioDetails.sender[0].toUpperCase()}</div>
                      <div>
                        <p className="sender-address">{scenarioDetails.sender}</p>
                        <p className="sender-to">to {scenarioDetails.recipient}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="email-body">
                  <div className="email-body-content">
                    {scenarioDetails.body.split('\n').map((line: string, i: number) => (
                      <p key={i} className="email-line">{line || '\u00A0'}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="modal-error">
                <p>Failed to load scenario.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .empty-state { padding:4rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .history-table-wrapper { overflow-x:auto; border-radius:var(--radius-lg); }
        .history-table { width:100%; border-collapse:collapse; }
        .history-table th { padding:0.875rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); border-bottom:1px solid var(--border-subtle); white-space:nowrap; }
        .history-table td { padding:0.875rem 1rem; border-bottom:1px solid var(--border-subtle); vertical-align:middle; transition: background 0.15s; }
        .history-table tr:last-child td { border-bottom:none; }
        .history-table tr:hover td { background:var(--bg-hover); }
        .subject-cell { font-size:0.8rem; color:var(--text-primary); max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .result-correct { font-size:0.8rem; font-weight:600; color:var(--color-success); }
        .result-incorrect { font-size:0.8rem; font-weight:600; color:var(--color-danger); }

        /* Modal Styles */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 2rem; animation: fade-in 0.2s ease-out; }
        .modal-content { background: var(--bg-surface); border-radius: var(--radius-lg); width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; position: relative; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid var(--border-default); animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-close { position: absolute; top: 1rem; right: 1rem; background: var(--bg-hover); border: none; color: var(--text-secondary); width: 32px; height: 32px; border-radius: 50%; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: all 0.2s; }
        .modal-close:hover { background: var(--color-danger-10); color: var(--color-danger); }
        .modal-loader, .modal-error { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-secondary); }
        
        /* Email Panel Styles reused */
        .email-panel { display:flex; flex-direction:column; background:var(--bg-base); flex: 1; overflow-y: auto; }
        .email-toolbar { padding:1rem 1.5rem; border-bottom:1px solid var(--border-default); display:flex; justify-content:space-between; align-items:center; padding-right: 4rem; }
        .toolbar-left { display:flex; align-items:center; gap:0.5rem; }
        .toolbar-badges { display:flex; gap:0.5rem; }
        .email-header { padding:1.5rem 2rem; border-bottom:1px solid var(--border-default); }
        .email-subject { font-size:1.5rem; font-weight:600; color:var(--text-primary); margin:0 0 1rem; line-height:1.3; letter-spacing: -0.02em; }
        .toggle-headers-btn { background:transparent; border:none; color:var(--text-secondary); font-size:0.75rem; font-weight:500; cursor:pointer; padding:0; margin-bottom:1rem; transition: color 0.15s; }
        .toggle-headers-btn:hover { color:var(--accent-primary); }
        .email-headers { display:flex; flex-direction:column; gap:0.5rem; padding: 1rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-default); }
        .header-row { display:grid; grid-template-columns:60px 1fr; gap:0.75rem; align-items:baseline; }
        .header-key { font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .header-val { font-size:0.875rem; color:var(--text-secondary); font-family:var(--font-mono); word-break:break-all; }
        .header-from { color:var(--text-primary); font-weight: 500; }
        .email-from-preview { display:flex; align-items:center; gap:0.75rem; }
        .sender-avatar { width:40px; height:40px; border-radius:50%; background:var(--bg-surface); border:1px solid var(--border-default); display:flex; align-items:center; justify-content:center; font-size:0.875rem; font-weight:600; color:var(--text-primary); flex-shrink:0; }
        .sender-address { font-size:0.875rem; color:var(--text-primary); font-weight:600; margin:0; font-family:var(--font-mono); }
        .sender-to { font-size:0.75rem; color:var(--text-secondary); margin:0.125rem 0 0; }
        .email-body { padding:2rem; overflow-y:auto; }
        .email-body-content { max-width:640px; }
        .email-line { font-size:1rem; color:var(--text-primary); margin:0.5rem 0; line-height:1.6; }
        
        .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </>
  );
}
