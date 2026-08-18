import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(userId: number) {
  const [stats, categoryStats] = await Promise.all([
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
      .selectFrom('user_attempts as ua')
      .innerJoin('scenarios as s', 's.id', 'ua.scenario_id')
      .innerJoin('categories as c', 'c.id', 's.category_id')
      .select([
        'c.id',
        'c.name',
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

  // Process category stats
  const allCategories = categoryStats
    .map((c) => {
      const attempts = Number(c.attempts);
      const correct = Number(c.correct);
      const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const avg = Math.round(Number(c.avg_score));
      let proficiency = 'weak';
      if (acc >= 80) proficiency = 'strong';
      else if (acc >= 60) proficiency = 'moderate';
      return { id: c.id, name: c.name, accuracy: acc, avgScore: avg, proficiency };
    })
    .sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Security Training Overview</h1>
          <p className="page-subtitle">Your personalized performance metrics</p>
        </div>
        <Link href="/training" className="start-btn">
          Start Training
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div className="metrics-grid animate-fade-in-up stagger-1">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-icon">🎯</span>
            <span className="metric-label">Accuracy</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{accuracy}%</span>
            <span className="metric-sub">Average accuracy across scenarios</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-icon">⭐</span>
            <span className="metric-label">Average Score</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{Math.round(avgScore)}</span>
            <span className="metric-sub">Points per completed scenario</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-icon">📝</span>
            <span className="metric-label">Total Scenarios</span>
          </div>
          <div className="metric-body">
            <span className="metric-value">{totalAttempts}</span>
            <span className="metric-sub">Scenarios attempted</span>
          </div>
        </div>
      </div>

      {/* Category Performance List */}
      <div className="weaknesses-section animate-fade-in-up stagger-2">
        <div className="weaknesses-card">
          <h2 className="section-title">Category Performance</h2>
          {allCategories.length === 0 ? (
            <div className="empty-state">
              <p>Complete some training scenarios to see your performance metrics.</p>
            </div>
          ) : (
            <div className="weaknesses-list">
              <div className="list-header">
                <div className="header-col flex-2">Category</div>
                <div className="header-col text-right">Strength</div>
                <div className="header-col text-right">Accuracy</div>
                <div className="header-col text-right">Avg Score</div>
              </div>
              {allCategories.map((cat) => (
                <div key={cat.id} className="weakness-item">
                  <div className="weakness-info flex-2">
                    <p className="weakness-name">{cat.name}</p>
                  </div>
                  <div className="weakness-score text-right">
                    <span className={`strength-badge strength-${cat.proficiency}`}>
                      {cat.proficiency}
                    </span>
                  </div>
                  <div className="weakness-score text-right">{cat.accuracy}%</div>
                  <div className="weakness-score text-right">{cat.avgScore} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .page-container { padding: 3rem 4rem; max-width: 1200px; margin: 0 auto; color: #111827; }
        @media (max-width: 768px) { .page-container { padding: 2rem; } }
        
        .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:3rem; flex-wrap:wrap; gap: 1rem; }
        .page-title { font-size:1.75rem; font-weight:700; color: #111827; margin:0; letter-spacing: -0.02em; }
        .page-subtitle { font-size:1rem; color: #6b7280; margin:0.25rem 0 0; }
        
        .start-btn { 
          background: #111827; color: #fff; padding: 0.75rem 1.5rem;
          border-radius: 8px; cursor: pointer; text-decoration: none;
          font-weight: 500; transition: background 0.2s;
        }
        .start-btn:hover { background: #374151; }

        .metrics-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; margin-bottom:3rem; }
        @media (max-width:900px) { .metrics-grid { grid-template-columns:1fr; } }
        
        .metric-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .metric-top { display: flex; align-items: center; gap: 0.75rem; }
        .metric-icon { font-size: 1.25rem; }
        .metric-label { font-size: 0.9375rem; font-weight: 500; color: #374151; }
        
        .metric-body { display: flex; flex-direction: column; gap: 0.5rem; }
        .metric-value { font-size: 3.5rem; font-weight: 600; line-height: 1; letter-spacing: -0.04em; color: #111827; }
        .metric-sub { font-size: 0.875rem; color: #6b7280; }
        
        .weaknesses-section { display: flex; justify-content: flex-start; }
        .weaknesses-card { 
          width: 100%; max-width: 600px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .section-title { font-size:1.125rem; font-weight:600; color:#111827; margin:0; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
        
        .weaknesses-list { display: flex; flex-direction: column; }
        
        .list-header {
          display: flex; align-items: center; padding: 0.75rem 1.5rem;
          background: #f9fafb; border-bottom: 1px solid #e5e7eb;
          font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .header-col { flex: 1; }
        .text-right { text-align: right; }
        .flex-2 { flex: 2; }
        
        .weakness-item { 
          display: flex; align-items: center; padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .weakness-item:last-child { border-bottom: none; }
        
        .weakness-info { flex: 1; }
        .weakness-name { font-size: 0.9375rem; font-weight: 500; color: #111827; margin: 0; text-transform: capitalize; }
        
        .weakness-score { flex: 1; font-size: 0.9375rem; color: #6b7280; font-family: var(--font-mono); }
        
        .strength-badge {
          display: inline-block; padding: 0.25rem 0.75rem; border-radius: 99px;
          font-size: 0.75rem; font-weight: 600; text-transform: capitalize; letter-spacing: 0.02em; font-family: var(--font-sans);
        }
        .strength-strong { background: #ecfdf5; color: #059669; }
        .strength-moderate { background: #fffbeb; color: #d97706; }
        .strength-weak { background: #fef2f2; color: #dc2626; }
        
        .empty-state { padding: 3rem 2rem; text-align: center; color: #6b7280; font-size: 0.9375rem; }
      `}</style>
    </div>
  );
}
