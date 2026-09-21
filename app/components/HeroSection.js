'use client'

import { useState } from 'react'
import Link from 'next/link'
import TransparentModal from './TransparentModal'

export default function HeroSection() {
  const [reelOpen, setReelOpen] = useState(false)

  return (
    <>
      <section className="hero" id="hero">
        <div className="hero-top">
          <h1 className="hero-heading hero-anim-1">
            Three unique companies under one roof, creating experiences you&apos;ll never forget.
          </h1>
        </div>

        <div className="hero-bottom hero-anim-2">
          <div className="hero-reel-area">
            <button type="button" className="reel-btn" onClick={() => setReelOpen(true)}>
              <span className="reel-play-circle">
                <svg width="7" height="9" viewBox="0 0 7 9" fill="none">
                  <path d="M0 0L7 4.5L0 9V0Z" fill="currentColor" />
                </svg>
              </span>
              Play Reel
            </button>
            <ul className="reel-indicators">
              <li className="reel-dot active" />
              <li className="reel-dot" />
              <li className="reel-dot" />
            </ul>
          </div>

          <Link href="/" className="hero-link">
            <span style={{ fontSize: '0.75em', lineHeight: 1 }}>↳</span>
            Browse all work
          </Link>
        </div>
      </section>

      <TransparentModal open={reelOpen} title="Play Reel" onClose={() => setReelOpen(false)}>
        <div className="video-modal-wrap">
          <video
            key={reelOpen ? 'reel-open' : 'reel-closed'}
            controls
            playsInline
            className="reel-video"
            poster="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"
            onEnded={() => setReelOpen(false)}
          >
            <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
          </video>
        </div>
      </TransparentModal>
    </>
  )
}
