'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setStoredAuth } from '@/app/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error) {
      if (error === 'google_not_configured') {
        setErrorMessage('Google Sign-In is not yet configured. Please set GOOGLE_CLIENT_ID in backend/.env');
      } else {
        setErrorMessage(decodeURIComponent(error) || 'Google authentication failed.');
      }
      return;
    }

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        setStoredAuth(token, user);
        router.replace('/home');
      } catch (err) {
        setErrorMessage('Failed to process authentication credentials.');
      }
    } else {
      setErrorMessage('Missing authentication parameters.');
    }
  }, [router]);

  return (
    <main className="auth-shell auth-entry-shell">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="brand-link">Silent House</Link>
          <p className="eyebrow">Authentication</p>
          <h1>Connecting</h1>
        </div>

        {errorMessage ? (
          <div className="auth-form">
            <p className="form-message error">{errorMessage}</p>
            <Link href="/signup" className="auth-button" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Back to Sign Up
            </Link>
          </div>
        ) : (
          <p style={{ color: 'rgba(245, 247, 250, 0.78)', margin: '20px 0' }}>
            Completing sign-in with Google, please wait...
          </p>
        )}
      </div>
    </main>
  );
}
