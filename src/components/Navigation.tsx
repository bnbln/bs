import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface NavigationProps {
  theme?: 'dark' | 'light'
}

const Navigation: React.FC<NavigationProps> = ({ theme = 'dark' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const router = useRouter()
  const isHome = router.pathname === '/'

  useEffect(() => {
    // Only track scroll on Home for the "delayed fixed" effect
    if (!isHome) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrollY(scrollPosition)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

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

  const positionClass = isHome ? 'fixed' : 'absolute'
  
  // Text color logic
  const textColor = theme === 'light' ? 'text-[#1D1D1F]' : 'text-white'

  // Link helper
  const getLink = (hash: string) => isHome ? hash : `/${hash}`

  return (
    <>
      <motion.nav 
        className={`${positionClass} top-0 left-0 right-0 z-50 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] py-[38px] flex items-center justify-between pointer-events-none`}
        initial={isHome ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
        animate={{ 
          y: navY, 
          opacity: 1 
        }}
        transition={isHome ? { 
          y: { duration: 0, ease: "linear" },
          opacity: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
        } : { duration: 0 }}
        style={{zIndex: 1000}}
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
        
        <motion.div 
          className={`flex items-center sm:gap-10 gap-5 ${textColor} font-space-grotesk font-medium text-[12px] md:text-[14.375px] leading-[14px] md:leading-[16.5px] pointer-events-auto`}
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
          <motion.a 
            href={getLink('#contact')} 
            className="cursor-pointer hover:opacity-70 transition-opacity"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Contact
          </motion.a>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeMenu}
          >
            <motion.div
              className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex flex-col items-start justify-start h-full pt-32 px-10">
                <Link href="/about" passHref legacyBehavior>
                  <motion.a
                    className="text-black font-space-grotesk font-medium text-[16px] leading-[20px] mb-8 cursor-pointer block"
                    whileHover={{ scale: 1.05, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={closeMenu}
                  >
                    About
                  </motion.a>
                </Link>
                <Link href="/work" passHref legacyBehavior>
                  <motion.a
                    className="text-black font-space-grotesk font-medium text-[16px] leading-[20px] mb-8 cursor-pointer block"
                    whileHover={{ scale: 1.05, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={closeMenu}
                  >
                    Work
                  </motion.a>
                </Link>
                <motion.a
                  href={getLink('#contact')}
                  className="text-black font-space-grotesk font-medium text-[16px] leading-[20px] mb-8 cursor-pointer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={closeMenu}
                >
                  Contact
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navigation 