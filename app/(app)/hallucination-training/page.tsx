'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HallucinationTrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startTraining() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hallucination-training/session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      router.push(`/hallucination-training/${data.scenarioId}?session=${data.sessionId}`);
    } catch (err) {
      setError('Could not start hallucination training session. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Hallucination Spotter</h1>
          <p className="page-subtitle">
            Can you detect when AI goes rogue? 50% of the scenarios here will contain intentional hallucinations. 
          </p>
        </div>
        <button
          className="btn-primary start-btn"
          onClick={startTraining}
          disabled={loading}
          id="start-training-btn"
        >
          {loading ? (
            <><span className="spinner-sm" /> Generating scenario…</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Session</>
          )}
        </button>
      </div>

      {error && (
        <div className="error-banner animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Explainer */}
      <div className="adaptive-banner animate-fade-in-up stagger-1">
        <div className="adaptive-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <p className="adaptive-title">How it works</p>
          <p className="adaptive-desc">
            You will be presented with simulated security alerts or emails. Your job is to carefully read them and look for 
            <strong> blatantly false, impossible, or contradictory statements</strong> (e.g., impossible dates, non-existent physics, 
            or fake company policies). If you spot one, click the "Report Incorrect" button in the toolbar to verify your suspicion!
          </p>
        </div>
      </div>

      <style>{`
        .page-container { padding: 2.5rem 3rem; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 768px) { .page-container { padding: 1.5rem; } }
        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2.5rem; gap:1rem; flex-wrap:wrap; }
        .page-title { font-size:2rem; font-weight:700; color:var(--text-primary); margin:0; letter-spacing: -0.03em; }
        .page-subtitle { font-size:1rem; color:var(--text-secondary); margin:0.25rem 0 0; max-width:500px; }
        .start-btn { display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; white-space:nowrap; }
        .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .error-banner { display:flex; align-items:center; gap:0.5rem; padding:0.875rem 1rem; background:var(--color-danger-10); border:1px solid var(--color-danger-20); border-radius:var(--radius-md); color:var(--color-danger); font-size:0.875rem; margin-bottom:1.5rem; box-shadow: var(--shadow-card); }
        .adaptive-banner { background:var(--bg-card); padding:1.5rem; display:flex; gap:1rem; align-items:flex-start; margin-bottom:2rem; border:1px solid var(--border-default); border-radius:var(--radius-lg); box-shadow: var(--shadow-card); }
        .adaptive-icon { width:48px; height:48px; background:var(--bg-surface); border:1px solid var(--border-default); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--color-warning); }
        .adaptive-title { font-size:0.875rem; font-weight:600; color:var(--text-primary); margin:0 0 0.25rem; }
        .adaptive-desc { font-size:0.875rem; color:var(--text-secondary); margin:0; line-height:1.5; }
      `}</style>
    </div>
  );
}
