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
                                className="flex flex-wrap justify-center gap-2 relative bg-white p-1 rounded-full border border-neutral-200 w-fit mx-auto mb-16"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {['All', 'Design', 'Development'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`relative px-6 py-2 rounded-full transition-colors duration-300 font-inter text-sm md:text-base z-10 ${filter === f
                                            ? 'text-white font-medium'
                                            : 'text-neutral-500 hover:text-black'
                                            }`}
                                    >
                                        {filter === f && (
                                            <motion.div
                                                layoutId="activeFilter"
                                                className="absolute inset-0 bg-black rounded-full z-[-1]"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        {f}
                                    </button>
                                ))}
                            </motion.div>
                        </div>

                        {/* Projects Grid: 3-column Layout */}
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-8 w-full grid-flow-row-dense"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredProjects.map((project, index) => {
                                    const isFeatured = Boolean(project.featured)
                                    // Featured item spans 1 col on md+, 1 col on mobile (since grid is 1 col on mobile)
                                    // Regular item spans 2 cols on md+, 1 col on mobile
                                    const colSpan = isFeatured ? 'md:col-span-1' : 'md:col-span-2'

                                    return (
                                        <motion.div
                                            layout
                                            key={project.slug}
                                            initial={{ opacity: 0, y: 40 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{
                                                opacity: { duration: 0.4 },
                                                y: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                                                layout: { type: "spring", stiffness: 300, damping: 30 }
                                            }}
                                            className={`group relative cursor-pointer flex flex-col ${colSpan}`}
                                        >
                                            <Link href={`/project/${project.slug}`} passHref className="flex-1 flex flex-col">
                                                {/* Image Card Container */}
                                                <div
                                                    className={`w-full ${isFeatured ? 'aspect-[3/4]' : 'aspect-video'} relative rounded-xl overflow-hidden bg-neutral-200 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1 shadow-sm group-hover:shadow-2xl`}
                                                    style={{ backgroundColor: project.bgColor || '#e5e5e5' }}
                                                >
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
                                                        style={{ backgroundImage: `url('${project.image}')` }}
                                                    />

                                                    {/* Minimal Image Overlay on Hover */}
                                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                </div>

                                                {/* External Meta Row (Typography driven design) */}
                                                <div className="flex justify-between items-start mt-6 w-full gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-2xl md:text-[28px] font-space-grotesk font-bold text-black tracking-tight leading-none group-hover:text-neutral-600 transition-colors duration-300">
                                                            {project.title}
                                                        </h3>
                                                        <div className="mt-3 w-full leading-snug">
                                                            <span className="text-xs font-mono tracking-widest uppercase text-neutral-500 mr-3">
                                                                {Array.isArray(project.category) ? project.category[0] : project.category}
                                                            </span>
                                                            <span className="text-neutral-500 text-sm font-inter">
                                                                {project.subtitle}
                                                            </span>
                                                        </div>
                                                        {!isFeatured && project.excerpts && (
                                                            <p className="mt-4 text-neutral-500 font-inter text-sm md:text-base leading-relaxed line-clamp-3">
                                                                {project.excerpts}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Magnetic action indicator */}
                                                    <div className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:border-black transition-all duration-300">
                                                        <ArrowUpRight className="w-5 h-5 text-black group-hover:text-white transition-all duration-300 shrink-0" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    )
                                })}
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
