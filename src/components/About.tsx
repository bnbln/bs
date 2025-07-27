import React from 'react'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <section id="about" className="bg-white py-20 md:py-40 px-4 sm:px-8 md:px-16 lg:px-[159px] relative w-full">
      <div className="max-w-[962px] mx-auto">
        <motion.div 
          className="space-y-6 sm:space-y-8"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          {/* Large Heading */}
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-black font-space-grotesk font-bold leading-tight sm:leading-[1.1] md:leading-[1.15] lg:leading-[81.2px]"
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>Crafting Connections</div>
            <div>through Code & Creativity</div>
          </motion.h2>
          
          {/* Description */}
          <motion.div 
            className="text-[rgba(0,0,0,0.92)] font-inter font-normal text-sm sm:text-base leading-relaxed"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div>I'm a creative, tech-savvy Motion Designer & Front-End Developer with 7+ years of experience in branding, motion design and modern web development. I plan and build innovative visual concepts that blend storytelling, design and cutting-edge code. Leveraging deep technical expertise in contemporary web technologies and generative AI tools, I deliver high-performance, scalable interfaces that elevate brand identity. Proactive, solution-oriented and committed to driving impactful, brand-defining projects from idea to launch.</div>
          </motion.div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div 
          className="flex gap-4 mt-8 sm:mt-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Email Button - Simple Circle */}
          <motion.a 
            href="mailto:mail@benediktschnupp.com"
            className="bg-[#1C1D20] text-white h-12 w-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2a2b2e] transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            aria-label="Send email"
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0H2C0.9 0 0.0100002 0.9 0.0100002 2L0 14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 4L10 9L2 4V2L10 7L18 2V4Z" fill="currentColor"/>
            </svg>
          </motion.a>

          {/* LinkedIn Button - Simple Circle */}
          <motion.a 
            href="https://linkedin.com/in/benedikt-schnupp-928112116"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1C1D20] text-white h-12 w-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2a2b2e] transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            aria-label="LinkedIn profile"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.5 0H1.5C0.675 0 0 0.675 0 1.5V18.5C0 19.325 0.675 20 1.5 20H18.5C19.325 20 20 19.325 20 18.5V1.5C20 0.675 19.325 0 18.5 0ZM6 17H3V8H6V17ZM4.5 6.5C3.675 6.5 3 5.825 3 5C3 4.175 3.675 3.5 4.5 3.5C5.325 3.5 6 4.175 6 5C6 5.825 5.325 6.5 4.5 6.5ZM17 17H14V12.5C14 11.675 13.325 11 12.5 11C11.675 11 11 11.675 11 12.5V17H8V8H11V9.5C11.825 8.675 12.825 8 14 8C16.2 8 17 9.8 17 12.5V17Z" fill="currentColor"/>
            </svg>
          </motion.a>

          {/* GitHub Button - Simple Circle */}
          {/* <motion.a 
            href="https://github.com/bnbln"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1C1D20] text-white h-12 w-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2a2b2e] transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            aria-label="GitHub profile"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.477 0 0 4.477 0 10C0 14.42 2.865 18.17 6.839 19.49C7.339 19.58 7.5 19.27 7.5 19C7.5 18.77 7.5 18.14 7.5 17.31C5 17.88 4.35 16.23 4.15 15.5C4.05 15.18 3.6 14.5 3.1 14.23C2.75 14.05 2.4 13.66 3.1 13.65C3.8 13.64 4.35 14.23 4.55 14.5C5.5 16.1 6.9 15.7 7.5 15.4C7.6 14.8 7.9 14.4 8.2 14.2C6.2 14 4.1 13.1 4.1 9.3C4.1 8.2 4.5 7.3 5.1 6.6C5 6.4 4.6 5.4 5.2 4C5.2 4 6 3.7 7.5 5.2C8.3 5 9.2 4.9 10 4.9C10.8 4.9 11.7 5 12.5 5.2C14 3.7 14.8 4 14.8 4C15.4 5.4 15 6.4 14.9 6.6C15.5 7.3 15.9 8.2 15.9 9.3C15.9 13.1 13.8 14 11.8 14.2C12.2 14.5 12.5 15 12.5 15.7C12.5 16.5 12.5 17.3 12.5 18C12.5 18.27 12.66 18.58 13.16 18.49C17.135 18.17 20 14.42 20 10C20 4.477 15.523 0 10 0Z" fill="currentColor"/>
            </svg>
          </motion.a> */}
        </motion.div>
      </div>
    </section>
  )
}

export default About 