'use client'
import Link from 'next/link'
import Image from 'next/image'

const divisions = [
  {
    number: '1',
    name: 'Studios',
    href: '/studios',
    image: '/img/colin-lloyd-eiQqGBAMgIE-unsplash.jpg',
    description: 'We collaborate with artists and brands to redefine the visual experience.',
    gradient: 'linear-gradient(160deg, #2a1405 0%, #7a3c14 30%, #c87840 60%, #e8a870 85%, #f0c090 100%)',
  },
  {
    number: '2',
    name: 'Productions',
    href: '/productions',
    image: '/img/daniela-becerra-SvwmxHVO9ko-unsplash.jpg',
    description: 'We develop and produce innovative programming across all film, streaming, broadcast & digital media.',
    gradient: 'linear-gradient(160deg, #0c0520 0%, #2c1060 35%, #6830a8 65%, #b060d8 85%, #d890f0 100%)',
  },
  {
    number: '3',
    name: 'Touring',
    href: '/touring',
    image: '/img/danny-howe-bn-D2bCvpik-unsplash.jpg',
    description: "We tour the world's biggest acts across the globe.",
    gradient: 'linear-gradient(160deg, #200808 0%, #7b2010 35%, #c84020 65%, #e86830 85%, #f09060 100%)',
  },
]

export default function DivisionsSection() {
  return (
    <ul className="divisions">
      {divisions.map((div) => (
        <li key={div.number} className="division-panel" data-header-scheme="light">
          <div
            className="division-panel-bg"
            style={{ background: div.gradient }}
          >
            <Image
              src={div.image}
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div className="division-panel-overlay" />

          <div className="division-panel-content">
            <div className="division-panel-grid">
              <span className="division-panel-num">{div.number}</span>

              <Link href={div.href} className="division-panel-name">
                {div.name}
              </Link>

              <div className="division-panel-right">
                <p className="division-panel-desc">{div.description}</p>
                <Link href={div.href} className="division-panel-learn">
                  <span style={{ fontSize: '0.75em' }}>↳</span> Learn More
                </Link>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
