import React, { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { Project } from '../lib/markdown'

const FeaturedProjects = ({ data }: { data: Project[] }) => {
  
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
    } else {
        setIsDragging(false)
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

  // Check for mobile to disable scrolling animations
  const [isMobile, setIsMobile] = React.useState(false) // Default: Desktop; wird clientseitig gemessen
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ... rest of component logic ...

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
    <section className="bg-white my-[60px] relative w-full" id="work">
      {/* Section Title with Navigation */}
      <motion.div 
        className="w-full top-[60px] px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px]"
        initial={{ x: 0, opacity: 1 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">
          <h2 className="text-black font-space-grotesk font-bold text-[20px] leading-[41.22px] whitespace-pre">
            The Latest
          </h2>
          
          <div className="flex gap-3">
            <motion.button
              onClick={scrollLeft}
              className="w-12 h-12 rounded-full border border-neutral-300 bg-transparent hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-all group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scroll to previous project"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="transition-colors">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
            
            <motion.button
              onClick={scrollRight}
              className="w-12 h-12 rounded-full border border-neutral-300 bg-transparent hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-all group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scroll to next project"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="transition-colors">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Projects Container */}
      <div 
        ref={scrollContainerRef}
        className={`relative mt-[20px] w-full overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing select-none scroll-pl-4 sm:scroll-pl-8 md:scroll-pl-12 lg:scroll-pl-[100px] xl:scroll-pl-[140px] ${isDragging ? '' : 'snap-x snap-mandatory'}`}
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
                    // gleiche Größe wie die anderen Karten im Carousel
                    'w-[300px] sm:w-[353.66px] h-[424px] sm:h-[471.55px] flex-shrink-0 snap-start',
                    // “Article-Card” Look & Feel (Border/Shadow/Rounded)
                    'group rounded-2xl border border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl',
                    'transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
                    'relative overflow-hidden cursor-pointer',
                    // Inhalt zentrieren
                    'flex flex-col items-center justify-center p-6',
                  ].join(' ')}
                  data-carousel-item="true"
                  initial={isMobile ? false : { y: 12, opacity: 0 }}
                  whileInView={isMobile ? undefined : { y: 0, opacity: 1 }}
                  // Wichtig für Mobile: isMobile flippt erst nach dem ersten Render auf true.
                  // Ohne explizites animate kann opacity:0 vom initial hängen bleiben.
                  animate={isMobile ? { y: 0, opacity: 1 } : undefined}
                  transition={isMobile ? undefined : { duration: 0.6, ease: 'easeOut', delay: index * 0.08 }}
                  viewport={isMobile ? undefined : { once: true, amount: 0.6 }}
                  onClick={handleMoreProjectsClick}
                >
                  <motion.button
                    type="button"
                    aria-label="More Projects"
                    className="w-16 h-16 rounded-full border border-neutral-300 bg-transparent group-hover:bg-black group-hover:text-white group-hover:border-black flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoreProjectsClick()
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                  <div className="mt-5 text-center">
                    <div className="text-[14px] font-bold uppercase tracking-widest text-[#86868b] font-inter">
                      More Projects
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-black/10 transition-colors pointer-events-none" />
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
                project.bgColor,
                // gleiche Höhe für alle Cards, damit eine saubere Row entsteht
                'h-[424px] sm:h-[471.55px]',
                // Portrait Cards: fixe Breite wie bisher
                isLandscapeCard ? 'aspect-[4/3]' : 'w-[300px] sm:w-[353.66px]',
                'flex-shrink-0 cursor-pointer relative overflow-hidden rounded-xl snap-start flex flex-col p-4 sm:p-6',
              ].join(' ')}
              data-carousel-item="true"
              initial={isMobile ? false : { y: 12, opacity: 0 }}
              whileInView={isMobile ? undefined : { y: 0, opacity: 1 }}
              // Mobile-Safety: erzwingt Sichtbarkeit, falls whileInView durch State-Flip nicht feuert
              animate={isMobile ? { y: 0, opacity: 1 } : undefined}
              transition={
                isMobile
                  ? undefined
                  : { duration: 0.6, ease: 'easeOut', delay: index * 0.08 }
              }
              viewport={isMobile ? undefined : { once: true, amount: 0.6 }}
              onClick={() => handleProjectClick(project.slug)}
              whileHover="hover"
            >
              {/* Background Image */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes={imageSizes}
                  className="object-cover object-center"
                  draggable={false}
                />
              </div>
              {/* leichte Abdunklung unten für Text-Lesbarkeit */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35 pointer-events-none" />
              
              {/* Category */}
              <motion.div 
                className="relative z-10"
                initial="initial"
                animate="initial"
                whileHover="hover"
                variants={{
                  initial: { y: -20, opacity: 0 },
                  hover: { y: 0, opacity: 1 }
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeOut"
                }}
              >
                <p className="text-white font-inter font-normal text-[16px] leading-[24px] whitespace-pre">
                  {project.category}
                </p>
              </motion.div>
              
              {/* Title */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-white font-helvetica font-bold text-[19.844px] leading-[24px]">
                  {project.title}
                </h3>
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