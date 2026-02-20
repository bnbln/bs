import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRouter } from 'next/router';
const arrowSvg = '/assets/arrow.svg';
import { Project } from '../lib/markdown';

const SCRUB_FPS_CAP = 60;
const MOBILE_SCRUB_FPS_CAP = 30;
const IOS_SCRUB_FPS_CAP = 24;
const MOBILE_CANVAS_MAX_DPR = 1.5;
const IOS_CANVAS_MAX_DPR = 1.25;
const MOBILE_SCRUB_SEEK_INTERVAL_MS = 33;
const IOS_SCRUB_SEEK_INTERVAL_MS = 42;
const SAFARI_DESKTOP_SCRUB_SEEK_INTERVAL_MS = 33;
const MOBILE_NATIVE_MIN_SEEK_DELTA = 1 / 90;
const IOS_NATIVE_MIN_SEEK_DELTA = 1 / 24;
const SAFARI_DESKTOP_NATIVE_MIN_SEEK_DELTA = 1 / 30;
const NATIVE_FAST_SEEK_THRESHOLD_SECONDS = 0.45;
const NATIVE_WARMUP_ROOT_MARGIN = '200% 0px';
const VIDEO_SCROLL_START_OFFSET = '99%'; // start when card is about 1% visible
const VIDEO_SCROLL_END_OFFSET = '-120%'; // continue scrubbing after the card starts transitioning away

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
  const [isSafari, setIsSafari] = useState(false);
  const [preferNativeVideoScrub, setPreferNativeVideoScrub] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafariDesktop, setIsSafariDesktop] = useState(false);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
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
  const revealTimeoutRef = useRef<number | null>(null);
  const isMobileRef = useRef<boolean>(false);
  const isIOSRef = useRef<boolean>(false);
  const isSafariDesktopRef = useRef<boolean>(false);
  const preferNativeVideoScrubRef = useRef<boolean>(false);
  const nativeTargetTimeRef = useRef<number | null>(null);
  const nativeSeekInFlightRef = useRef<boolean>(false);
  const nativeLastSeekAtRef = useRef<number>(0);
  const nativeScrubRafRef = useRef<number | null>(null);
  const nativeWarmupDoneRef = useRef<boolean>(false);

  // Check if this project uses video scrubbing (has videoPath in animationSequence)
  const useVideoScrubbing = project.animationSequence?.videoPath !== undefined;
  const selectedScrubVideoPath = useMemo(() => {
    if (!project.animationSequence) return undefined;

    if (isIOS) {
      return (
        project.animationSequence.mobileVideoPath ||
        project.animationSequence.safariVideoPath ||
        project.animationSequence.videoPath
      );
    }

    if (isSafariDesktop) {
      return (
        project.animationSequence.safariVideoPath ||
        project.animationSequence.mobileVideoPath ||
        project.animationSequence.videoPath
      );
    }

    if (isMobileDevice) {
      return project.animationSequence.mobileVideoPath || project.animationSequence.videoPath;
    }

    return project.animationSequence.videoPath;
  }, [isIOS, isMobileDevice, isSafariDesktop, project.animationSequence]);

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: ["start end", "end start"]
  });
  const { scrollYProgress: videoScrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: [`start ${VIDEO_SCROLL_START_OFFSET}`, `end ${VIDEO_SCROLL_END_OFFSET}`]
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);
    const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    const finePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
    const detectedMobile = coarsePointer || isIOSDevice || isAndroidDevice;
    const detectedSafari =
      /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|SamsungBrowser|Android/i.test(ua);
    const detectedSafariDesktop = detectedSafari && !isIOSDevice && finePointer;

    isIOSRef.current = isIOSDevice;
    isMobileRef.current = detectedMobile;
    isSafariDesktopRef.current = detectedSafariDesktop;
    preferNativeVideoScrubRef.current = detectedMobile || detectedSafariDesktop;
    setIsMobileDevice(detectedMobile);
    setIsIOS(isIOSDevice);
    setIsSafariDesktop(detectedSafariDesktop);
    setIsSafari(detectedSafari);
    setPreferNativeVideoScrub(detectedMobile || detectedSafariDesktop);
  }, []);

  useEffect(() => {
    if (!useVideoScrubbing) return;

    pendingFrame.current = -1;
    lastRenderedFrame.current = -1;
    isSeekingRef.current = false;
    nativeTargetTimeRef.current = null;
    nativeSeekInFlightRef.current = false;
    nativeLastSeekAtRef.current = 0;
    nativeWarmupDoneRef.current = false;
    setVideoLoaded(false);
    setShowAnimation(false);
  }, [selectedScrubVideoPath, useVideoScrubbing]);

  // For image sequences: start when card reaches ~50% visibility and complete
  // at the sticky top position.
  const remapAnimationProgress = useCallback((rawProgress: number): number => {
    const vh = window.innerHeight;
    const cardHeight = containerRef.current?.offsetHeight || vh;
    const totalDistance = vh + cardHeight;

    // Start: card top reaches viewport center (~50% visible).
    const startPoint = (vh / 2) / totalDistance;
    // End: card top at viewport top.
    const endPoint = vh / totalDistance;

    return Math.min(1, Math.max(0, (rawProgress - startPoint) / Math.max(0.0001, endPoint - startPoint)));
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

  // Safari: animate crop via clip-path instead of margins/border radius to avoid
  // layout-heavy repaints during the intro stack transition.
  const safariCardClipPath = useTransform([cardMargin, cardBorderRadius] as any, ([m, r]: number[]) => {
    const inset = Math.max(0, m);
    const radius = Math.max(0, r);
    return `inset(0px ${inset}px 0px ${inset}px round ${radius}px)`;
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
    if (videoLoaded) return;
    setVideoLoaded(true);
    const revealDelay = preferNativeVideoScrubRef.current ? 0 : 100;

    if (revealTimeoutRef.current) {
      window.clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = window.setTimeout(() => {
      setShowAnimation(true);
      revealTimeoutRef.current = null;
    }, revealDelay);
  }, [videoLoaded]);

  // Safari-compatible video loading with multiple fallbacks
  const handleVideoLoadSafari = useCallback(() => {
    if (!videoLoaded) {
      handleVideoLoad();
    }
  }, [videoLoaded, handleVideoLoad]);

  // Initialize video when component mounts (only for book project)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && useVideoScrubbing && videoRef.current && selectedScrubVideoPath) {
      const video = videoRef.current;

      // Set up video properties for frame-by-frame scrubbing
      video.preload = 'auto';
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
          const readyStateThreshold = preferNativeVideoScrubRef.current ? 1 : 2;
          if (!videoLoaded && video.readyState >= readyStateThreshold) {
            handleVideoLoad();
          }
        };
        video.addEventListener(event, handler);
        return { event, handler };
      });

      // Safari fallback: check if video loads after a delay
      const safariFallback = setTimeout(() => {
        const readyStateThreshold = preferNativeVideoScrubRef.current ? 1 : 2;
        if (!videoLoaded && video.readyState >= readyStateThreshold) {
          handleVideoLoad();
        }
      }, 1200);

      return () => {
        events.forEach((event, index) => {
          video.removeEventListener(event, eventHandlers[index].handler);
        });
        clearTimeout(safariFallback);
      };
    }
  }, [project.hasAnimation, project.animationSequence, selectedScrubVideoPath, useVideoScrubbing, handleVideoLoad, videoLoaded]);

  useEffect(() => {
    if (!preferNativeVideoScrub || !useVideoScrubbing) return;

    const track = scrollTrackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    let cancelled = false;
    const warmup = () => {
      if (cancelled || nativeWarmupDoneRef.current) return;
      nativeWarmupDoneRef.current = true;

      video.preload = 'auto';
      if (video.readyState === 0) {
        video.load();
      }

      video.play()
        .then(() => {
          video.pause();
          if (video.duration && !isNaN(video.duration)) {
            video.currentTime = 0;
          }
        })
        .catch(() => {
          // Autoplay policies can still block this; native scrub still works.
        });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          warmup();
          observer.disconnect();
        }
      },
      { root: null, rootMargin: NATIVE_WARMUP_ROOT_MARGIN, threshold: 0 }
    );

    observer.observe(track);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [preferNativeVideoScrub, selectedScrubVideoPath, useVideoScrubbing]);

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

    const fpsCap = isMobileRef.current
      ? (isIOSRef.current ? IOS_SCRUB_FPS_CAP : MOBILE_SCRUB_FPS_CAP)
      : SCRUB_FPS_CAP;
    const cappedFrameCount = Math.max(2, Math.round(video.duration * fpsCap));
    // Do not clamp to frontmatter frameCount so longer replaced videos don't stop early.
    return cappedFrameCount;
  }, [project.animationSequence?.frameCount]);

  const seekToFrame = useCallback((frame: number, totalFrames: number) => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) {
      return;
    }

    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1));
    const targetTime = (clampedFrame / (totalFrames - 1)) * video.duration;

    // If we're effectively already at the requested time, don't trigger another seek.
    const minSeekDelta = isMobileRef.current ? (1 / 90) : 0.001;
    if (Math.abs(video.currentTime - targetTime) < minSeekDelta) {
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
    if (!videoRef.current || !videoLoaded || !showAnimation) {
      return;
    }

    if (!preferNativeVideoScrubRef.current && !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video.duration || isNaN(video.duration)) {
      return;
    }

    const totalFrames = getEffectiveVideoFrameCount(video);
    const animProgress = Math.min(1, Math.max(0, scrollProgress));
    const targetFrame = Math.round(animProgress * (totalFrames - 1));
    const clampedFrame = Math.max(0, Math.min(targetFrame, totalFrames - 1));

    // Skip if this frame is already pending and being processed.
    if (clampedFrame === pendingFrame.current) {
      return;
    }

    pendingFrame.current = clampedFrame;

    if (!isSeekingRef.current) {
      seekToFrame(clampedFrame, totalFrames);
    }
  }, [videoLoaded, showAnimation, seekToFrame, getEffectiveVideoFrameCount]);

  const getNativeSeekSettings = useCallback(() => {
    if (isIOSRef.current) {
      return {
        minSeekIntervalMs: IOS_SCRUB_SEEK_INTERVAL_MS,
        minSeekDeltaSeconds: IOS_NATIVE_MIN_SEEK_DELTA,
      };
    }

    if (isSafariDesktopRef.current) {
      return {
        minSeekIntervalMs: SAFARI_DESKTOP_SCRUB_SEEK_INTERVAL_MS,
        minSeekDeltaSeconds: SAFARI_DESKTOP_NATIVE_MIN_SEEK_DELTA,
      };
    }

    return {
      minSeekIntervalMs: MOBILE_SCRUB_SEEK_INTERVAL_MS,
      minSeekDeltaSeconds: MOBILE_NATIVE_MIN_SEEK_DELTA,
    };
  }, []);

  const runNativeScrubTick = useCallback(() => {
    nativeScrubRafRef.current = null;

    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) {
      return;
    }

    if (nativeSeekInFlightRef.current) {
      return;
    }

    const targetTime = nativeTargetTimeRef.current;
    if (targetTime === null) {
      return;
    }

    const { minSeekIntervalMs, minSeekDeltaSeconds } = getNativeSeekSettings();
    const now = performance.now();
    if (now - nativeLastSeekAtRef.current < minSeekIntervalMs) {
      nativeScrubRafRef.current = requestAnimationFrame(runNativeScrubTick);
      return;
    }

    const clampedTarget = Math.max(0, Math.min(video.duration, targetTime));
    const timeDiff = clampedTarget - video.currentTime;
    if (Math.abs(timeDiff) < minSeekDeltaSeconds) {
      return;
    }

    nativeSeekInFlightRef.current = true;
    nativeLastSeekAtRef.current = now;

    try {
      if (
        'fastSeek' in video &&
        typeof (video as any).fastSeek === 'function' &&
        Math.abs(timeDiff) > NATIVE_FAST_SEEK_THRESHOLD_SECONDS
      ) {
        (video as any).fastSeek(clampedTarget);
      } else {
        video.currentTime = clampedTarget;
      }
    } catch (error) {
      nativeSeekInFlightRef.current = false;
      nativeScrubRafRef.current = requestAnimationFrame(runNativeScrubTick);
    }
  }, [getNativeSeekSettings]);

  const ensureNativeScrubTick = useCallback(() => {
    if (nativeScrubRafRef.current === null) {
      nativeScrubRafRef.current = requestAnimationFrame(runNativeScrubTick);
    }
  }, [runNativeScrubTick]);

  // Responsive canvas drawing function
  const drawVideoFrame = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const deviceDpr = window.devicePixelRatio || 1;
    const dpr = isMobileRef.current
      ? Math.min(deviceDpr, isIOSRef.current ? IOS_CANVAS_MAX_DPR : MOBILE_CANVAS_MAX_DPR)
      : Math.min(deviceDpr, 2);

    // Always update canvas size for responsiveness
    const newWidth = Math.max(1, Math.round(rect.width * dpr));
    const newHeight = Math.max(1, Math.round(rect.height * dpr));

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
    if (!useVideoScrubbing || !videoRef.current || preferNativeVideoScrub) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;

    const onSeeked = () => {
      if (!video.duration || isNaN(video.duration)) return;

      if (canvas && ctx) {
        drawVideoFrame(video, canvas, ctx);
      }

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
  }, [preferNativeVideoScrub, useVideoScrubbing, drawVideoFrame, seekToFrame, getEffectiveVideoFrameCount]);

  useEffect(() => {
    if (!useVideoScrubbing || !preferNativeVideoScrub || !videoLoaded || !showAnimation) return;

    const video = videoRef.current;
    if (!video) return;

    const onSeeked = () => {
      nativeSeekInFlightRef.current = false;
      ensureNativeScrubTick();
    };

    const onError = () => {
      nativeSeekInFlightRef.current = false;
      ensureNativeScrubTick();
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
  }, [ensureNativeScrubTick, preferNativeVideoScrub, showAnimation, useVideoScrubbing, videoLoaded]);

  // Setup resize observer for responsive canvas
  useEffect(() => {
    if (preferNativeVideoScrub || !canvasRef.current) return;

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
  }, [preferNativeVideoScrub, useVideoScrubbing, drawVideoFrame, loadedImages.length]);

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
      if (preferNativeVideoScrub) {
        const updateTargetTime = (rawProgress: number) => {
          const video = videoRef.current;
          if (!video || !video.duration || isNaN(video.duration)) return;

          const clampedProgress = Math.max(0, Math.min(1, rawProgress));
          nativeTargetTimeRef.current = clampedProgress * video.duration;
          ensureNativeScrubTick();
        };

        updateTargetTime(videoScrollYProgress.get());

        const unsubscribe = videoScrollYProgress.on("change", (latest) => {
          updateTargetTime(latest);
        });

        return () => {
          if (nativeScrubRafRef.current) {
            cancelAnimationFrame(nativeScrubRafRef.current);
            nativeScrubRafRef.current = null;
          }
          unsubscribe();
        };
      }

      const unsubscribe = videoScrollYProgress.on("change", (latest) => {
        // Use requestAnimationFrame for smooth updates
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }

        scrollAnimationRef.current = requestAnimationFrame(() => {
          updateVideoFrame(latest);
        });
      });

      updateVideoFrame(videoScrollYProgress.get());

      return () => {
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
        unsubscribe();
      };
    }
  }, [ensureNativeScrubTick, videoScrollYProgress, project.hasAnimation, project.animationSequence, preferNativeVideoScrub, useVideoScrubbing, videoLoaded, showAnimation, updateVideoFrame]);

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
      if (nativeScrubRafRef.current) {
        cancelAnimationFrame(nativeScrubRafRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
      pendingFrame.current = -1;
      isSeekingRef.current = false;
      lastRenderedFrame.current = -1;
      nativeTargetTimeRef.current = null;
      nativeSeekInFlightRef.current = false;
      nativeLastSeekAtRef.current = 0;
      nativeWarmupDoneRef.current = false;

      // Stop video if playing
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  const useSafariClipPath = isSafari && !useVideoScrubbing;

  return (
    <div ref={scrollTrackRef} className="relative">
      <motion.div
        ref={containerRef}
        className={`sticky w-full aspect-[1/1] md:h-auto md:aspect-video shadow-xl cursor-pointer group`}
        style={{
          zIndex: index + 1,
          top: stickyTop,
          borderRadius: useSafariClipPath ? 0 : cardBorderRadius,
          marginLeft: useSafariClipPath ? 0 : cardMargin,
          marginRight: useSafariClipPath ? 0 : cardMargin,
          clipPath: useSafariClipPath ? (safariCardClipPath as any) : undefined,
          WebkitClipPath: useSafariClipPath ? (safariCardClipPath as any) : undefined,
          scale: cardScale,
          overflow: 'hidden',
          width: 'auto',
          willChange: useSafariClipPath ? 'transform, clip-path' : 'transform',
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
		          <video
		            ref={videoRef}
		            className={preferNativeVideoScrub ? "w-full h-full object-cover pointer-events-none select-none" : "absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none"}
		            muted
		            playsInline
		            preload="auto"
		            poster={project.image}
		            webkit-playsinline="true"
		            x-webkit-airplay="allow"
		            onLoadedMetadata={handleVideoLoad}
		            onLoadedData={handleVideoLoadSafari}
		            onCanPlay={handleVideoLoadSafari}
		            onCanPlayThrough={handleVideoLoadSafari}
		            style={{
		              transform: 'translateZ(0)',
		              backfaceVisibility: 'hidden',
		              willChange: 'transform',
		            }}
		          >
		            <source src={selectedScrubVideoPath} type="video/mp4" />
		            Your browser does not support the video tag.
		          </video>

	          {!preferNativeVideoScrub && (
	            <canvas
	              ref={canvasRef}
	              className="w-full h-full"
	              style={{
	                willChange: 'contents',
	                transform: 'translateZ(0)',
	                backfaceVisibility: 'hidden',
	                imageRendering: 'auto',
	                objectFit: 'cover',
	              }}
	            />
	          )}
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
      {project.hasAnimation && project.animationSequence && !showAnimation && !(useVideoScrubbing && preferNativeVideoScrub) && (
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
    </div>
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
