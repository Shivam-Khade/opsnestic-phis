'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Registration failed');
      setLoading(false);
      return;
    }

    router.push('/login?registered=1');
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow" />
      </div>

      <div className="auth-container animate-fade-in-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L3 8v8c0 7.18 5.56 13.89 13 15.93C23.44 29.89 29 23.18 29 16V8L16 2z" fill="url(#shield-grad2)" />
              <path d="M12 16l3 3 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield-grad2" x1="3" y1="2" x2="29" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00d4ff"/>
                  <stop offset="1" stopColor="#7c3aed"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="auth-logo-title">PhishGuard AI</h1>
            <p className="auth-logo-sub">Adaptive Security Training</p>
          </div>
        </div>

        <div className="auth-card glass-card">
          <h2 className="auth-heading">Create your account</h2>
          <p className="auth-subheading">Start your personalized security awareness training</p>

          {error && (
            <div className="auth-error animate-fade-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full name</label>
              <input id="reg-name" type="text" className="input-field" placeholder="John Smith"
                value={form.name} onChange={update('name')} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Work email</label>
              <input id="reg-email" type="email" className="input-field" placeholder="you@company.com"
                value={form.email} onChange={update('email')} required autoComplete="email" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Password</label>
                <input id="reg-password" type="password" className="input-field" placeholder="Min. 8 characters"
                  value={form.password} onChange={update('password')} required autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label htmlFor="reg-confirm" className="form-label">Confirm password</label>
                <input id="reg-confirm" type="password" className="input-field" placeholder="Repeat password"
                  value={form.confirmPassword} onChange={update('confirmPassword')} required />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading} id="register-submit-btn">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:2rem; }
        .auth-bg { position:fixed; inset:0; z-index:0; }
        .auth-bg-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(0,212,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.04) 1px,transparent 1px); background-size:40px 40px; }
        .auth-bg-glow { position:absolute; top:-20%; left:50%; transform:translateX(-50%); width:600px; height:600px; background:radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%); border-radius:50%; }
        .auth-container { position:relative; z-index:1; width:100%; max-width:480px; display:flex; flex-direction:column; gap:2rem; }
        .auth-logo { display:flex; align-items:center; gap:1rem; justify-content:center; }
        .auth-logo-icon { width:52px; height:52px; background:var(--bg-card); border:1px solid var(--border-accent); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-glow-cyan); }
        .auth-logo-title { font-size:1.4rem; font-weight:800; background:linear-gradient(135deg,var(--accent-primary),var(--accent-secondary)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; line-height:1.2; margin:0; }
        .auth-logo-sub { font-size:0.75rem; color:var(--text-muted); margin:0; }
        .auth-card { padding:2rem; display:flex; flex-direction:column; gap:1.25rem; }
        .auth-heading { font-size:1.5rem; font-weight:700; color:var(--text-primary); margin:0; }
        .auth-subheading { font-size:0.875rem; color:var(--text-secondary); margin:0; margin-top:-0.5rem; }
        .auth-error { display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1rem; background:var(--color-danger-10); border:1px solid var(--color-danger-20); border-radius:var(--radius-md); color:var(--color-danger); font-size:0.875rem; }
        .auth-form { display:flex; flex-direction:column; gap:1rem; }
        .form-group { display:flex; flex-direction:column; gap:0.375rem; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .form-label { font-size:0.8rem; font-weight:600; color:var(--text-secondary); letter-spacing:0.025em; }
        .auth-footer-text { text-align:center; font-size:0.875rem; color:var(--text-secondary); margin:0; }
        .auth-link { color:var(--accent-primary); font-weight:600; text-decoration:none; }
        .auth-link:hover { text-decoration:underline; }
        .w-full { width:100%; }
      `}</style>
    </div>
  );
}
