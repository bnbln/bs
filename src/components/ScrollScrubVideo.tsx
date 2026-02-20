import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { resolveAssetPath } from '../lib/assets'

const SCRUB_FPS_CAP = 60
const MOBILE_SCRUB_FPS_CAP = 30
const VIDEO_SCROLL_START_OFFSET = '92%'
const VIDEO_SCROLL_END_OFFSET = '-120%'

const INTRO_END_PROGRESS = 0.16
const PLAYBACK_END_PROGRESS = 0.5
const OUTRO_START_PROGRESS = 0.6
const OUTRO_END_PROGRESS = 0.9

const MOBILE_INTRO_END_PROGRESS = 0.14
const MOBILE_PLAYBACK_END_PROGRESS = 0.45
const MOBILE_OUTRO_START_PROGRESS = 0.58
const MOBILE_OUTRO_END_PROGRESS = 0.72

const MOBILE_SCRUB_SEEK_INTERVAL_MS = 33
const IOS_SCRUB_SEEK_INTERVAL_MS = 42
const SAFARI_DESKTOP_SCRUB_SEEK_INTERVAL_MS = 33
const MOBILE_NATIVE_MIN_SEEK_DELTA = 1 / 90
const IOS_NATIVE_MIN_SEEK_DELTA = 1 / 24
const SAFARI_DESKTOP_NATIVE_MIN_SEEK_DELTA = 1 / 30
const NATIVE_FAST_SEEK_THRESHOLD_SECONDS = 0.45
const NATIVE_WARMUP_ROOT_MARGIN = '200% 0px'

const CANVAS_MAX_DPR = 2

interface ScrollScrubVideoProps {
  videoPath: string
  mobileVideoPath?: string
  safariVideoPath?: string
  frameCount?: number
  accentColor?: string
  className?: string
}

export default function ScrollScrubVideo({
  videoPath,
  mobileVideoPath,
  safariVideoPath,
  frameCount,
  accentColor = '#0066CC',
  className = ''
}: ScrollScrubVideoProps) {
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const scrollAnimationRef = useRef<number | null>(null)
  const nativeScrubRafRef = useRef<number | null>(null)
  const revealTimeoutRef = useRef<number | null>(null)

  const pendingFrame = useRef<number>(-1)
  const isSeekingRef = useRef<boolean>(false)
  const lastRenderedFrame = useRef<number>(-1)
  const nativeTargetTimeRef = useRef<number | null>(null)
  const nativeSeekInFlightRef = useRef<boolean>(false)
  const nativeLastSeekAtRef = useRef<number>(0)
  const nativeWarmupDoneRef = useRef<boolean>(false)

  const hasLoadedRef = useRef<boolean>(false)
  const hasRevealedRef = useRef<boolean>(false)
  const isMobileRef = useRef<boolean>(false)
  const isIOSRef = useRef<boolean>(false)
  const isSafariDesktopRef = useRef<boolean>(false)

  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [preferNativeVideoScrub, setPreferNativeVideoScrub] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isSafariDesktop, setIsSafariDesktop] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 })
  const [entryFrame, setEntryFrame] = useState({ width: 1080, height: 608 })
  const [stickyTopOffset, setStickyTopOffset] = useState(48)

  const selectedSourcePath = useMemo(() => {
    if (isIOS) {
      return mobileVideoPath || safariVideoPath || videoPath
    }

    if (isSafariDesktop) {
      return safariVideoPath || mobileVideoPath || videoPath
    }

    if (isMobileDevice) {
      return mobileVideoPath || videoPath
    }

    return videoPath
  }, [isIOS, isMobileDevice, isSafariDesktop, mobileVideoPath, safariVideoPath, videoPath])

  const resolvedVideoPath = useMemo(() => resolveAssetPath(selectedSourcePath), [selectedSourcePath])

  const scrollSpanVh = useMemo(() => {
    const base = frameCount || 1400
    if (preferNativeVideoScrub) {
      return Math.max(150, Math.min(240, Math.round(base / 24)))
    }

    return Math.max(170, Math.min(320, Math.round(base / 18)))
  }, [frameCount, preferNativeVideoScrub])

  const introEndProgress = preferNativeVideoScrub ? MOBILE_INTRO_END_PROGRESS : INTRO_END_PROGRESS
  const playbackEndProgress = preferNativeVideoScrub ? MOBILE_PLAYBACK_END_PROGRESS : PLAYBACK_END_PROGRESS
  const outroStartProgress = preferNativeVideoScrub ? MOBILE_OUTRO_START_PROGRESS : OUTRO_START_PROGRESS
  const outroEndProgress = preferNativeVideoScrub ? MOBILE_OUTRO_END_PROGRESS : OUTRO_END_PROGRESS

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: [`start ${VIDEO_SCROLL_START_OFFSET}`, `end ${VIDEO_SCROLL_END_OFFSET}`]
  })

  const fullscreenPhase = useTransform(scrollYProgress, value => {
    const progress = Math.max(0, Math.min(1, value))

    if (progress <= introEndProgress) {
      const t = progress / introEndProgress
      return 1 - Math.pow(1 - t, 3)
    }

    if (progress < outroStartProgress) {
      return 1
    }

    if (progress <= outroEndProgress) {
      const t = (progress - outroStartProgress) / (outroEndProgress - outroStartProgress)
      return 1 - Math.pow(t, 0.58)
    }

    return 0
  })

  const frameWidth = useTransform(fullscreenPhase, value => {
    return entryFrame.width + (viewportSize.width - entryFrame.width) * value
  })

  const frameHeight = useTransform(fullscreenPhase, value => {
    return entryFrame.height + (viewportSize.height - entryFrame.height) * value
  })

  const frameX = useTransform(frameWidth, value => -value / 2)
  const frameRadius = useTransform(fullscreenPhase, value => 22 - 22 * value)

  const frameY = useTransform(scrollYProgress, value => {
    const progress = Math.max(0, Math.min(1, value))

    if (progress <= introEndProgress) {
      const t = progress / introEndProgress
      const intro = 1 - Math.pow(1 - t, 3)
      return -stickyTopOffset * intro
    }

    if (progress < outroStartProgress) {
      return -stickyTopOffset
    }

    if (progress <= outroEndProgress) {
      const t = (progress - outroStartProgress) / (outroEndProgress - outroStartProgress)
      const release = Math.pow(t, 1.25)
      return -stickyTopOffset * (1 - release)
    }

    return 0
  })

  const frameShadow = useTransform(fullscreenPhase, value => {
    if (preferNativeVideoScrub) {
      const opacity = 0.2 + 0.2 * value
      return `0 18px 42px -22px rgba(0,0,0,${opacity.toFixed(3)})`
    }

    const blur = 32 + 58 * value
    const spread = -18 - 20 * value
    const opacity = 0.22 + 0.36 * value
    return `0 26px ${blur}px ${spread}px rgba(0,0,0,${opacity.toFixed(3)})`
  })

  const stickyShellHeight = useTransform(fullscreenPhase, value => {
    const fullHeight = viewportSize.height - stickyTopOffset
    const compactHeight = entryFrame.height
    return compactHeight + (fullHeight - compactHeight) * value
  })

  const recomputeLayout = useCallback(() => {
    if (typeof window === 'undefined') return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const compact = vw < 768
    const topOffset = compact ? 24 : 48
    const aspectRatio = 16 / 9
    const measuredWidth = scrollTrackRef.current?.clientWidth || vw
    const usableWidth = Math.min(measuredWidth, vw - (compact ? 20 : 48))
    const usableHeight = usableWidth / aspectRatio

    setViewportSize(prev => {
      if (prev.width === vw && prev.height === vh) return prev
      return { width: vw, height: vh }
    })

    setStickyTopOffset(prev => (prev === topOffset ? prev : topOffset))

    setEntryFrame(prev => {
      if (
        Math.round(prev.width) === Math.round(usableWidth) &&
        Math.round(prev.height) === Math.round(usableHeight)
      ) {
        return prev
      }

      return {
        width: usableWidth,
        height: usableHeight,
      }
    })
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return

    const ua = navigator.userAgent
    const isIOSDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroidDevice = /Android/i.test(ua)
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const detectedMobile = coarsePointer || isIOSDevice || isAndroidDevice
    const detectedSafari =
      /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|SamsungBrowser|Android/i.test(ua)
    const detectedSafariDesktop = detectedSafari && !isIOSDevice && finePointer

    isMobileRef.current = detectedMobile
    isIOSRef.current = isIOSDevice
    isSafariDesktopRef.current = detectedSafariDesktop
    setIsMobileDevice(detectedMobile)
    setIsIOS(isIOSDevice)
    setIsSafariDesktop(detectedSafariDesktop)
    setPreferNativeVideoScrub(detectedMobile || detectedSafariDesktop)
  }, [])

  useEffect(() => {
    recomputeLayout()

    window.addEventListener('resize', recomputeLayout)
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(recomputeLayout)
    })

    if (scrollTrackRef.current) {
      resizeObserver.observe(scrollTrackRef.current)
    }

    return () => {
      window.removeEventListener('resize', recomputeLayout)
      resizeObserver.disconnect()
    }
  }, [recomputeLayout])

  useEffect(() => {
    hasLoadedRef.current = false
    hasRevealedRef.current = false
    pendingFrame.current = -1
    lastRenderedFrame.current = -1
    isSeekingRef.current = false
    nativeTargetTimeRef.current = null
    nativeSeekInFlightRef.current = false
    nativeLastSeekAtRef.current = 0
    nativeWarmupDoneRef.current = false
    setVideoLoaded(false)
    setShowAnimation(false)
  }, [resolvedVideoPath])

  const handleVideoReady = useCallback(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    setVideoLoaded(true)

    if (hasRevealedRef.current) return
    hasRevealedRef.current = true

    const revealDelay = isMobileRef.current ? 0 : 120
    revealTimeoutRef.current = window.setTimeout(() => {
      setShowAnimation(true)
      revealTimeoutRef.current = null
    }, revealDelay)
  }, [])

  const getEffectiveVideoFrameCount = useCallback((video: HTMLVideoElement): number => {
    const sourceFrameCount = frameCount || 501
    if (!video.duration || isNaN(video.duration)) {
      return sourceFrameCount
    }

    const fpsCap = isMobileRef.current ? MOBILE_SCRUB_FPS_CAP : SCRUB_FPS_CAP
    return Math.max(2, Math.round(video.duration * fpsCap))
  }, [frameCount])

  const seekToFrame = useCallback((frame: number, totalFrames: number) => {
    const video = videoRef.current
    if (!video || !video.duration || isNaN(video.duration)) {
      return
    }

    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1))
    const targetTime = (clampedFrame / (totalFrames - 1)) * video.duration
    const minSeekDelta = isMobileRef.current ? (1 / 90) : 0.001

    if (Math.abs(video.currentTime - targetTime) < minSeekDelta) {
      lastRenderedFrame.current = clampedFrame
      isSeekingRef.current = false
      return
    }

    isSeekingRef.current = true

    if ('fastSeek' in video && typeof (video as any).fastSeek === 'function') {
      try {
        ;(video as any).fastSeek(targetTime)
        return
      } catch {
        // fall back to assigning currentTime
      }
    }

    video.currentTime = targetTime
  }, [])

  const normalizePlaybackProgress = useCallback((scrollProgress: number) => {
    const clampedScroll = Math.max(0, Math.min(1, scrollProgress))
    return clampedScroll >= playbackEndProgress
      ? 1
      : clampedScroll / Math.max(0.0001, playbackEndProgress)
  }, [playbackEndProgress])

  const getNativeSeekSettings = useCallback(() => {
    if (isIOSRef.current) {
      return {
        minSeekIntervalMs: IOS_SCRUB_SEEK_INTERVAL_MS,
        minSeekDeltaSeconds: IOS_NATIVE_MIN_SEEK_DELTA,
      }
    }

    if (isSafariDesktopRef.current) {
      return {
        minSeekIntervalMs: SAFARI_DESKTOP_SCRUB_SEEK_INTERVAL_MS,
        minSeekDeltaSeconds: SAFARI_DESKTOP_NATIVE_MIN_SEEK_DELTA,
      }
    }

    return {
      minSeekIntervalMs: MOBILE_SCRUB_SEEK_INTERVAL_MS,
      minSeekDeltaSeconds: MOBILE_NATIVE_MIN_SEEK_DELTA,
    }
  }, [])

  const runNativeScrubTick = useCallback(() => {
    nativeScrubRafRef.current = null

    const video = videoRef.current
    if (!video || !video.duration || isNaN(video.duration)) {
      return
    }

    if (nativeSeekInFlightRef.current) {
      return
    }

    const targetTime = nativeTargetTimeRef.current
    if (targetTime === null) {
      return
    }

    const { minSeekIntervalMs, minSeekDeltaSeconds } = getNativeSeekSettings()
    const now = performance.now()
    if (now - nativeLastSeekAtRef.current < minSeekIntervalMs) {
      nativeScrubRafRef.current = requestAnimationFrame(runNativeScrubTick)
      return
    }

    const clampedTarget = Math.max(0, Math.min(video.duration, targetTime))
    const timeDiff = clampedTarget - video.currentTime
    if (Math.abs(timeDiff) < minSeekDeltaSeconds) {
      return
    }

    nativeSeekInFlightRef.current = true
    nativeLastSeekAtRef.current = now

    try {
      if (
        'fastSeek' in video &&
        typeof (video as any).fastSeek === 'function' &&
        Math.abs(timeDiff) > NATIVE_FAST_SEEK_THRESHOLD_SECONDS
      ) {
        ;(video as any).fastSeek(clampedTarget)
      } else {
        video.currentTime = clampedTarget
      }
    } catch {
      nativeSeekInFlightRef.current = false
      nativeScrubRafRef.current = requestAnimationFrame(runNativeScrubTick)
    }
  }, [getNativeSeekSettings])

  const ensureNativeScrubTick = useCallback(() => {
    if (nativeScrubRafRef.current === null) {
      nativeScrubRafRef.current = requestAnimationFrame(runNativeScrubTick)
    }
  }, [runNativeScrubTick])

  const drawVideoFrame = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, CANVAS_MAX_DPR)
    const nextWidth = Math.max(1, Math.round(rect.width * dpr))
    const nextHeight = Math.max(1, Math.round(rect.height * dpr))

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth
      canvas.height = nextHeight
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    ctx.clearRect(0, 0, rect.width, rect.height)

    const videoAspect = video.videoWidth / video.videoHeight
    const canvasAspect = rect.width / rect.height

    let drawWidth = 0
    let drawHeight = 0
    let drawX = 0
    let drawY = 0

    if (videoAspect > canvasAspect) {
      drawHeight = rect.height
      drawWidth = drawHeight * videoAspect
      drawX = (rect.width - drawWidth) / 2
    } else {
      drawWidth = rect.width
      drawHeight = drawWidth / videoAspect
      drawY = (rect.height - drawHeight) / 2
    }

    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight)
  }, [])

  const updateVideoFrame = useCallback((scrollProgress: number) => {
    if (preferNativeVideoScrub) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !videoLoaded || !showAnimation || !video.duration || isNaN(video.duration)) {
      return
    }

    const totalFrames = getEffectiveVideoFrameCount(video)
    const playbackProgress = normalizePlaybackProgress(scrollProgress)
    const targetFrame = Math.round(playbackProgress * (totalFrames - 1))
    const clampedFrame = Math.max(0, Math.min(targetFrame, totalFrames - 1))

    if (clampedFrame === pendingFrame.current) {
      return
    }

    pendingFrame.current = clampedFrame
    if (!isSeekingRef.current) {
      seekToFrame(clampedFrame, totalFrames)
    }
  }, [getEffectiveVideoFrameCount, normalizePlaybackProgress, preferNativeVideoScrub, seekToFrame, showAnimation, videoLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !resolvedVideoPath) return

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.currentTime = 0

    if (video.readyState === 0) {
      video.load()
    }

    const onReady = () => {
      const readyStateThreshold = preferNativeVideoScrub ? 1 : 2
      if (video.readyState >= readyStateThreshold) {
        handleVideoReady()
      }
    }

    const events: Array<keyof HTMLMediaElementEventMap> = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']
    events.forEach(event => video.addEventListener(event, onReady))

    const fallbackTimeout = window.setTimeout(onReady, 1400)

    return () => {
      events.forEach(event => video.removeEventListener(event, onReady))
      window.clearTimeout(fallbackTimeout)
    }
  }, [handleVideoReady, preferNativeVideoScrub, resolvedVideoPath])

  useEffect(() => {
    if (!preferNativeVideoScrub) return

    const track = scrollTrackRef.current
    const video = videoRef.current
    if (!track || !video) return

    let cancelled = false
    const warmup = () => {
      if (cancelled || nativeWarmupDoneRef.current) return
      nativeWarmupDoneRef.current = true

      video.preload = 'auto'
      if (video.readyState === 0) {
        video.load()
      }

      video.play()
        .then(() => {
          video.pause()
          if (video.duration && !isNaN(video.duration)) {
            video.currentTime = 0
          }
        })
        .catch(() => {
          // Autoplay policies can still block this; native scrub still works.
        })
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          warmup()
          observer.disconnect()
        }
      },
      { root: null, rootMargin: NATIVE_WARMUP_ROOT_MARGIN, threshold: 0 }
    )

    observer.observe(track)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [preferNativeVideoScrub, resolvedVideoPath])

  useEffect(() => {
    if (preferNativeVideoScrub) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const onSeeked = () => {
      if (!video.duration || isNaN(video.duration)) return

      drawVideoFrame(video, canvas, ctx)

      const totalFrames = getEffectiveVideoFrameCount(video)
      const renderedFrame = Math.round((video.currentTime / video.duration) * (totalFrames - 1))
      lastRenderedFrame.current = Math.max(0, Math.min(renderedFrame, totalFrames - 1))
      isSeekingRef.current = false

      if (pendingFrame.current !== lastRenderedFrame.current) {
        requestAnimationFrame(() => {
          if (!isSeekingRef.current && pendingFrame.current >= 0) {
            seekToFrame(pendingFrame.current, totalFrames)
          }
        })
      }
    }

    video.addEventListener('seeked', onSeeked)

    return () => {
      video.removeEventListener('seeked', onSeeked)
    }
  }, [drawVideoFrame, getEffectiveVideoFrameCount, preferNativeVideoScrub, seekToFrame])

  useEffect(() => {
    if (!preferNativeVideoScrub || !videoLoaded || !showAnimation) return

    const video = videoRef.current
    if (!video) return

    const onSeeked = () => {
      nativeSeekInFlightRef.current = false
      ensureNativeScrubTick()
    }

    const onError = () => {
      nativeSeekInFlightRef.current = false
      ensureNativeScrubTick()
    }

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }
  }, [ensureNativeScrubTick, preferNativeVideoScrub, showAnimation, videoLoaded])

  useEffect(() => {
    if (preferNativeVideoScrub) return

    const canvas = canvasRef.current
    if (!canvas) return

    const onResize = () => {
      const video = videoRef.current
      const innerCanvas = canvasRef.current
      if (!video || !innerCanvas || video.readyState < 2) return

      const ctx = innerCanvas.getContext('2d')
      if (!ctx) return

      drawVideoFrame(video, innerCanvas, ctx)
    }

    window.addEventListener('resize', onResize)

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(onResize)
    })
    resizeObserver.observe(canvas)

    return () => {
      window.removeEventListener('resize', onResize)
      resizeObserver.disconnect()
    }
  }, [drawVideoFrame, preferNativeVideoScrub])

  useEffect(() => {
    if (!videoLoaded || !showAnimation) return

    if (preferNativeVideoScrub) {
      const updateTargetTime = (rawProgress: number) => {
        const video = videoRef.current
        if (!video || !video.duration || isNaN(video.duration)) return

        const clampedProgress = Math.max(0, Math.min(1, rawProgress))
        const playbackProgress = normalizePlaybackProgress(clampedProgress)
        nativeTargetTimeRef.current = playbackProgress * video.duration
        ensureNativeScrubTick()
      }

      updateTargetTime(scrollYProgress.get())

      const unsubscribe = scrollYProgress.on('change', latest => {
        updateTargetTime(latest)
      })

      return () => {
        if (nativeScrubRafRef.current) {
          cancelAnimationFrame(nativeScrubRafRef.current)
          nativeScrubRafRef.current = null
        }
        unsubscribe()
      }
    }

    const unsubscribe = scrollYProgress.on('change', latest => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
      }

      scrollAnimationRef.current = requestAnimationFrame(() => {
        updateVideoFrame(latest)
      })
    })

    updateVideoFrame(scrollYProgress.get())

    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
      }
      unsubscribe()
    }
  }, [ensureNativeScrubTick, normalizePlaybackProgress, preferNativeVideoScrub, scrollYProgress, showAnimation, updateVideoFrame, videoLoaded])

  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
      }

      if (nativeScrubRafRef.current) {
        cancelAnimationFrame(nativeScrubRafRef.current)
      }

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current)
      }

      const video = videoRef.current
      if (video) {
        video.pause()
      }

      pendingFrame.current = -1
      isSeekingRef.current = false
      lastRenderedFrame.current = -1
      nativeTargetTimeRef.current = null
      nativeSeekInFlightRef.current = false
      nativeLastSeekAtRef.current = 0
      nativeWarmupDoneRef.current = false
    }
  }, [])

  return (
    <div
      ref={scrollTrackRef}
      className={`relative ${className}`}
      style={{ height: `${scrollSpanVh}vh` }}
    >
      <motion.div
        className="sticky overflow-visible"
        style={{ top: stickyTopOffset, height: stickyShellHeight }}
      >
        <motion.div
          className="relative left-1/2 overflow-hidden bg-[#0D0E11] ring-1 ring-black/10"
          style={{
            width: frameWidth,
            height: frameHeight,
            x: frameX,
            y: frameY,
            borderRadius: frameRadius,
            boxShadow: frameShadow,
          }}
        >
          <video
            ref={videoRef}
            className={preferNativeVideoScrub ? 'h-full w-full object-cover pointer-events-none select-none' : 'hidden'}
            muted
            playsInline
            preload="auto"
            webkit-playsinline="true"
            x-webkit-airplay="allow"
          >
            <source src={resolvedVideoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {!preferNativeVideoScrub && (
            <canvas
              ref={canvasRef}
              className={`h-full w-full transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}
              style={{
                willChange: 'contents',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                imageRendering: 'auto',
                objectFit: 'cover',
              }}
            />
          )}

          {!showAnimation && !preferNativeVideoScrub && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0D0E11]">
              <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white/90 animate-spin" />
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32"
            style={{ background: `linear-gradient(180deg, ${accentColor}1F 0%, transparent 90%)` }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
