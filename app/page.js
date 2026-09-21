import Header from './components/Header'
import HeroSection from './components/HeroSection'
import DivisionsSection from './components/DivisionsSection'
import FeaturedWork from './components/FeaturedWork'
import PressSection from './components/PressSection'
import TypesOfWork from './components/TypesOfWork'
import Footer from './components/Footer'
import SmoothScroll from './components/SmoothScroll'

export default function Home() {
  return (
    <SmoothScroll>
      <a href="#content" className="sr-only focus:not-sr-only">Skip to content</a>
      <a href="#footer" className="sr-only focus:not-sr-only">Skip to footer</a>
      <Header />
      <main id="content">
        <HeroSection />
        <FeaturedWork />
        <DivisionsSection />
        <PressSection />
        <TypesOfWork />
      </main>
      <Footer />
    </SmoothScroll>
  )
}
