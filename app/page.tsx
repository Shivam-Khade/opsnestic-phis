import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar glass-card">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L3 8v8c0 7.18 5.56 13.89 13 15.93C23.44 29.89 29 23.18 29 16V8L16 2z" fill="var(--accent-primary)" />
                <path d="M12 16l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="nav-logo-text">PhishGuard</span>
          </div>
          <div className="nav-links">
            <Link href="/login" className="btn-ghost">Log in</Link>
            <Link href="/login" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-badge">✨ Next-Generation Security</div>
            <h1 className="hero-title">
              Smarter Phishing <br />
              <span className="text-gradient">Awareness Training</span>
            </h1>
            <p className="hero-subtitle">
              Enterprise-grade, AI-powered phishing simulation that adapts in real-time to your employees' strengths and weaknesses. Stop threats before they start.
            </p>
            <div className="hero-actions stagger-2">
              <Link href="/login" className="btn-primary hero-btn">
                Start Training Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="#features" className="btn-ghost hero-btn">
                Explore Features
              </Link>
            </div>
          </div>
          <div className="hero-visual animate-fade-in-up stagger-3">
            <div className="dashboard-preview glass-card">
              <div className="preview-header">
                <div className="dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="preview-title">Adaptive Engine Active</div>
              </div>
              <div className="preview-body">
                <div className="preview-row">
                  <div className="preview-icon success">🛡️</div>
                  <div className="preview-text">
                    <div className="preview-line w-full"></div>
                    <div className="preview-line w-2/3"></div>
                  </div>
                </div>
                <div className="preview-row">
                  <div className="preview-icon warning">⚠️</div>
                  <div className="preview-text">
                    <div className="preview-line w-5/6"></div>
                    <div className="preview-line w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative background glow */}
            <div className="hero-glow"></div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-header animate-fade-in-up">
            <h2 className="section-title">Built for Modern Teams</h2>
            <p className="section-subtitle">Everything you need to build a resilient security culture without the administrative overhead.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-card glass-card-hover animate-fade-in-up stagger-1">
              <div className="feature-icon">🧠</div>
              <h3 className="feature-title">AI-Powered Scenarios</h3>
              <p className="feature-desc">Generate infinitely variable, highly realistic phishing scenarios on the fly. No more repetitive training templates.</p>
            </div>
            <div className="feature-card glass-card glass-card-hover animate-fade-in-up stagger-2">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Adaptive Difficulty</h3>
              <p className="feature-desc">The engine analyzes past performance to automatically serve scenarios that target individual user weaknesses.</p>
            </div>
            <div className="feature-card glass-card glass-card-hover animate-fade-in-up stagger-3">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Real-time Analytics</h3>
              <p className="feature-desc">Track organizational vulnerability with granular insights into specific attack vectors and departmental risks.</p>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="stats-section animate-fade-in-up">
          <div className="stats-container glass-card">
            <div className="stat-item">
              <div className="stat-number tabular-nums">94%</div>
              <div className="stat-label">Reduction in Phish Clicks</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number tabular-nums">3x</div>
              <div className="stat-label">Faster Learning Curve</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number tabular-nums">10k+</div>
              <div className="stat-label">Scenarios Generated</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section animate-fade-in-up stagger-2">
          <div className="cta-content">
            <h2 className="cta-title">Ready to secure your workforce?</h2>
            <p className="cta-subtitle">Join thousands of companies training their employees with AI.</p>
            <Link href="/login" className="btn-primary cta-btn">
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="nav-logo">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L3 8v8c0 7.18 5.56 13.89 13 15.93C23.44 29.89 29 23.18 29 16V8L16 2z" fill="var(--text-muted)" />
            </svg>
            <span className="nav-logo-text" style={{ color: 'var(--text-muted)' }}>PhishGuard AI</span>
          </div>
          <div className="footer-links">
            <span>© 2026 PhishGuard AI</span>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--bg-surface);
          overflow-x: hidden;
        }

        /* Navbar */
        .navbar {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 2rem);
          max-width: 1200px;
          z-index: 100;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
        }
        .nav-container {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .nav-logo-text {
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* Hero */
        .hero-section {
          padding: 10rem 2rem 6rem;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4rem;
          position: relative;
        }
        .hero-content {
          flex: 1;
          max-width: 600px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          background: var(--accent-primary-10);
          color: var(--accent-primary);
          border-radius: 99px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .hero-title {
          font-size: 4rem;
          line-height: 1.1;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 1.5rem;
          letter-spacing: -0.04em;
        }
        .text-gradient {
          background: linear-gradient(135deg, var(--accent-primary), #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 2.5rem;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
        }
        .hero-btn {
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
        }
        .hero-visual {
          flex: 1;
          position: relative;
        }
        .hero-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(15, 23, 42, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }
        .dashboard-preview {
          position: relative;
          z-index: 1;
          background: #ffffff;
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.1);
          border: 1px solid var(--border-default);
          transform: rotate(2deg);
          transition: transform 0.4s ease;
        }
        .dashboard-preview:hover {
          transform: rotate(0deg) scale(1.02);
        }
        .preview-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 1.5rem;
        }
        .dots { display: flex; gap: 0.375rem; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: #ef4444; }
        .dot.yellow { background: #f59e0b; }
        .dot.green { background: #10b981; }
        .preview-title { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }
        .preview-row { display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; }
        .preview-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .preview-icon.success { background: var(--color-success-10); }
        .preview-icon.warning { background: var(--color-warning-10); }
        .preview-text { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .preview-line { height: 8px; background: var(--bg-hover); border-radius: 4px; }
        .w-full { width: 100%; }
        .w-2\\/3 { width: 66%; }
        .w-5\\/6 { width: 83%; }
        .w-1\\/2 { width: 50%; }

        /* Features */
        .features-section {
          padding: 6rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 1rem;
          letter-spacing: -0.03em;
        }
        .section-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .feature-card {
          padding: 2.5rem 2rem;
          text-align: left;
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          display: inline-block;
          padding: 1rem;
          background: var(--bg-hover);
          border-radius: var(--radius-lg);
        }
        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 1rem;
        }
        .feature-desc {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        /* Stats */
        .stats-section {
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto 6rem;
        }
        .stats-container {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 3rem;
          background: #ffffff;
        }
        .stat-item {
          text-align: center;
        }
        .stat-number {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.05em;
          margin-bottom: 0.5rem;
        }
        .stat-label {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .stat-divider {
          width: 1px;
          height: 60px;
          background: var(--border-default);
        }

        /* CTA */
        .cta-section {
          padding: 6rem 2rem;
          text-align: center;
          background: #ffffff;
          border-top: 1px solid var(--border-default);
        }
        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .cta-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 1rem;
          letter-spacing: -0.03em;
        }
        .cta-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin: 0 0 2.5rem;
        }
        .cta-btn {
          padding: 1rem 2.5rem;
          font-size: 1.125rem;
        }

        /* Footer */
        .footer {
          border-top: 1px solid var(--border-default);
          padding: 2rem;
          background: var(--bg-surface);
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .footer-links a {
          color: var(--text-secondary);
          text-decoration: none;
        }
        .footer-links a:hover {
          color: var(--text-primary);
        }

        @media (max-width: 900px) {
          .hero-section { flex-direction: column; text-align: center; padding-top: 8rem; }
          .hero-content { max-width: 100%; }
          .hero-title { font-size: 3rem; }
          .hero-actions { justify-content: center; }
          .hero-visual { width: 100%; max-width: 500px; margin: 0 auto; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-container { flex-direction: column; gap: 2rem; }
          .stat-divider { width: 60px; height: 1px; }
          .footer-content { flex-direction: column; gap: 1rem; }
        }
      `}</style>
    </div>
  );
}
