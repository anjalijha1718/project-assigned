'use client'
import Link from 'next/link'
import { useState } from 'react'

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  )
}

export default function Footer() {
  const [copied, setCopied] = useState(false)

  function handleCopyEmail() {
    navigator.clipboard.writeText('info@silent-house.com').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <footer className="site-footer" id="footer">
      <div className="footer-gradient" />
      <div className="footer-card">
        <div className="footer-top">
          <p className="footer-cta">
            Have a project in mind?<br />
            We&apos;re ready to collaborate.
          </p>
          <button className="footer-email-btn" onClick={handleCopyEmail}>
            {copied ? 'Email Copied!' : 'info@silent-house.com'}
          </button>
        </div>

        <div className="footer-mid">
          <div className="footer-nav-col">
            <h4>Discover</h4>
            <ul>
              <li><Link href="/project">Work</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/press">Press</Link></li>
            </ul>
          </div>
          <div className="footer-nav-col">
            <h4>Divisions</h4>
            <ul>
              <li><Link href="/studios">Studios</Link></li>
              <li><Link href="/productions">Productions</Link></li>
              <li><Link href="/touring">Touring</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <ul className="footer-social">
            <li>
              <a href="https://www.instagram.com/silenthousegroup" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/silenthousegroup" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon />
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/company/silent-house-group/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedInIcon />
              </a>
            </li>
          </ul>

          <div className="footer-legal">
            <Link href="/pages/privacy-policy">Privacy Policy</Link>
            <button>Cookie Preferences</button>
          </div>

          <p className="footer-copy">
            2026 © Silent House Group &nbsp;
            <a href="https://koki-kiko.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              Credits
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
