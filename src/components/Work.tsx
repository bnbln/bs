import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll } from 'framer-motion';
import { useRouter } from 'next/router';
const arrowSvg = '/assets/arrow.svg';
import { Project } from '../lib/markdown';

interface ProjectCardProps extends React.ComponentPropsWithoutRef<'div'> {
  project: Project;
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const router = useRouter();
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInsideThisProject, setIsMouseInsideThisProject] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Simple fast scroll detection - only hides tooltip during very fast scrolling
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      const currentTime = Date.now();
      const currentScrollY = window.scrollY;
      const deltaTime = currentTime - lastScrollTime;
      const deltaY = Math.abs(currentScrollY - lastScrollY);
      
      // Calculate scroll velocity (pixels per millisecond)
      const scrollVelocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      
      // Hide tooltips during very fast scrolling (> 2 pixels per ms)
      if (scrollVelocity > 2) {
        setIsFastScrolling(true);
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Re-enable after short delay and check if mouse is still inside
        scrollTimeoutRef.current = setTimeout(() => {
          setIsFastScrolling(false);
          // If mouse is still inside this project after scrolling stops, show hover again
          if (isMouseInsideThisProject) {
            setIsHovered(true);
          }
        }, 50);
      }
      
      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMouseInsideThisProject]);

  // Hide hover when fast scrolling starts
  useEffect(() => {
    if (isFastScrolling) {
      setIsHovered(false);
    }
  }, [isFastScrolling]);

  // Optimized mouse move handler with throttling - only update if mouse is inside THIS project
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Only update position if mouse is actually inside this specific project
    if (!isMouseInsideThisProject) return;
    
    // Throttle mouse updates to improve performance
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    });
  }, [isMouseInsideThisProject]);

  // Proper hover handlers that track this specific project
  const handleMouseEnter = useCallback(() => {
    setIsMouseInsideThisProject(true);
    // Only show hover if not fast scrolling
    if (!isFastScrolling) {
      setIsHovered(true);
    }
  }, [isFastScrolling]);

  const handleMouseLeave = useCallback(() => {
    setIsMouseInsideThisProject(false);
    setIsHovered(false);
    // Clear any pending mouse position updates
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Handle project click
  const handleProjectClick = useCallback(() => {
    router.push(`/project/${project.slug}`);
  }, [router, project.slug]);

  // Generate image sequence URLs when component mounts (no loading needed since preloaded)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence) {
      const images: string[] = [];
      const { startFrame, endFrame, basePath } = project.animationSequence;
      
      // Generate all frame URLs
      for (let i = startFrame; i <= endFrame; i++) {
        const paddedNumber = i.toString().padStart(4, '0');
        const imageUrl = basePath + `${paddedNumber}.webp`;
        images.push(imageUrl);
      }
      
      setLoadedImages(images);
    }
  }, [project.hasAnimation, project.animationSequence]);

  // High-performance frame update using requestAnimationFrame
  const updateFrame = useCallback((scrollProgress: number) => {
    if (!loadedImages.length) return;
    
    // Calculate target frame with smooth interpolation
    const totalFrames = loadedImages.length;
    const targetFrame = scrollProgress * (totalFrames - 1);
    
    // Use 60fps interpolation for smoother animation
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime.current;
    
    if (deltaTime >= 0.5) { // 60fps = ~16.67ms per frame
      const newFrame = Math.round(targetFrame);
      const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames - 1));
      
      setCurrentFrame(clampedFrame);
      lastFrameTime.current = currentTime;
    }
  }, [loadedImages.length]);

  // High-performance scroll handler
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && loadedImages.length > 0) {
      const unsubscribe = scrollYProgress.on("change", (latest) => {
        // Use requestAnimationFrame for smooth updates
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        animationRef.current = requestAnimationFrame(() => {
          updateFrame(latest);
        });
      });
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        unsubscribe();
      };
    }
  }, [scrollYProgress, project.hasAnimation, project.animationSequence, loadedImages.length, updateFrame]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`sticky w-full aspect-video shadow-xl cursor-pointer group`}
      style={{
        zIndex: index + 1,
        top: 0
      }}
      initial={{ y: 0, opacity: 1 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8}}
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleProjectClick}
    >
      {/* Background Image or Sequence */}
      {project.hasAnimation && project.animationSequence && loadedImages.length > 0 ? (
        // Image sequence animation with high-performance rendering
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat">
          <img
            src={loadedImages[currentFrame]}
            alt={`Animation frame ${currentFrame + 1}`}
            className="w-full h-full object-cover"
            style={{
              // High-performance rendering optimizations
              imageRendering: 'auto',
              willChange: 'transform',
              transform: 'translateZ(0)', // Force hardware acceleration
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              // Ensure smooth transitions
              transition: 'none', // Disable CSS transitions for better performance
            }}
          />
        </div>
      ) : (
        // Static background image
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('${project.image}')` 
          }}
        />
      )}

      {/* Video Overlay - Only show if project has a video */}
      {project.video && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={project.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Cursor-following title (desktop only) */}
      {isHovered && !isFastScrolling && (
        <div
          className="fixed pointer-events-none z-50 hidden md:block"
          style={{
            left: mousePosition.x + 20,
            top: mousePosition.y - 20,
            transform: 'translateZ(0)', // Force hardware acceleration
            willChange: 'transform', // Optimize for animations
          }}
        >
          <motion.div
            className="bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-xl border border-white/10"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ 
              duration: 0.15,
              ease: "easeOut"
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">{project.title}</span>
              <img 
                src={arrowSvg} 
                alt="Arrow" 
                className="w-4 h-4 flex-shrink-0" 
                style={{ filter: 'brightness(0) invert(1)' }} // Ensure white arrow
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile arrow button (mobile only) */}
      <motion.button
        className="absolute bottom-4 right-4 md:hidden bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ 
          duration: 0.1,
          ease: "easeOut"
        }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          handleProjectClick();
        }}
        style={{
          transform: 'translateZ(0)', // Force hardware acceleration
          willChange: 'transform', // Optimize for animations
        }}
      >
        <img
          src={arrowSvg}
          alt="View project"
          className="w-4 h-4" 
          style={{ filter: 'brightness(0) invert(1)' }} // Ensure white arrow
        />
      </motion.button>
    </motion.div>
  );
};

interface WorkProps {
  data: Project[];
}

const Work: React.FC<WorkProps> = ({ data }) => {
  return (
    <section className="bg-white w-full relative">
      {/* Section Title */}
      <motion.h2
        className="bg-white max-w-7xl mx-auto px-4 sm:px-8 md:px-16 relative w-full text-black font-space-grotesk font-bold text-[20px] leading-[41.22px] z-20"
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Featured Design
      </motion.h2>
      
      {/* Projects Container */}
      <div className="relative pt-8">
        <div className="w-full">
          {data.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Work; 