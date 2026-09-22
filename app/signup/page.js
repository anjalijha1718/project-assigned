'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, setStoredAuth, API_BASE_URL } from '@/app/lib/api';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.95A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.95 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0 5.48 0 2.43 2.02.95 4.96l3.01 2.33c.71-2.13 2.7-3.71 5.04-3.71z"/>
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Step State
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Check URL parameters for potential Google OAuth errors
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      if (errorParam === 'google_not_configured') {
        setApiError('Google Sign-In is not yet configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env');
      } else {
        setApiError(decodeURIComponent(errorParam));
      }
    }
  }, []);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // Step 1: Submit signup form and request OTP
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');
    setApiSuccess('');

    try {
      const result = await apiRequest('/auth/send-signup-otp', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
      });

      setStep('otp');
      setResendCooldown(60);
      setApiSuccess(result.message || 'Verification code sent to your email.');
    } catch (error) {
      setApiError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otp.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    if (otp.trim().length !== 6) {
      setOtpError('Verification code must be 6 digits.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const result = await apiRequest('/auth/verify-signup-otp', {
        method: 'POST',
        body: {
          email: form.email,
          otp: otp.trim(),
        },
      });

      setStoredAuth(result.token, result.user);
      router.push('/home');
    } catch (error) {
      setOtpError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setOtpError('');
    setApiSuccess('');

    try {
      const result = await apiRequest('/auth/resend-signup-otp', {
        method: 'POST',
        body: { email: form.email },
      });

      setResendCooldown(60);
      setApiSuccess(result.message || 'A new verification code has been sent.');
    } catch (error) {
      setOtpError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Continue with Google
  const handleGoogleSignIn = () => {
    window.location.assign(`${API_BASE_URL}/auth/google`);
  };

  return (
    <main className="auth-shell auth-entry-shell">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="brand-link">Silent House</Link>
          <p className="eyebrow">{step === 'otp' ? 'Verification' : 'Create account'}</p>
          <h1>{step === 'otp' ? 'Verify email' : 'Sign up'}</h1>
        </div>

        {step === 'form' ? (
          <>
            {/* Google Signup Button */}
            <button
              type="button"
              className="google-auth-button"
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider">
              <span>or</span>
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
                {isSubmitting ? 'Sending verification code...' : 'Create account'}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: OTP Verification Interface */
          <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
            <p className="otp-subtext">
              We sent a 6-digit verification code to <strong>{form.email}</strong>. Please enter it below:
            </p>

            <label className="field">
              <span>Verification code</span>
              <input
                type="text"
                name="otp"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setOtpError('');
                }}
                className={`otp-input ${otpError ? 'error' : ''}`}
                placeholder="123456"
                autoFocus
              />
              {otpError && <small>{otpError}</small>}
            </label>

            {apiSuccess && <p className="form-message success">{apiSuccess}</p>}

            <button type="submit" className="auth-button" disabled={isVerifying || otp.length !== 6}>
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="otp-meta-actions">
              <button
                type="button"
                className="otp-resend-button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
              >
                {isResending
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : 'Resend code'}
              </button>

              <button
                type="button"
                className="otp-back-link"
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setOtpError('');
                  setApiSuccess('');
                  setApiError('');
                }}
              >
                Edit details
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer-copy">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
