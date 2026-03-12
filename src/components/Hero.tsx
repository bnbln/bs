import React from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import Image from 'next/image'
import ScrollVelocity from './ScrollVelocity'
const locationIcon = '/assets/locationBackground.svg'
const worldIcon = '/assets/World Icon.svg'
const arrowIcon = '/assets/arrow.svg'

const Hero = ({ title = "Benedikt Schnupp", location = "Berlin, Germany" }: { title?: string, location?: string }) => {
  const containerRef = React.useRef<HTMLElement>(null)

  // Vertical scroll parallax for background and floating elements
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  const floatingY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"])

  // Mouse move parallax for subtle depth reactions
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  // Floating elements moves inversely to mouse to feel "behind"
  const floatingElementX = useTransform(smoothMouseX, [-0.5, 0.5], ["3%", "-3%"])
  const floatingElementY = useTransform(smoothMouseY, [-0.5, 0.5], ["3%", "-3%"])

  // Foreground subject moves slightly with the mouse
  const fgX = useTransform(smoothMouseX, [-0.5, 0.5], ["-1%", "1%"])
  const fgY = useTransform(smoothMouseY, [-0.5, 0.5], ["-1%", "1%"])

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    // Normalize coordinates to -0.5 to 0.5
    mouseX.set(clientX / innerWidth - 0.5)
    mouseY.set(clientY / innerHeight - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[90vh] min-h-[600px] md:h-[100vh] md:min-h-0 w-full overflow-hidden bg-[#1C1D20]"
    >
      {/* 1. LAYER 0: Background Image (Slight Parallax on Scroll) */}
      <motion.div
        className="absolute inset-0 z-0 origin-center"
        style={{ y: bgY, scale: 1.05 }}
      >
        <Image
          src="/assets/heroimage-bg.webp"
          alt=""
          aria-hidden="true"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 85%' }}
        />
      </motion.div>

      {/* 2. LAYER 1: Interactive Floating Elements (Deep Mouse Parallax) */}
      {/* <motion.div
        className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center p-32"
        style={{ x: floatingElementX, y: floatingElementY }}
      > */}
      {/* Decorative Graphic Element behind the subject */}
      {/* <motion.div
          className="w-48 h-48 rounded-full border border-white/10 bg-white/5 backdrop-blur-md absolute top-1/4 left-1/4 hidden md:block"
          style={{ y: floatingY }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 60 }}
        />
        <motion.div
          className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent absolute top-1/2 -ml-32 hidden md:block"
          style={{ y: floatingY, rotate: -15 }}
        />
      </motion.div> */}

      {/* 3. LAYER 2: Title - ScrollVelocity text */}
      <motion.div
        className="absolute md:bottom-[172px] sm:bottom-[240px] bottom-[240px] left-[-260px] z-30 md:z-10"
        style={{ height: '150px' }}
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <ScrollVelocity
          texts={[`${title} – `]}
          velocity={-50}
          className="hero-text text-white font-space-grotesk font-bold"
          parallaxClassName=""
          scrollerClassName=""
          parallaxStyle={{ height: '150px' }}
          scrollerStyle={{
            height: '150px',
            lineHeight: '150px',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit'
          }}
          numCopies={8}
        />
      </motion.div>

      {/* 4. LAYER 3: Foreground Subject (Pinned, Subtle Mouse Parallax) */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none origin-center"
        style={{ x: fgX, y: fgY, scale: 1.05 }}
      >
        <Image
          src="/assets/heroimage-fg-v2.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 85%' }}
        />
      </motion.div>

      {/* 5. LAYER 4: Info Section (Minimalist Redesign) */}
      <div className="absolute md:bottom-[60px] bottom-[30px] left-6 right-6 z-30 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pointer-events-none">

        {/* Minimalist Location */}
        <motion.div
          className="flex items-center gap-3 backdrop-blur-md bg-black/20 px-4 py-2 rounded-full border border-white/10 pointer-events-auto"
          initial={{ y: 50, opacity: 0, z: 0 }}
          animate={{ y: 0, opacity: 1, z: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ WebkitBackdropFilter: "blur(12px)", willChange: "transform, opacity" }}
        >
          <img
            src={worldIcon}
            alt="World Icon"
            className="w-5 h-5 opacity-80"
          />
          <p className="text-white/90 font-space-grotesk tracking-wide font-medium text-sm">
            From {location}
          </p>
        </motion.div>

        {/* Minimalist Role Text */}
        <motion.div
          className="flex flex-col items-start md:items-end gap-[2px] text-white/90 font-inter font-normal text-xl md:text-2xl tracking-tight backdrop-blur-md bg-black/10 px-5 py-3 rounded-2xl border border-white/10 pointer-events-auto"
          initial={{ y: 50, opacity: 0, z: 0 }}
          animate={{ y: 0, opacity: 1, z: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ WebkitBackdropFilter: "blur(12px)", willChange: "transform, opacity" }}
        >
          <span className="block text-nowrap">Senior Designer</span>
          <div className="flex items-center gap-3">

            {/* <img
              src={arrowIcon}
              alt="Arrow"
              className="w-3 h-3 opacity-80"
            /> */}
          </div>
          <p className="block text-nowrap text-white/70">& Developer</p>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero 