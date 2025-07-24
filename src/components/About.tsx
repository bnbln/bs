import React from 'react'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <section id="about" className="bg-white py-20 px-4 sm:px-8 md:px-16 lg:px-[159px] relative w-full">
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
            <div>I’m a creative, tech-savvy Motion Designer & Front-End Developer with 7+ years of experience in branding, motion design and modern web development. I plan and build innovative visual concepts that blend storytelling, design and cutting-edge code. Leveraging deep technical expertise in contemporary web technologies and generative AI tools, I deliver high-performance, scalable interfaces that elevate brand identity. Proactive, solution-oriented and committed to driving impactful, brand-defining projects from idea to launch.</div>
          </motion.div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div 
          className="flex gap-2.5 mt-8 sm:mt-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="bg-[#d9d9d9] h-[31px] w-[129px] cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div 
            className="bg-[#d9d9d9] h-[31px] w-[31px] cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div 
            className="bg-[#d9d9d9] h-[31px] w-[31px] cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      </div>
    </section>
  )
}

export default About 