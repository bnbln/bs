import React from 'react'
import { motion } from 'framer-motion'

const Footer = () => {
  return (
    <footer
      className="fixed bottom-0 left-0 w-full h-[403px] bg-[#1C1D20] z-[-10] overflow-hidden"
    >
      {/* Footer Content */}
      <div className="absolute left-10 top-[57.5px] translate-y-[-50%] pointer-events-auto">
        <motion.p 
          className="text-white font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre"
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Benedikt Schnupp
        </motion.p>
      </div>

      {/* Navigation Links */}
      <motion.div 
        className="absolute left-10 top-[139px] flex flex-col gap-5 pointer-events-auto"
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <motion.a 
          href="#about" 
          className="text-[rgba(255,255,255,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          About
        </motion.a>
        <motion.a 
          href="#work" 
          className="text-[rgba(255,255,255,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          Work
        </motion.a>
        <motion.a 
          href="#contact" 
          className="text-[rgba(255,255,255,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          Contact
        </motion.a>
        <motion.a 
          href="#contact" 
          className="text-[rgba(255,255,255,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          Datenschutzerklärung
        </motion.a>
        <motion.a 
          href="#contact" 
          className="text-[rgba(255,255,255,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(255,255,255,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          Impressum
        </motion.a>
      </motion.div>
    </footer>
  )
}

export default Footer 