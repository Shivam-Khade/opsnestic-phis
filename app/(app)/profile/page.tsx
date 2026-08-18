import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';
import ResetProgressButton from '@/components/profile/ResetProgressButton';

export const metadata: Metadata = { title: 'My Profile' };

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
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Settings / Profile</p>
        </div>
        <ResetProgressButton />
      </div>

      <div className="profile-grid">
        {/* Elegant Profile Header */}
        <div className="premium-hero animate-fade-in-up stagger-1">
          <div className="hero-pattern"></div>
          <div className="hero-content">
            <div className="avatar-wrapper">
              <div className="profile-avatar">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-role">
                {user?.role === 'admin' ? 'Security Administrator' : 'Security Analyst'} | Enterprise Solutions
              </p>
              <div className="profile-meta">
                <span className="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {user?.email}
                </span>
                <span className="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Member since {new Date(user?.created_at ?? '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="profile-stats">
              <div className="stat-col">
                <span className="stat-val">{totalAttempts}</span>
                <span className="stat-lbl">Attempts</span>
              </div>
              <div className="stat-col">
                <span className="stat-val">{accuracy}%</span>
                <span className="stat-lbl">Accuracy</span>
              </div>
              <div className="stat-col">
                <span className="stat-val">{Math.round(Number(stats?.avg_score ?? 0))}</span>
                <span className="stat-lbl">Avg Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="content-layout">
          {/* Skill Breakdown */}
          <div className="premium-card animate-fade-in-up stagger-2">
            <div className="card-header">
              <h2 className="card-title">Skill Breakdown</h2>
              <span className="card-action">•••</span>
            </div>
            
            {skills.length === 0 ? (
              <p className="empty-text">Complete training to see your skill profile.</p>
            ) : (
              <div className="skills-grid">
                {skills.map((skill) => (
                  <div key={skill.id} className="skill-row">
                    <div className="skill-meta">
                      <span className="skill-name">{skill.skill_area.replace(/_/g, ' ')}</span>
                      <span className="skill-pct">{Math.round(Number(skill.accuracy_score))}%</span>
                    </div>
                    <div className="skill-track">
                      <div 
                        className="skill-fill" 
                        style={{ width: `${skill.accuracy_score}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="premium-card animate-fade-in-up stagger-3">
            <div className="card-header">
              <h2 className="card-title">Areas to Improve</h2>
              <span className="card-action">•••</span>
            </div>
            
            {weakIndicators.filter((w) => w.incorrect_count >= 2).length === 0 ? (
              <p className="empty-text">No significant weak areas identified yet.</p>
            ) : (
              <div className="table-container">
                <div className="table-header">
                  <div className="th-col flex-2">Indicator Type</div>
                  <div className="th-col flex-2">Category context</div>
                  <div className="th-col">Status</div>
                  <div className="th-col text-right">Errors</div>
                </div>
                {weakIndicators
                  .filter((w) => w.incorrect_count >= 2)
                  .sort((a, b) => b.incorrect_count - a.incorrect_count)
                  .map((w, i) => (
                    <div key={`${w.category}-${w.indicator_type}-${i}`} className="table-row">
                      <div className="td-col flex-2">
                        <span className="fw-500 text-slate">{w.indicator_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="td-col flex-2">
                        <span className="text-muted">{w.category}</span>
                      </div>
                      <div className="td-col">
                        <span className="status-badge">Targeted</span>
                      </div>
                      <div className="td-col text-right">
                        <span className="error-count">{w.incorrect_count} missed</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-container { padding: 3rem 4rem; max-width: 1200px; margin: 0 auto; color: #111827; }
        @media (max-width: 768px) { .page-container { padding: 2rem; } }
        
        .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem; gap:1rem; flex-wrap:wrap; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
        .page-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0; }

        .profile-grid { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Premium Hero Banner */
        .premium-hero {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          position: relative;
        }
        
        .hero-pattern {
          height: 120px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          overflow: hidden;
        }
        
        .hero-pattern::before {
          content: '';
          position: absolute; width: 200%; height: 200%;
          background-image: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
          background-size: 40px 40px;
          transform: rotate(-15deg) translateY(-20%);
          opacity: 0.4;
        }

        .hero-content {
          padding: 0 2rem 2rem;
          display: flex;
          align-items: flex-end;
          gap: 1.5rem;
          margin-top: -3rem;
          position: relative;
          z-index: 2;
        }
        
        @media (max-width: 768px) {
          .hero-content { flex-direction: column; align-items: center; text-align: center; margin-top: -4rem; }
        }

        .avatar-wrapper {
          padding: 0.5rem;
          background: #ffffff;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
        }

        .profile-avatar {
          width: 96px; height: 96px; border-radius: 50%;
          background: #1e293b; color: #ffffff;
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem; font-weight: 600;
        }

        .profile-info { flex: 1; padding-bottom: 0.25rem; }
        .profile-name { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
        .profile-role { font-size: 0.9375rem; color: #475569; margin: 0 0 0.75rem; font-weight: 500; }
        .profile-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        @media (max-width: 768px) { .profile-meta { justify-content: center; } }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #64748b; font-weight: 500; }

        .profile-stats {
          display: flex; gap: 2rem; padding: 1rem 1.5rem;
          background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px;
        }
        .stat-col { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .stat-val { font-size: 1.25rem; font-weight: 700; color: #0f172a; font-family: var(--font-mono); }
        .stat-lbl { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Content Layout */
        .content-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 1000px) { .content-layout { grid-template-columns: 1fr; } }

        .premium-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex; flex-direction: column;
        }

        .card-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem; border-bottom: 1px solid #f1f5f9;
        }
        .card-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
        .card-action { color: #94a3b8; letter-spacing: 2px; cursor: pointer; }
        
        .empty-text { padding: 2rem; color: #64748b; font-size: 0.875rem; text-align: center; }

        /* Skills Grid */
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 1.5rem; }
        @media (max-width: 600px) { .skills-grid { grid-template-columns: 1fr; gap: 1.5rem; } }
        
        .skill-row { display: flex; flex-direction: column; gap: 0.5rem; }
        .skill-meta { display: flex; justify-content: space-between; align-items: center; }
        .skill-name { font-size: 0.875rem; font-weight: 500; color: #1e293b; text-transform: capitalize; }
        .skill-pct { font-size: 0.8125rem; font-weight: 600; color: #475569; font-family: var(--font-mono); }
        
        .skill-track { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .skill-fill { height: 100%; background: #2563eb; border-radius: 99px; transition: width 1s ease-out; }

        /* Table */
        .table-container { display: flex; flex-direction: column; width: 100%; }
        .table-header {
          display: flex; padding: 0.75rem 1.5rem; background: #f8fafc;
          border-bottom: 1px solid #f1f5f9; font-size: 0.75rem; font-weight: 600; color: #64748b;
        }
        .table-row {
          display: flex; align-items: center; padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-row:last-child { border-bottom: none; }
        
        .th-col, .td-col { flex: 1; font-size: 0.875rem; }
        .flex-2 { flex: 2; }
        .text-right { text-align: right; }
        
        .fw-500 { font-weight: 500; }
        .text-slate { color: #0f172a; text-transform: capitalize; }
        .text-muted { color: #64748b; }
        
        .status-badge {
          display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px;
          background: #eff6ff; color: #2563eb; font-size: 0.75rem; font-weight: 500;
        }
        
        .error-count { font-weight: 500; color: #475569; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
