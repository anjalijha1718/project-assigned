'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const slides = [
  {
    id: 1,
    title: 'Backstreet Boys — Sphere Las Vegas',
    href: '/project/backstreet-boys-sphere-las-vegas',
    category: 'Studios',
    image: '/img/austin-neill-hgO1wFPXl3I-unsplash.jpg',
    bg: 'linear-gradient(160deg, #050a20 0%, #0a1540 40%, #102060 65%, #1a3080 100%)',
    thumbBg: 'linear-gradient(135deg, #c020a0 0%, #e040b0 100%)',
  },
  {
    id: 2,
    title: 'Taylor Swift | The Eras Tour',
    href: '/project/taylor-swift-the-eras-tour-film',
    category: 'Productions',
    image: '/img/vishnu-r-nair-m1WZS5ye404-unsplash.jpg',
    bg: 'linear-gradient(160deg, #08041e 0%, #1a0a48 40%, #3a1870 65%, #6020a8 100%)',
    thumbBg: 'linear-gradient(135deg, #e0a020 0%, #f0c040 100%)',
  },
  {
    id: 3,
    title: 'The Actor Awards Presented by SAG-AFTRA',
    href: '/project/actor-awards',
    category: 'Productions',
    image: '/img/colin-lloyd-8H72wMWxj90-unsplash.jpg',
    bg: 'linear-gradient(160deg, #120404 0%, #3a0c0c 40%, #6a1818 65%, #a02828 100%)',
    thumbBg: 'linear-gradient(135deg, #c04020 0%, #e06840 100%)',
  },
  {
    id: 4,
    title: 'Tyler, The Creator — CHROMAKOPIA Tour',
    href: '/project/tyler-the-creator-chromakopia-tour',
    category: 'Studios',
    image: '/img/yvette-de-wit-NYrVisodQ2M-unsplash.jpg',
    bg: 'linear-gradient(160deg, #021008 0%, #042818 40%, #085030 65%, #107840 100%)',
    thumbBg: 'linear-gradient(135deg, #e06010 0%, #f08020 100%)',
  },
]

export default function FeaturedWork() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    function onScroll() {
      const rect = section.getBoundingClientRect()
      const totalScrollable = section.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const progress = totalScrollable > 0 ? Math.min(1, scrolled / totalScrollable) : 0
      const idx = Math.min(slides.length - 1, Math.floor(progress * slides.length))
      setActiveIndex(idx)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Top featured preview — aspect-video wide panel */}
      <div className="featured-work-top" data-header-scheme="light" style={{ background: slides[0].bg }}>
        <Image
          src={slides[0].image}
          alt={slides[0].title}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div className="featured-bg-grad" />
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: 18,
          right: 18,
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em' }}>
            01/{slides.length}
          </span>
          <Link
            href={slides[0].href}
            style={{
              fontSize: 'clamp(1.25rem, 2.5vw, 2.4rem)',
              fontWeight: 450,
              color: 'white',
              letterSpacing: '-0.04em',
              textAlign: 'center',
              flex: 1,
              textDecoration: 'none',
              lineHeight: 1.1,
            }}
          >
            {slides[0].title}
          </Link>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'right', minWidth: 80, letterSpacing: '-0.01em' }}>
            {slides[0].category}
          </span>
        </div>
      </div>

      {/* Scrolling sticky slides */}
      <section
        ref={sectionRef}
        data-header-scheme="light"
        style={{ position: 'relative', height: `${slides.length * 100}vh` }}
      >
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`featured-slide${i === activeIndex ? ' active' : ''}`}
              style={{ background: slide.bg }}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
              <div className="featured-bg-grad" />

              <div
                className="featured-thumb"
                style={{ background: slide.thumbBg }}
              >
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  sizes="150px"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>

              <div className="featured-info">
                <span className="featured-counter">
                  {String(i + 1).padStart(2, '0')}/{slides.length}
                </span>
                <Link href={slide.href} className="featured-title">
                  {slide.title}
                </Link>
                <span className="featured-cat">{slide.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
