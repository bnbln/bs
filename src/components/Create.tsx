import React from 'react'
import { motion } from 'framer-motion'

const Create = () => {
  return (
    <section className="bg-[#1C1D20] py-20 md:py-40 px-4 sm:px-8 md:px-16 lg:px-[159px] relative w-full">
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
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-space-grotesk font-bold leading-tight sm:leading-[1.1] md:leading-[1.15] lg:leading-[81.2px]"
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>Create something</div>
            <div>meaningful today</div>
          </motion.h2>
        </motion.div>
      </div>
    </section>
  )
}

export default Create 