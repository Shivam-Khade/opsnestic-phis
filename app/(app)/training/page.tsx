'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Metadata } from 'next';

export default function TrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startTraining() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/training/session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      router.push(`/training/${data.scenarioId}?session=${data.sessionId}`);
    } catch (err) {
      setError('Could not start training session. Please try again.');
      setLoading(false);
    }
  }

  const CATEGORIES = [
    { icon: '🔑', name: 'Password Reset', desc: 'Fake urgency to steal credentials' },
    { icon: '👔', name: 'HR Communications', desc: 'Policy changes, payroll phishing' },
    { icon: '🧾', name: 'Invoice Fraud', desc: 'Fake billing and payment requests' },
    { icon: '📄', name: 'Shared Documents', desc: 'Malicious file sharing links' },
    { icon: '🔔', name: 'Account Alerts', desc: 'Suspicious activity warnings' },
    { icon: '💻', name: 'IT Support', desc: 'Credential harvesting via IT' },
    { icon: '🎭', name: 'Social Engineering', desc: 'Authority and trust exploitation' },
  ];

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Training Inbox</h1>
          <p className="page-subtitle">
            The adaptive engine will serve a scenario personalized to your skill gaps.
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

      {/* Adaptive engine explainer */}
      <div className="adaptive-banner animate-fade-in-up stagger-1">
        <div className="adaptive-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
        </div>
        <div>
          <p className="adaptive-title">Adaptive Learning Engine</p>
          <p className="adaptive-desc">
            Every scenario is selected based on your performance history. If you struggle with
            urgency-based attacks, you&apos;ll see more of them — at the right difficulty — until
            your accuracy improves. Your training path is unique to you.
          </p>
        </div>
      </div>

      {/* Category cards */}
      <div className="animate-fade-in-up stagger-2">
        <p className="section-label">Training Categories</p>
        <div className="category-grid">
          {CATEGORIES.map((cat, i) => (
            <div key={cat.name} className={`category-card glass-card glass-card-hover animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}>
              <span className="cat-icon">{cat.icon}</span>
              <div>
                <p className="cat-name">{cat.name}</p>
                <p className="cat-desc">{cat.desc}</p>
              </div>
            </div>
          ))}
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
        .adaptive-icon { width:48px; height:48px; background:var(--bg-surface); border:1px solid var(--border-default); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--text-primary); }
        .adaptive-title { font-size:0.875rem; font-weight:600; color:var(--text-primary); margin:0 0 0.25rem; }
        .adaptive-desc { font-size:0.875rem; color:var(--text-secondary); margin:0; line-height:1.5; }
        .section-label { font-size:0.75rem; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:var(--text-secondary); margin-bottom:1rem; }
        .category-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1.5rem; }
        .category-card { padding:1.5rem; display:flex; align-items:center; gap:1rem; cursor:default; }
        .cat-icon { font-size:1.75rem; flex-shrink:0; }
        .cat-name { font-size:0.875rem; font-weight:600; color:var(--text-primary); margin:0 0 0.25rem; }
        .cat-desc { font-size:0.875rem; color:var(--text-secondary); margin:0; }
      `}</style>
    </div>
  );
}
