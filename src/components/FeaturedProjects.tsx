import React, { useRef, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { Project } from '../lib/markdown'
import MagneticButton from './MagneticButton'
import dynamic from 'next/dynamic'

const LottiePlayer = dynamic(() => import('./LottiePlayer'), { ssr: false })

const FeaturedProjects = ({ data }: { data: Project[] }) => {

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const getCarouselEls = useCallback((): HTMLElement[] => {
    const container = scrollContainerRef.current
    if (!container) return []
    return Array.from(container.querySelectorAll<HTMLElement>('[data-carousel-item="true"]'))
  }, [])

  const getScrollLeftForEl = useCallback((container: HTMLElement, el: HTMLElement) => {
    const c = container.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    return r.left - c.left + container.scrollLeft
  }, [])

  const getNearestIndex = useCallback(
    (scrollLeft: number) => {
      const container = scrollContainerRef.current
      if (!container) return 0
      const els = getCarouselEls()
      if (!els.length) return 0

      let bestIdx = 0
      let bestDist = Infinity
      for (let i = 0; i < els.length; i++) {
        const left = getScrollLeftForEl(container, els[i])
        const dist = Math.abs(left - scrollLeft)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }
      return bestIdx
    },
    [getCarouselEls, getScrollLeftForEl]
  )

  const scrollToIndex = useCallback(
    (targetIndex: number) => {
      const container = scrollContainerRef.current
      if (!container) return
      const els = getCarouselEls()
      if (!els.length) return

      const clamped = Math.max(0, Math.min(els.length - 1, targetIndex))
      const left = getScrollLeftForEl(container, els[clamped])
      container.scrollTo({ left, behavior: 'smooth' })
    },
    [getCarouselEls, getScrollLeftForEl]
  )

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const currentIndex = getNearestIndex(container.scrollLeft)
      scrollToIndex(currentIndex - 1)
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const currentIndex = getNearestIndex(container.scrollLeft)
      scrollToIndex(currentIndex + 1)
    }
  }

  // Drag to scroll implementation
  const [isDragging, setIsDragging] = React.useState(false)
  const [disableSnap, setDisableSnap] = React.useState(false)
  const snapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const [startX, setStartX] = React.useState(0)
  const [scrollLeftStart, setScrollLeftStart] = React.useState(0)
  const dragMovedRef = React.useRef(0)

  // Physics refs
  const velocityRef = React.useRef(0)
  const lastXRef = React.useRef(0)
  const lastTimeRef = React.useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setDisableSnap(true)
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)

    dragMovedRef.current = 0
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeftStart(scrollContainerRef.current.scrollLeft)

    // Init physics
    velocityRef.current = 0
    lastXRef.current = e.pageX
    lastTimeRef.current = performance.now()
  }

  const handleDragEnd = () => {
    if (scrollContainerRef.current && isDragging) {
      setIsDragging(false)

      const container = scrollContainerRef.current
      const currentScroll = container.scrollLeft

      // Calculate projection based on velocity
      // A velocity of 2 means we moved 2px per ms. 
      // Let's project where we'd land in ~300ms
      const velocity = velocityRef.current
      const inertia = Math.abs(velocity) > 0.5 ? 300 : 0 // Only apply inertia if decent swipe
      const projectedScroll = currentScroll - (velocity * inertia)

      // Snap auf die nächste Karte basierend auf echten DOM-Positionen (variable Breiten)
      const nearestIndex = getNearestIndex(projectedScroll)
      scrollToIndex(nearestIndex)

      // Allow the smooth scroll animation to physically finish before turning CSS snapping back on.
      // Re-applying native CSS scroll-snap mid-animation causes the browser to instantly cut to the position.
      snapTimeoutRef.current = setTimeout(() => {
        setDisableSnap(false)
      }, 600)
    } else {
      setIsDragging(false)
      setDisableSnap(false)
    }
  }

  const onMouseLeave = handleDragEnd
  const onMouseUp = handleDragEnd

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()

    // Calculate Velocity
    const now = performance.now()
    const dt = now - lastTimeRef.current
    const dx = e.pageX - lastXRef.current

    if (dt > 0) {
      velocityRef.current = dx / dt
      lastXRef.current = e.pageX
      lastTimeRef.current = now
    }

    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.0 // 1:1 movement
    scrollContainerRef.current.scrollLeft = scrollLeftStart - walk
    dragMovedRef.current += Math.abs(walk)
  }

  // Handle project click - Prevent click if dragged
  const handleProjectClick = useCallback((slug: string) => {
    if (dragMovedRef.current > 5) return // Threshold for click vs drag
    router.push(`/project/${slug}`)
  }, [router])

  const handleMoreProjectsClick = useCallback(() => {
    if (dragMovedRef.current > 5) return
    router.push('/work')
  }, [router])

  type CarouselItem =
    | { kind: 'project'; project: Project }
    | { kind: 'more-projects' }

  // Nur die ersten 6 Projekte anzeigen; Rest gehört auf /work
  const visibleProjects = React.useMemo(() => (data || []).slice(0, 7), [data])

  const items: CarouselItem[] = React.useMemo(() => {
    const out: CarouselItem[] = visibleProjects.map((project) => ({ kind: 'project', project }))
    // CTA immer direkt nach den 6 Einträgen (oder nach dem letzten, falls <6)
    out.push({ kind: 'more-projects' })
    return out
  }, [visibleProjects])

  const carouselLength = items.length

  return (
    <section className="relative w-full overflow-hidden" id="work">

      {/* Section Title with Navigation */}
      <motion.div
        className="w-full px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] mb-12"
        initial={{ x: 0, opacity: 1 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-[1400px] mx-auto flex items-end justify-between gap-4">
          <h2 className="text-neutral-800 text-[20px] font-space-grotesk font-bold tracking-tight">
            Recent News
          </h2>

          <div className="flex gap-3">
            <MagneticButton>
              <motion.button
                onClick={scrollLeft}
                className="w-12 h-12 rounded-full border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-all group text-black shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Scroll to previous project"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="transition-colors">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </MagneticButton>

            <MagneticButton>
              <motion.button
                onClick={scrollRight}
                className="w-12 h-12 rounded-full border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-all group text-black shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Scroll to next project"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="transition-colors">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </MagneticButton>
          </div>
        </div>
      </motion.div>

      {/* Projects Container */}
      <div
        ref={scrollContainerRef}
        className={`relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide select-none scroll-pl-4 sm:scroll-pl-8 md:scroll-pl-12 lg:scroll-pl-[100px] xl:scroll-pl-[140px] ${disableSnap ? '' : 'snap-x snap-mandatory'}`}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <motion.div
          className="inline-flex min-w-full items-start gap-5 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px]"
        >
          {items.map((item, index) => {
            if (item.kind === 'more-projects') {
              return (
                <motion.div
                  key="more-projects"
                  className={[
                    'w-[300px] sm:w-[353.66px] h-[450px] sm:h-[500px] flex-shrink-0 snap-start',
                    'group rounded-3xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200',
                    'transition-[background-color,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)]',
                    'relative overflow-hidden',
                    'flex flex-col items-center justify-center p-6',
                  ].join(' ')}
                  data-carousel-item="true"
                  // Entrance animation disabled for now: keep cards visible from first paint.
                  onClick={handleMoreProjectsClick}
                >
                  <MagneticButton>
                    <motion.button
                      type="button"
                      aria-label="More Projects"
                      className="w-16 h-16 rounded-full border border-neutral-200/80 bg-white group-hover:bg-black group-hover:text-white group-hover:border-black flex items-center justify-center transition-all text-black hover:text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMoreProjectsClick()
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.button>
                  </MagneticButton>
                  <div className="mt-6 text-center">
                    <div className="text-[14px] font-bold uppercase tracking-widest text-neutral-500 font-inter">
                      View All Work
                    </div>
                  </div>
                </motion.div>
              )
            }

            const project = item.project
            // Umgekehrt: die bisher 16:9 (featured) sollen wieder portrait sein,
            // und die übrigen (neu hinzugekommenen) sollen 16:9 bekommen.
            // Jetzt: der Kartencontainer selbst ist 16:9 (breiter), bei gleicher Höhe.
            const isLandscapeCard = !Boolean(project.featured)
            const imageSizes = isLandscapeCard
              ? '(max-width: 640px) 565px, 630px'
              : '(max-width: 640px) 300px, 354px'

            return (
              // In horizontalen Scroller-Layouts kann ein x-Entrance die In-View-Erkennung
              // (IntersectionObserver) „flattern“ lassen. Daher: y/opacity Entrance.
              // Auf Mobile/ungeklärten Breakpoints kein Entrance-Anim, um Remount/Jank zu vermeiden.
              <motion.div
                key={project.id}
                className={[
                  'project-card',
                  project.bgColor || 'bg-neutral-100',
                  'h-[450px] sm:h-[500px]',
                  isLandscapeCard ? 'aspect-[4/3]' : 'w-[300px] sm:w-[353.66px]',
                  'flex-shrink-0 relative overflow-hidden rounded-3xl snap-start flex flex-col p-6 sm:p-8',
                  'group transition-transform duration-500 shadow-sm hover:shadow-lg'
                ].join(' ')}
                data-carousel-item="true"
                onClick={() => handleProjectClick(project.slug)}
                initial="initial"
                whileHover="hover"
                animate="initial"
              >
                {/* Background Image */}
                <div className="absolute inset-0 overflow-hidden bg-neutral-100 border-none">
                  {project.image ? (
                    <motion.div
                      className="w-full h-full relative"
                      variants={{
                        initial: { scale: 1 },
                        hover: { scale: 1.05 }
                      }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes={imageSizes}
                        className={isLandscapeCard ? 'object-cover object-right' : 'object-cover object-center'}
                        draggable={false}
                      />
                    </motion.div>
                  ) : (
                    <div className="w-full h-full bg-neutral-100" />
                  )}
                </div>
                {/* Dark overlay that intensifies on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"
                  variants={{
                    initial: { opacity: 0.6 },
                    hover: { opacity: 0.9 }
                  }}
                  transition={{ duration: 0.5 }}
                />

                {/* Optional Lottie Animation Overlay */}
                {project.heroLottie && mounted && (
                  <div className="absolute inset-0 w-full h-full object-cover pointer-events-none">
                    <LottiePlayer
                      src={project.heroLottie}
                      className="w-full h-full absolute inset-0 mix-blend-normal"
                      style={{ objectFit: 'cover' }}
                      autoplay={true}
                      loop={true}
                    />
                  </div>
                )}

                {/* Content Container */}
                <div className="relative z-10 mt-auto flex flex-col">
                  {/* Category - Slides Up on Hover */}
                  <motion.div
                    variants={{
                      initial: { y: 10, opacity: 0, height: 0 },
                      hover: { y: 0, opacity: 1, height: 'auto' }
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-2"
                  >
                    <p className="text-neutral-200 font-inter text-sm uppercase tracking-widest font-semibold">
                      {Array.isArray(project.category) ? project.category.join(", ") : project.category}
                    </p>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    className="text-white font-helvetica font-bold text-xl md:text-2xl leading-tight"
                    variants={{
                      initial: { y: 0 },
                      hover: { y: -5 }
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {project.title}
                  </motion.h3>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProjects
