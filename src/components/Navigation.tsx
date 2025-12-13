import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Mail, Menu, X, ArrowUpRight } from 'lucide-react'
import { spaceGrotesk, inter } from '../lib/fonts'

interface NavigationProps {
  theme?: 'dark' | 'light'
}

const Navigation: React.FC<NavigationProps> = ({ theme = 'dark' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const isHome = router.pathname === '/'

  useEffect(() => {
    setMounted(true)
    // Only track scroll on Home for the "delayed fixed" effect
    if (!isHome) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrollY(scrollPosition)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Calculate the y position based on scroll (Only for Home)
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
  const threshold = viewportHeight * 0.35 - 50
  
  // Logic: 
  // Home: Fixed. Stays at 0 until threshold, then moves up (-y) to simulate scrolling away.
  // Others: Absolute. Stays at 0 relative to page (so moves up naturally with scroll).
  const navY = isHome 
    ? (scrollY > threshold ? -(scrollY - threshold) : 0) 
    : 0

  const positionClass = (isHome || isMenuOpen) ? 'fixed' : 'absolute'
  
  // Text color logic
  // When menu is open, we force white text because the overlay is dark
  const textColor = (theme === 'light' && !isMenuOpen) ? 'text-[#1D1D1F]' : 'text-white'

  // Link helper
  const getLink = (hash: string) => isHome ? hash : `/${hash}`

  return (
    <>
      <motion.nav 
        className={`${positionClass} top-0 left-0 right-0 z-[100] px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] py-[38px] flex items-center justify-between pointer-events-none`}
        initial={isHome ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
        animate={{ 
          y: navY, 
          opacity: 1 
        }}
        transition={isHome ? { 
          y: { duration: 0, ease: "linear" },
          opacity: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
        } : { duration: 0 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className={`${textColor} font-space-grotesk font-medium text-[14.375px] leading-[14px] md:leading-[16.5px] pointer-events-auto`}
          initial={isHome ? { x: -100, opacity: 0, scale: 1 } : { x: 0, opacity: 1, scale: 1 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={isHome ? { duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }}
        >
          <Link href="/" className="hover:opacity-70 transition-opacity">
            Benedikt Schnupp
          </Link>
        </motion.div>
        
        {/* Mobile Hamburger Button */}
        <motion.div 
            className={`md:hidden ${textColor} pointer-events-auto z-50 ${isMenuOpen ? 'pointer-events-none' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isMenuOpen ? 0 : 1 }}
        >
            <button onClick={toggleMenu} aria-label="Toggle menu" className="p-2 -mr-2">
                <Menu className="w-6 h-6" />
            </button>
        </motion.div>
        
        {/* Desktop Links */}
        <motion.div 
          className={`hidden md:flex items-center sm:gap-10 gap-5 ${textColor} font-space-grotesk font-medium text-[12px] md:text-[14.375px] leading-[14px] md:leading-[16.5px] pointer-events-auto`}
          initial={isHome ? { x: 100, opacity: 0 } : { x: 0, opacity: 1 }}
          animate={{ x: 0, opacity: 1 }}
          transition={isHome ? { duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }}
        >
          <Link href="/" passHref legacyBehavior>
            <motion.a 
              className="cursor-pointer hover:opacity-70 transition-opacity"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Home
            </motion.a>
          </Link>
          <Link href="/about" passHref legacyBehavior>
            <motion.a 
              className="cursor-pointer hover:opacity-70 transition-opacity"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              About
            </motion.a>
          </Link>
          <Link href="/work" passHref legacyBehavior>
            <motion.a 
              className="cursor-pointer hover:opacity-70 transition-opacity"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Work
            </motion.a>
          </Link>
          <Link href="/contact" passHref legacyBehavior>
            <motion.a 
              className="cursor-pointer hover:opacity-70 transition-opacity inline-flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              aria-label="Contact"
            >
              <Mail className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </motion.a>
          </Link>
        </motion.div>
      </motion.nav>

      {mounted && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className={`${spaceGrotesk.variable} ${inter.variable}`}>
              <motion.div
                key="overlay"
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={closeMenu}
              />
              
              <motion.div
                key="drawer"
                className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#1C1D20] shadow-2xl flex flex-col z-[9999]"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                  {/* Header with Logo and Close Button */}
                <div className="flex justify-between items-center pt-[38px] px-4 sm:px-8 md:px-12">
                     <Link href="/" passHref legacyBehavior>
                        <a className="text-white font-space-grotesk font-medium text-[14.375px] leading-[14px] md:leading-[16.5px] hover:opacity-70 transition-opacity" onClick={closeMenu}>
                            Benedikt Schnupp
                        </a>
                     </Link>
                     <button onClick={closeMenu} className="text-white hover:text-white/70 transition-colors p-2 -mr-2">
                        <X className="w-6 h-6" />
                     </button>
                </div>

                <motion.div 
                  className="flex flex-col h-full px-4 sm:px-8 md:px-12 pb-12 overflow-y-auto"
                  initial="hidden"
                  animate="visible"
                  variants={{
                      hidden: { opacity: 0 },
                      visible: { 
                          opacity: 1,
                          transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                      }
                  }}
                >
                  {/* Navigation Links */}
                  <div className="flex flex-col gap-6 mb-12 pt-10">
                      {[
                          { name: 'Home', href: '/' },
                          { name: 'About', href: '/about' },
                          { name: 'Work', href: '/work' }
                      ].map((item) => (
                           <motion.div key={item.name} variants={{
                               hidden: { x: 20, opacity: 0 },
                               visible: { x: 0, opacity: 1, transition: { duration: 0.4 } }
                           }}>
                              <Link href={item.href} passHref legacyBehavior>
                                  <a className="text-white font-space-grotesk font-bold text-4xl hover:text-white/70 transition-colors" onClick={closeMenu}>
                                      {item.name}
                                  </a>
                              </Link>
                           </motion.div>
                      ))}
                  </div>

                  <motion.div className="w-12 h-[1px] bg-white/20 mb-10" variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.5 } } }}></motion.div>

                  {/* Footer Style Links */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                      
                      {/* Socials */}
                      <motion.div className="flex flex-col gap-4" variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 font-inter mb-2">Socials</h3>
                          <a 
                              href="https://linkedin.com/in/benedikt-schnupp-928112116" 
                              target="_blank" 
                              rel="noopener"
                              className="group flex items-center gap-1 text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit"
                          >
                              LinkedIn <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5" />
                          </a>
                          <a 
                              href="mailto:mail@benediktschnupp.com"
                              className="group flex items-center gap-1 text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit"
                          >
                              Email <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5" />
                          </a>
                      </motion.div>

                      {/* Legal */}
                      <motion.div className="flex flex-col gap-4" variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 font-inter mb-2">Legal</h3>
                          <Link href="/datenschutzerklaerung" passHref legacyBehavior>
                              <a className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit" onClick={closeMenu}>Privacy</a>
                          </Link>
                          <Link href="/impressum" passHref legacyBehavior>
                              <a className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit" onClick={closeMenu}>Imprint</a>
                          </Link>
                      </motion.div>
                  </div>

                  {/* Contact Button */}
                  <motion.div 
                      className="mt-auto pt-10"
                      variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                  >
                      <Link href="/contact" passHref legacyBehavior>
                          <a 
                              className="flex items-center justify-center gap-3 w-full bg-white text-black py-4 px-6 rounded-lg font-space-grotesk font-bold text-lg hover:bg-white/90 transition-colors"
                              onClick={closeMenu}
                          >
                              <Mail className="w-5 h-5" />
                              <span>Contact</span>
                          </a>
                      </Link>
                  </motion.div>

                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default Navigation 