'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const types = [
  {
    name: 'Concert Tours',
    href: '/project?type=world-tours',
    image: '/img/tony-pham-FUmDe-Bx1LA-unsplash.jpg',
    desc: "We're known for mounting the most ambitious concert tours that drive pop culture conversation.",
    gradient: 'linear-gradient(160deg, #050818 0%, #0a1840 40%, #1a3070 70%, #3060c0 100%)',
  },
  {
    name: 'Streaming',
    href: '/project?type=streaming',
    image: '/img/muneeb-s-4_M8uIfPEZw-unsplash.jpg',
    desc: 'We are a trusted partner as streaming prioritizes live events.',
    gradient: 'linear-gradient(160deg, #180510 0%, #500820 40%, #a01040 70%, #e04060 100%)',
  },
  {
    name: 'Residencies',
    href: '/project?type=residencies',
    image: '/img/mathurin-napoly-matnapo-Dw7e2-fFvkM-unsplash.jpg',
    desc: 'We create residencies from the ground up in Las Vegas and beyond that attract audiences from around the world.',
    gradient: 'linear-gradient(160deg, #100820 0%, #302040 40%, #604880 70%, #a080c0 100%)',
  },
  {
    name: 'Feature Films',
    href: '/project?type=feature-films',
    image: '/img/perry-avgerinos-R2dlVo7WQVs-unsplash.jpg',
    desc: 'From record-setting concert films to behind-the-scenes documentaries, we provide full-service production.',
    gradient: 'linear-gradient(160deg, #080808 0%, #1a1a1a 40%, #383838 70%, #606060 100%)',
  },
  {
    name: 'Sports Entertainment',
    href: '/project?type=sports-entertainment',
    image: '/img/israel-palacio-Y20JJ_ddy9M-unsplash.jpg',
    desc: 'From Super Bowl Halftime Shows to UFC Fight Nights, we amplify the world of sports with unrivaled spectacle.',
    gradient: 'linear-gradient(160deg, #100508 0%, #401018 40%, #902028 70%, #d04040 100%)',
  },
  {
    name: 'Festivals',
    href: '/project?type=festivals',
    image: '/img/jordon-conner-tIr-PWgSYB4-unsplash.jpg',
    desc: 'We stage some of the most viral performances at music festivals around the world, from Coachella to Glastonbury.',
    gradient: 'linear-gradient(160deg, #050a10 0%, #103030 40%, #206050 70%, #40a080 100%)',
  },
  {
    name: 'Broadcast',
    href: '/project?type=broadcast',
    image: '/img/tijs-van-leur-So6YckShOVA-unsplash.jpg',
    desc: "We produce some of television's most-watched live events.",
    gradient: 'linear-gradient(160deg, #081010 0%, #183030 40%, #305858 70%, #508080 100%)',
  },
]

export default function TypesOfWork() {
  const [offset, setOffset] = useState(0)
  const trackRef = useRef(null)
  const max = types.length - 3

  function prev() { setOffset(o => Math.max(0, o - 1)) }
  function next() { setOffset(o => Math.min(max, o + 1)) }

  return (
    <section className="types-section">
      <div className="types-header">
        <span className="types-label">Types of work</span>
        <div className="types-arrows">
          <button className="types-arrow" onClick={prev} disabled={offset === 0} aria-label="Previous">←</button>
          <button className="types-arrow" onClick={next} disabled={offset >= max} aria-label="Next">→</button>
        </div>
      </div>

      <div className="types-track-outer">
        <div
          className="types-track"
          ref={trackRef}
          style={{ transform: `translateX(calc(-${offset} * (30vw + 18px)))` }}
        >
          {types.map((type) => (
            <div key={type.name} className="type-card">
              <div className="type-img">
                <Image
                  src={type.image}
                  alt={type.name}
                  fill
                  sizes="(max-width: 900px) 70vw, 30vw"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
              <Link href={type.href} className="type-link">
                <span style={{ fontSize: '0.7em' }}>↳</span>
                {type.name}
              </Link>
              <p className="type-desc">{type.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
