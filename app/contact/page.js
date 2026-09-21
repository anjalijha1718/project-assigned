'use client';

import Link from 'next/link';
import InquiryForm from '@/app/components/InquiryForm';

export default function ContactPage() {
  return (
    <main className="auth-shell contact-shell">
      <div className="auth-card wide-card">
        <div className="auth-header">
          <Link href="/" className="brand-link">Silent House</Link>
          <p className="eyebrow">Contact</p>
          <h1>Start a conversation</h1>
        </div>

        <InquiryForm />
      </div>
    </main>
  );
}
