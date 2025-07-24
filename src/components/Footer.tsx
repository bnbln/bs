import React from 'react'
import { motion } from 'framer-motion'

const Footer = () => {
  return (
    <footer className="h-[403px] relative w-full">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('http://localhost:3845/assets/26b707c914a62741375ccc5a225791c53af057b3.png')` }}
      />
      
      {/* Footer Content */}
      <div className="absolute left-10 top-[57.5px] translate-y-[-50%]">
        <motion.p 
          className="text-black font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre"
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
        className="absolute left-10 top-[139px] flex flex-col gap-5"
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <motion.a 
          href="#about" 
          className="text-[rgba(0,0,0,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(0,0,0,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          About
        </motion.a>
        <motion.a 
          href="#work" 
          className="text-[rgba(0,0,0,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(0,0,0,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          Work
        </motion.a>
        <motion.a 
          href="#contact" 
          className="text-[rgba(0,0,0,0.5)] font-space-grotesk font-medium text-[14.375px] leading-[16.5px] whitespace-pre cursor-pointer"
          whileHover={{ color: 'rgba(0,0,0,0.8)' }}
          transition={{ duration: 0.2 }}
        >
          Contact
        </motion.a>
      </motion.div>
    </footer>
  )
}

export default Footer 