import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';
import ResetProgressButton from '@/components/profile/ResetProgressButton';

export const metadata: Metadata = { title: 'My Profile' };

const PROFICIENCY_COLOR: Record<string, string> = {
  strong: 'var(--color-success)',
  moderate: 'var(--color-warning)',
  weak: 'var(--color-danger)',
};

export default async function ProfilePage() {
  const session = await auth();
  const userId = Number(session!.user!.id);

  const [user, skills, stats, weakIndicators] = await Promise.all([
    db.selectFrom('users').select(['id','name','email','role','created_at']).where('id','=',userId).executeTakeFirst(),
    db.selectFrom('user_skills').selectAll().where('user_id','=',userId).execute(),
    db.selectFrom('user_attempts')
      .select([
        db.fn.countAll<number>().as('total'),
        db.fn.sum<number>('is_correct').as('correct'),
        db.fn.avg<number>('score').as('avg_score'),
      ])
      .where('user_id','=',userId)
      .executeTakeFirst(),
    db.selectFrom('user_performance as up')
      .innerJoin('categories as c','c.id','up.category_id')
      .select(['c.name as category','up.indicator_type','up.correct_count','up.incorrect_count'])
      .where('up.user_id','=',userId)
      .where('up.indicator_type','!=','general')
      .execute(),
  ]);

  const totalAttempts = Number(stats?.total ?? 0);
  const accuracy = totalAttempts > 0 ? Math.round((Number(stats?.correct) / totalAttempts) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your security awareness profile and adaptive training data</p>
        </div>
        <ResetProgressButton />
      </div>

      <div className="profile-grid">
        {/* Profile card */}
        <div className="glass-card profile-card animate-fade-in-up stagger-1">
          <div className="profile-avatar">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>
            <span className="badge badge-cyan" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              {user?.role}
            </span>
          </div>
          <div className="profile-stats">
            <div className="ps-item">
              <span className="ps-val">{totalAttempts}</span>
              <span className="ps-label">Attempts</span>
            </div>
            <div className="ps-item">
              <span className="ps-val" style={{ color: accuracy >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {accuracy}%
              </span>
              <span className="ps-label">Accuracy</span>
            </div>
            <div className="ps-item">
              <span className="ps-val">{Math.round(Number(stats?.avg_score ?? 0))}</span>
              <span className="ps-label">Avg Score</span>
            </div>
          </div>
          <p className="member-since">Member since {new Date(user?.created_at ?? '').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Skills detail */}
        <div className="glass-card skills-detail animate-fade-in-up stagger-2">
          <h2 className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Skill Breakdown
          </h2>
          {skills.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Complete training to see your skill profile.</p>
          ) : (
            <div className="skills-grid">
              {skills.map((skill) => (
                <div key={skill.id} className="skill-badge-card">
                  <div className="sb-header">
                    <span className="sb-area">{skill.skill_area.replace(/_/g, ' ')}</span>
                    <span className="sb-level" style={{ color: PROFICIENCY_COLOR[skill.proficiency_level] }}>
                      {skill.proficiency_level}
                    </span>
                  </div>
                  <div className="sb-bar-track">
                    <div className="sb-bar-fill" style={{ width: `${skill.accuracy_score}%`, background: PROFICIENCY_COLOR[skill.proficiency_level] }} />
                  </div>
                  <span className="sb-pct">{Math.round(Number(skill.accuracy_score))}% accuracy</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak indicators */}
        {weakIndicators.filter((w) => w.incorrect_count >= 2).length > 0 && (
          <div className="glass-card weak-indicators animate-fade-in-up stagger-3">
            <h2 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Indicators to Improve
            </h2>
            <p className="weak-intro">The adaptive engine is targeting these patterns in your upcoming scenarios:</p>
            <div className="weak-list">
              {weakIndicators
                .filter((w) => w.incorrect_count >= 2)
                .sort((a, b) => b.incorrect_count - a.incorrect_count)
                .map((w) => (
                  <div key={`${w.category}-${w.indicator_type}`} className="weak-item">
                    <div className="wi-header">
                      <span className="wi-type">{w.indicator_type.replace(/_/g, ' ')}</span>
                      <span className="wi-category badge badge-cyan" style={{ fontSize: '0.65rem' }}>{w.category}</span>
                    </div>
                    <div className="wi-counts">
                      <span className="wi-correct">✓ {w.correct_count}</span>
                      <span className="wi-incorrect">✗ {w.incorrect_count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .page-container { padding:2rem; max-width:1000px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .page-title { font-size:1.75rem; font-weight:800; margin:0 0 0.25rem; }
        .page-subtitle { font-size:0.875rem; color:var(--text-secondary); margin:0; }
        .profile-grid { display:grid; grid-template-columns:300px 1fr; gap:1.5rem; }
        @media(max-width:800px) { .profile-grid { grid-template-columns:1fr; } }
        .profile-card { padding:2rem; display:flex; flex-direction:column; align-items:center; text-align:center; gap:0.75rem; }
        .profile-avatar { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,var(--accent-primary),var(--accent-secondary)); display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:800; color:#000; }
        .profile-name { font-size:1.25rem; font-weight:700; margin:0; }
        .profile-email { font-size:0.8rem; color:var(--text-muted); margin:0; font-family:var(--font-mono); }
        .profile-info { display:flex; flex-direction:column; align-items:center; }
        .profile-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; width:100%; margin-top:0.5rem; padding-top:1rem; border-top:1px solid var(--border-subtle); }
        .ps-item { display:flex; flex-direction:column; align-items:center; gap:0.25rem; }
        .ps-val { font-size:1.5rem; font-weight:800; }
        .ps-label { font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); }
        .member-since { font-size:0.75rem; color:var(--text-muted); margin:0; }
        .skills-detail { padding:1.5rem; }
        .section-title { font-size:0.875rem; font-weight:700; display:flex; align-items:center; gap:0.5rem; margin:0 0 1.25rem; }
        .skills-grid { display:flex; flex-direction:column; gap:1rem; }
        .skill-badge-card { display:grid; grid-template-columns:1fr auto; grid-template-rows:auto auto; gap:0.25rem; align-items:center; }
        .sb-header { grid-column:1; display:flex; justify-content:space-between; }
        .sb-area { font-size:0.825rem; font-weight:500; color:var(--text-primary); text-transform:capitalize; }
        .sb-level { font-size:0.75rem; font-weight:700; text-transform:capitalize; }
        .sb-bar-track { grid-column:1; height:5px; background:var(--bg-elevated); border-radius:3px; overflow:hidden; }
        .sb-bar-fill { height:100%; border-radius:3px; transition:width 0.6s ease; }
        .sb-pct { grid-column:2; grid-row:1/3; font-size:0.7rem; color:var(--text-muted); padding-left:0.75rem; font-family:var(--font-mono); }
        .weak-indicators { padding:1.5rem; grid-column:1/-1; }
        .weak-intro { font-size:0.8rem; color:var(--text-secondary); margin:0 0 1rem; }
        .weak-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:0.75rem; }
        .weak-item { background:var(--bg-elevated); border:1px solid var(--color-danger-20); border-radius:var(--radius-md); padding:0.875rem; }
        .wi-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.375rem; }
        .wi-type { font-size:0.8rem; font-weight:600; color:var(--text-primary); text-transform:capitalize; }
        .wi-counts { display:flex; gap:0.75rem; font-size:0.75rem; font-family:var(--font-mono); }
        .wi-correct { color:var(--color-success); }
        .wi-incorrect { color:var(--color-danger); font-weight:700; }
      `}</style>
    </div>
  );
}
