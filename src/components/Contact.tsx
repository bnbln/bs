import React from 'react'
import { motion } from 'framer-motion'
const profileImage = '/assets/portrait.webp'

const Contact = () => {
  return (
    <section id="contact" className="bg-white py-20 px-4 sm:px-8 md:px-16 lg:px-[159px] relative w-full">
      <div className="max-w-[962px] mx-auto">
        <motion.div 
          className="space-y-6 sm:space-y-8"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          {/* Headline with Image and Text */}
          <motion.div 
            className="flex flex-col"
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Image and "Let's work" text row */}
            <div className="flex flex-row gap-3 md:gap-6 items-center">
              {/* Profile Image */}
              <motion.div 
                className="w-[40px] h-[40px] md:w-[70px] md:h-[70px] rounded-full bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url('/assets/portrait.webp'), url('/assets/portrait.png')` }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              {/* "Let's work" text */}
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-black font-space-grotesk font-bold leading-tight sm:leading-[1.1] md:leading-[1.15] lg:leading-[81.2px]">
                Let's work
              </div>
            </div>
            
            {/* "together" text */}
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-black font-space-grotesk font-bold leading-tight sm:leading-[1.1] md:leading-[1.15] lg:leading-[81.2px]">
              together
            </div>
          </motion.div>
          
          {/* Description */}
          <motion.div 
            className="text-[rgba(0,0,0,0.92)] font-inter font-normal text-sm sm:text-base leading-relaxed"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div>Lets work together on anything from video production to web development using React,</div>
            <div>Node.js, Three.js and CSS, branding, animation, corporate design, 3D modeling, AI-generated</div>
            <div>artworks, Adobe After Effects and any other Creative Cloud product, Blender, Stable Diffusion,</div>
            <div>Midjourney, Figma and also Microsoft Office (Im good at Excel too).</div>
          </motion.div>
        </motion.div>
        
        {/* Contact Button */}
        <motion.div 
          className="mt-8 sm:mt-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.button 
            className="bg-[#0c1fe7] px-10 py-5 rounded-[75px] text-white font-space-grotesk font-bold text-lg leading-none whitespace-pre"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            mail@benediktschnupp.com
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact 