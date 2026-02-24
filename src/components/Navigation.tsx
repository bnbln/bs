import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Mail, Menu, X, ArrowUpRight } from 'lucide-react'
import { spaceGrotesk, inter } from '../lib/fonts'

interface NavigationProps {
  theme?: 'dark' | 'light'
}

const desktopNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Work', href: '/work' }
] as const

type DesktopNavItem = (typeof desktopNavLinks)[number]['name'] | 'Contact'
type PillRect = { x: number; y: number; width: number; height: number }

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
let lastRouteActiveNavItem: DesktopNavItem | null = null
let lastRouteTheme: 'dark' | 'light' | null = null

const getActiveNavItem = (pathname: string): DesktopNavItem | null => {
  if (pathname === '/') return 'Home'
  if (pathname.startsWith('/about')) return 'About'
  if (pathname.startsWith('/work') || pathname.startsWith('/project')) return 'Work'
  if (pathname.startsWith('/contact')) return 'Contact'
  return null
}

const Navigation: React.FC<NavigationProps> = ({ theme = 'dark' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Track theme to allow smooth cross-route color transitions
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>(
    typeof window !== 'undefined' && lastRouteTheme ? lastRouteTheme : theme
  )

  const router = useRouter()
  const isHome = router.pathname === '/'
  const activeNavItem = getActiveNavItem(router.pathname)
  const [hoveredNavItem, setHoveredNavItem] = useState<DesktopNavItem | null>(null)
  const highlightedNavItem = hoveredNavItem ?? activeNavItem
  const linksContainerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<DesktopNavItem, HTMLAnchorElement | null>>({
    Home: null,
    About: null,
    Work: null,
    Contact: null
  })
  const [pillRect, setPillRect] = useState<PillRect | null>(null)
  const didRunInitialRouteAnimation = useRef(false)
  const routeAnimationFrameRef = useRef<number | null>(null)

  const getItemRect = useCallback((targetItem: DesktopNavItem | null): PillRect | null => {
    const containerEl = linksContainerRef.current
    const targetEl = targetItem ? itemRefs.current[targetItem] : null

    if (!containerEl || !targetEl) return null

    const containerRect = containerEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()

    return {
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      width: targetRect.width,
      height: targetRect.height
    }
  }, [])

  const updatePillRect = useCallback((targetItem: DesktopNavItem | null) => {
    const nextRect = getItemRect(targetItem)
    if (!nextRect) {
      setPillRect(null)
      return
    }

    setPillRect((prev) => {
      if (
        prev &&
        Math.abs(prev.x - nextRect.x) < 0.5 &&
        Math.abs(prev.y - nextRect.y) < 0.5 &&
        Math.abs(prev.width - nextRect.width) < 0.5 &&
        Math.abs(prev.height - nextRect.height) < 0.5
      ) {
        return prev
      }
      return nextRect
    })
  }, [getItemRect])

  useIsomorphicLayoutEffect(() => {
    if (!didRunInitialRouteAnimation.current) {
      didRunInitialRouteAnimation.current = true
      const previousItem = lastRouteActiveNavItem
      const shouldAnimateFromPrevious =
        previousItem &&
        highlightedNavItem &&
        hoveredNavItem === null &&
        previousItem !== highlightedNavItem

      if (shouldAnimateFromPrevious) {
        const previousRect = getItemRect(previousItem)
        const nextRect = getItemRect(highlightedNavItem)
        if (previousRect && nextRect) {
          setPillRect(previousRect)
          routeAnimationFrameRef.current = window.requestAnimationFrame(() => {
            setPillRect(nextRect)
          })
          return
        }
      }
    }

    updatePillRect(highlightedNavItem)
  }, [highlightedNavItem, hoveredNavItem, getItemRect, updatePillRect])

  useEffect(() => {
    const handleResize = () => updatePillRect(highlightedNavItem)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [highlightedNavItem, updatePillRect])

  useEffect(() => {
    return () => {
      if (routeAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(routeAnimationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setHoveredNavItem(null)
  }, [router.pathname])

  useEffect(() => {
    lastRouteActiveNavItem = activeNavItem
    lastRouteTheme = theme
  }, [activeNavItem, theme])

  useEffect(() => {
    if (activeTheme !== theme) {
      // Delay switching to the current theme to trigger CSS transitions after mount
      const timer = setTimeout(() => setActiveTheme(theme), 50)
      return () => clearTimeout(timer)
    }
  }, [theme, activeTheme])

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

  const isLight = activeTheme === 'light' && !isMenuOpen
  // Floating pill styles 
  const navBgColor = isLight ? 'bg-[#fff]/60 border-black/10' : 'bg-[#1C1D20]/80 border-white/10'

  // Unselected states (standard text in container)
  const unselectedTextClass = isLight ? 'text-black/70 hover:text-black' : 'text-white/70 hover:text-white'

  // Active pill state
  const pillBgClass = isLight ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'bg-white'
  const pillTextClass = isLight ? 'text-black' : 'text-black' // Both themes use black text on a white pill

  // The conditional darken layer for light mode that only affects the background
  const BlendLayer = () => (
    isLight ? <div className={`absolute inset-0 z-[-1] mix-blend-darken ${navBgColor}/[10] rounded-full pointer-events-none`} /> : null
  )

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        className={`hidden lg:flex fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-fit pl-6 pr-2 py-1.5 rounded-full items-center justify-center pointer-events-auto backdrop-blur-md border shadow-sm ${navBgColor} transition-colors duration-500 overflow-hidden`}
        style={{ WebkitBackdropFilter: "blur(12px)", willChange: "transform, opacity" }}
      >
        {/* <BlendLayer /> */}

        {/* Logo / Name */}
        <Link href="/" className={`pr-6 py-2 ${unselectedTextClass} font-space-grotesk font-medium text-[14.375px] leading-tight hover:opacity-70 transition-colors duration-500 z-10 shrink-0`}>
          Benedikt Schnupp
        </Link>

        {/* Desktop Links Container */}
        <div ref={linksContainerRef} className="relative flex items-center gap-1">
          {/* Base Unselected Links */}
          {desktopNavLinks.map((link) => (
            <Link key={`base-${link.name}`} href={link.href} passHref legacyBehavior>
              <a
                ref={(node) => {
                  itemRefs.current[link.name] = node
                }}
                className={`relative px-4 py-2 rounded-full font-inter font-medium text-[13.5px] transition-colors duration-500 z-10 ${unselectedTextClass}`}
                onMouseEnter={() => setHoveredNavItem(link.name)}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                {link.name}
              </a>
            </Link>
          ))}

          <Link href="/contact" passHref legacyBehavior>
            <a
              ref={(node) => {
                itemRefs.current.Contact = node
              }}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500 z-10 ${unselectedTextClass}`}
              onMouseEnter={() => setHoveredNavItem('Contact')}
              onMouseLeave={() => setHoveredNavItem(null)}
              aria-label="Contact"
            >
              <Mail className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </a>
          </Link>

          {/* Active Highlight Pill / Mask */}
          {pillRect && (
            <motion.div
              className={`absolute top-0 left-0 rounded-full z-20 pointer-events-none overflow-hidden ${pillBgClass}`}
              initial={false}
              animate={{
                x: pillRect.x,
                y: pillRect.y,
                width: pillRect.width,
                height: pillRect.height,
                opacity: 1
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Duplicate translated content perfectly masking underneath */}
              <motion.div
                className="absolute top-0 left-0 flex items-center gap-1"
                initial={false}
                animate={{
                  x: -pillRect.x,
                  y: -pillRect.y,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                {desktopNavLinks.map((link) => (
                  <div key={`mask-${link.name}`} className={`relative px-4 py-2 rounded-full font-inter font-medium text-[13.5px] whitespace-nowrap ${pillTextClass}`}>
                    {link.name}
                  </div>
                ))}

                <div className={`relative w-9 h-9 rounded-full flex items-center justify-center ${pillTextClass}`}>
                  <Mail className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.nav
        className={`lg:hidden fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] flex items-center justify-between pointer-events-none transition-colors duration-500`}
      >
        {/* Title Pill */}
        <Link href="/" style={{ WebkitBackdropFilter: "blur(12px)" }} className={`pointer-events-auto px-6 h-[46px] rounded-full flex items-center justify-center backdrop-blur-md border shadow-sm ${navBgColor} ${unselectedTextClass} font-space-grotesk font-medium text-[14.375px] leading-none hover:opacity-70 transition-colors duration-500 z-10 relative overflow-hidden`}>
          <BlendLayer />
          Benedikt Schnupp
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMenu}
          aria-label="Toggle menu"
          style={{ WebkitBackdropFilter: "blur(12px)" }}
          className={`pointer-events-auto w-[46px] h-[46px] flex items-center justify-center rounded-full backdrop-blur-md border shadow-sm ${navBgColor} ${unselectedTextClass} hover:opacity-70 transition-colors duration-500 z-10 relative overflow-hidden`}
        >
          <BlendLayer />
          <Menu className="w-5 h-5 relative z-10" />
        </button>
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
                          <a
                            className={`font-inter font-bold text-4xl transition-colors ${activeNavItem === item.name ? 'text-white' : 'text-white/70 hover:text-white'}`}
                            onClick={closeMenu}
                          >
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
                        className="group flex items-center gap-1 text-white/70 font-inter text-[15px] hover:text-white transition-colors w-fit"
                      >
                        LinkedIn <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5" />
                      </a>
                      <a
                        href="mailto:mail@benediktschnupp.com"
                        className="group flex items-center gap-1 text-white/70 font-inter text-[15px] hover:text-white transition-colors w-fit"
                      >
                        Email <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5" />
                      </a>
                    </motion.div>

                    {/* Legal */}
                    <motion.div className="flex flex-col gap-4" variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 font-inter mb-2">Legal</h3>
                      <Link href="/datenschutzerklaerung" passHref legacyBehavior>
                        <a className="text-white/70 font-inter text-[15px] hover:text-white transition-colors w-fit" onClick={closeMenu}>Privacy</a>
                      </Link>
                      <Link href="/impressum" passHref legacyBehavior>
                        <a className="text-white/70 font-inter text-[15px] hover:text-white transition-colors w-fit" onClick={closeMenu}>Imprint</a>
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
                        className="flex items-center justify-center gap-3 w-full bg-white text-black py-4 px-6 rounded-lg font-inter font-bold text-lg hover:bg-white/90 transition-colors"
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
