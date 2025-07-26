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
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedImageCount = useRef<number>(0);
  const lastRenderedFrame = useRef<number>(-1);
  const pendingFrame = useRef<number>(-1);
  const isSeekingRef = useRef<boolean>(false);
  const frameQueue = useRef<number[]>([]);
  const lastScrollTime = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);
  const isPlayingVideo = useRef<boolean>(false);
  const playbackTimeout = useRef<NodeJS.Timeout | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  
  // Check if this project uses video scrubbing (has videoPath in animationSequence)
  const useVideoScrubbing = project.animationSequence?.videoPath !== undefined;
  
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

  // Handle video loading for animation sequence
  const handleVideoLoad = useCallback(() => {
    console.log('Video loaded successfully');
    setVideoLoaded(true);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      console.log('Showing animation');
      setShowAnimation(true);
    }, 100);
  }, []);

  // Safari-compatible video loading with multiple fallbacks
  const handleVideoLoadSafari = useCallback(() => {
    console.log('Safari video load triggered');
    if (!videoLoaded) {
      handleVideoLoad();
    }
  }, [videoLoaded, handleVideoLoad]);

  // Initialize video when component mounts (only for book project)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && useVideoScrubbing && videoRef.current) {
      const video = videoRef.current;
      
      console.log('Setting up video for book project (Safari compatible)');
      
      // Set up video properties for frame-by-frame scrubbing
      video.preload = 'auto'; // Safari needs 'auto' for better loading
      video.currentTime = 0;
      
      // Safari-specific video setup
      video.muted = true;
      video.playsInline = true;
      
      // Force load in Safari
      if (video.readyState === 0) {
        video.load();
      }
      
      // Multiple event listeners for Safari compatibility
      const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'];
      const eventHandlers = events.map(event => {
        const handler = () => {
          console.log(`Video event: ${event}`);
          if (!videoLoaded && video.readyState >= 2) {
            handleVideoLoad();
          }
        };
        video.addEventListener(event, handler);
        return { event, handler };
      });
      
      // Safari fallback: check if video loads after a delay
      const safariFallback = setTimeout(() => {
        if (!videoLoaded && video.readyState >= 2) {
          console.log('Safari fallback: forcing video load');
          handleVideoLoad();
        }
      }, 2000);
      
      return () => {
        events.forEach((event, index) => {
          video.removeEventListener(event, eventHandlers[index].handler);
        });
        clearTimeout(safariFallback);
      };
    }
  }, [project.hasAnimation, project.animationSequence, useVideoScrubbing, handleVideoLoad, videoLoaded]);

  // Preload animation sequence images (for legacy image sequences)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && !useVideoScrubbing && project.animationSequence.basePath && project.animationSequence.startFrame !== undefined && project.animationSequence.endFrame !== undefined) {
      const images: string[] = [];
      const { startFrame, endFrame, basePath } = project.animationSequence;
      
      // Generate all frame URLs
      for (let i = startFrame!; i <= endFrame!; i++) {
        const paddedNumber = i.toString().padStart(4, '0');
        const imageUrl = basePath! + `${paddedNumber}.webp`;
        images.push(imageUrl);
      }
      
      setLoadedImages(images);
      
      // Preload images with progress tracking
      let loadedCount = 0;
      const totalImages = images.length;
      
      const preloadImage = (url: string, index: number) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            loadedImageCount.current = loadedCount;
            
            // Update loading state
            if (loadedCount === totalImages) {
              setImagesLoaded(true);
              // Small delay to ensure smooth transition
              setTimeout(() => {
                setShowAnimation(true);
              }, 100);
            }
            resolve();
          };
          img.onerror = () => {
            // If image fails to load, still count it to avoid infinite loading
            loadedCount++;
            loadedImageCount.current = loadedCount;
            if (loadedCount === totalImages) {
              setImagesLoaded(true);
              setTimeout(() => {
                setShowAnimation(true);
              }, 100);
            }
            resolve();
          };
          img.src = url;
        });
      };
      
      // Preload all images in parallel
      Promise.all(images.map((url, index) => preloadImage(url, index)));
    }
  }, [project.hasAnimation, project.animationSequence, useVideoScrubbing]);

  // Hybrid rendering: frame-perfect scrubbing for slow scroll, 60fps playback for fast scroll
  const updateVideoFrame = useCallback((scrollProgress: number) => {
    if (!videoRef.current || !canvasRef.current || !videoLoaded || !showAnimation) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !video.duration || isNaN(video.duration)) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastScrollTime.current;
    
    // Calculate scroll velocity (scroll progress change per ms)
    const totalFrames = project.animationSequence?.frameCount || 501;
    const scrollDelta = Math.abs(scrollProgress - (lastRenderedFrame.current / (totalFrames - 1)));
    scrollVelocity.current = deltaTime > 0 ? scrollDelta / deltaTime : 0;
    
    // Fast scrolling threshold (adjust as needed)
    const isFastScrolling = scrollVelocity.current > 0.01; // Adjust sensitivity here
    
    if (isFastScrolling && !isPlayingVideo.current) {
      // Switch to smooth video playback for fast scrolling
      startVideoPlayback(video, canvas, ctx, scrollProgress);
    } else if (!isFastScrolling && isPlayingVideo.current) {
      // Switch back to frame-perfect scrubbing for slow scrolling
      stopVideoPlayback(video, canvas, ctx, scrollProgress);
    } else if (!isFastScrolling && !isPlayingVideo.current) {
      // Normal frame-perfect scrubbing for slow scrolling
      updateFramePerfectly(video, canvas, ctx, scrollProgress, currentTime);
    }
    
    lastScrollTime.current = currentTime;
  }, [videoLoaded, showAnimation]);

  // Frame-perfect scrubbing for slow scrolling (your preferred mode)
  const updateFramePerfectly = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scrollProgress: number, currentTime: number) => {
    const deltaTime = currentTime - lastFrameTime.current;
    
    if (deltaTime >= 16.67) { // 60fps = 16.67ms per frame
      const totalFrames = project.animationSequence?.frameCount || 501;
      const targetFrame = scrollProgress * (totalFrames - 1);
      const newFrame = Math.round(targetFrame);
      const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames - 1));
      
      // Only update if frame changed
      if (clampedFrame !== lastRenderedFrame.current) {
        const targetTime = (clampedFrame / (totalFrames - 1)) * video.duration;
        video.currentTime = targetTime;
        
        requestAnimationFrame(() => {
          drawVideoFrame(video, canvas, ctx);
          lastRenderedFrame.current = clampedFrame;
          setCurrentFrame(clampedFrame);
        });
      }
      
      lastFrameTime.current = currentTime;
    }
  }, [project.animationSequence?.frameCount]);

  // Start smooth 60fps video playback for fast scrolling (Safari compatible)
  const startVideoPlayback = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scrollProgress: number) => {
    if (isPlayingVideo.current) return;
    
    isPlayingVideo.current = true;
    
    // Set video to correct position and play at 60fps
    const targetTime = scrollProgress * video.duration;
    video.currentTime = targetTime;
    video.playbackRate = 1.0; // Normal speed
    
    // Start continuous canvas updates during playback
    const playbackLoop = () => {
      if (isPlayingVideo.current && video && canvas && ctx) {
        drawVideoFrame(video, canvas, ctx);
        
        // Update frame counter based on video time
        const totalFrames = project.animationSequence?.frameCount || 501;
        const currentFrame = Math.round((video.currentTime / video.duration) * (totalFrames - 1));
        lastRenderedFrame.current = currentFrame;
        setCurrentFrame(currentFrame);
        
        requestAnimationFrame(playbackLoop);
      }
    };
    
    // Safari-compatible play with user interaction fallback
    const playVideo = async () => {
      try {
        await video.play();
        playbackLoop();
      } catch (error) {
        console.log('Video play failed, using frame-perfect mode instead');
        // Fallback to frame-perfect mode if autoplay fails
        isPlayingVideo.current = false;
        // Force a frame update
        if (video.readyState >= 2) {
          drawVideoFrame(video, canvas, ctx);
        }
      }
    };
    
    playVideo();
  }, []);

  // Stop video playback and return to frame-perfect scrubbing
  const stopVideoPlayback = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scrollProgress: number) => {
    if (!isPlayingVideo.current) return;
    
    isPlayingVideo.current = false;
    video.pause();
    
    // Set to exact frame based on current scroll position
    const targetTime = scrollProgress * video.duration;
    video.currentTime = targetTime;
    
    // Draw final frame
    requestAnimationFrame(() => {
      drawVideoFrame(video, canvas, ctx);
      const totalFrames = project.animationSequence?.frameCount || 501;
      const currentFrame = Math.round(scrollProgress * (totalFrames - 1));
      lastRenderedFrame.current = currentFrame;
      setCurrentFrame(currentFrame);
    });
  }, []);

  // Responsive canvas drawing function
  const drawVideoFrame = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Always update canvas size for responsiveness
    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;
    
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Reset context scale and apply new DPR
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    
    // Clear and draw video frame with object-cover behavior
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = rect.width / rect.height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (videoAspect > canvasAspect) {
      drawHeight = rect.height;
      drawWidth = drawHeight * videoAspect;
      drawX = (rect.width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = rect.width;
      drawHeight = drawWidth / videoAspect;
      drawX = 0;
      drawY = (rect.height - drawHeight) / 2;
    }
    
    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }, []);

  // Setup resize observer for responsive canvas
  useEffect(() => {
    if (useVideoScrubbing && canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Create resize observer
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === canvas) {
            // Force redraw when canvas size changes
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              const ctx = canvas.getContext('2d');
              if (ctx) {
                drawVideoFrame(video, canvas, ctx);
              }
            }
          }
        }
      });
      
      // Observe canvas for size changes
      resizeObserver.current.observe(canvas);
      
      // Also listen for window resize events
      const handleWindowResize = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawVideoFrame(video, canvas, ctx);
          }
        }
      };
      
      window.addEventListener('resize', handleWindowResize);
      
      return () => {
        if (resizeObserver.current) {
          resizeObserver.current.disconnect();
        }
        window.removeEventListener('resize', handleWindowResize);
      };
    }
  }, [useVideoScrubbing, drawVideoFrame]);

  // High-performance frame update using requestAnimationFrame (for image sequences)
  const updateImageFrame = useCallback((scrollProgress: number) => {
    if (!loadedImages.length || !showAnimation) return;
    
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
  }, [loadedImages.length, showAnimation]);

  // High-performance scroll handler for video scrubbing (book project)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && useVideoScrubbing && videoLoaded && showAnimation) {
      const unsubscribe = scrollYProgress.on("change", (latest) => {
        // Use requestAnimationFrame for smooth updates
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        animationRef.current = requestAnimationFrame(() => {
          updateVideoFrame(latest);
        });
      });
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        unsubscribe();
      };
    }
  }, [scrollYProgress, project.hasAnimation, project.animationSequence, useVideoScrubbing, videoLoaded, showAnimation, updateVideoFrame]);

  // High-performance scroll handler for image sequences (other projects)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && !useVideoScrubbing && loadedImages.length > 0 && showAnimation) {
      const unsubscribe = scrollYProgress.on("change", (latest) => {
        // Use requestAnimationFrame for smooth updates
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        animationRef.current = requestAnimationFrame(() => {
          updateImageFrame(latest);
        });
      });
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        unsubscribe();
      };
    }
  }, [scrollYProgress, project.hasAnimation, project.animationSequence, useVideoScrubbing, loadedImages.length, showAnimation, updateImageFrame]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (playbackTimeout.current) {
        clearTimeout(playbackTimeout.current);
      }
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      // Clear frame queue and seeking state
      frameQueue.current = [];
      isSeekingRef.current = false;
      isPlayingVideo.current = false;
      
      // Stop video if playing
      if (videoRef.current) {
        videoRef.current.pause();
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
      {/* Static Background Image (Fallback) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('${project.image}')`,
          opacity: showAnimation ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />

      {/* Video Animation Sequence (Book Project Only) */}
      {project.hasAnimation && project.animationSequence && useVideoScrubbing && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            opacity: showAnimation ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
                    {/* Hidden video for frame extraction (Safari compatible) */}
          <video
            ref={videoRef}
            className="hidden"
            muted
            playsInline
            preload="auto"
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            onLoadedMetadata={handleVideoLoad}
            onLoadedData={handleVideoLoadSafari}
            onCanPlay={handleVideoLoadSafari}
            onCanPlayThrough={handleVideoLoadSafari}
            onProgress={() => {
              console.log('Video progress');
              if (!videoLoaded && videoRef.current && videoRef.current.readyState >= 2) {
                handleVideoLoad();
              }
            }}
            onError={(e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
              console.error('Video loading error:', e);
            }}
          >
            <source src={project.animationSequence?.videoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Canvas for smooth frame rendering (same smoothness as your original images) */}
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              // Maximum smoothness optimizations
              willChange: 'contents',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              imageRendering: 'pixelated', // Crisp pixel rendering
              objectFit: 'cover',
            }}
           />
        </div>
      )}

      {/* Image Animation Sequence (Other Projects) */}
      {project.hasAnimation && project.animationSequence && !useVideoScrubbing && loadedImages.length > 0 && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            opacity: showAnimation ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          {showAnimation && (
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
          )}
        </div>
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
      
      {/* Loading indicator for animations */}
      {project.hasAnimation && project.animationSequence && !showAnimation && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">
                {useVideoScrubbing ? 'Loading animation...' : `Loading animation... ${Math.round((loadedImageCount.current / (loadedImages.length || 1)) * 100)}%`}
              </span>
            </div>
          </div>
        </div>
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