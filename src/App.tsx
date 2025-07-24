import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './components/Hero'
import Navigation from './components/Navigation'
import FeaturedProjects from './components/FeaturedProjects'
import About from './components/About'
import Work from './components/Work'
import Contact from './components/Contact'
import Footer from './components/Footer'
import BrandExperience from './components/BrandExperience'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

function App() {
  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // GSAP animations
    const ctx = gsap.context(() => {
      // Hero text animation - only if component is rendered
      // REMOVED: This was causing upward motion conflict with Framer Motion
      // const heroText = document.querySelector('.hero-text')
      // if (heroText) {
      //   gsap.fromTo('.hero-text', 
      //     { y: 100, opacity: 0 },
      //     { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out' }
      //   )
      // }

      // Only add animations for components that are actually rendered
      // Commented out animations for now since components are commented out
      
      // gsap.fromTo('.project-card',
      //   { y: 50, opacity: 0 },
      //   { 
      //     y: 0, 
      //     opacity: 1, 
      //     duration: 0.8, 
      //     stagger: 0.2,
      //     ease: 'power2.out',
      //     scrollTrigger: {
      //       trigger: '.featured-projects',
      //       start: 'top 80%',
      //       end: 'bottom 20%',
      //     }
      //   }
      // )

      // gsap.fromTo('.brand-logo',
      //   { scale: 0.8, opacity: 0 },
      //   { 
      //     scale: 1, 
      //     opacity: 1, 
      //     duration: 0.6, 
      //     stagger: 0.1,
      //     ease: 'back.out(1.7)',
      //     scrollTrigger: {
      //       trigger: '.brand-experience',
      //       start: 'top 80%',
      //       end: 'bottom 20%',
      //     }
      //   }
      // )
    }, appRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={appRef} className="min-h-screen bg-white w-full">
      <Navigation />
      <Hero />
      <About />

      <div className="featured-projects">
        <FeaturedProjects />
      </div>
      
      {/* <Work /> */}
      <Contact />
      <div className="brand-experience">
        <BrandExperience />
      </div>
      <Footer />
    </div>
  )
}

export default App 