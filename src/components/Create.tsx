import React from 'react'
import { motion } from 'framer-motion'

const Create = () => {
  return (
    <section className="bg-[#1C1D20] py-24 md:py-40 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full">
      <div className="max-w-[1400px] mx-auto">
        <motion.div 
          className="space-y-6 sm:space-y-8"
          initial={{ y: 0, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          {/* Large Heading */}
          <motion.h2 
            className="text-[11vw] sm:text-[9vw] md:text-[7vw] lg:text-[5.5vw] text-white font-space-grotesk font-bold leading-[0.9] tracking-tight"
            initial={{ y: 0, opacity: 0 }}
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