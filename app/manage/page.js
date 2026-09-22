'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, clearStoredAuth, getStoredAuth } from '@/app/lib/api';

const initialNewUserForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
};

export default function ManagePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add User Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState(initialNewUserForm);
  const [addFormErrors, setAddFormErrors] = useState({});
  const [addFormError, setAddFormError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Delete User Modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchAdminData = useCallback(async () => {
    const auth = getStoredAuth();
    if (!auth?.token) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Authoritatively verify with backend
      const meRes = await apiRequest('/auth/me', { method: 'GET', token: auth.token });
      const user = meRes.user;
      setCurrentUser(user);

      if (user.role !== 'admin') {
        setForbidden(true);
        setLoading(false);
        return;
      }

      // 2. Fetch users from MongoDB
      const usersRes = await apiRequest('/admin/users', { method: 'GET', token: auth.token });
      setUsers(usersRes.users || []);
    } catch (err) {
      if (err.message?.includes('Admin access required') || err.message?.includes('403')) {
        setForbidden(true);
      } else {
        setError(err.message || 'Failed to load user management data.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore logout errors
    } finally {
      clearStoredAuth();
      router.push('/login');
    }
  };

  // Add User Form Handlers
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserForm((prev) => ({ ...prev, [name]: value }));
    setAddFormErrors((prev) => ({ ...prev, [name]: '' }));
    setAddFormError('');
  };

  const validateNewUserForm = () => {
    const errors = {};
    if (!newUserForm.name.trim()) errors.name = 'Full name is required.';
    if (!newUserForm.email.trim()) {
      errors.email = 'Email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserForm.email)) errors.email = 'Please enter a valid email address.';
    }
    if (!newUserForm.password) {
      errors.password = 'Password is required.';
    } else if (newUserForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (!newUserForm.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (newUserForm.password !== newUserForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!validateNewUserForm()) return;

    const auth = getStoredAuth();
    if (!auth?.token) {
      router.replace('/login');
      return;
    }

    setIsAdding(true);
    setAddFormError('');

    try {
      const res = await apiRequest('/admin/users', {
        method: 'POST',
        token: auth.token,
        body: newUserForm,
      });

      // Update users list reactively
      setUsers((prev) => [res.user, ...prev]);
      setIsAddModalOpen(false);
      setNewUserForm(initialNewUserForm);
      setSuccessMessage(`User "${res.user.name}" (${res.user.role}) created successfully.`);
    } catch (err) {
      setAddFormError(err.message || 'Failed to create user.');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete User Handlers
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const auth = getStoredAuth();
    if (!auth?.token) {
      router.replace('/login');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await apiRequest(`/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
        token: auth.token,
      });

      const deletedName = userToDelete.name;
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setUserToDelete(null);
      setSuccessMessage(`User "${deletedName}" was removed successfully.`);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Render 403 Forbidden State
  if (forbidden) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <div className="auth-header">
            <Link href="/" className="brand-link">Silent House</Link>
            <p className="eyebrow" style={{ color: '#991b1b' }}>403 Forbidden</p>
            <h1>Access Denied</h1>
          </div>
          <p className="auth-footer-copy" style={{ textAlign: 'left', marginBottom: '24px' }}>
            Administrator privileges are required to access this page. Your account ({currentUser?.email}) is registered as a standard user.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="auth-button small-button">
              Return to Dashboard
            </Link>
            <Link href="/" className="ghost-button small-button">
              Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Render Loading State
  if (loading) {
    return (
      <main className="auth-shell admin-shell">
        <div className="auth-card wide-card admin-card">
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>User Management</h1>
            </div>
          </div>
          <div className="empty-state">
            <p>Loading registered users from database...</p>
          </div>
        </div>
      </main>
    );
  }

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const standardCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <main className="auth-shell admin-shell">
      <div className="auth-card wide-card admin-card manage-card">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>User Management</h1>
          </div>
          <div className="dashboard-actions">
            <button
              type="button"
              className="auth-button small-button"
              onClick={() => {
                setAddFormErrors({});
                setAddFormError('');
                setNewUserForm(initialNewUserForm);
                setIsAddModalOpen(true);
              }}
            >
              + Add New User
            </button>
            <Link href="/admin" className="ghost-button small-button">
              Inquiries
            </Link>
            <Link href="/dashboard" className="ghost-button small-button">
              Dashboard
            </Link>
            <button type="button" className="ghost-button small-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* Global Feedback Messages */}
        {successMessage && (
          <div className="form-message success manage-alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span>{successMessage}</span>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'inherit' }}
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="form-message error manage-alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span>{error}</span>
            <button
              type="button"
              className="ghost-button small-button"
              onClick={fetchAdminData}
              style={{ marginLeft: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Admin Summary Stats */}
        <div className="admin-summary">
          <span>
            <strong>{users.length}</strong> total {users.length === 1 ? 'user' : 'users'} ({adminCount} admin{adminCount === 1 ? '' : 's'}, {standardCount} normal)
          </span>
          <span>
            Signed in as <strong>{currentUser?.name}</strong> ({currentUser?.email})
          </span>
        </div>

        {/* Users Table / Empty State */}
        {users.length === 0 ? (
          <div className="empty-state-panel">
            <p>No registered users found in the database.</p>
            <button
              type="button"
              className="auth-button small-button"
              style={{ marginTop: '14px' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add First User
            </button>
          </div>
        ) : (
          <div className="manage-table-container">
            <table className="manage-table" aria-label="Registered users table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Registered Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?._id === u._id || currentUser?.id === u._id;
                  const createdDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={u._id}>
                      <td data-label="User">
                        <div className="manage-user-cell">
                          <span className="manage-user-avatar" aria-hidden="true">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                          <span className="manage-user-name">
                            {u.name}
                            {isSelf && <span className="manage-self-badge">You</span>}
                          </span>
                        </div>
                      </td>
                      <td data-label="Email" className="manage-email-cell">
                        {u.email}
                      </td>
                      <td data-label="Role">
                        <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Normal User'}
                        </span>
                      </td>
                      <td data-label="Registered Date" className="manage-date-cell">
                        {createdDate}
                      </td>
                      <td data-label="Status">
                        <span className="status-badge status-active">Active</span>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        {isSelf ? (
                          <span className="manage-action-disabled" title="You cannot delete your own account">
                            Current Account
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ghost-button danger-button small-button"
                            onClick={() => {
                              setDeleteError('');
                              setUserToDelete(u);
                            }}
                            aria-label={`Delete user ${u.name}`}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Back Link */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <Link href="/" className="ghost-button small-button">
            ← Back to Silent House
          </Link>
        </div>
      </div>

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="manage-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-modal-title">
          <div className="manage-modal-card">
            <div className="manage-modal-header">
              <h2 id="add-modal-title">Add New User</h2>
              <button
                type="button"
                className="manage-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {addFormError && <p className="form-message error" style={{ marginBottom: '16px' }}>{addFormError}</p>}

            <form onSubmit={handleAddUserSubmit} noValidate className="auth-form">
              <label className="field">
                <span>Full Name</span>
                <input
                  type="text"
                  name="name"
                  value={newUserForm.name}
                  onChange={handleNewUserChange}
                  placeholder="e.g. Jane Doe"
                  className={addFormErrors.name ? 'error' : ''}
                />
                {addFormErrors.name && <small>{addFormErrors.name}</small>}
              </label>

              <label className="field">
                <span>Email Address</span>
                <input
                  type="email"
                  name="email"
                  value={newUserForm.email}
                  onChange={handleNewUserChange}
                  placeholder="name@example.com"
                  className={addFormErrors.email ? 'error' : ''}
                />
                {addFormErrors.email && <small>{addFormErrors.email}</small>}
              </label>

              <div className="form-grid two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    name="password"
                    value={newUserForm.password}
                    onChange={handleNewUserChange}
                    placeholder="Min 6 chars"
                    className={addFormErrors.password ? 'error' : ''}
                  />
                  {addFormErrors.password && <small>{addFormErrors.password}</small>}
                </label>

                <label className="field">
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={newUserForm.confirmPassword}
                    onChange={handleNewUserChange}
                    placeholder="Repeat password"
                    className={addFormErrors.confirmPassword ? 'error' : ''}
                  />
                  {addFormErrors.confirmPassword && <small>{addFormErrors.confirmPassword}</small>}
                </label>
              </div>

              <label className="field">
                <span>Role</span>
                <select
                  name="role"
                  value={newUserForm.role}
                  onChange={handleNewUserChange}
                  aria-label="Select user role"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,0,0,0.18)',
                    background: 'white',
                    fontSize: '15px',
                  }}
                >
                  <option value="user">Normal User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <div className="manage-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="ghost-button small-button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-button small-button"
                  disabled={isAdding}
                >
                  {isAdding ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="manage-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="manage-modal-card">
            <div className="manage-modal-header">
              <h2 id="delete-modal-title" style={{ color: '#991b1b' }}>Delete User</h2>
              <button
                type="button"
                className="manage-modal-close"
                onClick={() => setUserToDelete(null)}
                aria-label="Close dialog"
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>

            {deleteError && <p className="form-message error" style={{ marginBottom: '16px' }}>{deleteError}</p>}

            <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '16px', color: 'var(--black)' }}>
              Are you sure you want to permanently remove this user from the database?
            </p>

            <div
              style={{
                background: '#faf8f5',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <strong>Name:</strong> {userToDelete.name}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Email:</strong> {userToDelete.email}
              </div>
              <div>
                <strong>Role:</strong>{' '}
                <span className={`role-badge ${userToDelete.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                  {userToDelete.role === 'admin' ? 'Admin' : 'Normal User'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#991b1b', marginBottom: '20px' }}>
              ⚠️ This action cannot be undone. All database records for this user will be removed.
            </p>

            <div className="manage-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="ghost-button small-button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="auth-button danger-button small-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ background: '#991b1b', color: 'white' }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
