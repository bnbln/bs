import React, { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { Project } from '../lib/markdown'

const FeaturedProjects = ({ data }: { data: Project[] }) => {
  
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = window.innerWidth < 768 ? 300 : 353.66 
      const gap = 20 
      const totalCardWidth = cardWidth + gap
      
      // Calculate current scroll position
      const currentScroll = container.scrollLeft
      
      // Find the index of the currently visible card (no padding offset needed)
      const currentIndex = Math.round(currentScroll / totalCardWidth)
      
      // Calculate target scroll position for the previous card
      const targetIndex = Math.max(0, currentIndex - 1)
      const targetScroll = targetIndex * totalCardWidth
      
      // Ensure we don't scroll beyond the maximum possible scroll position
      const maxScroll = container.scrollWidth - container.clientWidth
      const finalTargetScroll = Math.min(targetScroll, maxScroll)
      
      container.scrollTo({ left: finalTargetScroll, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = window.innerWidth < 768 ? 300 : 353.66 
      const gap = 20 
      const totalCardWidth = cardWidth + gap
      
      // Calculate current scroll position
      const currentScroll = container.scrollLeft
      
      // Find the index of the currently visible card (no padding offset needed)
      const currentIndex = Math.round(currentScroll / totalCardWidth)
      
      // Calculate target scroll position for the next card
      const targetIndex = Math.min(data.length - 1, currentIndex + 1)
      const targetScroll = targetIndex * totalCardWidth
      
      // Ensure we don't scroll beyond the maximum possible scroll position
      const maxScroll = container.scrollWidth - container.clientWidth
      const finalTargetScroll = Math.min(targetScroll, maxScroll)
      
      container.scrollTo({ left: finalTargetScroll, behavior: 'smooth' })
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
        const cardWidth = window.innerWidth < 768 ? 300 : 353.66 
        const gap = 20 
        const totalCardWidth = cardWidth + gap
        const currentScroll = container.scrollLeft
        
        // Calculate projection based on velocity
        // A velocity of 2 means we moved 2px per ms. 
        // Let's project where we'd land in ~300ms
        const velocity = velocityRef.current
        const inertia = Math.abs(velocity) > 0.5 ? 300 : 0 // Only apply inertia if decent swipe
        const projectedScroll = currentScroll - (velocity * inertia)
        
        // Find nearest index to projection
        const nearestIndex = Math.round(projectedScroll / totalCardWidth)
        
        // Clamp index
        const clampedIndex = Math.max(0, Math.min(data.length - 1, nearestIndex))
        const targetScroll = clampedIndex * totalCardWidth
        
        container.scrollTo({ left: targetScroll, behavior: 'smooth' })
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
  const [isMobile, setIsMobile] = React.useState(false) // Default to false (desktop) until checked
  
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
            key={isMobile ? 'mobile' : 'desktop'}
            className="inline-flex min-w-full gap-5 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px]"
        >
          {data.map((project, index) => (
            <motion.div
              key={project.id}
              className={`project-card ${project.bgColor} w-[300px] sm:w-[353.66px] h-[424px] sm:h-[471.55px] flex-shrink-0 cursor-pointer relative overflow-hidden rounded-xl snap-start flex flex-col p-4 sm:p-6`}
              initial={isMobile ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: isMobile ? 0 : index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => handleProjectClick(project.slug)}
              whileHover="hover"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-xl"
                style={{ backgroundImage: `url('${project.image}')` }}
              />
              
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
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProjects 