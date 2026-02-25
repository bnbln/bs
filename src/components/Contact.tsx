import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Mail, Linkedin, ArrowUpRight } from 'lucide-react'
import MagneticButton from './MagneticButton'

const Contact = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-10%" })

  // Live Clock State
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Berlin',
    }).format(date)
  }

  return (
    <section
      id="contact"
      ref={containerRef}
      className="bg-[#FAFAFA] py-16 md:py-24 lg:py-32 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full flex justify-center items-center"
    >
      {/* Subtle noise wash overlay for the entire section */}
      <div className="absolute inset-0 bg-[url('/assets/noise.png')] bg-repeat bg-[length:100px_100px] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      <div className="w-full max-w-[1400px] relative z-10">

        <motion.div
          className="relative flex flex-col w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >

          {/* Main Hero Zone */}
          <div className="pt-16 sm:pt-20 md:pt-28 lg:pt-40 pb-12 sm:pb-16 md:pb-20 lg:pb-28 flex flex-col items-center justify-center relative w-full">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full relative z-10 flex flex-col items-center text-center"
            >
              {/* Glass Available Badge matching Navigation.tsx */}
              <span
                className="inline-flex items-center gap-2 mb-6 md:mb-10 px-4 py-2 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-colors duration-500 bg-white/70 border-black/5"
                style={{ WebkitBackdropFilter: "blur(12px)" }}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-black/70 font-inter">Available for Q3</span>
              </span>

              {/* Massive Dynamic Headline with Inline Images */}
              <h2 className="text-[12vw] sm:text-[10vw] md:text-[8.5vw] lg:text-[7.5vw] xl:text-[7vw] leading-[1.05] tracking-tighter font-bold font-space-grotesk text-black mb-6 w-full max-w-[1200px] flex flex-wrap justify-center items-center gap-x-[2vw] gap-y-1 sm:gap-y-2">
                <span>LET'S</span>
                <span>CREATE</span>
                <span>SOMETHING</span>
                <span className="flex items-center text-neutral-300 w-full justify-center mt-2 gap-[2vw]">
                  <span className="flex items-center">
                    {/* Circle 1: The Portrait */}
                    <span className="relative z-10 inline-block w-[1em] h-[1em] rounded-full overflow-hidden border-[0.05em] border-[#FAFAFA] shadow-sm shrink-0 bg-neutral-100">
                      <img src="/assets/portrait.webp" alt="Benedikt Schnupp" className="w-full h-full object-cover mix-blend-multiply" />
                    </span>
                    {/* Circle 2: The Client (Empty/Symbolic) */}
                    <span className="relative z-0 inline-flex items-center justify-center w-[1em] h-[1em] rounded-full border-[0.05em] border-neutral-300 border-dashed bg-white shrink-0 -ml-[0.3em] shadow-sm">
                      <ArrowUpRight className="w-1/2 h-1/2 text-neutral-400" strokeWidth={2} />
                    </span>
                  </span>
                  <motion.span
                    className="flex cursor-default text-neutral-300"
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                  >
                    {"TOGETHER.".split("").map((char, index) => (
                      <motion.span
                        key={index}
                        variants={{
                          rest: { color: "#d4d4d4", opacity: 0.8 },
                          hover: { color: "#000000", opacity: 1 }
                        }}
                        transition={{
                          duration: 0.25,
                          delay: index * 0.04,
                          ease: "easeOut"
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </motion.span>
                </span>
              </h2>

              {/* Redistributed Identity Info */}
              <div className="flex flex-col items-center mt-8 md:mt-12">
                <span className="text-base md:text-lg font-space-grotesk font-semibold text-black">Benedikt Schnupp</span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 font-inter mt-1">
                  Branding, Motion, UX/UI & Development
                </span>
              </div>

            </motion.div>
          </div>

          {/* Bottom Bar: Action & Engagement Zone */}
          <div className="flex flex-col lg:flex-row items-center justify-between pt-8 border-t border-neutral-200/80 gap-8 lg:gap-0">

            {/* Left: Meta Data & Engagement Options */}
            <div className="flex flex-col items-center lg:items-start gap-6 w-full lg:w-auto">

              {/* Redistributed Location & Time */}
              <div className="flex items-center gap-3 text-center lg:text-left text-neutral-500 font-medium bg-neutral-50/50 px-4 py-2 rounded-full border border-neutral-200/50">
                <span className="text-[10px] md:text-xs font-inter">
                  Berlin, Germany
                </span>
                <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                <span className="text-[10px] md:text-xs font-mono text-black font-semibold tabular-nums tracking-tight">
                  CET {time ? formatTime(time) : '00:00:00'}
                </span>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-3">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 font-inter text-center lg:text-left">
                  Engagement Options
                </span>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 max-w-[300px] sm:max-w-none">
                  {["Freelance", "Contract", "Consulting", "Retainer"].map((tag, i) => (
                    <span key={i} className="px-4 py-2 bg-white/80 border border-neutral-200/60 rounded-full text-[10px] sm:text-xs font-inter font-medium text-neutral-600 shadow-sm backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">

              {/* Secondary Actions */}
              <div className="flex gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                <MagneticButton>
                  <a
                    href="https://linkedin.com/in/benedikt-schnupp-928112116"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center justify-center w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] md:w-[68px] md:h-[68px] rounded-full border border-neutral-200 hover:border-black hover:bg-black transition-all text-black hover:text-white bg-white shadow-sm"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
                  </a>
                </MagneticButton>
                <MagneticButton>
                  <a
                    href="mailto:mail@benediktschnupp.com"
                    className="group flex flex-col items-center justify-center w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] md:w-[68px] md:h-[68px] rounded-full border border-neutral-200 hover:border-black hover:bg-black transition-all text-black hover:text-white bg-white shadow-sm"
                    aria-label="Email"
                  >
                    <Mail className="w-5 h-5 lg:w-6 lg:h-6 mb-0.5" />
                  </a>
                </MagneticButton>
              </div>

              {/* Primary CTA */}
              <MagneticButton className="w-full sm:w-auto">
                <Link
                  href="/contact"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center sm:justify-between px-8 py-4 sm:py-5 md:px-10 lg:py-6 bg-[#1C1D20] text-white rounded-full overflow-hidden transition-all duration-500 hover:bg-black shadow-[0_8px_20px_rgb(0,0,0,0.15)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.25)] flex-grow"
                >
                  <span className="relative z-10 font-space-grotesk font-bold text-base sm:text-lg md:text-xl tracking-wide sm:mr-6 mr-3">Start a Project</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors duration-500 relative z-10 shrink-0">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-45 transition-transform duration-500" />
                  </div>
                </Link>
              </MagneticButton>

            </div>
          </div>

        </motion.div>
      </div>
    </section>
  )
}

export default Contact
