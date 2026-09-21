'use client'
import Link from 'next/link'
import Image from 'next/image'

const pressItems = [
  {
    publication: 'GQ',
    image: '/img/abigail-lynn-rdmJc2Os4EM-unsplash.jpg',
    logoGradient: 'linear-gradient(135deg, #f0efec 0%, #e8e6e2 100%)',
    logoColor: '#cc0000',
    title: 'Silent House Group named one of “The 20 Most Creative Companies in the World” by GQ',
    href: '#',
  },
  {
    publication: 'Rolling Stone',
    image: '/img/actionvance-eXVd7gDPO9A-unsplash.jpg',
    logoGradient: 'linear-gradient(135deg, #f0efec 0%, #e8e6e2 100%)',
    logoColor: '#cc0000',
    title: "Inside Baz Halpin's Spectacular Visions for Taylor Swift, No Doubt, and more",
    href: '#',
  },
  {
    publication: 'The Verge',
    image: '/img/nainoa-shizuru-NcdG9mK3PBY-unsplash.jpg',
    logoGradient: 'linear-gradient(135deg, #f0efec 0%, #e8e6e2 100%)',
    logoColor: '#000000',
    title: 'How to design a tour good enough for Katy Perry, Taylor Swift, or J.Lo',
    href: '#',
  },
]

const logoStyles = {
  GQ: { fontFamily: 'Georgia, serif', fontSize: '52px', fontWeight: '900', letterSpacing: '-0.05em', color: '#cc0000' },
  'Rolling Stone': { fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '900', letterSpacing: '0.02em', color: '#d40000', textTransform: 'uppercase' },
  'The Verge': { fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: '800', letterSpacing: '-0.04em', color: '#000' },
}

export default function PressSection() {
  return (
    <section className="press-section">
      <h2 className="press-heading">Press</h2>

      <ul className="press-list">
        {pressItems.map((item) => (
          <li key={item.publication} className="press-item">
            <div className="press-logo-box">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 900px) 100px, 25vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
              <span style={logoStyles[item.publication] || {}}>
                {item.publication}
              </span>
            </div>

            {/* spacer col */}
            <div />

            <div>
              <p className="press-title">{item.title}</p>
              <p className="press-source">{item.publication}</p>
            </div>

            <a href={item.href} className="press-read" target="_blank" rel="noopener noreferrer">
              Read&nbsp;↗
            </a>
          </li>
        ))}
      </ul>

      <div className="press-footer">
        <Link href="/press" className="press-view-all">
          <span>↳</span> View all Press
        </Link>
      </div>
    </section>
  )
}
