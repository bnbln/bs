import React, { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

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
  }
]

interface ProjectCardProps {
  project: typeof workProjects[0]
  index: number
  scrollYProgress: MotionValue<number>
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, scrollYProgress }) => {
  // Each card has its own scroll trigger based on its position
  const cardProgress = useTransform(
    scrollYProgress,
    [0, 0.05 + (index * 0.05), 0.2 + (index * 0.05), 1],
    [0, 0, 1, 1]
  )
  
  const y = useTransform(
    cardProgress,
    [0, 1],
    [0, index * 20]
  )

  // Title appears briefly when card first comes into view, then hides
  const titleOpacity = useTransform(
    cardProgress,
    [0, 0.1, 0.3, 1],
    [0, 1, 1, 0]
  )

  const titleY = useTransform(
    cardProgress,
    [0, 0.1, 0.6, 1],
    [50, 0, 0, 0]
  )

  return (
    <motion.div
      className={`sticky w-full aspect-video relative rounded-lg shadow-xl`}
      style={{
        y,
        zIndex: index + 1,
        top: `${5 + (index * 3)}rem`
      }}
      initial={{ y: 100, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${project.image}')` }}
      />
      
      {/* Project Title */}
      <motion.div 
        className="absolute inset-x-6 -bottom-12 flex items-start"
        style={{
          opacity: titleOpacity,
          y: titleY
        }}
      >
        <h3 className="text-black font-inter font-medium text-[18px] leading-tight">
          {project.title}
        </h3>
      </motion.div>

      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
    </motion.div>
  )
}

const Work = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  return (
    <section ref={containerRef} className="bg-white min-h-screen w-full relative py-20">
      {/* Section Title */}
      <motion.h2 
        className="absolute left-10 top-[65px] text-black font-space-grotesk font-bold text-[20px] leading-[41.22px] z-20"
        initial={{ x: -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Featured Projects
      </motion.h2>

      {/* Projects Container */}
      <div className="relative px-10 pt-32 pb-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {workProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Work 