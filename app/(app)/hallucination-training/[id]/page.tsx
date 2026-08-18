'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

interface Indicator {
  indicator_type: string;
  description: string;
}

interface Scenario {
  id: number;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  category_name: string;
  category_slug: string;
  difficulty_name: string;
  difficulty_slug: string;
  indicators: Indicator[];
}

interface AttemptResult {
  isCorrect: boolean;
  score: number;
  explanation: string;
  indicators: Array<{ type: string; present: boolean; description: string }>;
}

const INDICATOR_LABELS: Record<string, string> = {
  urgency_language: '⚡ Urgency Language',
  domain_mismatch: '🌐 Domain Mismatch',
  generic_greeting: '👤 Generic Greeting',
  suspicious_link: '🔗 Suspicious Link',
  attachment_warning: '📎 Suspicious Attachment',
  authority_exploitation: '🎖 Authority Exploitation',
  poor_grammar: '✏️ Poor Grammar/Spelling',
  impersonation: '🎭 Impersonation',
  reward_promise: '🎁 Reward Promise',
  credential_request: '🔑 Credential Request',
};

import { Suspense } from 'react';

function TrainingScenarioContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const scenarioId = params.id as string;
  const sessionId = searchParams.get('session');

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [submitted, setSubmitting] = useState(false);
  // Re-use submitted/result for the hallucination result
  const [result, setResult] = useState<{isCorrect: boolean, explanation: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);

  useEffect(() => {
    fetch(`/api/scenarios/${scenarioId}`)
      .then((r) => r.json())
      .then((data) => { setScenario(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [scenarioId]);

  const toggleIndicator = (type: string) => {
    setSelectedIndicators((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  async function makeDecision(decision: 'hallucinated' | 'real') {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/training/report-hallucination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: Number(sessionId),
          scenarioId: Number(scenarioId),
        }),
      });
      const data = await res.json();
      const isCorrect = (decision === 'hallucinated' && data.wasHallucinated) || (decision === 'real' && !data.wasHallucinated);
      setResult({
        isCorrect,
        explanation: data.wasHallucinated 
          ? 'This email contains a deliberate AI hallucination (impossible facts, contradictory details, etc).' 
          : 'This is a real scenario with no hallucinations.'
      });
      setSubmitting(true); // set submitted
    } catch {
      setIsSubmitting(false);
    }
  }

  async function nextScenario() {
    setLoading(true);
    setSubmitting(false);
    setResult(null);
    setShowHeaders(false);

    try {
      const res = await fetch('/api/hallucination-training/session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      router.push(`/hallucination-training/${data.scenarioId}?session=${data.sessionId}`);
    } catch {
      setLoading(false);
    }
  }

  if (loading) return <TrainingLoader />;
  if (!scenario) return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Scenario not found.</div>;

  const difficultyColor: Record<string, string> = {
    beginner: 'var(--color-success)',
    intermediate: 'var(--color-warning)',
    advanced: 'var(--color-danger)',
  };

  return (
    <div className="training-layout">
      {/* Left panel — email viewer */}
      <div className="email-panel">
        {/* Toolbar */}
        <div className="email-toolbar animate-fade-in">
          <div className="toolbar-left">
            <button className="toolbar-btn" onClick={() => router.push('/hallucination-training')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Training
            </button>
          </div>
          <div className="toolbar-badges">
            <span className="badge badge-cyan">{scenario.category_name}</span>
            <span className="badge" style={{ background: `${difficultyColor[scenario.difficulty_slug]}15`, color: difficultyColor[scenario.difficulty_slug], border: `1px solid ${difficultyColor[scenario.difficulty_slug]}30` }}>
              {scenario.difficulty_name}
            </span>
          </div>
        </div>

        {/* Email header */}
        <div className="email-header animate-fade-in-up">
          <h1 className="email-subject">{scenario.subject}</h1>

          <button className="toggle-headers-btn" onClick={() => setShowHeaders(!showHeaders)}>
            {showHeaders ? '▾ Hide details' : '▸ Show details'}
          </button>

          {showHeaders && (
            <div className="email-headers animate-fade-in">
              <div className="header-row">
                <span className="header-key">From</span>
                <span className="header-val header-from">{scenario.sender}</span>
              </div>
              <div className="header-row">
                <span className="header-key">To</span>
                <span className="header-val">{scenario.recipient}</span>
              </div>
            </div>
          )}

          {!showHeaders && (
            <div className="email-from-preview">
              <div className="sender-avatar">{scenario.sender[0].toUpperCase()}</div>
              <div>
                <p className="sender-address">{scenario.sender}</p>
                <p className="sender-to">to {scenario.recipient}</p>
              </div>
            </div>
          )}
        </div>

        {/* Email body */}
        <div className="email-body animate-fade-in-up stagger-1">
          <div className="email-body-content">
            {scenario.body.split('\n').map((line, i) => (
              <p key={i} className="email-line">{line || '\u00A0'}</p>
            ))}
          </div>
        </div>

        {/* Submitted — show explanation */}
        {submitted && result && (
          <div className={`explanation-panel animate-slide-in-right ${result.isCorrect ? 'explanation-correct' : 'explanation-incorrect'}`}>
            <div className="explanation-header">
              <span className="explanation-verdict">
                {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </span>
            </div>

            <p className="explanation-text">{result.explanation}</p>

            <button className="btn-primary next-btn" style={{marginTop: '1.5rem'}} onClick={nextScenario}>
              Next Scenario →
            </button>
          </div>
        )}
      </div>

      {/* Right panel — decision UI */}
      {!submitted && (
        <div className="decision-panel animate-slide-in-right">
          <div className="decision-card glass-card">
            <h2 className="decision-title">Spot the Hallucination</h2>
            <p className="decision-subtitle">Does this email contain factually impossible or hallucinatory details?</p>

            <div className="decision-buttons" style={{marginTop: '2rem'}}>
              <button
                className="decision-btn decision-btn-phishing"
                onClick={() => makeDecision('hallucinated')}
                disabled={isSubmitting}
                style={{borderColor: 'var(--color-danger)', color: 'var(--color-danger)'}}
              >
                <span className="decision-icon">⚠️</span>
                <span>Hallucinated</span>
                <span className="decision-hint">It's fake/impossible</span>
              </button>
              <button
                className="decision-btn decision-btn-legitimate"
                onClick={() => makeDecision('real')}
                disabled={isSubmitting}
              >
                <span className="decision-icon">✅</span>
                <span>Real</span>
                <span className="decision-hint">No hallucinations</span>
              </button>
            </div>

            {isSubmitting && (
              <div className="submitting-overlay">
                <div className="submitting-spinner" />
                <p>Analysing your response…</p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="tips-card glass-card">
            <p className="tips-title">🔍 Things to look for</p>
            <ul className="tips-list">
              <li>Sender domain vs. claimed organisation</li>
              <li>Urgency or threatening language</li>
              <li>Generic greetings ("Dear Customer")</li>
              <li>Requests for credentials or payment</li>
              <li>Suspicious links or attachment names</li>
              <li>Grammar and spelling errors</li>
            </ul>
          </div>
        </div>
      )}

      <style jsx>{`
        .training-layout { display:grid; grid-template-columns:1fr 380px; gap:0; min-height:100vh; background:var(--bg-surface); }
        @media (max-width:1000px) { .training-layout { grid-template-columns:1fr; } }

        /* Email panel */
        .email-panel { display:flex; flex-direction:column; background:var(--bg-base); border-right:1px solid var(--border-default); box-shadow: 2px 0 8px rgba(0,0,0,0.02); z-index: 10; }
        .email-toolbar { padding:1rem 1.5rem; background:var(--bg-base); border-bottom:1px solid var(--border-default); display:flex; justify-content:space-between; align-items:center; }
        .toolbar-left { display:flex; align-items:center; gap:0.5rem; }
        .toolbar-btn { background:transparent; border:1px solid transparent; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:0.375rem; font-size:0.875rem; font-weight:500; padding:0.375rem 0.75rem; border-radius:var(--radius-sm); transition:all 0.15s; }
        .toolbar-btn:hover:not(:disabled) { color:var(--text-primary); background:var(--bg-hover); border-color:var(--border-default); }
        .toolbar-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .reported-btn-danger { color: var(--color-danger); }
        .reported-btn-success { color: var(--color-success); }
        .toolbar-badges { display:flex; gap:0.5rem; align-items:center; }
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
        .email-body { flex:1; padding:2rem; overflow-y:auto; }
        .email-body-content { max-width:640px; }
        .email-line { font-size:1rem; color:var(--text-primary); margin:0.5rem 0; line-height:1.6; }

        /* Explanation panel */
        .explanation-panel { margin:2rem; padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--border-default); background: var(--bg-surface); box-shadow: var(--shadow-card); }
        .explanation-correct { border-top: 4px solid var(--color-success); }
        .explanation-incorrect { border-top: 4px solid var(--color-danger); }
        .explanation-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
        .explanation-verdict { font-size:1.25rem; font-weight:700; letter-spacing: -0.01em; }
        .explanation-correct .explanation-verdict { color:var(--color-success); }
        .explanation-incorrect .explanation-verdict { color:var(--color-danger); }
        .explanation-score { font-size:1.125rem; font-weight:600; color:var(--text-primary); font-family:var(--font-mono); }
        .explanation-text { font-size:1rem; color:var(--text-primary); line-height:1.6; margin:0 0 1.5rem; }
        .indicators-reveal-title { font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin:0 0 1rem; }
        .indicators-list { display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem; }
        .indicator-item { display:flex; gap:1rem; padding:1rem; background:var(--bg-base); border-radius:var(--radius-md); border:1px solid var(--border-default); box-shadow: var(--shadow-card); }
        .indicator-icon { font-size:1.25rem; flex-shrink:0; }
        .indicator-type { font-size:0.875rem; font-weight:600; color:var(--text-primary); margin:0 0 0.25rem; }
        .indicator-desc { font-size:0.875rem; color:var(--text-secondary); margin:0; line-height:1.5; }
        .next-btn { width:100%; margin-top:0.5rem; }

        /* Decision panel */
        .decision-panel { padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; overflow-y:auto; background: var(--bg-surface); }
        .decision-card { padding:1.5rem; position:relative; background: var(--bg-base); border-radius: var(--radius-lg); border: 1px solid var(--border-default); box-shadow: var(--shadow-card); }
        .decision-title { font-size:1.125rem; font-weight:600; color:var(--text-primary); margin:0 0 0.25rem; letter-spacing: -0.01em; }
        .decision-subtitle { font-size:0.875rem; color:var(--text-secondary); margin:0 0 1.5rem; }
        .indicators-section { margin-bottom:1.5rem; }
        .indicators-label { font-size:0.75rem; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; margin:0 0 1rem; }
        .indicators-checkboxes { display:flex; flex-direction:column; gap:0.375rem; max-height:220px; overflow-y:auto; padding-right:0.25rem; }
        .indicator-checkbox { display:flex; align-items:center; gap:0.75rem; padding:0.625rem 0.75rem; border-radius:var(--radius-sm); cursor:pointer; font-size:0.875rem; font-weight:500; color:var(--text-secondary); transition:all 0.15s; border:1px solid var(--border-subtle); background: var(--bg-surface); }
        .indicator-checkbox:hover { background:var(--bg-hover); color:var(--text-primary); border-color: var(--border-default); }
        .indicator-checked { background:var(--bg-base); border-color:var(--accent-primary); color:var(--accent-primary); box-shadow: 0 0 0 1px var(--accent-primary); }
        .checkbox-icon { font-size:1rem; flex-shrink:0; font-family: var(--font-mono); }
        .decision-buttons { display:flex; gap:0.75rem; }
        .decision-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:1.25rem 1rem; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); transition: all 0.2s; cursor: pointer; color: var(--text-primary); }
        .decision-icon { font-size:1.5rem; }
        .decision-btn > span:nth-child(2) { font-size:0.875rem; font-weight:600; }
        .decision-hint { font-size:0.75rem; color: var(--text-muted); }
        .decision-btn-phishing:hover { background: var(--color-danger-10); border-color: var(--color-danger); color: var(--color-danger); }
        .decision-btn-legitimate:hover { background: var(--color-success-10); border-color: var(--color-success); color: var(--color-success); }
        .submitting-overlay { position:absolute; inset:0; background:rgba(255,255,255,0.9); border-radius:var(--radius-lg); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; backdrop-filter:blur(4px); z-index: 20; }
        .submitting-spinner { width:32px; height:32px; border:3px solid var(--border-default); border-top-color:var(--accent-primary); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .submitting-overlay p { color:var(--text-primary); font-size:0.875rem; font-weight: 500; }
        .tips-card { padding:1.5rem; background: var(--bg-base); border-radius: var(--radius-lg); border: 1px solid var(--border-default); box-shadow: var(--shadow-card); }
        .tips-title { font-size:0.875rem; font-weight:600; color:var(--text-primary); margin:0 0 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .tips-list { padding-left:1.5rem; margin:0; display:flex; flex-direction:column; gap:0.5rem; }
        .tips-list li { font-size:0.875rem; color:var(--text-secondary); line-height:1.5; }
      `}</style>
    </div>
  );
}

function TrainingLoader() {
  return (
    <div className="loader-container">
      <div className="loader-card glass-card">
        <div className="loader-icon animate-pulse-glow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <p className="loader-title">Generating scenario…</p>
        <p className="loader-sub">The AI is crafting a personalized training email and validating it through our security pipeline.</p>
      </div>
      <style jsx>{`
        .loader-container { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:2rem; background: var(--bg-surface); }
        .loader-card { padding:2.5rem; max-width:400px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; background: var(--bg-base); border: 1px solid var(--border-default); box-shadow: var(--shadow-card); border-radius: var(--radius-lg); }
        .loader-icon { width:48px; height:48px; background:var(--bg-surface); border:1px solid var(--border-default); border-radius:50%; display:flex; align-items:center; justify-content:center; color: var(--accent-primary); }
        .loader-title { font-size:1.125rem; font-weight:600; color:var(--text-primary); margin:0; letter-spacing: -0.01em; }
        .loader-sub { font-size:0.875rem; color:var(--text-secondary); margin:0; line-height:1.5; }
      `}</style>
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
