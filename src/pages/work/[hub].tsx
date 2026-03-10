import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import StructuredData from '../../components/StructuredData'
import HubLinkCard from '../../components/HubLinkCard'
import { getAllProjects, type Project } from '../../lib/markdown'
import {
  getAllWorkHubContent,
  getWorkHubContentBySlug,
  type WorkHubContent,
} from '../../lib/work-hub-content'
import { buildCanonical, getSeoConfig } from '../../lib/seo'
import { getHubBySlug, getProjectsForHub, WORK_HUB_SLUGS } from '../../lib/work-hubs'

const LottiePlayer = dynamic(() => import('../../components/LottiePlayer'), { ssr: false })
const HubThreeDScene = dynamic(
  () => import('../../components/Skills').then((mod) => mod.ThreeDScene),
  { ssr: false }
)

interface WorkHubPageProps {
  hubContent: WorkHubContent
  allHubContent: WorkHubContent[]
  projects: Project[]
}

export default function WorkHubPage({ hubContent, allHubContent, projects }: WorkHubPageProps) {
  const seoConfig = getSeoConfig()
  const canonical = buildCanonical(seoConfig, `/work/${hubContent.slug}/`)
  const ogImage = buildCanonical(seoConfig, seoConfig.pages.work.ogImage || seoConfig.assets.ogDefaultImage)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const hubIndex = Math.max(0, WORK_HUB_SLUGS.indexOf(hubContent.slug))

  const orderedHubContent = React.useMemo(
    () =>
      WORK_HUB_SLUGS
        .map((slug) => allHubContent.find((entry) => entry.slug === slug))
        .filter((entry): entry is WorkHubContent => Boolean(entry)),
    [allHubContent]
  )

  const itemListElements = projects.map((project, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: project.title,
    url: buildCanonical(seoConfig, `/project/${project.slug}/`),
  }))

  const topNavItems = [
    { label: 'Back to all work', href: '/work', active: false },
    ...orderedHubContent.map((candidate) => ({
      label: candidate.navLabel,
      href: `/work/${candidate.slug}`,
      active: candidate.slug === hubContent.slug,
    })),
  ]

  const siblingHubContent = orderedHubContent.filter((candidate) => candidate.slug !== hubContent.slug)
  const hasArticleBody = hubContent.articleHtml.trim().length > 0

  return (
    <>
      <NextSeo
        title={hubContent.seoTitle}
        description={hubContent.seoDescription}
        canonical={canonical}
        openGraph={{
          type: 'website',
          locale: seoConfig.site.locale,
          siteName: seoConfig.site.siteName,
          url: canonical,
          title: `${hubContent.pageTitle} | ${seoConfig.site.siteName}`,
          description: hubContent.seoDescription,
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: hubContent.pageTitle,
            },
          ],
        }}
      />

      <StructuredData
        type="CollectionPage"
        data={{
          name: hubContent.pageTitle,
          description: hubContent.seoDescription,
          url: canonical,
          inLanguage: 'en',
        }}
      />
      <StructuredData
        type="ItemList"
        data={{
          name: `${hubContent.pageTitle} project list`,
          numberOfItems: itemListElements.length,
          itemListElement: itemListElements,
        }}
      />

      <div className="min-h-screen bg-[#1C1D20] w-full">
        <div className="relative z-10 bg-[#F5F5F5] shadow-2xl mb-0 md:mb-[500px] min-h-screen flex flex-col">
          <Navigation theme="light" />

          <main className="relative flex-grow pt-[160px] pb-24 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] w-full overflow-x-hidden">
            <div
              className="absolute top-0 left-0 w-full h-[48vh] pointer-events-none -z-0"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${hubContent.headerColor}, transparent 72%)`,
                opacity: 0.22,
              }}
            />

            <section className="relative z-10 mb-12 md:mb-16 overflow-hidden md:overflow-visible">
              {/* <motion.div
                className="flex flex-nowrap justify-center gap-1 sm:gap-2 relative bg-white p-1 rounded-full border border-neutral-200 w-fit max-w-full mx-auto mb-12 overflow-x-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {topNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative whitespace-nowrap px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-full transition-colors duration-300 font-inter text-xs sm:text-sm md:text-base z-10 ${
                      item.active ? 'text-white font-medium' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    {item.active && (
                      <motion.div
                        layoutId="activeHubTopNav"
                        className="absolute inset-0 bg-black rounded-full z-[-1]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {item.label}
                  </Link>
                ))}
              </motion.div> */}

              <div className="max-w-[1400px] mx-auto relative">
                <motion.div
                  initial={{ opacity: 0, x: 12, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-0 right-0 z-0 h-[132px] w-[132px] sm:h-[168px] sm:w-[168px] md:hidden"
                >
                  <HubThreeDScene
                    index={hubIndex}
                    isHovered={true}
                    config={hubContent.shapeConfig}
                    color={hubContent.canvasColor}
                    overscan={0}
                    allowOverflow={false}
                    opacity={0.86}
                    speedMultiplier={hubContent.canvasSpeed}
                    interactive={true}
                  />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-x-6 pb-4">
                  <div className="relative z-10 md:col-span-7 pr-[116px] sm:pr-[172px] md:pr-0">
                    <motion.h1
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="text-[12vw] sm:text-[9vw] md:text-[7vw] leading-[0.98] tracking-[-0.03em] font-bold font-space-grotesk mb-8 text-black"
                    >
                      {hubContent.pageTitle}
                    </motion.h1>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className="text-2xl md:text-3xl lg:text-[2.2rem] font-medium leading-tight max-w-3xl text-neutral-700"
                    >
                      {hubContent.subtitle || hubContent.description}
                    </motion.p>
                  </div>

                  <div className="hidden md:flex md:col-span-5 flex-col justify-end pb-2">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="relative h-[260px] md:h-[320px] lg:h-[360px] overflow-visible"
                    >
                      <HubThreeDScene
                        index={hubIndex}
                        isHovered={true}
                        config={hubContent.shapeConfig}
                        color={hubContent.canvasColor}
                        overscan={hubContent.canvasOverscan}
                        allowOverflow={true}
                        opacity={hubContent.canvasOpacity}
                        speedMultiplier={hubContent.canvasSpeed}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative z-10 mb-14 md:mb-16">
              <div className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-x-5 gap-y-12 md:gap-x-6 md:gap-y-8 lg:gap-y-6">
                <div className="lg:col-span-6 p-1">
                  <h2 className="text-neutral-500 font-space-grotesk text-xs font-semibold uppercase tracking-[0.18em] mb-4">
                    Core Methods
                  </h2>
                  <div className="flex flex-wrap gap-2.5">
                    {hubContent.coreMethods.map((pill) => (
                      <span
                        key={pill}
                        className="px-3.5 py-1.5 rounded-full border border-black/10 bg-transparent text-neutral-700 text-xs md:text-[13px] font-inter whitespace-nowrap"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 p-1">
                  <h2 className="text-neutral-500 font-space-grotesk text-xs font-semibold uppercase tracking-[0.18em] mb-3">
                    What I Build
                  </h2>
                  <ul className="w-full flex flex-col border-t border-black/10">
                    {hubContent.deliverables.map((item, index) => (
                      <li
                        key={item}
                        className="flex items-start gap-5 py-4 border-b border-black/10 group hover:bg-neutral-50/60 transition-colors duration-300"
                      >
                        <span className="text-neutral-300 font-mono text-sm tracking-widest pt-1">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[18px] md:text-[21px] leading-[1.38] text-neutral-800 font-semibold tracking-[-0.01em]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {hasArticleBody && (
              <section className="relative z-10 mb-14 md:mb-16">
                <article className="max-w-[960px]">
                  <h2 className="text-[10vw] sm:text-[7vw] md:text-[4.8vw] leading-[0.95] tracking-[-0.03em] font-bold font-space-grotesk text-black mb-6">
                    {hubContent.articleTitle}
                  </h2>
                  <div
                    className="hub-article-content text-[#1D1D1F] [&_p]:text-[19px] [&_p]:md:text-[24px] [&_p]:leading-[1.45] [&_p]:tracking-[-0.015em] [&_p]:font-inter [&_p:not(:first-child)]:mt-5 [&_strong]:font-semibold [&_h3]:font-space-grotesk [&_h3]:text-[26px] [&_h3]:md:text-[34px] [&_h3]:leading-tight [&_h3]:mt-10 [&_h3]:mb-4 [&_ul]:my-6 [&_ul]:space-y-2 [&_li]:text-[18px] [&_li]:leading-[1.45] [&_li]:font-inter"
                    dangerouslySetInnerHTML={{ __html: hubContent.articleHtml }}
                  />
                </article>
              </section>
            )}

            <section className="relative z-10">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h2 className="font-space-grotesk text-2xl md:text-3xl font-bold tracking-tight text-black">
                  {hubContent.projectsHeading}
                </h2>
                {/* <p className="font-inter text-sm text-neutral-500">{projects.length} items</p> */}
              </div>

              <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-8 w-full grid-flow-row-dense">
                <AnimatePresence mode="popLayout">
                  {projects.map((project) => {
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
                              <h3
                                className={`text-2xl ${
                                  !isFeatured
                                    ? 'md:text-[36px] leading-[1] md:w-[90%]'
                                    : 'md:text-[20px] leading-[1.2] md:w-[80%]'
                                } font-inter font-bold text-black tracking-tight group-hover:text-neutral-600 transition-colors duration-300`}
                              >
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

              {projects.length === 0 && (
                <div className="py-24 text-center text-neutral-400 font-inter">No projects found for this hub.</div>
              )}
            </section>

            <section className="relative z-10 mt-20 md:mt-24 border-t border-neutral-200 pt-10 md:pt-12">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="font-space-grotesk text-xl md:text-2xl font-bold tracking-tight text-black">
                  Explore The Other Hubs
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {siblingHubContent.map((candidate) => (
                  <HubLinkCard
                    key={candidate.slug}
                    href={`/work/${candidate.slug}`}
                    title={candidate.pageTitle}
                    description={candidate.cardDescription}
                    accentColor={candidate.headerColor}
                    eyebrow={candidate.navLabel}
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

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: WORK_HUB_SLUGS.map((slug) => ({ params: { hub: slug } })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const hubParam = params?.hub
  if (typeof hubParam !== 'string') {
    return { notFound: true }
  }

  const hub = getHubBySlug(hubParam)
  if (!hub) {
    return { notFound: true }
  }

  const [hubContent, allHubContent] = await Promise.all([
    getWorkHubContentBySlug(hub.slug),
    getAllWorkHubContent(),
  ])

  const projects = getProjectsForHub(getAllProjects(), hub.slug)

  return {
    props: {
      hubContent,
      allHubContent,
      projects,
    },
  }
}
