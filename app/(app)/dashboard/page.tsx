import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(userId: number) {
  const [stats, categoryStats] = await Promise.all([
    db.selectFrom('user_attempts')
      .select([
        db.fn.countAll<number>().as('total_attempts'),
        db.fn.sum<number>('is_correct').as('correct_count'),
        db.fn.avg<number>('score').as('avg_score'),
      ])
      .where('user_id', '=', userId)
      .executeTakeFirst(),
    db.selectFrom('user_attempts as ua')
      .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
      .innerJoin('categories as c', 'c.id', 's.category_id')
      .select([
        'c.id', 'c.name',
        db.fn.countAll<number>().as('attempts'),
        db.fn.sum<number>('is_correct').as('correct'),
        db.fn.avg<number>('score').as('avg_score'),
      ])
      .where('ua.user_id', '=', userId)
      .groupBy('c.id')
      .execute(),
  ]);
  return { stats, categoryStats };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = Number(session!.user!.id);
  const { stats, categoryStats } = await getDashboardData(userId);

  const totalAttempts = Number(stats?.total_attempts ?? 0);
  const correctCount = Number(stats?.correct_count ?? 0);
  const avgScore = Number(stats?.avg_score ?? 0);
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  const allCategories = categoryStats.map((c) => {
    const attempts = Number(c.attempts);
    const correct = Number(c.correct);
    const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const avg = Math.round(Number(c.avg_score));
    let proficiency = 'weak';
    if (acc >= 80) proficiency = 'strong';
    else if (acc >= 60) proficiency = 'moderate';
    return { id: c.id, name: c.name, accuracy: acc, avgScore: avg, proficiency };
  }).sort((a, b) => b.accuracy - a.accuracy);

  const metrics = [
    { icon: '🎯', label: 'Accuracy', value: `${accuracy}%`, sub: 'Avg across all scenarios', color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', iconBg: '#10b981' },
    { icon: '⭐', label: 'Avg Score', value: Math.round(avgScore), sub: 'Points per scenario', color: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.2)', iconBg: '#4f46e5' },
    { icon: '📝', label: 'Total Scenarios', value: totalAttempts, sub: 'Scenarios attempted', color: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', iconBg: '#f59e0b' },
  ];

  const proficiencyStyles: Record<string, { bg: string; color: string; border: string }> = {
    strong:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.25)' },
    moderate: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    weak:     { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  };

  return (
    <div style={{ padding: '2.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem', letterSpacing: '-0.025em' }}>
            Security Training <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Overview</span>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0 }}>Your personalized performance metrics</p>
        </div>
        <Link href="/training" className="btn-primary" style={{ textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          Start Training
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="animate-fade-in-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {metrics.map((m) => (
          <div key={m.label} className="glass-card" style={{ padding: '1.5rem', background: m.color, borderColor: m.border, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{m.label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: `0 4px 12px ${m.iconBg}50` }}>
                {m.icon}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '2.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{m.value}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.375rem 0 0' }}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Table */}
      <div className="animate-fade-in-up stagger-2">
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Category Performance</h2>
            {totalAttempts > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{allCategories.length} categories</span>}
          </div>

          {allCategories.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
              <p style={{ margin: 0 }}>Complete some training scenarios to see your performance metrics.</p>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div style={{ display: 'flex', padding: '0.75rem 1.5rem', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-glass)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                <div style={{ flex: 2 }}>Category</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Strength</div>
                <div style={{ flex: 1, textAlign: 'right' }}>Accuracy</div>
                <div style={{ flex: 1, textAlign: 'right' }}>Avg Score</div>
              </div>
              {allCategories.map((cat) => {
                const ps = proficiencyStyles[cat.proficiency];
                return (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', padding: '1.125rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                    <div style={{ flex: 2, fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{cat.name}</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, textTransform: 'capitalize' }}>
                        {cat.proficiency}
                      </span>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{cat.accuracy}%</div>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{cat.avgScore} pts</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          div[style*="padding: 2.5rem 3rem"] { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
