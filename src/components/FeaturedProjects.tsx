import React, { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface FeaturedProject {
  id: number
  category: string
  title: string
  image: string
  bgColor: string
}



const FeaturedProjects = ({ data }: { data: FeaturedProject[] }) => {
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = 353.66 // Width of each project card
      const gap = 20 // Gap between cards (gap-5 = 20px)
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
      const cardWidth = 353.66 // Width of each project card
      const gap = 20 // Gap between cards (gap-5 = 20px)
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

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = 353.66 // Width of each project card
      const gap = 20 // Gap between cards (gap-5 = 20px)
      const totalCardWidth = cardWidth + gap
      
      // Calculate current scroll position
      const currentScroll = container.scrollLeft
      
      // Find the nearest card position (no padding offset needed)
      const nearestIndex = Math.round(currentScroll / totalCardWidth)
      
      // Ensure index is within bounds
      const clampedIndex = Math.max(0, Math.min(data.length - 1, nearestIndex))
      const nearestScroll = clampedIndex * totalCardWidth
      
      // Only snap if we're close enough to a card position (within 60px for more responsive snapping)
      if (Math.abs(currentScroll - nearestScroll) > 20) {
        // Ensure we don't scroll beyond the maximum possible scroll position
        const maxScroll = container.scrollWidth - container.clientWidth
        const finalTargetScroll = Math.min(nearestScroll, maxScroll)
        
        // Custom smooth scrolling with longer duration
        const startPosition = container.scrollLeft
        const distance = finalTargetScroll - startPosition
        const duration = 800 // 800ms for longer, smoother animation
        const startTime = performance.now()
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Easing function for smooth animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4)
          
          const newPosition = startPosition + (distance * easeOutQuart)
          container.scrollLeft = newPosition
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll)
          }
        }
        
        requestAnimationFrame(animateScroll)
      }
    }
  }, [])

  // Debounced scroll handler
  const debouncedHandleScroll = useCallback(() => {
    let timeoutId: number
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        handleScroll()
      }, 150) // Wait 150ms after scrolling stops for more responsive snapping
    }
  }, [handleScroll])

  // Set up scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      const debouncedScroll = debouncedHandleScroll()
      container.addEventListener('scroll', debouncedScroll)
      
      return () => {
        container.removeEventListener('scroll', debouncedScroll)
      }
    }
  }, [debouncedHandleScroll])

  return (
    <section className="bg-white h-[737px] relative w-full" id="work">
      {/* Section Title with Navigation */}
      <motion.div 
        className="absolute left-10 top-[108px] translate-y-[-50%] flex items-center gap-4"
        initial={{ x: -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-black font-space-grotesk font-bold text-[20px] leading-[41.22px] whitespace-pre">
          The Latest
        </h2>
        
        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={scrollLeft}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
          
          <motion.button
            onClick={scrollRight}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Projects Container */}
      <div 
        ref={scrollContainerRef}
        className="absolute left-0 top-[162px] h-[472px] w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
      >
        <div className="flex gap-5 pl-10">
          {data.map((project, index) => (
            <motion.div
              key={project.id}
              className={`project-card ${project.bgColor} w-[353.66px] flex-shrink-0`}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-[4.5px]"
                style={{ backgroundImage: `url('${project.image}')` }}
              />
              
              {/* Category */}
              <div className="relative z-10">
                <p className="text-white font-inter font-normal text-[16px] leading-[24px] whitespace-pre">
                  {project.category}
                </p>
              </div>
              
              {/* Title */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-white font-helvetica font-bold text-[19.844px] leading-[24px]">
                  {project.title}
                </h3>
              </div>
            </motion.div>
          ))}
          {/* Spacer for right padding */}
          <div className="w-4 flex-shrink-0"></div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects 