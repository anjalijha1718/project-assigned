'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setStoredAuth } from '@/app/lib/api';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const result = await apiRequest('/auth/signup', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
      });

      setStoredAuth(result.token, result.user);
      router.push('/home');
    } catch (error) {
      setApiError(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell auth-entry-shell">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="brand-link">Silent House</Link>
          <p className="eyebrow">Create account</p>
          <h1>Sign up</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={updateField}
              className={errors.name ? 'error' : ''}
              placeholder="Your full name"
            />
            {errors.name && <small>{errors.name}</small>}
          </label>

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
              placeholder="At least 6 characters"
            />
            {errors.password && <small>{errors.password}</small>}
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <small>{errors.confirmPassword}</small>}
          </label>

          {apiError && <p className="form-message error">{apiError}</p>}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer-copy">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
