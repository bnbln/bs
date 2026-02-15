import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRouter } from 'next/router';
const arrowSvg = '/assets/arrow.svg';
import { Project } from '../lib/markdown';

const SCRUB_FPS_CAP = 30;

interface ProjectCardProps extends React.ComponentPropsWithoutRef<'div'> {
  project: Project;
  index: number;
  sectionProgress: MotionValue<number>;
  pageMargin: number;
  totalCards: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, sectionProgress, pageMargin, totalCards }) => {
  const router = useRouter();
  // Detect fine pointer (avoid hover / cursor logic on touch devices)
  const [hasFinePointer, setHasFinePointer] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(pointer: fine)');
      const update = () => setHasFinePointer(mq.matches);
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
  }, []);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isMouseInsideThisProject, setIsMouseInsideThisProject] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverAnimationRef = useRef<number | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedImageCount = useRef<number>(0);
  const lastRenderedFrame = useRef<number>(-1);
  const pendingFrame = useRef<number>(-1);
  const isSeekingRef = useRef<boolean>(false);

  // Check if this project uses video scrubbing (has videoPath in animationSequence)
  const useVideoScrubbing = project.animationSequence?.videoPath !== undefined;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Remap raw scroll progress so the full animation (all frameCount frames)
  // plays only while the card is meaningfully visible.
  // With offset ["start end", "end start"]:
  //   rawProgress = 0  → card top at viewport bottom (barely peeking in)
  //   rawProgress = vh/(vh+h) → card top at viewport top (sticky position)
  // Start animating as soon as the card starts to become visible.
  const remapAnimationProgress = useCallback((rawProgress: number): number => {
    const vh = window.innerHeight;
    const cardHeight = containerRef.current?.offsetHeight || vh;
    const totalDistance = vh + cardHeight;

    // Start: card just enters the viewport.
    const startPoint = (vh / 2) / totalDistance;
    // End: card top at viewport top (card reaches sticky position)
    const endPoint = vh / totalDistance;

    return Math.min(1, Math.max(0, (rawProgress - startPoint) / (endPoint - startPoint)));
  }, []);

  // ── Two-phase scroll animation ──
  // Phase 1 – Entrance (sectionProgress 0→0.35): cards settle into a tight stack
  //   gap: 100 → 16,  borderRadius: 20 → 12,  scale: 0.93 → 0.97
  // Phase 2 – Expand  (sectionProgress 0.5→0.75): stack goes fullscreen
  //   gap: 16 → 0,   borderRadius: 12 → 0,   scale: 0.97 → 1,  margins → 0

  const STACK_SCALE_STEP = 0.015;     // each deeper card is 1.5 % smaller
  const stackScaleOffset = index * STACK_SCALE_STEP;

  // Keep a live ref so MotionValue callbacks always read the latest pageMargin
  const pageMarginRef = useRef(pageMargin);
  pageMarginRef.current = pageMargin;

  // Entrance: 0 → 1  (settling into stack)
  const entranceT = useTransform(sectionProgress, [0, 0.35], [0, 1], { clamp: true });

  // Expand: 0 → 1  (stack → fullscreen)
  const expandT = useTransform(sectionProgress, [0.5, 0.75], [0, 1], { clamp: true });

  // ── Derived values from both phases ──

  // Gap per card:  100 → 16 (entrance)  → 0 (expand)
  const GAP_INITIAL = 100;
  const GAP_STACKED = 16;
  const stickyTop = useTransform([entranceT, expandT] as any, ([e, t]: number[]) => {
    const entranceGap = GAP_INITIAL - (GAP_INITIAL - GAP_STACKED) * e; // 40→16
    return index * entranceGap * (1 - t);                              // →0
  });

  // Border radius:  20 → 12 (entrance)  → 0 (expand)
  const cardBorderRadius = useTransform([entranceT, expandT] as any, ([e, t]: number[]) => {
    const entranceRadius = 20 - 8 * e; // 20→12
    return entranceRadius * (1 - t);   // →0
  });

  // Scale:  0.93 → 0.97 (entrance)  → 1.0 (expand),  per-card offset fades out
  const cardScale = useTransform([entranceT, expandT] as any, ([e, t]: number[]) => {
    const entranceBase = 0.93 + 0.04 * e;            // 0.93→0.97
    const base = entranceBase + 0.03 * t;             // 0.97→1.0
    const stackFactor = 1 - t;
    return base - stackScaleOffset * stackFactor;
  });

  // Horizontal margin: pageMargin (stacked) → 0 (fullscreen), with scale compensation
  const cardMargin = useTransform([entranceT, expandT] as any, ([e, t]: number[]) => {
    const pm = pageMarginRef.current;
    const fraction = 1 - t;
    if (fraction <= 0) return 0;

    const entranceBase = 0.93 + 0.04 * e;
    const base = entranceBase + 0.03 * t;
    const currentScale = base - stackScaleOffset * fraction;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;

    const M = vw / 2 - (vw - 2 * pm * fraction) / (2 * currentScale);
    return Math.max(0, M);
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
    if (!hasFinePointer) return; // disable on touch
    // Only update position if mouse is actually inside this specific project
    if (!isMouseInsideThisProject) return;

    // Throttle mouse updates to improve performance
    if (hoverAnimationRef.current) {
      cancelAnimationFrame(hoverAnimationRef.current);
    }

    hoverAnimationRef.current = requestAnimationFrame(() => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    });
  }, [isMouseInsideThisProject, hasFinePointer]);

  // Proper hover handlers that track this specific project
  const handleMouseEnter = useCallback(() => {
    if (!hasFinePointer) return; // disable on touch
    setIsMouseInsideThisProject(true);
    // Only show hover if not fast scrolling
    if (!isFastScrolling) {
      setIsHovered(true);
    }
  }, [isFastScrolling, hasFinePointer]);

  const handleMouseLeave = useCallback(() => {
    if (!hasFinePointer) return; // disable on touch
    setIsMouseInsideThisProject(false);
    setIsHovered(false);
    // Clear any pending mouse position updates
    if (hoverAnimationRef.current) {
      cancelAnimationFrame(hoverAnimationRef.current);
    }
  }, [hasFinePointer]);

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

  const getEffectiveVideoFrameCount = useCallback((video: HTMLVideoElement): number => {
    const sourceFrameCount = project.animationSequence?.frameCount || 501;
    if (!video.duration || isNaN(video.duration)) {
      return sourceFrameCount;
    }

    const cappedFrameCount = Math.max(2, Math.round(video.duration * SCRUB_FPS_CAP));
    return Math.max(2, Math.min(sourceFrameCount, cappedFrameCount));
  }, [project.animationSequence?.frameCount]);

  const seekToFrame = useCallback((frame: number, totalFrames: number) => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) {
      return;
    }

    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1));
    const targetTime = (clampedFrame / (totalFrames - 1)) * video.duration;

    // If we're effectively already at the requested time, don't trigger another seek.
    if (Math.abs(video.currentTime - targetTime) < 0.001) {
      lastRenderedFrame.current = clampedFrame;
      isSeekingRef.current = false;
      return;
    }

    isSeekingRef.current = true;
    if ('fastSeek' in video && typeof (video as any).fastSeek === 'function') {
      try {
        (video as any).fastSeek(targetTime);
        return;
      } catch (error) {
        // Ignore and fall back to currentTime assignment.
      }
    }
    video.currentTime = targetTime;
  }, []);

  // Scroll-driven video scrubbing with seek queueing:
  // keep only the latest requested frame while one seek is in flight.
  const updateVideoFrame = useCallback((scrollProgress: number) => {
    if (!videoRef.current || !canvasRef.current || !videoLoaded || !showAnimation) {
      return;
    }

    if (!videoRef.current.duration || isNaN(videoRef.current.duration)) {
      return;
    }

    const totalFrames = getEffectiveVideoFrameCount(videoRef.current);
    const animProgress = remapAnimationProgress(scrollProgress);
    const targetFrame = Math.round(animProgress * (totalFrames - 1));
    const clampedFrame = Math.max(0, Math.min(targetFrame, totalFrames - 1));

    // Skip if this frame is already pending and being processed.
    if (clampedFrame === pendingFrame.current) {
      return;
    }

    pendingFrame.current = clampedFrame;
    setCurrentFrame(clampedFrame);

    if (!isSeekingRef.current) {
      seekToFrame(clampedFrame, totalFrames);
    }
  }, [videoLoaded, showAnimation, remapAnimationProgress, seekToFrame, getEffectiveVideoFrameCount]);

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

  // Draw the video frame only after the browser has decoded it (seeked event)
  useEffect(() => {
    if (!useVideoScrubbing || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const onSeeked = () => {
      drawVideoFrame(video, canvas, ctx);

      const totalFrames = getEffectiveVideoFrameCount(video);
      const renderedFrame = Math.round((video.currentTime / video.duration) * (totalFrames - 1));
      lastRenderedFrame.current = Math.max(0, Math.min(renderedFrame, totalFrames - 1));
      isSeekingRef.current = false;

      // If scroll moved further while we were seeking, immediately seek to newest frame.
      if (pendingFrame.current !== lastRenderedFrame.current) {
        requestAnimationFrame(() => {
          if (!isSeekingRef.current && pendingFrame.current >= 0) {
            seekToFrame(pendingFrame.current, totalFrames);
          }
        });
      }
    };
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('seeked', onSeeked);
    };
  }, [useVideoScrubbing, drawVideoFrame, seekToFrame, getEffectiveVideoFrameCount]);

  // Setup resize observer for responsive canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Force immediate redraw on resize
      if (useVideoScrubbing && videoRef.current && videoRef.current.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawVideoFrame(videoRef.current, canvas, ctx);
      }
    };

    window.addEventListener('resize', handleResize);

    // Also use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(handleResize);
    });
    resizeObserver.observe(canvasRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [useVideoScrubbing, drawVideoFrame, loadedImages.length]);

  // High-performance frame update using requestAnimationFrame (for image sequences)
  const updateImageFrame = useCallback((scrollProgress: number) => {
    if (!loadedImages.length || !showAnimation) return;

    // Calculate target frame with smooth interpolation
    const totalFrames = loadedImages.length;
    const animProgress = remapAnimationProgress(scrollProgress);
    const targetFrame = animProgress * (totalFrames - 1);

    // Use 60fps interpolation for smoother animation
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime.current;

    if (deltaTime >= 0.5) {
      const newFrame = Math.round(targetFrame);
      const clampedFrame = Math.max(0, Math.min(newFrame, totalFrames - 1));

      setCurrentFrame(clampedFrame);
      lastFrameTime.current = currentTime;
    }
  }, [loadedImages.length, showAnimation]);

  // High-performance scroll handler for video scrubbing
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && useVideoScrubbing && videoLoaded && showAnimation) {
      const unsubscribe = scrollYProgress.on("change", (latest) => {
        // Use requestAnimationFrame for smooth updates
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }

        scrollAnimationRef.current = requestAnimationFrame(() => {
          updateVideoFrame(latest);
        });
      });

      return () => {
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
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
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }

        scrollAnimationRef.current = requestAnimationFrame(() => {
          updateImageFrame(latest);
        });
      });

      return () => {
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
        unsubscribe();
      };
    }
  }, [scrollYProgress, project.hasAnimation, project.animationSequence, useVideoScrubbing, loadedImages.length, showAnimation, updateImageFrame]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hoverAnimationRef.current) {
        cancelAnimationFrame(hoverAnimationRef.current);
      }
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      pendingFrame.current = -1;
      isSeekingRef.current = false;
      lastRenderedFrame.current = -1;

      // Stop video if playing
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`sticky w-full aspect-[1/1] md:h-auto md:aspect-video shadow-xl cursor-pointer group`}
      style={{
        zIndex: index + 1,
        top: stickyTop,
        borderRadius: cardBorderRadius,
        marginLeft: cardMargin,
        marginRight: cardMargin,
        scale: cardScale,
        overflow: 'hidden',
        width: 'auto',
        willChange: 'transform',
      }}
      initial={{ y: 0, opacity: 1 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      onMouseMove={hasFinePointer ? handleMouseMove : undefined}
      onMouseEnter={hasFinePointer ? handleMouseEnter : undefined}
      onMouseLeave={hasFinePointer ? handleMouseLeave : undefined}
      onClick={handleProjectClick}
    >
      {/* Static Background Image (Fallback) */}
      <div
        className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${project.image}')`,
          opacity: showAnimation ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />

      {/* Video Animation Sequence (Book Project Only) */}
      {project.hasAnimation && project.animationSequence && useVideoScrubbing && (
        <div
          className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
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
          className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
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

      {/* Floating Cursor Title (Desktop) */}
      <motion.div
        className="fixed pointer-events-none z-50 hidden md:flex flex-col items-start gap-1"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: isHovered && !isFastScrolling && mousePosition.x > 0 ? 1 : 0,
          scale: isHovered && !isFastScrolling && mousePosition.x > 0 ? 1 : 0.9,
          x: 24, // Offset from cursor
          y: 24
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 28,
          mass: 0.5
        }}
      >
        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <span className="text-sm font-medium whitespace-nowrap font-space-grotesk tracking-wide">{project.title}</span>
        </div>
      </motion.div>

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
          style={{ filter: 'brightness(0) invert(1)', transform: 'rotate(-180deg)' }} // Ensure white arrow
        />
      </motion.button>
    </motion.div>
  );
};

interface WorkProps {
  data: Project[];
}

const Work: React.FC<WorkProps> = ({ data }) => {
  const sectionRef = useRef<HTMLElement>(null);

  // Responsive page margin matching the site layout:
  // px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px]
  const [pageMargin, setPageMargin] = useState(16);
  useEffect(() => {
    const updateMargin = () => {
      const w = window.innerWidth;
      if (w >= 1280) setPageMargin(140);
      else if (w >= 1024) setPageMargin(100);
      else if (w >= 768) setPageMargin(48);
      else if (w >= 640) setPageMargin(32);
      else setPageMargin(16);
    };
    updateMargin();
    window.addEventListener('resize', updateMargin);
    return () => window.removeEventListener('resize', updateMargin);
  }, []);

  // Track the Work section entering viewport
  // progress 0 → section top at viewport bottom, 1 → section top at viewport top
  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"]
  });

  return (
    <section ref={sectionRef} className="bg-white w-full relative" id="work">
      {data.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} sectionProgress={sectionProgress} pageMargin={pageMargin} totalCards={data.length} />
      ))}
    </section>
  );
};

export default Work;
