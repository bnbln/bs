import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrollY(scrollPosition)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Calculate the y position based on scroll
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
  const threshold = viewportHeight * 0.35
  const navY = scrollY > threshold ? -(scrollY - threshold) : 0
  
  // Add offset to hamburger menu appearance to prevent overlapping
  const hamburgerOffset = viewportHeight * 0.7 // pixels
  const showHamburger = scrollY > (threshold + hamburgerOffset)

  return (
    <>
      {/* Main Navigation - Scrolls up with page content when scrolled */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 px-10 py-[38px] flex items-center justify-between"
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: navY, 
          opacity: 1 
        }}
        transition={{ 
          y: { duration: 0, ease: "linear" }, // No transition for y to follow scroll smoothly
          opacity: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
        }}
        style={{zIndex: 1000}}
        viewport={{ once: true }}
      >
        <motion.div 
          className="text-white font-space-grotesk font-medium text-[12px] md:text-[14.375px] leading-[14px] md:leading-[16.5px]"
          initial={{ x: -100, opacity: 0, scale: 1 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Benedikt Schnupp
        </motion.div>
        
        <motion.div 
          className="flex items-center md:gap-10 gap-5 text-white font-space-grotesk font-medium text-[12px] md:text-[14.375px] leading-[14px] md:leading-[16.5px]"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.a 
            href="#about" 
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            About
          </motion.a>
          <motion.a 
            href="#work" 
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Work
          </motion.a>
          <motion.a 
            href="#contact" 
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Contact
          </motion.a>
        </motion.div>
      </motion.nav>

      {/* Circular Hamburger Menu - Appears when scrolled */}
      {/* <AnimatePresence>
        {showHamburger && (
          <motion.div
            className="fixed top-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.button
              className="w-14 h-14 bg-white rounded-full shadow-lg flex flex-col justify-center items-center cursor-pointer"
              onClick={toggleMenu}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                className="block w-6 h-0.5 bg-black mb-1.5 transition-all duration-300"
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 6 : 0
                }}
              />
              <motion.span
                className="block w-6 h-0.5 bg-black mb-1.5 transition-all duration-300"
                animate={{
                  opacity: isMenuOpen ? 0 : 1
                }}
              />
              <motion.span
                className="block w-6 h-0.5 bg-black transition-all duration-300"
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? -6 : 0
                }}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence> */}

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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-start justify-start h-full pt-32 px-10">
                <motion.a
                  href="#about"
                  className="text-black font-space-grotesk font-medium text-[16px] leading-[20px] mb-8 cursor-pointer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={closeMenu}
                >
                  About
                </motion.a>
                <motion.a
                  href="#work"
                  className="text-black font-space-grotesk font-medium text-[16px] leading-[20px] mb-8 cursor-pointer"
                  whileHover={{ scale: 1.05, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onClick={closeMenu}
                >
                  Work
                </motion.a>
                <motion.a
                  href="#contact"
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