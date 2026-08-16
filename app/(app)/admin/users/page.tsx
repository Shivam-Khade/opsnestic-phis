import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Users' };

export default async function AdminUsersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Access denied.</div>;

  const users = await db
    .selectFrom('users as u')
    .leftJoin('user_attempts as ua', 'ua.user_id', 'u.id')
    .select(['u.id','u.email','u.name','u.role','u.created_at', db.fn.countAll<number>().as('attempt_count')])
    .groupBy(['u.id','u.email','u.name','u.role','u.created_at'])
    .orderBy('u.created_at','desc')
    .execute();

  return (
    <div className="page-container">
      <h1 className="page-title animate-fade-in-up">Users</h1>
      <div className="glass-card table-card animate-fade-in-up stagger-1">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Attempts</th><th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontFamily:'var(--font-mono)', color:'var(--text-muted)', fontSize:'0.75rem' }}>{u.id}</td>
                <td style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.name}</td>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text-secondary)' }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-cyan'}`} style={{ fontSize:'0.7rem' }}>{u.role}</span></td>
                <td style={{ fontFamily:'var(--font-mono)', color:'var(--accent-primary)', fontWeight:700 }}>{Number(u.attempt_count)}</td>
                <td style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{new Date(u.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .page-container { padding: 2.5rem 3rem; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 768px) { .page-container { padding: 1.5rem; } }
        .page-title { font-size:2rem; font-weight:700; color:var(--text-primary); margin:0 0 1.5rem; letter-spacing: -0.03em; }
        .table-card { overflow-x:auto; border-radius:var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-card); }
        .data-table { width:100%; border-collapse:collapse; }
        .data-table th { padding:1rem 1.25rem; text-align:left; font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary); border-bottom:1px solid var(--border-default); background: var(--bg-surface); }
        .data-table td { padding:1rem 1.25rem; border-bottom:1px solid var(--border-default); vertical-align:middle; color:var(--text-primary); }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:hover td { background:var(--bg-hover); }
      `}</style>
    </div>
  );
}
