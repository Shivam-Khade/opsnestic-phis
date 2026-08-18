'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Domain {
  id: number;
  domain: string;
  name: string;
  industry: string;
  is_active: number;
  created_at: string;
}

export default function DomainsAdminPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({ domain: '', name: '', industry: '', is_active: 1 });
  const [submitting, setSubmitting] = useState(false);

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/admin/domains');
      if (res.ok) {
        const data = await res.json();
        setDomains(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const openModal = (domain?: Domain) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        domain: domain.domain,
        name: domain.name,
        industry: domain.industry,
        is_active: domain.is_active,
      });
    } else {
      setEditingDomain(null);
      setFormData({ domain: '', name: '', industry: '', is_active: 1 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDomain(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = editingDomain ? 'PUT' : 'POST';
      const url = editingDomain ? `/api/admin/domains/${editingDomain.id}` : '/api/admin/domains';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchDomains();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save domain');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    
    try {
      const res = await fetch(`/api/admin/domains/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDomains();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div>
          <div className="breadcrumbs">
            <Link href="/admin" className="breadcrumb-link">Admin</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Company Domains</span>
          </div>
          <h1 className="page-title">Company Domains</h1>
          <p className="page-subtitle">Manage company context for AI scenario generation.</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          + Add Domain
        </button>
      </div>

      <div className="glass-card animate-fade-in-up stagger-1">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading domains...</div>
        ) : domains.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No company domains configured. The AI is using the default "company-training.local" domain.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.domain}</td>
                    <td>{d.name}</td>
                    <td>{d.industry}</td>
                    <td>
                      {d.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-sm btn-outline" onClick={() => openModal(d)}>Edit</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(d.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2 className="modal-title">{editingDomain ? 'Edit Domain' : 'Add Domain'}</h2>
            <form onSubmit={handleSubmit} className="form-layout">
              <div className="form-group">
                <label>Company Domain</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.domain} 
                  onChange={(e) => setFormData({...formData, domain: e.target.value})} 
                  placeholder="e.g. acme-corp.com"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Acme Corporation"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.industry} 
                  onChange={(e) => setFormData({...formData, industry: e.target.value})} 
                  placeholder="e.g. Finance, Healthcare, Retail"
                  required 
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                  />
                  <span>Active for new scenario generations</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container { padding: 2.5rem 3rem; max-width: 1400px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
        .page-title { font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; letter-spacing: -0.03em; }
        .page-subtitle { font-size: 1rem; color: var(--text-secondary); margin: 0; }
        .breadcrumbs { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.75rem; }
        .breadcrumb-link { color: var(--accent-primary); text-decoration: none; }
        .breadcrumb-link:hover { text-decoration: underline; }
        .breadcrumb-separator { color: var(--text-muted); }
        .breadcrumb-current { color: var(--text-secondary); }
        
        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border-default); }
        .admin-table td { padding: 1rem 1.5rem; font-size: 0.875rem; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tr:hover td { background: var(--bg-hover); }
        
        .action-buttons { display: flex; gap: 0.5rem; }
        .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 500; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s; }
        .btn-outline { background: transparent; border: 1px solid var(--border-default); color: var(--text-primary); }
        .btn-outline:hover { background: var(--bg-hover); border-color: var(--border-accent); }
        .btn-danger { background: transparent; border: 1px solid var(--color-danger-30); color: var(--color-danger); }
        .btn-danger:hover { background: var(--color-danger-10); border-color: var(--color-danger); }
        
        /* Modal Styles */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 2rem; animation: fade-in 0.2s ease-out; }
        .modal-content { background: var(--bg-surface); border-radius: var(--radius-lg); width: 100%; max-width: 500px; padding: 2rem; box-shadow: var(--shadow-card); border: 1px solid var(--border-default); animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-title { font-size: 1.25rem; font-weight: 600; margin: 0 0 1.5rem; color: var(--text-primary); }
        
        .form-layout { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .form-input { padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-base); color: var(--text-primary); font-size: 0.875rem; transition: border-color 0.2s; }
        .form-input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-primary-20); }
        .checkbox-group label { display: flex; align-items: center; gap: 0.75rem; font-weight: normal; cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border-default); }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
