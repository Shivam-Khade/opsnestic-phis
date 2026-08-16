import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(userId: number) {
  const [skills, recentAttempts, stats, categoryBreakdown] = await Promise.all([
    db.selectFrom('user_skills').selectAll().where('user_id', '=', userId).execute(),
    db
      .selectFrom('user_attempts as ua')
      .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
      .innerJoin('categories as c', 'c.id', 's.category_id')
      .innerJoin('difficulty_levels as d', 'd.id', 's.difficulty_id')
      .select(['ua.id', 'ua.is_correct', 'ua.score', 'ua.responded_at', 'ua.user_decision',
        's.subject', 's.is_phishing', 'c.name as category_name', 'd.name as difficulty_name', 'c.slug as category_slug'])
      .where('ua.user_id', '=', userId)
      .orderBy('ua.responded_at', 'desc')
      .limit(8)
      .execute(),
    db
      .selectFrom('user_attempts')
      .select([
        db.fn.countAll<number>().as('total_attempts'),
        db.fn.sum<number>('is_correct').as('correct_count'),
        db.fn.avg<number>('score').as('avg_score'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst(),
    db
      .selectFrom('user_performance as up')
      .innerJoin('categories as c', 'c.id', 'up.category_id')
      .select(['c.name as category', 'c.slug as slug', 'up.correct_count', 'up.incorrect_count'])
      .where('up.user_id', '=', userId)
      .where('up.indicator_type', '=', 'general')
      .execute(),
  ]);

  return { skills, recentAttempts, stats, categoryBreakdown };
}

const PROFICIENCY_COLOR: Record<string, string> = {
  strong: '#10b981', moderate: '#f59e0b', weak: '#ef4444',
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = Number(session!.user!.id);
  const { skills, recentAttempts, stats, categoryBreakdown } = await getDashboardData(userId);

  const totalAttempts = Number(stats?.total_attempts ?? 0);
  const correctCount = Number(stats?.correct_count ?? 0);
  const avgScore = Number(stats?.avg_score ?? 0);
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  const weakAreas = skills.filter((s) => s.proficiency_level === 'weak');
  const strongAreas = skills.filter((s) => s.proficiency_level === 'strong');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Security Dashboard</h1>
          <p className="page-subtitle">Your adaptive training overview</p>
        </div>
        <Link href="/training" className="start-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Start Training
        </Link>
      </div>

      {/* Stats row */}
      <div className="stats-grid animate-fade-in-up stagger-1">
        <div className="stat-card border-blue">
          <div className="stat-top">
            <span className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>🎯</span>
            <span className="stat-label">Total Attempts</span>
          </div>
          <span className="stat-value">{totalAttempts}</span>
        </div>
        <div className="stat-card border-green">
          <div className="stat-top">
            <span className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>✅</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <span className="stat-value" style={{ color: accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
            {accuracy}%
          </span>
        </div>
        <div className="stat-card border-purple">
          <div className="stat-top">
            <span className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>⭐</span>
            <span className="stat-label">Avg Score</span>
          </div>
          <span className="stat-value">{Math.round(avgScore)}</span>
        </div>
        <div className="stat-card border-emerald">
          <div className="stat-top">
            <span className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>💪</span>
            <span className="stat-label">Strong Areas</span>
          </div>
          <span className="stat-value">{strongAreas.length}</span>
        </div>
        <div className="stat-card border-red">
          <div className="stat-top">
            <span className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>⚠️</span>
            <span className="stat-label">Weak Areas</span>
          </div>
          <span className="stat-value" style={{ color: weakAreas.length > 0 ? '#ef4444' : '#10b981' }}>
            {weakAreas.length}
          </span>
        </div>
      </div>

      <div className="content-grid">
        {/* Left column */}
        <div className="left-col">
          {/* Skill profile */}
          <div className="premium-card animate-fade-in-up stagger-2">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Security Skill Profile
            </h2>
            {skills.length === 0 ? (
              <div className="empty-state">
                <p>Complete some training scenarios to see your skill profile.</p>
                <Link href="/training" className="start-btn" style={{ width: 'fit-content', marginTop: '0.5rem' }}>Start Training</Link>
              </div>
            ) : (
              <div className="skills-list">
                {skills.map((skill) => {
                  const acc = Number(skill.accuracy_score);
                  const color = PROFICIENCY_COLOR[skill.proficiency_level];
                  return (
                    <div key={skill.id} className="skill-row">
                      <div className="skill-info">
                        <span className="skill-name">{skill.skill_area.replace(/_/g, ' ')}</span>
                        <span className="skill-level" style={{ color }}>
                          {skill.proficiency_level}
                        </span>
                      </div>
                      <div className="skill-bar-container">
                        <div className="skill-bar-track">
                          <div
                            className="skill-bar-fill"
                            style={{
                              width: `${acc}%`,
                              background: `linear-gradient(90deg, ${color}99, ${color})`,
                              boxShadow: skill.proficiency_level === 'strong' ? `0 2px 8px ${color}66` : 'none'
                            }}
                          />
                        </div>
                        <span className="skill-pct">{Math.round(acc)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="premium-card animate-fade-in-up stagger-3">
              <h2 className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Category Breakdown
              </h2>
              <DashboardCharts categoryData={categoryBreakdown as any} />
            </div>
          )}
        </div>

        {/* Right column — recent activity */}
        <div className="right-col">
          <div className="premium-card animate-fade-in-up stagger-2">
            <div className="section-header-row">
              <h2 className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Recent Activity
              </h2>
              <Link href="/history" className="view-all-link">View all →</Link>
            </div>
            {recentAttempts.length === 0 ? (
              <div className="empty-state">
                <p>No training attempts yet. Start your first session!</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentAttempts.map((attempt, i) => {
                  const delay = 0.05 * (i + 1);
                  return (
                    <div key={attempt.id} className="activity-item animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
                      <div className={`activity-indicator ${attempt.is_correct ? 'activity-correct' : 'activity-incorrect'}`} />
                      <div className="activity-content">
                        <p className="activity-subject">{(attempt as any).subject}</p>
                        <div className="activity-meta">
                          <span className="soft-badge badge-blue">{(attempt as any).category_name}</span>
                          <span className="soft-badge badge-purple">{(attempt as any).difficulty_name}</span>
                          {(attempt as any).is_phishing ? (
                            <span className="soft-badge badge-red">Phishing</span>
                          ) : (
                            <span className="soft-badge badge-green">Legitimate</span>
                          )}
                        </div>
                        <div className="activity-bottom">
                          {attempt.is_correct ? (
                            <span className="activity-result result-correct">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              Correct
                            </span>
                          ) : (
                            <span className="activity-result result-incorrect">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Incorrect
                            </span>
                          )}
                          <span className="activity-score" style={{ color: attempt.score > 0 ? '#10b981' : '#6b7280' }}>
                            {attempt.score > 0 ? '+' : ''}{attempt.score} pts
                          </span>
                          <span className="activity-time">
                            {new Date(attempt.responded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adaptive recommendation banner */}
          {weakAreas.length > 0 && (
            <div className="recommendation-card animate-fade-in-up stagger-4">
              <div className="rec-icon">🎯</div>
              <div className="rec-content">
                <p className="rec-title">Adaptive Training Focus</p>
                <p className="rec-body">
                  Your training is being personalized to target{' '}
                  <strong>{weakAreas.map(w => w.skill_area.replace(/_/g, ' ')).join(', ')}</strong>{' '}
                  — areas where you need the most practice.
                </p>
              </div>
              <Link href="/training" className="start-btn rec-btn">Train Now</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .page-container { padding: 2.5rem 3rem; max-width: 1400px; margin: 0 auto; color: #111827; }
        @media (max-width: 768px) { .page-container { padding: 1.5rem; } }
        
        .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem; gap:1rem; flex-wrap:wrap; }
        .page-title { font-size:2rem; font-weight:800; color: #111827; margin:0; letter-spacing: -0.03em; }
        .page-subtitle { font-size:1rem; color: #6b7280; margin:0.25rem 0 0; }
        
        /* Premium Button */
        .start-btn { 
          display:flex; align-items:center; gap:0.5rem; font-size:0.9375rem; font-weight:600;
          background: var(--accent-primary); color: #fff; padding: 0.625rem 1.25rem;
          border-radius: 12px; cursor: pointer; text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.1);
        }
        .start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2), 0 4px 6px -4px rgba(15, 23, 42, 0.1);
          background: #1e293b;
        }

        .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:1.25rem; margin-bottom:2.5rem; }
        @media (max-width:1100px) { .stats-grid { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:700px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
        
        /* Stat Cards */
        .stat-card {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-top: 3px solid transparent;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05);
        }
        .stat-card.border-blue { border-top-color: #3b82f6; }
        .stat-card.border-green { border-top-color: #10b981; }
        .stat-card.border-purple { border-top-color: #8b5cf6; }
        .stat-card.border-emerald { border-top-color: #059669; }
        .stat-card.border-red { border-top-color: #ef4444; }

        .stat-top { display: flex; align-items: center; gap: 0.75rem; }
        .stat-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
        .stat-label { font-size: 0.8125rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .stat-value { font-size: 2.25rem; font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: #111827; font-variant-numeric: tabular-nums; }
        
        .content-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
        @media (max-width:1000px) { .content-grid { grid-template-columns:1fr; } }
        .left-col, .right-col { display:flex; flex-direction:column; gap:1.5rem; }
        
        /* Premium General Card */
        .premium-card {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
        }
        
        .section-title { font-size:1rem; font-weight:700; color:#111827; margin:0 0 1.25rem; display:flex; align-items:center; gap:0.5rem; letter-spacing: -0.01em; }
        .section-header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
        .view-all-link { font-size:0.8125rem; color:var(--accent-primary); text-decoration:none; font-weight:600; }
        .view-all-link:hover { text-decoration:underline; }
        
        .empty-state { text-align:center; padding:3rem 2rem; color:#6b7280; font-size:0.875rem; display:flex; flex-direction:column; align-items:center; gap:1rem; border: 1px dashed #e5e7eb; border-radius: 16px; }
        
        /* Skills List */
        .skills-list { display:flex; flex-direction:column; gap:1.25rem; }
        .skill-row { display:flex; flex-direction:column; gap:0.5rem; }
        .skill-info { display:flex; justify-content:space-between; align-items:center; }
        .skill-name { font-size:0.875rem; font-weight:600; color:#111827; text-transform:capitalize; }
        .skill-level { font-size:0.75rem; font-weight:700; text-transform:capitalize; letter-spacing: 0.02em; }
        .skill-bar-container { display: flex; align-items: center; gap: 0.75rem; }
        .skill-bar-track { flex: 1; height:8px; background:#f3f4f6; border-radius:99px; overflow:hidden; }
        .skill-bar-fill { height:100%; border-radius:99px; width: 0; animation: fillBar 0.8s ease-out forwards; }
        @keyframes fillBar { from { max-width: 0; } to { max-width: 100%; } }
        .skill-pct { font-size:0.875rem; color:#6b7280; font-weight:600; font-family:var(--font-mono); font-variant-numeric: tabular-nums; width: 36px; text-align: right; }
        
        /* Activity List */
        .activity-list { display:flex; flex-direction:column; gap:0.75rem; }
        .activity-item { 
          display:flex; gap:1rem; padding:1rem; background: rgba(255, 255, 255, 0.5); border-radius:12px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
        }
        .activity-item:hover { background: rgba(255, 255, 255, 0.8); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: #ffffff; }
        
        .activity-indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .activity-correct { background: #10b981; }
        .activity-incorrect { background: #ef4444; }
        
        .activity-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:0.625rem; padding-left: 0.5rem; }
        .activity-subject { font-size:0.9375rem; font-weight:600; color:#111827; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        
        /* Soft Badges */
        .activity-meta { display:flex; gap:0.5rem; flex-wrap:wrap; }
        .soft-badge { padding: 0.25rem 0.625rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em; }
        .badge-blue { background: #eff6ff; color: #2563eb; }
        .badge-purple { background: #f5f3ff; color: #7c3aed; }
        .badge-red { background: #fef2f2; color: #dc2626; }
        .badge-green { background: #ecfdf5; color: #059669; }
        
        .activity-bottom { display:flex; align-items:center; gap:1rem; margin-top:0.25rem; }
        .activity-result { font-size:0.8125rem; font-weight:700; display: flex; align-items: center; gap: 0.25rem; }
        .result-correct { color:#10b981; }
        .result-incorrect { color:#ef4444; }
        .activity-score { font-size:0.8125rem; font-family:var(--font-mono); font-weight: 700; }
        .activity-time { font-size:0.75rem; color:#6b7280; font-weight: 500; margin-left:auto; }
        
        /* Recommendations */
        .recommendation-card { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border:1px solid rgba(255, 255, 255, 0.6); border-left: 4px solid var(--accent-primary); border-radius:16px; padding:1.5rem; display:flex; gap:1rem; align-items:center; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05); }
        .rec-icon { font-size:1.5rem; flex-shrink:0; }
        .rec-content { flex:1; }
        .rec-title { font-size:0.9375rem; font-weight:700; color:#111827; margin:0 0 0.25rem; }
        .rec-body { font-size:0.875rem; color:#6b7280; margin:0; line-height:1.5; }
        .rec-btn { font-size:0.875rem; padding:0.5rem 1rem; white-space:nowrap; flex-shrink:0; }
      `}</style>
    </div>
  );
}
