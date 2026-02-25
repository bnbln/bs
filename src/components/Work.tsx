import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, MotionValue, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { useRouter } from 'next/router';
const arrowSvg = '/assets/arrow.svg';
import { Project } from '../lib/markdown';
import dynamic from 'next/dynamic';

const LottiePlayer = dynamic(() => import('./LottiePlayer'), { ssr: false })

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
const VIDEO_SCROLL_START_RATIO = Number.parseFloat(VIDEO_SCROLL_START_OFFSET) / 100;
const VIDEO_SCROLL_END_RATIO = Number.parseFloat(VIDEO_SCROLL_END_OFFSET) / 100;
const loadedSpritesheetPathCache = new Set<string>();

interface ProjectCardProps extends React.ComponentPropsWithoutRef<'div'> {
  project: Project;
  index: number;
  sectionProgress: MotionValue<number>;
  pageMargin: number;
  totalCards: number;
  setHoveredProject: (project: Project | null) => void;
}

type CssVarsStyle = React.CSSProperties & Record<`--${string}`, string | number>;

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, sectionProgress, pageMargin, totalCards, setHoveredProject }) => {
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [spritesheetLoaded, setSpritesheetLoaded] = useState(false);
  const [spritesheetDisplayReady, setSpritesheetDisplayReady] = useState(false);
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
  const spritesheetSequenceRef = useRef<HTMLDivElement>(null);
  const spritesheetCanvasRef = useRef<HTMLCanvasElement>(null);
  const spritesheetImageRef = useRef<HTMLImageElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const latestSpritesheetProgressRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
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
  const spritesheetFrameRef = useRef<number>(-1);
  const spritesheetFrameAspectRef = useRef<number>(16 / 9);
  const spritesheetLoadedPathRef = useRef<string | null>(null);
  const spritesheetLoadingPathRef = useRef<string | null>(null);
  const previousSpritesheetPathRef = useRef<string | null>(null);
  const scrollRangePxRef = useRef<number>(0);
  const effectiveScrollRangePxRef = useRef<number>(0);

  const selectedSpritesheetPath = useMemo(() => {
    if (!project.animationSequence) return undefined;

    if (isIOS) {
      return (
        project.animationSequence.mobileSpritesheetPath ||
        project.animationSequence.safariSpritesheetPath ||
        project.animationSequence.spritesheetPath
      );
    }

    if (isSafariDesktop) {
      return (
        project.animationSequence.safariSpritesheetPath ||
        project.animationSequence.mobileSpritesheetPath ||
        project.animationSequence.spritesheetPath
      );
    }

    if (isMobileDevice) {
      return project.animationSequence.mobileSpritesheetPath || project.animationSequence.spritesheetPath;
    }

    return project.animationSequence.spritesheetPath;
  }, [isIOS, isMobileDevice, isSafariDesktop, project.animationSequence]);

  const spriteCount = project.animationSequence?.spriteCount || 0;
  const spriteColumnCount = project.animationSequence?.columnCount || 0;
  const spriteRowCount = project.animationSequence?.rowCount || 0;
  const scrollPixelsPerFrame = project.animationSequence?.scrollPixelsPerFrame;
  const scrollStartOffsetPx = project.animationSequence?.scrollStartOffsetPx || 0;
  const [isCardNearViewport, setIsCardNearViewport] = useState(false);
  const isSpritesheetKnownLoaded = useMemo(
    () => Boolean(selectedSpritesheetPath && loadedSpritesheetPathCache.has(selectedSpritesheetPath)),
    [selectedSpritesheetPath]
  );
  const spritesheetAssetReady = spritesheetLoaded || isSpritesheetKnownLoaded;

  // Preferred mode: spritesheet. Fallbacks: video scrub -> legacy image sequence.
  const useSpritesheetScrubbing = Boolean(
    selectedSpritesheetPath &&
    spriteCount > 0 &&
    spriteColumnCount > 0 &&
    spriteRowCount > 0
  );

  const useVideoScrubbing = !useSpritesheetScrubbing && project.animationSequence?.videoPath !== undefined;
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

  const animationOpacityTransition = useMemo(() => {
    if (useSpritesheetScrubbing) return 'none';
    return 'opacity 0.5s ease-in-out';
  }, [useSpritesheetScrubbing]);

  const isAnimationReady = useMemo(() => {
    if (useSpritesheetScrubbing) return spritesheetDisplayReady;
    return showAnimation;
  }, [showAnimation, spritesheetDisplayReady, useSpritesheetScrubbing]);

  useEffect(() => {
    const target = scrollTrackRef.current;
    if (!target || !project.hasAnimation || !project.animationSequence) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsCardNearViewport(entries.some((entry) => entry.isIntersecting));
      },
      { root: null, rootMargin: '120% 0px 120% 0px', threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [project.hasAnimation, project.animationSequence]);

  const spritesheetSequenceStyle = useMemo<CssVarsStyle>(() => ({
    '--sprite-count': spriteCount,
    '--column-count': spriteColumnCount,
    '--row-count': spriteRowCount,
    contain: 'layout paint style',
    backgroundColor: 'transparent',
  }), [spriteCount, spriteColumnCount, spriteRowCount]);

  const spritesheetImageStyle = useMemo<React.CSSProperties>(() => ({
    display: 'block',
    width: '1px',
    height: '1px',
    opacity: 0,
    pointerEvents: 'none',
    userSelect: 'none',
  }), []);

  const spritesheetCanvasStyle = useMemo<React.CSSProperties>(() => ({
    willChange: isCardNearViewport ? 'contents' : 'auto',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    imageRendering: 'auto',
  }), [isCardNearViewport]);

  const applySpritesheetFrameTransform = useCallback((frameIndex: number) => {
    const imageEl = spritesheetImageRef.current;
    const canvasEl = spritesheetCanvasRef.current;
    const sequenceEl = spritesheetSequenceRef.current;
    if (!imageEl || !canvasEl || !sequenceEl || spriteCount <= 0 || spriteColumnCount <= 0 || spriteRowCount <= 0) return;
    if (imageEl.naturalWidth <= 0 || imageEl.naturalHeight <= 0) return;

    const clampedFrame = Math.max(0, Math.min(frameIndex, spriteCount - 1));
    const cellWidth = imageEl.naturalWidth / spriteColumnCount;
    const cellHeight = imageEl.naturalHeight / spriteRowCount;
    if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight) || cellWidth <= 0 || cellHeight <= 0) return;

    const rect = sequenceEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const column = clampedFrame % spriteColumnCount;
    const row = Math.floor(clampedFrame / spriteColumnCount);
    const sourceX = column * cellWidth;
    const sourceY = row * cellHeight;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const targetWidth = Math.max(1, Math.round(rect.width * dpr));
    const targetHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvasEl.width !== targetWidth || canvasEl.height !== targetHeight) {
      canvasEl.width = targetWidth;
      canvasEl.height = targetHeight;
    }

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const frameAspect = cellWidth / cellHeight;
    const canvasAspect = rect.width / rect.height;
    let drawWidth = rect.width;
    let drawHeight = rect.height;
    let drawX = 0;
    let drawY = 0;

    if (frameAspect > canvasAspect) {
      drawHeight = rect.height;
      drawWidth = drawHeight * frameAspect;
      drawX = (rect.width - drawWidth) / 2;
    } else {
      drawWidth = rect.width;
      drawHeight = drawWidth / frameAspect;
      drawY = (rect.height - drawHeight) / 2;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageEl, sourceX, sourceY, cellWidth, cellHeight, drawX, drawY, drawWidth, drawHeight);

    spritesheetFrameAspectRef.current = frameAspect;
    spritesheetFrameRef.current = clampedFrame;
  }, [spriteColumnCount, spriteCount, spriteRowCount]);

  const recomputeSpritesheetScrollMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    const trackHeight = scrollTrackRef.current?.offsetHeight || containerRef.current?.offsetHeight || window.innerHeight;
    const scrollRangePx = trackHeight + (VIDEO_SCROLL_START_RATIO - VIDEO_SCROLL_END_RATIO) * window.innerHeight;
    scrollRangePxRef.current = Math.max(1, scrollRangePx);
    effectiveScrollRangePxRef.current = Math.max(1, scrollRangePxRef.current - scrollStartOffsetPx);
  }, [scrollStartOffsetPx]);

  const updateSpritesheetViewportMetrics = useCallback(() => {
    if (!useSpritesheetScrubbing) return;
    const currentFrame = spritesheetFrameRef.current >= 0 ? spritesheetFrameRef.current : 0;
    applySpritesheetFrameTransform(currentFrame);
  }, [applySpritesheetFrameTransform, useSpritesheetScrubbing]);

  const getSpritesheetFrameFromScrollProgress = useCallback((rawProgress: number): number => {
    const totalFrames = Math.max(0, spriteCount - 1);
    if (totalFrames <= 0) return 0;

    let progress = Number.isFinite(rawProgress) ? Math.max(0, Math.min(1, rawProgress)) : 0;
    const scrollRangePx = scrollRangePxRef.current || 1;
    const effectiveScrollRangePx = effectiveScrollRangePxRef.current || 1;

    if (scrollStartOffsetPx > 0) {
      const progressPx = progress * scrollRangePx;
      const delayedProgressPx = Math.max(0, progressPx - scrollStartOffsetPx);
      progress = Math.max(0, Math.min(1, delayedProgressPx / effectiveScrollRangePx));
    }

    if (scrollPixelsPerFrame && scrollPixelsPerFrame > 0) {
      const defaultFramesPerPixel = totalFrames / Math.max(effectiveScrollRangePx, 1);
      const desiredFramesPerPixel = 1 / scrollPixelsPerFrame;
      const speedMultiplier = desiredFramesPerPixel / Math.max(defaultFramesPerPixel, 0.0001);
      progress = Math.max(0, Math.min(1, progress * speedMultiplier));
    }

    if (!Number.isFinite(progress)) progress = 0;
    const targetFrame = Math.round(progress * totalFrames);
    return Math.max(0, Math.min(totalFrames, targetFrame));
  }, [scrollPixelsPerFrame, scrollStartOffsetPx, spriteCount]);

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

  useEffect(() => {
    if (!useSpritesheetScrubbing) return;
    const nextPath = selectedSpritesheetPath || null;
    const prevPath = previousSpritesheetPathRef.current;
    if (prevPath === nextPath) return;
    previousSpritesheetPathRef.current = nextPath;

    spritesheetFrameRef.current = -1;
    recomputeSpritesheetScrollMetrics();

    if (!nextPath) {
      spritesheetLoadedPathRef.current = null;
      spritesheetLoadingPathRef.current = null;
      setSpritesheetLoaded(false);
      setSpritesheetDisplayReady(false);
      setShowAnimation(false);
      return;
    }

    if (loadedSpritesheetPathCache.has(nextPath)) {
      spritesheetLoadedPathRef.current = nextPath;
      spritesheetLoadingPathRef.current = null;
      setSpritesheetLoaded(true);
      const imgEl = spritesheetImageRef.current;
      const hasReadyDomImage =
        Boolean(imgEl) &&
        imgEl?.getAttribute('src') === nextPath &&
        imgEl.complete &&
        imgEl.naturalWidth > 0 &&
        imgEl.naturalHeight > 0;
      setSpritesheetDisplayReady(hasReadyDomImage);
      setShowAnimation(true);
      return;
    }

    if (spritesheetLoadedPathRef.current === nextPath) {
      setSpritesheetLoaded(true);
      const imgEl = spritesheetImageRef.current;
      const hasReadyDomImage =
        Boolean(imgEl) &&
        imgEl?.getAttribute('src') === nextPath &&
        imgEl.complete &&
        imgEl.naturalWidth > 0 &&
        imgEl.naturalHeight > 0;
      setSpritesheetDisplayReady(hasReadyDomImage);
      setShowAnimation(true);
      return;
    }

    spritesheetLoadingPathRef.current = null;
    setSpritesheetLoaded(false);
    setSpritesheetDisplayReady(false);
    setShowAnimation(false);
  }, [recomputeSpritesheetScrollMetrics, selectedSpritesheetPath, useSpritesheetScrubbing]);

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

  const STACK_SCALE_STEP = 0.04;     // slightly stronger step to make the scale difference visible
  const stackScaleOffset = Math.max(0, totalCards - 1 - index) * STACK_SCALE_STEP;

  // Keep a live ref so MotionValue callbacks always read the latest pageMargin
  const pageMarginRef = useRef(pageMargin);
  pageMarginRef.current = pageMargin;

  // Entrance: 0 → 1  (settling into stack)
  const entranceT = useTransform(sectionProgress, [0, 0.3], [0, 1], { clamp: true });

  // Expand: 0 → 1  (stack → fullscreen)
  // Expand mapped over a larger distance to give the transition more time
  const expandT = useTransform(sectionProgress, [0.35, 0.95], [0, 1], { clamp: true });

  // Border radius transition: starts even later than the rest (at 0.85 instead of 0.7)
  const borderExpandT = useTransform(sectionProgress, [0.85, 0.98], [0, 1], { clamp: true });

  // ── Derived values from both phases ──

  // Gap per card:  100 → 16 (entrance)  → 0 (expand)
  const GAP_INITIAL = 100;
  const GAP_STACKED = 16;
  const stickyTop = useTransform([entranceT, expandT] as any, ([e, t]: number[]) => {
    const entranceGap = GAP_INITIAL - (GAP_INITIAL - GAP_STACKED) * e; // 40→16
    return index * entranceGap * (1 - t);                              // →0
  });

  // Border radius:  20 → 12 (entrance)  → 0 (borderExpand)
  const cardBorderRadius = useTransform([entranceT, borderExpandT] as any, ([e, bt]: number[]) => {
    const entranceRadius = 20 - 8 * e; // 20→12
    return entranceRadius * (1 - bt);   // →0
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

    // Use `base` instead of `currentScale` to calculate identical DOM margins for all cards,
    // so the scale difference becomes fully visible horizontally.
    const M = vw / 2 - (vw - 2 * pm * fraction) / (2 * base);
    return Math.max(0, M);
  });

  // Calculate stack overlapped position
  const percentY = useTransform(expandT, [0, 1], [-100 * index, 0]);
  // Positive pixel offset shifts items down so the back cards peek out at the top
  const pixelY = useTransform(expandT, [0, 1], [35 * index, 0]);
  const cardY = useMotionTemplate`calc(${percentY}% + ${pixelY}px)`;

  // Safari: animate crop via clip-path instead of margins/border radius to avoid
  // layout-heavy repaints during the intro stack transition.
  const safariCardClipPath = useTransform([cardMargin, cardBorderRadius] as any, ([m, r]: number[]) => {
    const inset = Math.max(0, m);
    const radius = Math.max(0, r);
    return `inset(0px ${inset}px 0px ${inset}px round ${radius}px)`;
  });



  // Set hovered project globally
  const handleMouseEnter = useCallback(() => {
    if (!hasFinePointer) return; // disable on touch
    setHoveredProject(project);
  }, [hasFinePointer, setHoveredProject, project]);

  const handleMouseLeave = useCallback(() => {
    if (!hasFinePointer) return; // disable on touch
    setHoveredProject(null);
  }, [hasFinePointer, setHoveredProject]);

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
    if (!useSpritesheetScrubbing || !selectedSpritesheetPath) return;
    spritesheetLoadingPathRef.current = selectedSpritesheetPath;
    const imgEl = spritesheetImageRef.current;
    if (imgEl) {
      imgEl.setAttribute('fetchpriority', 'high');
    }
  }, [selectedSpritesheetPath, useSpritesheetScrubbing]);

  useEffect(() => {
    if (!useSpritesheetScrubbing) return;

    const sequenceEl = spritesheetSequenceRef.current;
    if (!sequenceEl) return;

    const onResize = () => {
      requestAnimationFrame(updateSpritesheetViewportMetrics);
    };

    updateSpritesheetViewportMetrics();

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(sequenceEl);
    window.addEventListener('resize', onResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [spritesheetLoaded, updateSpritesheetViewportMetrics, useSpritesheetScrubbing]);

  useEffect(() => {
    if (!useSpritesheetScrubbing) return;

    const onResize = () => {
      requestAnimationFrame(recomputeSpritesheetScrollMetrics);
    };

    recomputeSpritesheetScrollMetrics();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [recomputeSpritesheetScrollMetrics, useSpritesheetScrubbing]);

  const finalizeSpritesheetFromElement = useCallback((imgEl: HTMLImageElement) => {
    if (!useSpritesheetScrubbing || !selectedSpritesheetPath) return;
    const domSrc = spritesheetImageRef.current?.getAttribute('src');
    if (domSrc !== selectedSpritesheetPath) return;

    if (
      imgEl.naturalWidth > 0 &&
      imgEl.naturalHeight > 0 &&
      spriteColumnCount > 0 &&
      spriteRowCount > 0
    ) {
      const frameWidth = imgEl.naturalWidth / spriteColumnCount;
      const frameHeight = imgEl.naturalHeight / spriteRowCount;
      if (frameWidth > 0 && frameHeight > 0) {
        spritesheetFrameAspectRef.current = frameWidth / frameHeight;
      }
    }

    requestAnimationFrame(() => {
      const currentSrc = spritesheetImageRef.current?.getAttribute('src');
      if (currentSrc !== selectedSpritesheetPath) return;

      updateSpritesheetViewportMetrics();
      recomputeSpritesheetScrollMetrics();
      const progress = Number.isFinite(videoScrollYProgress.get()) ? videoScrollYProgress.get() : 0;
      latestSpritesheetProgressRef.current = progress;
      const targetFrame = getSpritesheetFrameFromScrollProgress(progress);
      applySpritesheetFrameTransform(targetFrame);

      requestAnimationFrame(() => {
        const latestSrc = spritesheetImageRef.current?.getAttribute('src');
        if (latestSrc !== selectedSpritesheetPath) return;

        loadedSpritesheetPathCache.add(selectedSpritesheetPath);
        spritesheetLoadedPathRef.current = selectedSpritesheetPath;
        spritesheetLoadingPathRef.current = null;
        setSpritesheetLoaded(true);
        setSpritesheetDisplayReady(true);
        setShowAnimation(true);
      });
    });
  }, [applySpritesheetFrameTransform, getSpritesheetFrameFromScrollProgress, recomputeSpritesheetScrollMetrics, selectedSpritesheetPath, spriteColumnCount, spriteRowCount, updateSpritesheetViewportMetrics, useSpritesheetScrubbing, videoScrollYProgress]);

  const handleSpritesheetElementLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    finalizeSpritesheetFromElement(event.currentTarget);
  }, [finalizeSpritesheetFromElement]);

  const handleSpritesheetElementError = useCallback(() => {
    if (!useSpritesheetScrubbing || !selectedSpritesheetPath) return;
    if (spritesheetLoadingPathRef.current === selectedSpritesheetPath) {
      spritesheetLoadingPathRef.current = null;
    }
    if (spritesheetLoadedPathRef.current === selectedSpritesheetPath) {
      spritesheetLoadedPathRef.current = null;
    }
    loadedSpritesheetPathCache.delete(selectedSpritesheetPath);
    setSpritesheetLoaded(false);
    setSpritesheetDisplayReady(false);
    setShowAnimation(false);
  }, [selectedSpritesheetPath, useSpritesheetScrubbing]);

  useEffect(() => {
    if (!useSpritesheetScrubbing || !selectedSpritesheetPath || spritesheetDisplayReady) return;
    const imgEl = spritesheetImageRef.current;
    if (!imgEl) return;
    if (imgEl.complete && imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
      finalizeSpritesheetFromElement(imgEl);
    }
  }, [finalizeSpritesheetFromElement, selectedSpritesheetPath, spritesheetDisplayReady, useSpritesheetScrubbing]);

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

  // Preload animation sequence images (legacy fallback)
  useEffect(() => {
    if (project.hasAnimation && project.animationSequence && !useVideoScrubbing && !useSpritesheetScrubbing && project.animationSequence.basePath && project.animationSequence.startFrame !== undefined && project.animationSequence.endFrame !== undefined) {
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
  }, [project.hasAnimation, project.animationSequence, useSpritesheetScrubbing, useVideoScrubbing]);

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

  const updateSpritesheetFrame = useCallback((scrollProgress: number) => {
    if (
      !spritesheetImageRef.current ||
      !useSpritesheetScrubbing ||
      spriteCount <= 0 ||
      spriteColumnCount <= 0
    ) {
      return;
    }

    const targetFrame = getSpritesheetFrameFromScrollProgress(scrollProgress);

    if (targetFrame === spritesheetFrameRef.current) {
      return;
    }

    applySpritesheetFrameTransform(targetFrame);
  }, [applySpritesheetFrameTransform, getSpritesheetFrameFromScrollProgress, spriteColumnCount, spriteCount, useSpritesheetScrubbing]);

  // High-performance scroll handler for spritesheet scrubbing
  useEffect(() => {
    if (!project.hasAnimation || !project.animationSequence || !useSpritesheetScrubbing || !spritesheetAssetReady) {
      return;
    }

    const unsubscribe = videoScrollYProgress.on("change", (latest) => {
      latestSpritesheetProgressRef.current = latest;
      if (scrollAnimationRef.current !== null) return;

      scrollAnimationRef.current = requestAnimationFrame(() => {
        scrollAnimationRef.current = null;
        updateSpritesheetFrame(latestSpritesheetProgressRef.current);
      });
    });

    latestSpritesheetProgressRef.current = videoScrollYProgress.get();
    updateSpritesheetFrame(latestSpritesheetProgressRef.current);

    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      unsubscribe();
    };
  }, [project.hasAnimation, project.animationSequence, spritesheetAssetReady, updateSpritesheetFrame, useSpritesheetScrubbing, videoScrollYProgress]);

  // Snap immediately to the current scroll frame when card re-enters view.
  useEffect(() => {
    if (!useSpritesheetScrubbing || !spritesheetAssetReady || !isCardNearViewport) return;
    updateSpritesheetFrame(videoScrollYProgress.get());
  }, [isCardNearViewport, spritesheetAssetReady, updateSpritesheetFrame, useSpritesheetScrubbing, videoScrollYProgress]);

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
    if (project.hasAnimation && project.animationSequence && !useVideoScrubbing && !useSpritesheetScrubbing && loadedImages.length > 0 && showAnimation) {
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
  }, [scrollYProgress, project.hasAnimation, project.animationSequence, useSpritesheetScrubbing, useVideoScrubbing, loadedImages.length, showAnimation, updateImageFrame]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      if (nativeScrubRafRef.current) {
        cancelAnimationFrame(nativeScrubRafRef.current);
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
      spritesheetFrameRef.current = -1;

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
        className={`sticky w-full aspect-[16/10] md:h-auto md:aspect-video shadow-xl cursor-pointer group`}
        style={{
          zIndex: index + 1,
          top: stickyTop,
          borderRadius: useSafariClipPath ? 0 : cardBorderRadius,
          marginLeft: useSafariClipPath ? 0 : cardMargin,
          marginRight: useSafariClipPath ? 0 : cardMargin,
          clipPath: useSafariClipPath ? (safariCardClipPath as any) : undefined,
          WebkitClipPath: useSafariClipPath ? (safariCardClipPath as any) : undefined,
          y: cardY,
          scale: cardScale,
          overflow: 'hidden',
          width: 'auto',
          willChange: useSafariClipPath ? 'transform, clip-path' : 'transform',
        }}
        onMouseEnter={hasFinePointer ? handleMouseEnter : undefined}
        onMouseLeave={hasFinePointer ? handleMouseLeave : undefined}
        onClick={handleProjectClick}
      >
        {/* Static Background Image (Fallback) */}
        <div
          className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${project.image}')`,
            opacity: useSpritesheetScrubbing ? (spritesheetDisplayReady ? 0 : 1) : (showAnimation ? 0 : 1),
            transition: useSpritesheetScrubbing ? 'opacity 180ms ease-out' : animationOpacityTransition
          }}
        />

        {/* Video Animation Sequence (Book Project Only) */}
        {project.hasAnimation && project.animationSequence && useVideoScrubbing && (
          <div
            className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              opacity: showAnimation ? 1 : 0,
              transition: animationOpacityTransition
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

        {/* Spritesheet Animation Sequence (Preferred) */}
        {project.hasAnimation && project.animationSequence && useSpritesheetScrubbing && selectedSpritesheetPath && (
          <div
            className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              opacity: spritesheetDisplayReady ? 1 : 0,
              transition: animationOpacityTransition
            }}
          >
            <div
              ref={spritesheetSequenceRef}
              className="relative w-full h-full overflow-hidden"
              style={spritesheetSequenceStyle}
            >
              <canvas
                ref={spritesheetCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                style={spritesheetCanvasStyle}
              />
              <img
                ref={spritesheetImageRef}
                src={selectedSpritesheetPath}
                alt={`${project.title} animation sequence`}
                loading="eager"
                decoding="async"
                onLoad={handleSpritesheetElementLoad}
                onError={handleSpritesheetElementError}
                className="absolute top-0 left-0 opacity-0 pointer-events-none select-none"
                draggable={false}
                style={spritesheetImageStyle}
              />
            </div>
          </div>
        )}

        {/* Image Animation Sequence (Other Projects) */}
        {project.hasAnimation && project.animationSequence && !useVideoScrubbing && !useSpritesheetScrubbing && loadedImages.length > 0 && (
          <div
            className="absolute right-0 bottom-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              opacity: showAnimation ? 1 : 0,
              transition: animationOpacityTransition
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

        {/* Lottie Animation Sequence */}
        {project.heroLottie && mounted && (
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <LottiePlayer
              src={project.heroLottie}
              className="w-full h-full absolute inset-0 mix-blend-normal"
              style={{ objectFit: 'cover' }}
              autoplay={true}
              loop={true}
            />
          </div>
        )}

        {/* Video Overlay - Only show if project has a video */}
        {project.video && !project.heroLottie && (
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

        {/* Subtle loading indicator for animations */}
        {project.hasAnimation && project.animationSequence && !isAnimationReady && !(useVideoScrubbing && preferNativeVideoScrub) && (
          <div className="absolute top-6 right-6 z-20 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xl">
              <svg className="animate-spin h-3.5 w-3.5 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[11px] font-medium tracking-wide uppercase font-inter text-white/95">
                {useSpritesheetScrubbing || useVideoScrubbing
                  ? 'Loading'
                  : `Loading ${Math.round((loadedImageCount.current / (loadedImages.length || 1)) * 100)}%`}
              </span>
            </div>
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
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

  // Global cursor position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const cursorX = useSpring(mouseX, { stiffness: 400, damping: 28, mass: 0.2 });
  const cursorY = useSpring(mouseY, { stiffness: 400, damping: 28, mass: 0.2 });

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

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
    <section ref={sectionRef} className="w-full relative" id="work">
      {data.map((project, index) => (
        <ProjectCard
          key={`${project.id}-${index}`}
          project={project}
          index={index}
          sectionProgress={sectionProgress}
          pageMargin={pageMargin}
          totalCards={data.length}
          setHoveredProject={setHoveredProject}
        />
      ))}

      {/* Global Cursor for all Work Projects */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[100] hidden md:flex items-center gap-2 will-change-transform"
        style={{
          x: cursorX,
          y: cursorY,
          originX: 0,
          originY: 0,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: hoveredProject && !isScrolling ? 1 : 0,
          scale: hoveredProject && !isScrolling ? 1 : 0.8,
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          opacity: { duration: 0.15 },
          scale: { type: "spring", stiffness: 300, damping: 25 },
        }}
      >
        <div className="bg-black/40 backdrop-blur-xl text-white px-4 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 transform -translate-x-1/2 -translate-y-full mt-[-16px]">
          <span className="text-sm font-medium whitespace-nowrap font-space-grotesk tracking-wide text-white/95">
            {hoveredProject?.title}
          </span>
          <span className="text-white/40">•</span>
          <span className="text-sm font-bold text-white/80">View</span>
        </div>
      </motion.div>
    </section>
  );
};

export default Work;
