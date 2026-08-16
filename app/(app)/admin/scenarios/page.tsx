import { auth } from '@/lib/auth';
import { listScenarios } from '@/lib/services/scenario.service';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Scenarios' };

export default async function AdminScenariosPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Access denied.</div>;

  const { scenarios, total } = await listScenarios(1, 30);

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Scenario Library</h1>
        <span className="badge badge-cyan">{total} total</span>
      </div>
      <div className="glass-card table-card animate-fade-in-up stagger-1">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Subject</th><th>Category</th><th>Difficulty</th><th>Type</th><th>Source</th><th>Validation</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily:'var(--font-mono)',color:'var(--text-muted)',fontSize:'0.75rem' }}>{s.id}</td>
                <td className="subject-cell">{(s as any).subject}</td>
                <td><span className="badge badge-cyan" style={{ fontSize:'0.7rem' }}>{(s as any).category_name}</span></td>
                <td><span className="badge badge-violet" style={{ fontSize:'0.7rem' }}>{(s as any).difficulty_name}</span></td>
                <td>
                  {s.is_phishing
                    ? <span className="badge badge-danger" style={{ fontSize:'0.7rem' }}>Phishing</span>
                    : <span className="badge badge-success" style={{ fontSize:'0.7rem' }}>Legit</span>}
                </td>
                <td><span className="badge" style={{ fontSize:'0.7rem', background:'var(--bg-elevated)', color:'var(--text-secondary)', border:'1px solid var(--border-subtle)' }}>{s.source}</span></td>
                <td>
                  <span className={`badge ${s.validation_status === 'passed' ? 'badge-success' : s.validation_status === 'failed' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize:'0.7rem' }}>
                    {s.validation_status}
                  </span>
                </td>
                <td style={{ color:'var(--text-muted)',fontSize:'0.75rem',whiteSpace:'nowrap' }}>
                  {new Date(s.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .page-container { padding: 2.5rem 3rem; max-width: 1400px; margin: 0 auto; }
        @media (max-width: 768px) { .page-container { padding: 1.5rem; } }
        .page-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
        .page-title { font-size:2rem; font-weight:700; margin:0; color:var(--text-primary); letter-spacing:-0.03em; }
        .table-card { overflow-x:auto; border-radius:var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-card); }
        .data-table { width:100%; border-collapse:collapse; }
        .data-table th { padding:1rem 1.25rem; text-align:left; font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary); border-bottom:1px solid var(--border-default); white-space:nowrap; background: var(--bg-surface); }
        .data-table td { padding:1rem 1.25rem; border-bottom:1px solid var(--border-default); vertical-align:middle; }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:hover td { background:var(--bg-hover); }
        .subject-cell { font-size:0.875rem; color:var(--text-primary); max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight: 500; }
      `}</style>
    </div>
  );
}
