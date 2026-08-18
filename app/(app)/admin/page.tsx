import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Overview' };

export default async function AdminPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Access denied.</div>;
  }

  const [totalUsers, totalAttempts, totalScenarios, validationStats, recentAttempts] = await Promise.all([
    db.selectFrom('users').select(db.fn.countAll<number>().as('count')).executeTakeFirst(),
    db.selectFrom('user_attempts').select(db.fn.countAll<number>().as('count')).executeTakeFirst(),
    db.selectFrom('scenarios').select(db.fn.countAll<number>().as('count')).executeTakeFirst(),
    db.selectFrom('validation_results').select([
      db.fn.countAll<number>().as('total'),
      db.fn.sum<number>('passed').as('passed'),
      db.fn.sum<number>('used_fallback').as('fallbacks'),
    ]).executeTakeFirst(),
    db.selectFrom('user_attempts as ua')
      .innerJoin('users as u', 'u.id', 'ua.user_id')
      .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
      .select(['ua.id','ua.is_correct','ua.score','ua.responded_at','u.name as user_name','s.subject'])
      .orderBy('ua.responded_at','desc')
      .limit(10)
      .execute(),
  ]);

  const validationTotal = Number(validationStats?.total ?? 0);
  const validationPass = Number(validationStats?.passed ?? 0);
  const validationRate = validationTotal > 0 ? Math.round((validationPass / validationTotal) * 100) : 0;

  const ADMIN_LINKS = [
    { href: '/admin/users', label: 'Manage Users', icon: '👥', desc: `${Number(totalUsers?.count ?? 0)} registered users` },
    { href: '/admin/scenarios', label: 'Scenario Library', icon: '📧', desc: `${Number(totalScenarios?.count ?? 0)} scenarios generated` },
    { href: '/admin/domains', label: 'Company Domains', icon: '🏢', desc: 'AI generation context' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📊', desc: 'Platform-wide performance data' },
  ];

  return (
    <div className="page-container">
      <div className="animate-fade-in-up">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and management</p>
      </div>

      {/* Platform stats */}
      <div className="stats-grid animate-fade-in-up stagger-1">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{Number(totalUsers?.count ?? 0)}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">{Number(totalAttempts?.count ?? 0)}</span>
          <span className="stat-label">Total Attempts</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📧</span>
          <span className="stat-value">{Number(totalScenarios?.count ?? 0)}</span>
          <span className="stat-label">Scenarios</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value" style={{ color: validationRate >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {validationRate}%
          </span>
          <span className="stat-label">AI Validation Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <span className="stat-value">{Number(validationStats?.fallbacks ?? 0)}</span>
          <span className="stat-label">Fallbacks Used</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="admin-links animate-fade-in-up stagger-2">
        {ADMIN_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="admin-link-card glass-card glass-card-hover">
            <span className="alc-icon">{link.icon}</span>
            <div>
              <p className="alc-label">{link.label}</p>
              <p className="alc-desc">{link.desc}</p>
            </div>
            <svg className="alc-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="glass-card recent-section animate-fade-in-up stagger-3">
        <h2 className="section-title">Recent Platform Activity</h2>
        {recentAttempts.map((a) => (
          <div key={a.id} className="activity-row">
            <div className={`activity-dot ${a.is_correct ? 'dot-correct' : 'dot-incorrect'}`} />
            <div className="activity-info">
              <span className="activity-user">{(a as any).user_name}</span>
              <span className="activity-subject">{(a as any).subject}</span>
            </div>
            <span className={`activity-result ${a.is_correct ? 'r-correct' : 'r-incorrect'}`}>
              {a.is_correct ? '✓' : '✗'}
            </span>
            <span className="activity-time">
              {new Date(a.responded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .page-container { padding: 2.5rem 3rem; max-width: 1400px; margin: 0 auto; }
        @media (max-width: 768px) { .page-container { padding: 1.5rem; } }
        .page-title { font-size:2rem; font-weight:700; color:var(--text-primary); margin:0 0 0.25rem; letter-spacing: -0.03em; }
        .page-subtitle { font-size:1rem; color:var(--text-secondary); margin:0 0 2.5rem; }
        .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:1.5rem; margin-bottom:2.5rem; }
        @media(max-width:900px) { .stats-grid { grid-template-columns:repeat(3,1fr); } }
        .stat-card { background:var(--bg-card); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem; box-shadow: var(--shadow-card); }
        .stat-icon { font-size:1.5rem; }
        .stat-value { font-size:2rem; font-weight:600; line-height:1; font-family: var(--font-mono); letter-spacing: -0.02em; }
        .stat-label { font-size:0.75rem; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; }
        .admin-links { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin-bottom:2.5rem; }
        .admin-link-card { padding:1.5rem; display:flex; align-items:center; gap:1rem; text-decoration:none; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); transition: all 0.2s; }
        .admin-link-card:hover { border-color: var(--border-accent); box-shadow: var(--shadow-elevated); transform: translateY(-1px); }
        .alc-icon { font-size:1.75rem; flex-shrink:0; }
        .alc-label { font-size:1rem; font-weight:600; color:var(--text-primary); margin:0 0 0.25rem; }
        .alc-desc { font-size:0.875rem; color:var(--text-secondary); margin:0; }
        .alc-arrow { margin-left:auto; color:var(--text-muted); flex-shrink:0; }
        .recent-section { padding:1.5rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
        .section-title { font-size:0.875rem; font-weight:600; margin:0 0 1rem; color: var(--text-primary); }
        .activity-row { display:flex; align-items:center; gap:1rem; padding:0.875rem 0; border-bottom:1px solid var(--border-default); }
        .activity-row:last-child { border-bottom:none; }
        .activity-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .dot-correct { background:var(--color-success); }
        .dot-incorrect { background:var(--color-danger); }
        .activity-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:0.25rem; }
        .activity-user { font-size:0.875rem; font-weight:600; color:var(--text-primary); }
        .activity-subject { font-size:0.875rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .activity-result { font-size:1.125rem; font-weight:700; }
        .r-correct { color:var(--color-success); }
        .r-incorrect { color:var(--color-danger); }
        .activity-time { font-size:0.875rem; color:var(--text-muted); white-space:nowrap; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
