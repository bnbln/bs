import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [isDesktop, setIsDesktop] = useState(false)
  const footerRef = useRef<HTMLElement>(null)
  
  // Motion values for scroll-linked animation
  const revealProgress = useMotionValue(0)
  
  // Check for desktop environment and handle scroll logic
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    
    window.addEventListener('resize', checkDesktop)
    
    // Scroll listener to update reveal progress based on distance to bottom
    const handleScroll = () => {
        if (window.innerWidth < 768) return
        
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        const docHeight = document.documentElement.scrollHeight
        const distanceToBottom = docHeight - scrollY - windowHeight
        
        // We want the animation to run over the last 400px of scrolling
        // 0 = fully revealed (at bottom), 1 = hidden (400px away)
        const progress = Math.max(0, Math.min(1, 1 - (distanceToBottom / 400)))
        revealProgress.set(progress)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Initial call
    handleScroll()
    
    return () => {
        window.removeEventListener('resize', checkDesktop)
        window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Derived animations from revealProgress (0 to 1)
  const y = useTransform(revealProgress, [0, 1], [50, 0]) // Moves up into place
  const opacity = useTransform(revealProgress, [0, 0.5, 1], [0.3, 0.6, 1]) 
  
  // Animation variants (Mobile only)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as any } }
  }

  // Dynamic style props based on device
  const desktopProps = isDesktop ? { 
      style: { y, opacity },
      animate: "visible"
  } : {}
  
  const mobileProps = !isDesktop ? {
      variants: containerVariants,
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true }
  } : {}

  return (
    <footer
      ref={footerRef}
      className="w-full bg-[#1C1D20] flex flex-col justify-between py-12 md:py-20 relative z-10 md:fixed md:bottom-0 md:left-0 md:-z-10 md:h-[500px]"
    >
      <motion.div 
        className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] pointer-events-auto grid grid-cols-1 md:grid-cols-12 gap-12"
        {...desktopProps}
        {...mobileProps}
      >
        
        {/* Brand Column */}
        <motion.div className="md:col-span-4 flex flex-col justify-between h-full" variants={itemVariants}>
          <div>
             <h2 className="text-white font-space-grotesk font-bold text-2xl md:text-3xl mb-2">Benedikt Schnupp</h2>
             <p className="text-white/40 font-inter text-sm max-w-xs leading-relaxed">
               Creative Motion Designer & Developer based in Berlin, crafting digital experiences.
             </p>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="hidden md:block md:col-span-2"></div>

        {/* Links Column: Sitemap */}
        <motion.div className="md:col-span-2 flex flex-col gap-4" variants={itemVariants}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 font-inter mb-2">Sitemap</h3>
            <div className="flex flex-col gap-4">
              <Link href="/about" className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit">
                About
              </Link>
              <Link href="/work" className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit">
                Work
              </Link>
              <Link href="/contact" className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit">
                Contact
              </Link>
            </div>
        </motion.div>

        {/* Links Column: Socials */}
        <motion.div className="md:col-span-2 flex flex-col gap-4" variants={itemVariants}>
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

        {/* Links Column: Legal */}
        <motion.div className="md:col-span-2 flex flex-col gap-4" variants={itemVariants}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 font-inter mb-2">Legal</h3>
            <a href="/datenschutzerklaerung" className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit">Privacy</a>
            <a href="/impressum" className="text-white/70 font-space-grotesk text-[15px] hover:text-white transition-colors w-fit">Imprint</a>
        </motion.div>

      </motion.div>

      {/* Bottom Bar */}
      <motion.div 
        className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] pointer-events-auto mt-12 md:mt-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        {...desktopProps}
        {...mobileProps}
        // Force override variants for bottom bar if needed, but inheriting is fine
      >
         <div className="text-white/30 font-inter text-[12px]">
            © {currentYear} Benedikt Schnupp. All rights reserved.
         </div>
         <div className="text-white/30 font-inter text-[12px]">
            Berlin, Germany
         </div>
      </motion.div>
    </footer>
  )
}

export default Footer 