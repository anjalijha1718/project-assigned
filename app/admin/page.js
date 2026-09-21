'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, clearStoredAuth, getStoredAuth } from '@/app/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const auth = getStoredAuth();

  const fetchData = async () => {
    if (!auth?.token) {
      router.push('/login');
      return;
    }

    try {
      const me = await apiRequest('/auth/me', { method: 'GET', token: auth.token });
      setUser(me.user);

      if (me.user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      const result = await apiRequest('/admin/inquiries', { method: 'GET', token: auth.token });
      setInquiries(result.inquiries || []);
    } catch (err) {
      clearStoredAuth();
      setError(err.message || 'Unable to load admin panel.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const updateStatus = async (id, status) => {
    try {
      const result = await apiRequest(`/admin/inquiries/${id}`, {
        method: 'PATCH',
        token: auth.token,
        body: { status },
      });
      setInquiries((current) =>
        current.map((item) => (item._id === id ? result.inquiry : item))
      );
    } catch (err) {
      setError(err.message || 'Unable to update inquiry.');
    }
  };

  const deleteInquiry = async (id) => {
    try {
      await apiRequest(`/admin/inquiries/${id}`, {
        method: 'DELETE',
        token: auth.token,
      });
      setInquiries((current) => current.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.message || 'Unable to delete inquiry.');
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    router.push('/login');
  };

  if (loading) {
    return <main className="auth-shell"><div className="auth-card"><p className="empty-state">Loading admin inquiries...</p></div></main>;
  }

  return (
    <main className="auth-shell admin-shell">
      <div className="auth-card wide-card admin-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Inquiry dashboard</h1>
          </div>
          <div className="dashboard-actions">
            <Link href="/dashboard" className="auth-button small-button">Dashboard</Link>
            <button type="button" className="ghost-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {error && <p className="form-message error">{error}</p>}

        <div className="admin-summary">
          <span>{inquiries.length} total inquiries</span>
          <span>Signed in as {user?.name}</span>
        </div>

        {inquiries.length === 0 ? (
          <div className="empty-state-panel">
            <p>No inquiries yet.</p>
          </div>
        ) : (
          <div className="admin-list">
            {inquiries.map((item) => (
              <article key={item._id} className="admin-item">
                <div className="admin-meta">
                  <strong>{item.name}</strong>
                  <span>{item.email}</span>
                  <span>{item.inquiryType}</span>
                </div>

                <p>{item.message}</p>

                <div className="admin-actions-row">
                  <select
                    value={item.status}
                    onChange={(event) => updateStatus(item._id, event.target.value)}
                    aria-label={`Update status for inquiry from ${item.name}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button type="button" className="ghost-button danger-button" onClick={() => deleteInquiry(item._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
