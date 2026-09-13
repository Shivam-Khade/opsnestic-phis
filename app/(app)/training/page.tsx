'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = [
  { icon: '🔑', name: 'Password Reset',    desc: 'Fake urgency to steal credentials', color: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
  { icon: '👔', name: 'HR Communications', desc: 'Policy changes, payroll phishing',   color: 'rgba(79,70,229,0.06)', border: 'rgba(79,70,229,0.15)' },
  { icon: '🧾', name: 'Invoice Fraud',     desc: 'Fake billing and payment requests',  color: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  { icon: '📄', name: 'Shared Documents',  desc: 'Malicious file sharing links',       color: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.15)' },
  { icon: '🔔', name: 'Account Alerts',    desc: 'Suspicious activity warnings',       color: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.15)' },
  { icon: '💻', name: 'IT Support',        desc: 'Credential harvesting via IT',       color: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.15)' },
  { icon: '🎭', name: 'Social Engineering',desc: 'Authority and trust exploitation',   color: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
];

export default function TrainingPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);

  async function startTraining() {
    setLoading(true);
    try {
      const res = await fetch('/api/training/session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      router.push(`/training/${data.scenarioId}?session=${data.sessionId}`);
    } catch {
      toastError('Could not start session', 'Failed to start training session. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem', letterSpacing: '-0.025em' }}>
            Training <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Inbox</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>
            The adaptive engine serves scenarios personalized to your skill gaps.
          </p>
        </div>
        <button className="btn-primary" id="start-training-btn" onClick={startTraining} disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Generating…
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Start Session
            </span>
          )}
        </button>
      </div>

      {/* Adaptive engine banner */}
      <div className="glass-card animate-fade-in-up stagger-1" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', borderLeft: '3px solid var(--accent-primary)' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-primary-10)', border: '1px solid var(--accent-primary-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>Adaptive Learning Engine</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Every scenario is selected based on your performance history. If you struggle with urgency-based attacks,
            you&apos;ll see more of them — at the right difficulty — until your accuracy improves.
          </p>
        </div>
      </div>

      {/* Category cards */}
      <div className="animate-fade-in-up stagger-2">
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Training Categories
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {CATEGORIES.map((cat, i) => (
            <div key={cat.name}
              className={`glass-card glass-card-hover animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
              style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: cat.color, borderColor: cat.border, cursor: 'default' }}>
              <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{cat.icon}</div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{cat.name}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="padding: 2.5rem 3rem"] { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
