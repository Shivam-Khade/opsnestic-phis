'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="auth-form-wrapper animate-slide-in-right">
      <div className="auth-header">
        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-subheading">Sign in to continue your security training</p>
      </div>

      {error && (
        <div className="auth-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div className="password-header">
            <label htmlFor="password" className="form-label">Password</label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>
          <input
            id="password"
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full login-btn"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner" /> Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="divider">
        <span>or</span>
      </div>

      {/* Demo credentials hint */}
      <div className="demo-hint">
        <div className="demo-hint-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Demo Accounts
        </div>
        <div className="demo-hint-body">
          <div className="demo-row">
            <span className="demo-role">User A</span>
            <code>usera@demo.local</code> <span className="demo-pwd">Password123!</span>
          </div>
          <div className="demo-row">
            <span className="demo-role">User B</span>
            <code>userb@demo.local</code> <span className="demo-pwd">Password123!</span>
          </div>
        </div>
      </div>

      <p className="auth-footer-text">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="auth-link">Register</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-split-page">
      {/* Left side: Branding only */}
      <div className="auth-left">
        <div className="auth-left-content animate-fade-in-up">
          <Link href="/" className="auth-logo">
            <div className="auth-logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L3 8v8c0 7.18 5.56 13.89 13 15.93C23.44 29.89 29 23.18 29 16V8L16 2z" fill="#fff" />
                <path d="M12 16l3 3 6-6" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
          <div className="auth-left-text">
            <h1 className="auth-brand-name">PhishGuard</h1>
            <p className="auth-tagline">Adaptive Security Awareness Training</p>
          </div>
        </div>
        <div className="auth-left-bg"></div>
      </div>

      {/* Right side: Login Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Use a global style block so it affects child components like LoginForm properly */}
      <style>{`
        .auth-split-page {
          display: flex;
          min-height: 100vh;
          background: var(--bg-surface); /* fall back if left is hidden */
        }

        /* Left Side */
        .auth-left {
          flex: 1;
          position: relative;
          background: var(--accent-primary); /* Dark navy from globals */
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          overflow: hidden;
        }
        .auth-left-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
                            linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%);
          z-index: 0;
        }
        .auth-left-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
        }
        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          margin-bottom: 0.5rem;
        }
        .auth-logo-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .auth-left-text {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .auth-brand-name {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .auth-tagline {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-weight: 400;
        }

        /* Right Side */
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: #ffffff; /* Clean white background */
        }
        .auth-form-container {
          width: 100%;
          max-width: 420px;
        }
        .auth-form-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          background: #ffffff;
          padding: 2rem;
          border-radius: var(--radius-lg);
          /* Subtle card shadow on white bg */
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          border: 1px solid rgba(15, 23, 42, 0.05);
        }
        .auth-header {
          text-align: left;
          margin-bottom: 0.5rem;
        }
        .auth-heading {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }
        .auth-subheading {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }
        
        .auth-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--color-danger-10);
          border: 1px solid rgba(225, 29, 72, 0.2);
          border-radius: var(--radius-md);
          color: var(--color-danger);
          font-size: 0.875rem;
          margin-bottom: -0.5rem;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }
        .password-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .forgot-link {
          font-size: 0.8125rem;
          color: var(--accent-primary);
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover {
          text-decoration: underline;
        }
        .input-field {
          width: 100%;
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-md);
          padding: 0.75rem 0.875rem;
          font-size: 0.9375rem;
          transition: all 0.2s;
          color: var(--text-primary);
        }
        .input-field:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-10);
          outline: none;
        }
        .login-btn {
          margin-top: 0.5rem;
          padding: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          background: var(--accent-primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-card);
        }
        .login-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: var(--shadow-elevated);
        }
        .login-btn:active {
          transform: translateY(0);
        }
        
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8125rem;
          margin: 0.5rem 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #E5E7EB;
        }
        .divider span {
          padding: 0 1rem;
        }

        /* Demo Hint */
        .demo-hint {
          padding: 1.25rem;
          background: #F8FAFC;
          border: 1px solid #E5E7EB;
          border-radius: var(--radius-md);
        }
        .demo-hint-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.875rem;
        }
        .demo-hint-body {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .demo-row {
          display: flex;
          align-items: center;
          font-size: 0.8125rem;
          gap: 0.5rem;
        }
        .demo-role {
          width: 50px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .demo-row code {
          background: #ffffff;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          border: 1px solid #E5E7EB;
          font-family: var(--font-mono);
          color: var(--text-primary);
        }
        .demo-pwd {
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        
        .auth-footer-text {
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .auth-link {
          color: var(--accent-primary);
          font-weight: 600;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; }
        
        .w-full { width: 100%; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .gap-2 { gap: 0.5rem; }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .auth-left { display: none; }
          .auth-right { padding: 1.5rem; }
          .auth-form-wrapper { padding: 1.5rem; border: none; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
