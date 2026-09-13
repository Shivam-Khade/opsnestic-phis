'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', { email, password, redirect: false });

    if (result?.error) {
      toastError('Sign in failed', 'Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      toastSuccess('Welcome back!', 'Redirecting to your dashboard…');
      router.push(callbackUrl);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Sign in to continue your security training
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input-field"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
            <a href="#" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="password" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.25rem' }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Signing in…
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sign in <ArrowRight size={16} />
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
      </div>

      {/* Demo accounts */}
      <div style={{ padding: '1.125rem', background: 'var(--accent-primary-10)', border: '1px solid var(--accent-primary-20)', borderRadius: '12px' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span>ℹ</span> Demo Accounts
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[['User A', 'usera@demo.local', 'Password123!'], ['User B', 'userb@demo.local', 'Password123!']].map(([role, email, pw]) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: '50px' }}>{role}</span>
              <code style={{ background: 'var(--bg-base)', padding: '0.1rem 0.4rem', borderRadius: '5px', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{email}</code>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{pw}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-surface)' }}>
      {/* Left: Branding panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', top: '-100px', right: '-100px' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(167,139,250,0.1)', filter: 'blur(60px)', bottom: '-50px', left: '-50px' }} />
        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <Shield size={36} color="#fff" strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 0.5rem' }}>PhishGuard</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem', margin: 0 }}>Adaptive Security Awareness Training</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', width: '100%', maxWidth: '280px' }}>
            {['AI-Powered Phishing Simulations', 'Adaptive Learning Engine', 'Real-time Performance Analytics'].map((feature) => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'var(--bg-base)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="flex: 1"][style*="gradient"] { display: none; }
        }
      `}</style>
    </div>
  );
}
