import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'kysely';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Analytics' };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Access denied.</div>;

  const [categoryBreakdown, topUsers, validationStats] = await Promise.all([
    db.selectFrom('user_attempts as ua')
      .innerJoin('scenarios as s','s.id','ua.scenario_id')
      .innerJoin('categories as c','c.id','s.category_id')
      .select(['c.name as category', db.fn.countAll<number>().as('attempts'), sql<number>`AVG(ua.is_correct)`.as('accuracy')])
      .groupBy(['c.id','c.name'])
      .orderBy('attempts','desc')
      .execute(),
    db.selectFrom('users as u')
      .leftJoin('user_attempts as ua','ua.user_id','u.id')
      .select(['u.name','u.email', db.fn.countAll<number>().as('attempts'), sql<number>`AVG(ua.is_correct)`.as('accuracy')])
      .groupBy(['u.id','u.name','u.email'])
      .orderBy('attempts','desc')
      .limit(10)
      .execute(),
    db.selectFrom('validation_results')
      .select([db.fn.countAll<number>().as('total'), db.fn.sum<number>('passed').as('passed'), db.fn.sum<number>('used_fallback').as('fallbacks'), db.fn.avg<number>('retry_count').as('avg_retries')])
      .executeTakeFirst(),
  ]);

  return (
    <div className="page-container">
      <h1 className="page-title animate-fade-in-up">Platform Analytics</h1>

      {/* Validation pipeline health */}
      <div className="glass-card section animate-fade-in-up stagger-1">
        <h2 className="section-title">🛡️ AI Validation Pipeline Health</h2>
        <div className="pipeline-stats">
          <div className="ps-item">
            <span className="ps-val">{Number(validationStats?.total ?? 0)}</span>
            <span className="ps-label">Total Validations</span>
          </div>
          <div className="ps-item">
            <span className="ps-val success">{Number(validationStats?.passed ?? 0)}</span>
            <span className="ps-label">Passed</span>
          </div>
          <div className="ps-item">
            <span className="ps-val warning">{Number(validationStats?.fallbacks ?? 0)}</span>
            <span className="ps-label">Fallbacks Served</span>
          </div>
          <div className="ps-item">
            <span className="ps-val">{Number(validationStats?.avg_retries ?? 0).toFixed(1)}</span>
            <span className="ps-label">Avg Retries</span>
          </div>
        </div>
        <p className="pipeline-note">
          This table is the audit trail for the proposed AI hallucination-mitigation pipeline.
          All AI-generated scenarios pass through a deterministic rule-check layer before
          being served to trainees. Failures trigger regeneration; persistent failures use curated fallbacks.
        </p>
      </div>

      {/* Category breakdown */}
      <div className="glass-card section animate-fade-in-up stagger-2">
        <h2 className="section-title">📊 Category Performance (Platform-wide)</h2>
        <table className="data-table">
          <thead>
            <tr><th>Category</th><th>Total Attempts</th><th>Avg Accuracy</th><th>Bar</th></tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((row) => {
              const acc = Math.round(Number(row.accuracy) * 100);
              return (
                <tr key={(row as any).category}>
                  <td style={{ fontWeight:600, fontSize:'0.875rem' }}>{(row as any).category}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.875rem' }}>{Number(row.attempts)}</td>
                  <td style={{ fontFamily:'var(--font-mono)', color: acc>=70?'var(--color-success)':acc>=50?'var(--color-warning)':'var(--color-danger)', fontWeight:700 }}>{acc}%</td>
                  <td style={{ width:'200px' }}>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width:`${acc}%`, background: acc>=70?'var(--color-success)':acc>=50?'var(--color-warning)':'var(--color-danger)' }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top users */}
      <div className="glass-card section animate-fade-in-up stagger-3">
        <h2 className="section-title">🏆 Top Trainees</h2>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Attempts</th><th>Accuracy</th></tr>
          </thead>
          <tbody>
            {topUsers.map((u) => {
              const acc = Math.round(Number(u.accuracy) * 100);
              return (
                <tr key={(u as any).email}>
                  <td style={{ fontWeight:600, fontSize:'0.875rem' }}>{(u as any).name}</td>
                  <td style={{ fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--text-muted)' }}>{(u as any).email}</td>
                  <td style={{ fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--accent-primary)' }}>{Number(u.attempts)}</td>
                  <td style={{ fontFamily:'var(--font-mono)',color:acc>=70?'var(--color-success)':acc>=50?'var(--color-warning)':'var(--color-danger)',fontWeight:700 }}>{acc}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .page-container { padding:2rem; max-width:1000px; }
        .page-title { font-size:1.75rem; font-weight:800; margin:0 0 2rem; }
        .section { padding:1.5rem; margin-bottom:1.5rem; }
        .section-title { font-size:0.9rem; font-weight:700; margin:0 0 1.25rem; }
        .pipeline-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1rem; }
        @media(max-width:600px) { .pipeline-stats { grid-template-columns:repeat(2,1fr); } }
        .ps-item { background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; flex-direction:column; gap:0.25rem; }
        .ps-val { font-size:1.75rem; font-weight:800; font-family:var(--font-mono); }
        .ps-val.success { color:var(--color-success); }
        .ps-val.warning { color:var(--color-warning); }
        .ps-label { font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); font-weight:600; }
        .pipeline-note { font-size:0.775rem; color:var(--text-muted); margin:0; line-height:1.6; border-top:1px solid var(--border-subtle); padding-top:1rem; }
        .data-table { width:100%; border-collapse:collapse; }
        .data-table th { padding:0.75rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); border-bottom:1px solid var(--border-subtle); }
        .data-table td { padding:0.75rem 1rem; border-bottom:1px solid var(--border-subtle); vertical-align:middle; color:var(--text-primary); }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:hover td { background:var(--bg-hover); }
        .bar-track { height:6px; background:var(--bg-elevated); border-radius:3px; overflow:hidden; }
        .bar-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }
      `}</style>
    </div>
  );
}
