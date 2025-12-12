import React, { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, Mail, Linkedin } from 'lucide-react'

const About = () => {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-10%" })

  const services = [
    "Creative Development",
    "Motion Design",
    "UI/UX Architecture",
    "Generative AI"
  ]
 // TODO: add "Awards: 4+"
  const stats = [
    { label: "Years Experience", value: "10+" },
    { label: "Projects Delivered", value: "400+" },
    { label: "Awards", value: "4+" },
  ]

  return (
    <section 
      id="about" 
      ref={containerRef}
      className="bg-white py-12 md:py-24 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Top Headline Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-12"
        >
          <h2 className="text-[11vw] sm:text-[9vw] md:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-tight font-bold font-space-grotesk text-black mix-blend-exclusion">
            <div>Crafting Connections</div>
            <div>through Code &</div>
            <div>Creativity</div>
          </h2>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6">
          
          {/* Left Column: Bio & CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="text-2xl md:text-3xl font-space-grotesk font-medium mb-5">
                Building digital experiences that matter.
              </h3>
              <div className="space-y-6 text-lg md:text-xl text-neutral-700 font-inter leading-relaxed max-w-2xl">
                <p>
                  I'm a creative, tech-savvy <span className="text-black font-semibold">Motion Designer & Front-End Developer</span> with a passion for blending storytelling with cutting-edge code.
                </p>
                {/* <p>
                  From branding to modern web development, I plan and build innovative visual concepts. Leveraging deep technical expertise in contemporary web technologies and generative AI tools, I deliver high-performance, scalable interfaces that elevate brand identity.
                </p>
                <p>
                  Proactive, solution-oriented, and committed to driving impactful, brand-defining projects from idea to launch.
                </p> */}
              </div>
            </motion.div>

            {/* Buttons / Actions */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 flex flex-wrap gap-4 items-center"
            >
              <Link 
                href="/contact"
                className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-black text-white rounded-full overflow-hidden transition-all hover:bg-neutral-800"
              >
                <span className="relative z-10 font-medium text-lg mr-2 font-inter">Let's Work Together</span>
                <ArrowUpRight className="w-5 h-5 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              
              <div className="flex gap-2">
                <a 
                  href="https://linkedin.com/in/benedikt-schnupp-928112116" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:border-neutral-300 transition-colors text-black"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="mailto:mail@benediktschnupp.com"
                  className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 hover:border-neutral-300 transition-colors text-black"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Services & Stats */}
          <div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-6">
            
            {/* Services List */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h4 className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-3 font-inter">
                Expertise
              </h4>
              <ul className="space-y-1">
                {services.map((service, index) => (
                  <li key={index} className="text-xl md:text-2xl font-space-grotesk text-black">
                    {service}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h4 className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-3 font-inter">
                Impact
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-4xl md:text-5xl font-bold font-space-grotesk text-black mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-neutral-500 font-inter">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default About