'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, clearStoredAuth, getStoredAuth } from '@/app/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getStoredAuth();

    if (!auth?.token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const result = await apiRequest('/auth/me', {
          method: 'GET',
          token: auth.token,
        });
        setUser(result.user);
      } catch (err) {
        clearStoredAuth();
        setError(err.message || 'Your session has expired. Please log in again.');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    clearStoredAuth();
    router.push('/login');
  };

  if (loading) {
    return <main className="auth-shell"><div className="auth-card"><p className="empty-state">Loading your dashboard...</p></div></main>;
  }

  if (error) {
    return <main className="auth-shell"><div className="auth-card"><p className="form-message error">{error}</p></div></main>;
  }

  return (
    <main className="auth-shell">
      <div className="auth-card wide-card dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Welcome, {user?.name}</h1>
          </div>
          <div className="dashboard-actions">
            {user?.role === 'admin' && <Link href="/admin" className="auth-button small-button">Admin panel</Link>}
            <button type="button" className="ghost-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="info-panel">
            <h2>Account details</h2>
            <ul>
              <li><strong>Name:</strong> {user?.name}</li>
              <li><strong>Email:</strong> {user?.email}</li>
              <li><strong>Role:</strong> {user?.role}</li>
            </ul>
          </div>

          <div className="info-panel">
            <h2>Quick links</h2>
            <div className="stack-links">
              <Link href="/">Back to home</Link>
              <Link href="/contact">Submit inquiry</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
