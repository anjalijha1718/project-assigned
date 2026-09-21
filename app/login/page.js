'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setStoredAuth } from '@/app/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (!form.password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const result = await apiRequest('/auth/login', { method: 'POST', body: form });
      setStoredAuth(result.token, result.user);
      router.push('/home');
    } catch (error) {
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell auth-entry-shell">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="brand-link">Silent House</Link>
          <p className="eyebrow">Welcome back</p>
          <h1>Login</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              className={errors.email ? 'error' : ''}
              placeholder="name@example.com"
            />
            {errors.email && <small>{errors.email}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <small>{errors.password}</small>}
          </label>

          {apiError && <p className="form-message error">{apiError}</p>}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer-copy">
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
