import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Mail, Linkedin } from 'lucide-react'

import MagneticButton from './MagneticButton'

// Word-by-word scroll reveal component
const ScrubText = ({ text, progress }: { text: string, progress: any }) => {
  const words = text.split(" ")
  return (
    <p className="text-[1.75rem] md:text-4xl lg:text-5xl text-black font-medium leading-[1.3] md:leading-[1.4] max-w-4xl flex flex-wrap gap-x-[0.25em] gap-y-[0.1em] tracking-tight">
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + (1 / words.length)
        // Ensure text is faded before it hits the scroll range, then fully opaque after
        const opacity = useTransform(progress, [start, end], [0.15, 1])
        return (
          <motion.span key={i} style={{ opacity }} className="relative text-black">
            {word}
          </motion.span>
        )
      })}
    </p>
  )
}

const About = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track scroll through the bio section to scrub the text opacity
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "start 10%"]
  })

  const stats = [
    { label: "Years Experience", value: "10+" },
    { label: "Projects Delivered", value: "400+" },
    { label: "Awards", value: "4+" },
  ]

  return (
    <section
      id="about"
      ref={containerRef}
      className="bg-[#FAFAFA] py-24 md:py-32 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full border-t border-neutral-100"
    >
      {/* Container: Asymmetric Sticky Layout */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 relative z-10">

        {/* Left Column: Fixed Headline (Sticky on Desktop) */}
        <div className="lg:w-[40%] flex-shrink-0">
          <div className="lg:sticky lg:top-32 flex flex-col gap-12">
            <h2 className="text-5xl md:text-7xl lg:text-[6vw] leading-[1.05] tracking-tighter font-bold text-black mix-blend-exclusion">
              Moving<br />Pixels with<br />Code &<br />Creativity.
            </h2>

            {/* Desktop Socials */}
            <div className="hidden lg:flex gap-4">
              <MagneticButton>
                <a
                  href="https://linkedin.com/in/benedikt-schnupp-928112116"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-100 transition-colors text-black bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="mailto:mail@benediktschnupp.com"
                  className="w-14 h-14 rounded-full border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-100 transition-colors text-black bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Right Column: Scrubbing Bio, Premium Stats, CTA */}
        <div className="lg:w-[60%] flex flex-col gap-24 lg:pt-12">

          {/* Scroll-Driven Scrubbing Bio */}
          <div className="min-h-[40vh] lg:min-h-[60vh] flex items-start">
            <ScrubText
              text="As a freelance motion designer and developer, I bridge the gap between brand identity and digital product. I craft visual systems that span brand, motion, and UX — then engineer them in React and Next.js to ensure pixel-perfect execution at scale."
              progress={scrollYProgress}
            />
          </div>

          {/* Elevated Glass UI Stats */}
          <div className="flex flex-col gap-6">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 font-inter px-2">
              The Impact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white border border-neutral-200/80 rounded-[2rem] p-8 md:p-10 hover:bg-neutral-50 transition-all duration-500 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden"
                >
                  <div className="text-5xl md:text-6xl font-bold font-space-grotesk text-black mb-3 tracking-tighter">
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base text-neutral-500 font-inter font-medium tracking-wide">
                    {stat.label}
                  </div>
                  {/* Subtle hover gradient wash */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Magnetic CTA & Mobile Socials */}
          <div className="pt-12 border-t border-neutral-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 pb-12">
            <MagneticButton>
              <Link
                href="/contact"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#1C1D20] text-white rounded-full overflow-hidden transition-all hover:bg-black shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10 font-medium text-lg mr-2 font-inter">Let's Work Together</span>
                <ArrowUpRight className="w-5 h-5 relative z-10 group-hover:rotate-45 transition-transform duration-300" />
              </Link>
            </MagneticButton>

            {/* Mobile Socials (Hidden on desktop) */}
            <div className="flex lg:hidden gap-4">
              <MagneticButton>
                <a
                  href="https://linkedin.com/in/benedikt-schnupp-928112116"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-100 transition-colors text-black bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="mailto:mail@benediktschnupp.com"
                  className="w-14 h-14 rounded-full border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-100 transition-colors text-black bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </MagneticButton>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default About