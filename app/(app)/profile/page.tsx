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
      .select([db.fn.countAll<number>().as('total'), db.fn.sum<number>('is_correct').as('correct'), db.fn.avg<number>('score').as('avg_score')])
      .where('user_id','=',userId).executeTakeFirst(),
    db.selectFrom('user_performance as up')
      .innerJoin('categories as c','c.id','up.category_id')
      .select(['c.name as category','up.indicator_type','up.correct_count','up.incorrect_count'])
      .where('up.user_id','=',userId).where('up.indicator_type','!=','general').execute(),
  ]);

  const totalAttempts = Number(stats?.total ?? 0);
  const accuracy = totalAttempts > 0 ? Math.round((Number(stats?.correct) / totalAttempts) * 100) : 0;
  const avgScore = Math.round(Number(stats?.avg_score ?? 0));

  const statItems = [
    { label: 'Attempts', value: totalAttempts },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Avg Score', value: avgScore },
  ];

  return (
    <div style={{ padding: '2.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem', letterSpacing: '-0.025em' }}>
            My <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Profile</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>Your skills & training analytics</p>
        </div>
        <ResetProgressButton />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Hero Profile Card */}
        <div className="glass-card animate-fade-in-up stagger-1" style={{ overflow: 'hidden' }}>
          {/* Banner */}
          <div style={{ height: '120px', background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #1e1b4b 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', filter: 'blur(40px)', right: '-50px', top: '-50px' }} />
          </div>

          {/* Profile content */}
          <div style={{ padding: '0 2rem 2rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginTop: '-3.5rem', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ padding: '4px', background: 'var(--bg-base)', borderRadius: '50%', border: '3px solid var(--bg-base)', boxShadow: 'var(--shadow-card)', flexShrink: 0 }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700, color: '#fff', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}>
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, paddingBottom: '0.5rem', minWidth: '200px' }}>
              <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>{user?.name}</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem', fontWeight: 500 }}>
                {user?.role === 'admin' ? 'Security Administrator' : 'Security Analyst'} · Enterprise
              </p>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {user?.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Member since {new Date(user?.created_at ?? '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
              {statItems.map((s) => (
                <div key={s.label} style={{ padding: '0.875rem 1.25rem', background: 'var(--accent-primary-10)', border: '1px solid var(--accent-primary-20)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '80px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Skill Breakdown */}
          <div className="glass-card animate-fade-in-up stagger-2" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Skill Breakdown</h2>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{skills.length} skills tracked</span>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {skills.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>Complete training to see your skill profile.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {skills.map((skill) => {
                    const pct = Math.round(Number(skill.accuracy_score));
                    const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={skill.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8375rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{skill.skill_area.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: barColor, fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--border-default)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '99px', transition: 'width 1s ease-out' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="glass-card animate-fade-in-up stagger-3" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Areas to Improve</h2>
            </div>
            {weakIndicators.filter((w) => w.incorrect_count >= 2).length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎉</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>No significant weak areas identified yet.</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', padding: '0.75rem 1.5rem', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-glass)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  <div style={{ flex: 2 }}>Indicator</div>
                  <div style={{ flex: 2 }}>Category</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>Errors</div>
                </div>
                {weakIndicators.filter((w) => w.incorrect_count >= 2)
                  .sort((a, b) => b.incorrect_count - a.incorrect_count)
                  .map((w, i) => (
                    <div key={`${w.category}-${w.indicator_type}-${i}`} style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                      <div style={{ flex: 2, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{w.indicator_type.replace(/_/g, ' ')}</div>
                      <div style={{ flex: 2, fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{w.category}</div>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(239,68,68,0.2)' }}>{w.incorrect_count} missed</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          div[style*="padding: 2.5rem 3rem"] { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
