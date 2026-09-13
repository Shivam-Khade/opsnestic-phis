'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Suspense } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

interface Indicator { indicator_type: string; description: string; }
interface Scenario {
  id: number; sender: string; recipient: string; subject: string; body: string;
  category_name: string; category_slug: string; difficulty_name: string; difficulty_slug: string;
  indicators: Indicator[];
}
interface AttemptResult {
  isCorrect: boolean; score: number; explanation: string;
  indicators: Array<{ type: string; present: boolean; description: string }>;
}

const INDICATOR_LABELS: Record<string, string> = {
  urgency_language: '⚡ Urgency Language', domain_mismatch: '🌐 Domain Mismatch',
  generic_greeting: '👤 Generic Greeting', suspicious_link: '🔗 Suspicious Link',
  attachment_warning: '📎 Suspicious Attachment', authority_exploitation: '🎖 Authority Exploitation',
  poor_grammar: '✏️ Poor Grammar/Spelling', impersonation: '🎭 Impersonation',
  reward_promise: '🎁 Reward Promise', credential_request: '🔑 Credential Request',
};

function TrainingScenarioContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { error: toastError } = useToast();

  const scenarioId = params.id as string;
  const sessionId = searchParams.get('session');

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  useEffect(() => {
    fetch(`/api/scenarios/${scenarioId}`)
      .then((r) => r.json())
      .then((data) => { setScenario(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [scenarioId]);

  const toggleIndicator = (type: string) => {
    setSelectedIndicators((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  async function makeDecision(decision: 'phishing' | 'legitimate') {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/training/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: Number(sessionId), scenarioId: Number(scenarioId), userDecision: decision, indicatorsSelected: selectedIndicators }),
      });
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch {
      toastError('Submission failed', 'Could not submit your decision. Please try again.');
      setSubmitting(false);
    }
  }

  async function nextScenario() {
    setLoading(true); setSubmitted(false); setResult(null); setSelectedIndicators([]); setShowHeaders(false);
    try {
      const res = await fetch('/api/training/session', { method: 'POST' });
      const data = await res.json();
      router.push(`/training/${data.scenarioId}?session=${data.sessionId}`);
    } catch {
      setLoading(false);
    }
  }

  if (loading) return <TrainingLoader />;
  if (!scenario) return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Scenario not found.</div>;

  const diffColors: Record<string, string> = { beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' };
  const dc = diffColors[scenario.difficulty_slug] ?? 'var(--accent-primary)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', minHeight: '100vh' }}>
      {/* LEFT: Email Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', borderRight: '1px solid var(--border-glass)' }}>
        {/* Toolbar */}
        <div style={{ padding: '0.875rem 1.5rem', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => router.push('/training')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.375rem 0.5rem', borderRadius: '8px', transition: 'all 0.15s' }}>
            <ArrowLeft size={14} /> Inbox
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-cyan">{scenario.category_name}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: `${dc}18`, color: dc, border: `1px solid ${dc}30` }}>{scenario.difficulty_name}</span>
          </div>
        </div>

        {/* Email Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.875rem', lineHeight: 1.35, letterSpacing: '-0.02em' }}>{scenario.subject}</h1>
          <button onClick={() => setShowHeaders(!showHeaders)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginBottom: '0.875rem', transition: 'color 0.15s' }}>
            {showHeaders ? <><ChevronDown size={12} /> Hide details</> : <><ChevronRight size={12} /> Show details</>}
          </button>

          {showHeaders ? (
            <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[['From', scenario.sender], ['To', scenario.recipient]].map(([key, val]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '55px 1fr', gap: '0.75rem', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</span>
                  <span style={{ fontSize: '0.875rem', color: key === 'From' ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', fontWeight: key === 'From' ? 600 : 400 }}>{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {scenario.sender[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, fontFamily: 'var(--font-mono)' }}>{scenario.sender}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>to {scenario.recipient}</p>
              </div>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '640px' }}>
            {scenario.body.split('\n').map((line, i) => (
              <p key={i} style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0.5rem 0', lineHeight: 1.7 }}>{line || '\u00A0'}</p>
            ))}
          </div>
        </div>

        {/* Result panel */}
        {submitted && result && (
          <div style={{ margin: '1.5rem 2rem', padding: '1.5rem', borderRadius: '16px', background: result.isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${result.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderTop: `4px solid ${result.isCorrect ? '#10b981' : '#ef4444'}` }} className="animate-slide-in-right">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: result.isCorrect ? '#10b981' : '#ef4444' }}>
                {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>+{result.score} pts</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 1.25rem' }}>{result.explanation}</p>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 0.875rem' }}>Ground-truth indicators:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
              {result.indicators.map((ind, idx) => (
                <div key={ind.type} className="animate-indicator" style={{ animationDelay: `${0.35 + idx * 0.12}s`, display: 'flex', gap: '0.875rem', padding: '0.875rem', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ind.present ? '🔴' : '✅'}</span>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{INDICATOR_LABELS[ind.type] ?? ind.type}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{ind.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={nextScenario}>Next Scenario →</button>
          </div>
        )}
      </div>

      {/* RIGHT: Decision Panel */}
      {!submitted && (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', background: 'var(--bg-surface)' }} className="animate-slide-in-right">
          <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem', letterSpacing: '-0.01em' }}>Analyse this email</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}>Is this a phishing attempt or a legitimate email?</p>

            {/* Indicators */}
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Suspicious indicators noticed?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '210px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {Object.entries(INDICATOR_LABELS).map(([key, label]) => {
                const checked = selectedIndicators.includes(key);
                return (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8375rem', fontWeight: 500, transition: 'all 0.15s', background: checked ? 'var(--accent-primary-10)' : 'transparent', color: checked ? 'var(--accent-primary)' : 'var(--text-secondary)', border: `1px solid ${checked ? 'var(--accent-primary-20)' : 'transparent'}` }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleIndicator(key)} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{checked ? '☑' : '☐'}</span>
                    {label}
                  </label>
                );
              })}
            </div>

            {/* Decision buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="decision-btn decision-btn-phishing" onClick={() => makeDecision('phishing')} disabled={submitting} id="decide-phishing-btn">
                <span style={{ fontSize: '1.5rem' }}>🎣</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Phishing</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This is a threat</span>
              </button>
              <button className="decision-btn decision-btn-legitimate" onClick={() => makeDecision('legitimate')} disabled={submitting} id="decide-legitimate-btn">
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Legitimate</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This is safe</span>
              </button>
            </div>

            {submitting && (
              <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.875rem', zIndex: 10 }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Analysing response…</p>
              </div>
            )}
          </div>

          {/* Tips card */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔍 Things to look for</p>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['Sender domain vs. claimed organisation', 'Urgency or threatening language', 'Generic greetings ("Dear Customer")', 'Requests for credentials or payment', 'Suspicious links or attachment names', 'Grammar and spelling errors'].map((tip) => (
                <li key={tip} style={{ fontSize: '0.8375rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1000px) {
          div[style*="grid-template-columns: 1fr 390px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function TrainingLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--bg-surface)' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '380px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div className="animate-pulse-glow" style={{ width: '52px', height: '52px', background: 'var(--accent-primary-10)', border: '1px solid var(--accent-primary-20)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        </div>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Generating scenario…</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          The AI is crafting a personalized training email and validating it through our security pipeline.
        </p>
      </div>
    </div>
  );
}

export default function TrainingScenarioPage() {
  return (
    <Suspense fallback={<TrainingLoader />}>
      <TrainingScenarioContent />
    </Suspense>
  );
}
