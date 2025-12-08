import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mail, Linkedin, Copy } from 'lucide-react'

const Contact = () => {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-10%" })
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('mail@benediktschnupp.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const offerings = [
    "Web Development", "React / Next.js", "Three.js / WebGL",
    "Motion Design", "3D Modeling", "Generative AI",
    "Branding", "UI/UX Design", "After Effects"
  ]

  return (
    <section 
      id="contact" 
      ref={containerRef}
      className="bg-white py-24 md:py-40 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Top Headline Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24"
        >
          <div className="flex items-center gap-4 md:gap-6 mb-4">
             <motion.div 
              className="w-[40px] h-[40px] md:w-[70px] md:h-[70px] rounded-full bg-cover bg-center shrink-0"
              style={{ backgroundImage: `url('/assets/portrait.webp')` }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
             <h2 className="text-[11vw] sm:text-[9vw] md:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-tight font-bold font-space-grotesk text-black">
              Let's work
            </h2>
          </div>
          <h2 className="text-[11vw] sm:text-[9vw] md:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-tight font-bold font-space-grotesk text-black">
            together
          </h2>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Left Column: Context & Tags */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xl md:text-2xl font-inter text-neutral-800 mb-8 max-w-2xl leading-relaxed">
                Available for freelance projects. I can help you with anything from video production to full-stack web development.
              </p>
              
              <div className="flex flex-wrap gap-2 md:gap-3">
                {offerings.map((item, index) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 rounded-full border border-neutral-200 text-sm md:text-base font-inter text-neutral-600 hover:border-black hover:text-black transition-colors cursor-default"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: CTA Actions */}
          <div className="lg:col-span-4 lg:col-start-9 flex flex-col justify-end gap-6">
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="text-sm font-semibold uppercase tracking-widest text-neutral-400 mb-4 font-inter">
                Get in touch
              </div>

               <div className="flex flex-col gap-4">
                 <button 
                  onClick={copyEmail}
                  className="group w-full flex items-center justify-between p-6 bg-[#1C1D20] text-white rounded-2xl hover:bg-black transition-all"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm text-neutral-400 mb-1">Drop me a line</span>
                    <span className="text-lg md:text-xl font-space-grotesk font-medium break-all sm:break-normal">mail@benediktschnupp.com</span>
                  </div>
                  <div className="relative shrink-0 ml-4">
                     <Copy className={`w-6 h-6 transition-all ${copied ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                     <span className={`absolute top-0 right-0 font-inter text-xs bg-white text-black px-2 py-1 rounded opacity-0 transition-all ${copied ? 'opacity-100 -translate-y-8' : ''}`}>Copied!</span>
                  </div>
                </button>

                <div className="flex gap-4">
                  <a 
                    href="mailto:mail@benediktschnupp.com"
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors font-inter font-medium text-black"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                  <a 
                    href="https://linkedin.com/in/benedikt-schnupp-928112116"
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors font-inter font-medium text-black"
                  >
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </a>
                </div>
               </div>

            </motion.div>

          </div>
        </div>
        
        {/* Footer Minimal */}
        {/* <div className="mt-24 pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-400 font-inter">
             <div>© {new Date().getFullYear()} Benedikt Schnupp</div>
             <div className="mt-2 md:mt-0">Made with ❤️ in Berlin</div>
        </div> */}
      </div>
    </section>
  )
}

export default Contact