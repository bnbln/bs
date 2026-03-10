import React, { useState } from 'react'
import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import HubLinkCard from '../../components/HubLinkCard'
import { getAllProjects, Project } from '../../lib/markdown'
import { getAllWorkHubContent, type WorkHubContent } from '../../lib/work-hub-content'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { buildPageSeo, getSeoConfig } from '../../lib/seo'
import {
  FILTER_OPTIONS,
  type WorkFilter,
  getProjectCategoryTags,
  WORK_HUB_SLUGS,
} from '../../lib/work-hubs'

const LottiePlayer = dynamic(() => import('../../components/LottiePlayer'), { ssr: false })

interface WorkPageProps {
  projects: Project[]
  hubContent: WorkHubContent[]
}

const WorkPage = ({ projects, hubContent }: WorkPageProps) => {
  const seoConfig = getSeoConfig()
  const seo = buildPageSeo(seoConfig, 'work')
  const [filter, setFilter] = useState<WorkFilter>('All')
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const hubContentBySlug = React.useMemo(() => {
    const entries = hubContent.map((entry) => [entry.slug, entry] as const)
    return Object.fromEntries(entries) as Record<string, WorkHubContent>
  }, [hubContent])

  const orderedHubContent = React.useMemo(
    () =>
      WORK_HUB_SLUGS
        .map((slug) => hubContentBySlug[slug])
        .filter((entry): entry is WorkHubContent => Boolean(entry)),
    [hubContentBySlug]
  )

  const filteredProjects = projects.filter((project) => {
    if (filter === 'All') return true

    const { isDev, isDesign, isUxUi } = getProjectCategoryTags(project)
    if (filter === 'Design') return isDesign
    if (filter === 'UX/UI') return isUxUi
    if (filter === 'Development') return isDev

    return false
  })

  return (
    <>
      <NextSeo {...seo} />

      <div className="min-h-screen bg-[#1C1D20] w-full">
        <div className="relative z-10 bg-[#F5F5F5] shadow-2xl mb-0 md:mb-[500px] min-h-screen flex flex-col">
          <Navigation theme="light" />

          <main className="flex-grow pt-[160px] pb-24 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] w-full">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
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
                className="flex flex-nowrap justify-center gap-1 sm:gap-2 relative bg-white p-1 rounded-full border border-neutral-200 w-fit max-w-full mx-auto mb-8 overflow-x-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`relative whitespace-nowrap px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full transition-colors duration-300 font-inter text-xs sm:text-sm md:text-base z-10 ${
                      filter === f ? 'text-white font-medium' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {filter === f && (
                      <motion.div
                        layoutId="activeFilter"
                        className="absolute inset-0 bg-black rounded-full z-[-1]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {f}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Projects Grid */}
            <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-8 w-full grid-flow-row-dense">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => {
                  const isFeatured = Boolean(project.featured)
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
                        layout: { type: 'spring', stiffness: 300, damping: 30 },
                      }}
                      className={`group relative cursor-pointer flex flex-col ${colSpan}`}
                    >
                      <Link href={`/project/${project.slug}`} passHref className="flex-1 flex flex-col">
                        <div
                          className={`w-full ${isFeatured ? 'aspect-[3/4]' : 'aspect-video'} relative rounded-xl overflow-hidden bg-neutral-200 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1 shadow-sm group-hover:shadow-2xl`}
                          style={{ backgroundColor: project.bgColor || '#e5e5e5' }}
                        >
                          {project.image && (
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
                              style={{ backgroundImage: `url('${project.image}')` }}
                            />
                          )}
                          {project.heroLottie && mounted && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105">
                              <LottiePlayer
                                src={project.heroLottie}
                                className="w-full h-full absolute inset-0 mix-blend-normal object-cover"
                                autoplay={true}
                                loop={true}
                              />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="mt-6 w-full">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-2xl ${
                                  !isFeatured ? 'md:text-[36px] leading-[1] md:w-[90%]' : 'md:text-[20px] leading-[1.2] md:w-[80%]'
                                } font-inter font-bold text-black tracking-tight group-hover:text-neutral-600 transition-colors duration-300`}>
                              {project.title}
                            </h3>
                            {project.subtitle && !isFeatured && (
                              <p
                                className={`mt-3 text-neutral-500 text-sm md:text-base font-inter leading-relaxed ${
                                  !isFeatured ? 'md:w-[85%] font-bold' : ''
                                }`}
                              >
                                {project.subtitle}
                              </p>
                            )}
                            {project.excerpts && !isFeatured && (
                              <p
                                className={`mt-3 text-neutral-500 text-sm md:text-base font-inter leading-relaxed ${
                                  !isFeatured ? 'md:w-[85%]' : ''
                                }`}
                              >
                                {project.excerpts}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {filteredProjects.length === 0 && (
              <div className="py-24 text-center text-neutral-400 font-inter">No projects found for {filter}.</div>
            )}

            <section className="mt-20 md:mt-24 border-t border-neutral-200 pt-10 md:pt-12">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="font-space-grotesk text-xl md:text-2xl font-bold tracking-tight text-black">
                 Core Disciplines
                </h2>
                <p className="hidden md:block text-sm text-neutral-500 font-inter">
                  Explore one focused content hub.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {orderedHubContent.map((content) => (
                  <HubLinkCard
                    key={`bottom-${content.slug}`}
                    href={`/work/${content.slug}`}
                    title={content.pageTitle}
                    description={content.cardDescription}
                    accentColor={content.headerColor}
                    eyebrow={content.navLabel}
                  />
                ))}
              </div>
            </section>
          </main>
        </div>
        <Footer />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const allProjects = getAllProjects()
  const hubContent = await getAllWorkHubContent()

  return {
    props: {
      projects: allProjects,
      hubContent,
    },
  }
}

export default WorkPage
