'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

export default function HistoryClient({ history }: { history: any[] }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [scenarioDetails, setScenarioDetails] = useState<any | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const { error: toastError } = useToast();

  const diffColors: Record<string, string> = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' };

  const openScenario = async (scenarioId: number) => {
    setSelectedScenarioId(scenarioId);
    setLoadingScenario(true);
    setScenarioDetails(null);
    setShowHeaders(false);
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`);
      if (res.ok) setScenarioDetails(await res.json());
      else toastError('Failed to load scenario', 'Could not fetch this scenario. Please try again.');
    } catch {
      toastError('Network error', 'Could not connect to server.');
    } finally {
      setLoadingScenario(false);
    }
  };

  const closeModal = () => { setSelectedScenarioId(null); setScenarioDetails(null); };

  return (
    <>
      {history.length === 0 ? (
        <div className="glass-card animate-fade-in-up" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '3rem' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
            No training history yet. Start a session to begin!
          </p>
        </div>
      ) : (
        <div className="glass-card animate-fade-in-up stagger-1" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  {['Subject', 'Category', 'Difficulty', 'Type', 'Your Call', 'Result', 'Score', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((attempt, i) => (
                  <tr key={attempt.id}
                    className={`animate-fade-in-up stagger-${Math.min((i % 5) + 1, 5)}`}
                    onClick={() => openScenario(attempt.scenario_id)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-primary)', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attempt.subject}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><span className="badge badge-cyan">{attempt.category_name}</span></td>
                    <td style={{ padding: '0.875rem 1rem' }}><span className="badge badge-violet">{attempt.difficulty_name}</span></td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {attempt.is_phishing
                        ? <span className="badge badge-danger">Phishing</span>
                        : <span className="badge badge-success">Legit</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{attempt.user_decision}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {attempt.is_correct
                        ? <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#10b981' }}>✓ Correct</span>
                        : <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444' }}>✗ Incorrect</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 700 }}>{attempt.score}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(attempt.responded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedScenarioId && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-base)', borderRadius: '20px', width: '100%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>

            {/* Close btn */}
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-hover)', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-danger-10)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-danger)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              <X size={14} />
            </button>

            {loadingScenario ? (
              <div style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ margin: 0 }}>Loading scenario...</p>
              </div>
            ) : scenarioDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                {/* Toolbar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '4rem', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scenario Record</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-cyan">{scenarioDetails.category_name}</span>
                    {(() => { const dc = diffColors[scenarioDetails.difficulty_slug] ?? '#4f46e5'; return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: `${dc}18`, color: dc, border: `1px solid ${dc}30` }}>{scenarioDetails.difficulty_name}</span>; })()}
                  </div>
                </div>

                {/* Email header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.875rem', lineHeight: 1.35, letterSpacing: '-0.02em' }}>{scenarioDetails.subject}</h1>
                  <button onClick={() => setShowHeaders(!showHeaders)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginBottom: '0.875rem' }}>
                    {showHeaders ? <><ChevronDown size={12} /> Hide details</> : <><ChevronRight size={12} /> Show details</>}
                  </button>
                  {showHeaders ? (
                    <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[['From', scenarioDetails.sender], ['To', scenarioDetails.recipient]].map(([key, val]) => (
                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '55px 1fr', gap: '0.75rem', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</span>
                          <span style={{ fontSize: '0.875rem', color: key === 'From' ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', fontWeight: key === 'From' ? 600 : 400 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {scenarioDetails.sender[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, fontFamily: 'var(--font-mono)' }}>{scenarioDetails.sender}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>to {scenarioDetails.recipient}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email body */}
                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                  <div style={{ maxWidth: '640px' }}>
                    {scenarioDetails.body.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0.5rem 0', lineHeight: 1.7 }}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-danger)' }}>
                <p>Failed to load scenario.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
