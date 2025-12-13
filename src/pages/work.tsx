import React, { useState } from 'react'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { getAllProjects, Project } from '../lib/markdown'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

interface WorkPageProps {
  projects: Project[]
}

const WorkPage = ({ projects }: WorkPageProps) => {
  const [filter, setFilter] = useState<'All' | 'Design' | 'Development'>('All')

  // Helper to determine category
  const getCategoryTags = (project: Project) => {
    if (project.type) {
      const types = Array.isArray(project.type) ? project.type : [project.type]
      return {
        isDev: types.includes('Development'),
        isDesign: types.includes('Design')
      }
    }
    const catVal = project.category
    const cats = (Array.isArray(catVal) ? catVal.join(' ') : (catVal || '')).toLowerCase()
    const isDev = cats.includes('development') || cats.includes('code') || cats.includes('tech')
    const isDesign = cats.includes('design') || cats.includes('ux') || cats.includes('branding') || cats.includes('promotion') || cats.includes('art') || cats.includes('motion')
    return { isDev, isDesign }
  }

  // Helper to determine aspect ratio for the grid
  // User request: "only do that when the project shows up in Featured Design" (interpreted as project.featured === true)
  const getAspectRatio = (project: Project) => {
    return project.featured ? 'aspect-video' : 'aspect-[3/4]'
  }

  const filteredProjects = projects.filter(project => {
    if (filter === 'All') return true
    const { isDev, isDesign } = getCategoryTags(project)
    if (filter === 'Design') return isDesign
    if (filter === 'Development') return isDev
    return false
  })

  return (
    <>
      <NextSeo
        title="Work | Benedikt Schnupp"
        description="Explore the portfolio of Benedikt Schnupp - Motion Design, Web Development, and Creative Coding projects."
        openGraph={{
          title: 'Work | Benedikt Schnupp',
          description: 'Explore the portfolio of Benedikt Schnupp - Motion Design, Web Development, and Creative Coding projects.',
          url: 'https://benediktschnupp.com/work',
        }}
      />

      <div className="min-h-screen bg-[#1C1D20] w-full">
         <div className="relative z-10 bg-[#F5F5F5] shadow-2xl mb-0 md:mb-[500px] min-h-screen flex flex-col">
            <Navigation theme="light" />

            <main className="flex-grow pt-[160px] pb-24 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] w-full">
                
                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24">
                   <motion.div
                       initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                   >
                        <h1 className="text-[10vw] sm:text-[8vw] md:text-[6vw] leading-[0.9] tracking-tight font-bold font-space-grotesk text-black mb-4">
                            Selected
                            <span className="block text-neutral-400">Work</span>
                        </h1>
                   </motion.div>

                   {/* Filter Toggles */}
                   <motion.div 
                        className="flex gap-2"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                   >
                       {['All', 'Design', 'Development'].map((f) => (
                           <button
                             key={f}
                             onClick={() => setFilter(f as any)}
                             className={`px-6 py-2 rounded-full border transition-all font-inter text-sm md:text-base ${
                                filter === f 
                                ? 'bg-black text-white border-black' 
                                : 'bg-transparent text-neutral-500 border-neutral-300 hover:border-black hover:text-black'
                             }`}
                           >
                               {f}
                           </button>
                       ))}
                   </motion.div>
                </div>

                {/* Projects Grid */}
                <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full grid-flow-row-dense"
                >
                    <AnimatePresence>
                        {filteredProjects.map((project) => (
                            <motion.div
                                layout
                                key={project.slug}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ 
                                    opacity: { duration: 0.2 },
                                    scale: { duration: 0.2 },
                                    layout: { type: "spring", stiffness: 300, damping: 30 }
                                }}
                                className={`group relative cursor-pointer ${!project.featured ? 'md:col-span-2' : ''}`}
                            >
                                <Link href={`/project/${project.slug}`} passHref>
                                    <div className="h-full flex flex-col">
                                        {/* Image Card */}
                                        <div 
                                            className={`w-full ${project.featured ? 'aspect-[3/4]' : 'aspect-video'} relative rounded-xl overflow-hidden bg-neutral-200 transition-transform duration-500 ease-out group-hover:scale-[0.98] drop-shadow-sm group-hover:drop-shadow-xl`}
                                            style={{ backgroundColor: project.bgColor || '#e5e5e5' }}
                                        >
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                                                style={{ backgroundImage: `url('${project.image}')` }}
                                            />
                                            
                                            {/* Overlay for Featured (Portrait) projects */}
                                            {project.featured && (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                                    
                                                    {/* Category Overlay */}
                                                    <motion.div 
                                                        className="absolute top-6 left-6 right-6 z-10"
                                                        initial={{ y: -20, opacity: 0 }}
                                                        whileInView={{ y: 0, opacity: 1 }}
                                                        viewport={{ once: true }}
                                                    >
                                                        <p className="text-white font-inter font-normal text-[16px] leading-[24px]">
                                                            {Array.isArray(project.category) ? project.category.join(', ') : project.category}
                                                        </p>
                                                    </motion.div>

                                                    {/* Title Overlay */}
                                                    <div className="absolute bottom-6 left-6 right-6 z-10">
                                                        <h3 className="text-white font-helvetica font-bold text-[20px] leading-[24px]">
                                                            {project.title}
                                                        </h3>
                                                    </div>
                                                </>
                                            )}

                                            {/* Hover Icon (for all) */}
                                            <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center ${project.featured ? 'z-20' : ''}`}>
                                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                                     <ArrowUpRight className="w-6 h-6 text-black" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* External Meta for Non-Featured (Landscape) items */}
                                        {!project.featured && (
                                            <div className="flex justify-between items-start mt-4">
                                                <div>
                                                    <h3 className="text-xl font-space-grotesk font-bold text-black group-hover:underline decoration-2 underline-offset-4 decoration-neutral-300">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-neutral-500 text-sm font-inter mt-1">
                                                        {project.subtitle}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-mono text-neutral-400 border border-neutral-200 rounded px-2 py-1">
                                                    {new Date(project.published).getFullYear()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredProjects.length === 0 && (
                    <div className="py-24 text-center text-neutral-400 font-inter">
                        No projects found for {filter}.
                    </div>
                )}

            </main>
         </div>
         <Footer />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
    // Get ALL projects for the work page, not just featured ones
    const allProjects = getAllProjects()
    return {
      props: {
        projects: allProjects
      }
    }
}

export default WorkPage
