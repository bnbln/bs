import React from 'react'
import { motion } from 'framer-motion'

const workProjects = [
  {
    id: 1,
    title: 'Book 3D-Modeling & Animation for TV Spot',
    image: 'http://localhost:3845/assets/a36e3380c829ef228fee4e069260682e709452d0.png'
  },
  {
    id: 2,
    title: 'Book 3D-Modeling & Animation for TV Spot',
    image: 'http://localhost:3845/assets/23edca76934e907dc05061e0a64f25f199357ddd.png'
  },
  {
    id: 3,
    title: 'Book 3D-Modeling & Animation for TV Spot',
    image: 'http://localhost:3845/assets/d242d74e2550db04549b88b5d5666cb3a0b7ab6e.png'
  },
  {
    id: 4,
    title: 'Trailer Design for EU election 2024',
    image: 'http://localhost:3845/assets/8d8d87a8f2e35f7af364647378af70da40c4c7ad.png'
  }
]

const Work = () => {
  return (
    <section className="bg-white h-[2919px] relative w-full">
      {/* Section Title */}
      <motion.h2 
        className="absolute left-10 top-[65px] translate-y-[-50%] text-black font-space-grotesk font-bold text-[20px] leading-[41.22px] whitespace-pre"
        initial={{ x: -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Work
      </motion.h2>

      {/* Projects Container */}
      <div className="absolute left-10 top-[107px] w-[1203.56px] space-y-5">
        {workProjects.map((project, index) => (
          <motion.div
            key={project.id}
            className="aspect-[1203.56/677] relative w-full"
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: index * 0.2 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-[4.5px]"
              style={{ backgroundImage: `url('${project.image}')` }}
            />
            
            {/* Project Title */}
            <div className="absolute left-[37px] top-[76.5px] translate-y-[-50%] w-[683px] h-[101px] flex items-center">
              <h3 className="text-white font-inter font-bold text-[39.84px] leading-none">
                {project.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default Work 