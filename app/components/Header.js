'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import TransparentModal from './TransparentModal'
import { apiRequest, clearStoredAuth, getStoredAuth } from '@/app/lib/api'

const navItems = [
  { key: 'work', label: 'Work', description: 'Explore our portfolio and recent collaborations.' },
  { key: 'studios', label: 'Studios', description: 'Learn how our multidisciplinary studios create culture-shaping work.' },
  { key: 'productions', label: 'Productions', description: 'From concept to delivery, we build ambitious experiences.' },
  { key: 'touring', label: 'Touring', description: 'See the live productions and touring programs we bring to audiences.' },
  { key: 'about', label: 'About', description: 'A closer look at the people and perspective behind Silent House.' },
]

const modalContentMap = {
  work: { title: 'Work', body: 'A curation of recent projects, brand experiences, and cultural storytelling across our portfolio.' },
  studios: { title: 'Studios', body: 'Our studios combine strategy, design, production, and experiential thinking to build unforgettable work.' },
  productions: { title: 'Productions', body: 'We shape end-to-end live experiences that move people, brands, and culture forward.' },
  touring: { title: 'Touring', body: 'We tour and scale experiences globally, delivering creative direction and operational excellence.' },
  about: { title: 'About', body: 'Silent House brings together distinct disciplines under one roof to design extraordinary experiences.' },
  contact: { title: "Let's talk", body: 'We’d love to hear about your project, partnership, or upcoming event.' },
  reel: { title: 'Play Reel', body: 'A short brand reel highlighting the energy and ambition of Silent House.' },
}

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 22V8L9 0H22V22H0Z" fill="currentColor"/>
      <path d="M9 0L9 8L0 8" fill="none" stroke="#f5f4f1" strokeWidth="1"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20c.7-3.4 3-5.2 6.5-5.2s5.8 1.8 6.5 5.2" />
    </svg>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [light, setLight] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const headerRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    setUser(getStoredAuth()?.user || null)

    function closeProfile(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false)
    }

    document.addEventListener('mousedown', closeProfile)
    return () => document.removeEventListener('mousedown', closeProfile)
  }, [])

  async function handleLogout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (error) {
    } finally {
      clearStoredAuth()
      setUser(null)
      setProfileOpen(false)
      window.location.assign('/login')
    }
  }

  useEffect(() => {
    function update() {
      const headerBottom = (headerRef.current?.offsetHeight ?? 59) + 4
      const darkEls = document.querySelectorAll('[data-header-scheme="light"]')
      let isLight = false
      for (const el of darkEls) {
        const rect = el.getBoundingClientRect()
        if (rect.top < headerBottom && rect.bottom > 0) {
          isLight = true
          break
        }
      }
      setLight(isLight)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <>
      <header ref={headerRef} className={`site-header${light ? ' header-light' : ''}`}>
        <Link href="/" className="site-logo">
          <LogoIcon />
          Silent House
        </Link>

        <nav className="site-nav">
          {navItems.map((item) => (
            <button key={item.key} type="button" className="nav-link-button" onClick={() => setActiveModal(item.key)}>
              {item.label}
            </button>
          ))}
          <button type="button" className="nav-play-reel" onClick={() => setActiveModal('reel')}>Play Reel</button>
        </nav>

        <div className="header-right">
          <div className="profile-control" ref={profileRef}>
            <button
              type="button"
              className="profile-button"
              aria-label="Open profile"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((current) => !current)}
            >
              <UserIcon />
            </button>
            {profileOpen && (
              <div className="profile-popover" role="dialog" aria-label="User profile">
                <p className="profile-name">{user?.name || 'Account'}</p>
                <button type="button" className="profile-logout" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
          <button type="button" className="header-contact" onClick={() => setActiveModal('contact')}>
            <span>Let&apos;s talk</span>
          </button>
          <button
            type="button"
            className="header-menu"
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span /><span />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu-panel" role="dialog" aria-label="Navigation panel">
          {navItems.map((item) => (
            <button key={item.key} type="button" className="mobile-menu-item" onClick={() => { setActiveModal(item.key); setMenuOpen(false) }}>
              {item.label}
            </button>
          ))}
          <button type="button" className="mobile-menu-item" onClick={() => { setActiveModal('reel'); setMenuOpen(false) }}>Play Reel</button>
          <button type="button" className="mobile-menu-item primary" onClick={() => { setActiveModal('contact'); setMenuOpen(false) }}>Let&apos;s talk</button>
        </div>
      )}

      <TransparentModal open={Boolean(activeModal)} title={modalContentMap[activeModal]?.title || 'Silent House'} onClose={() => setActiveModal(null)}>
        {activeModal === 'reel' ? (
          <div className="video-modal-wrap">
            <video
              key={activeModal}
              controls
              playsInline
              className="reel-video"
              poster="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"
              onLoadedMetadata={(event) => event.currentTarget.pause()}
            >
              <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
            </video>
          </div>
        ) : (
          <div className="modal-copy">
            <p>{modalContentMap[activeModal]?.body}</p>
            <div className="modal-actions">
              <button type="button" className="auth-button small-button" onClick={() => setActiveModal('contact')}>Talk to us</button>
            </div>
          </div>
        )}
      </TransparentModal>
    </>
  )
}
