import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { resolveAssetPath } from '../lib/assets'

const SCRUB_FPS_CAP = 60
const VIDEO_SCROLL_START_OFFSET = '92%'
const VIDEO_SCROLL_END_OFFSET = '-120%'
const INTRO_END_PROGRESS = 0.16
const PLAYBACK_END_PROGRESS = 0.5
const OUTRO_START_PROGRESS = 0.6
const OUTRO_END_PROGRESS = 0.9

interface ScrollScrubVideoProps {
  videoPath: string
  frameCount?: number
  accentColor?: string
  className?: string
}

export default function ScrollScrubVideo({
  videoPath,
  frameCount,
  accentColor = '#0066CC',
  className = ''
}: ScrollScrubVideoProps) {
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollAnimationRef = useRef<number | null>(null)
  const pendingFrame = useRef<number>(-1)
  const isSeekingRef = useRef<boolean>(false)
  const lastRenderedFrame = useRef<number>(-1)
  const isSafariRef = useRef<boolean>(false)
  const revealTimeoutRef = useRef<number | null>(null)
  const hasRevealedRef = useRef<boolean>(false)

  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 })
  const [entryFrame, setEntryFrame] = useState({ width: 1080, height: 608 })
  const [stickyTopOffset, setStickyTopOffset] = useState(48)

  const resolvedVideoPath = resolveAssetPath(videoPath)
  const scrollSpanVh = useMemo(() => {
    const base = frameCount || 1400
    return Math.max(170, Math.min(320, Math.round(base / 18)))
  }, [frameCount])

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: [`start ${VIDEO_SCROLL_START_OFFSET}`, `end ${VIDEO_SCROLL_END_OFFSET}`]
  })
  const fullscreenPhase = useTransform(scrollYProgress, value => {
    const progress = Math.max(0, Math.min(1, value))

    if (progress <= INTRO_END_PROGRESS) {
      const t = progress / INTRO_END_PROGRESS
      return 1 - Math.pow(1 - t, 3)
    }

    if (progress < OUTRO_START_PROGRESS) {
      return 1
    }

    if (progress <= OUTRO_END_PROGRESS) {
      const t = (progress - OUTRO_START_PROGRESS) / (OUTRO_END_PROGRESS - OUTRO_START_PROGRESS)
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

    // Keep intro behavior exactly as before.
    if (progress <= INTRO_END_PROGRESS) {
      const t = progress / INTRO_END_PROGRESS
      const intro = 1 - Math.pow(1 - t, 3)
      return -stickyTopOffset * intro
    }

    if (progress < OUTRO_START_PROGRESS) {
      return -stickyTopOffset
    }

    if (progress <= OUTRO_END_PROGRESS) {
      const t = (progress - OUTRO_START_PROGRESS) / (OUTRO_END_PROGRESS - OUTRO_START_PROGRESS)
      const release = Math.pow(t, 1.25)
      return -stickyTopOffset * (1 - release)
    }

    return 0
  })
  const frameShadow = useTransform(fullscreenPhase, value => {
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
    const topOffset = compact ? 32 : 48
    const aspectRatio = compact ? 4 / 3 : 16 / 9
    const measuredWidth = scrollTrackRef.current?.clientWidth || vw
    const usableWidth = Math.min(measuredWidth, vw - (compact ? 24 : 48))
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
    if (typeof navigator === 'undefined') return

    const ua = navigator.userAgent
    const detectedSafari =
      /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|SamsungBrowser|Android/i.test(ua)

    isSafariRef.current = detectedSafari
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

  const handleVideoReady = useCallback(() => {
    setVideoLoaded(true)

    if (hasRevealedRef.current) return
    hasRevealedRef.current = true

    revealTimeoutRef.current = window.setTimeout(() => {
      setShowAnimation(true)
      revealTimeoutRef.current = null
    }, 120)
  }, [])

  const getEffectiveVideoFrameCount = useCallback((video: HTMLVideoElement): number => {
    const sourceFrameCount = frameCount || 501
    if (!video.duration || isNaN(video.duration)) {
      return sourceFrameCount
    }

    return Math.max(2, Math.round(video.duration * SCRUB_FPS_CAP))
  }, [frameCount])

  const seekToFrame = useCallback((frame: number, totalFrames: number) => {
    const video = videoRef.current
    if (!video || !video.duration || isNaN(video.duration)) {
      return
    }

    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1))
    const targetTime = (clampedFrame / (totalFrames - 1)) * video.duration

    if (Math.abs(video.currentTime - targetTime) < 0.001) {
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

  const drawVideoFrame = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const nextWidth = rect.width * dpr
    const nextHeight = rect.height * dpr

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
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !videoLoaded || !showAnimation || !video.duration || isNaN(video.duration)) {
      return
    }

    const totalFrames = getEffectiveVideoFrameCount(video)
    const clampedScroll = Math.max(0, Math.min(1, scrollProgress))
    const playbackProgress =
      clampedScroll >= PLAYBACK_END_PROGRESS ? 1 : clampedScroll / PLAYBACK_END_PROGRESS
    const targetFrame = Math.round(playbackProgress * (totalFrames - 1))
    const clampedFrame = Math.max(0, Math.min(targetFrame, totalFrames - 1))

    if (isSafariRef.current) {
      if (clampedFrame === lastRenderedFrame.current) {
        return
      }

      pendingFrame.current = clampedFrame
      lastRenderedFrame.current = clampedFrame
      isSeekingRef.current = false

      const targetTime = (clampedFrame / (totalFrames - 1)) * video.duration
      video.currentTime = targetTime
      return
    }

    if (clampedFrame === pendingFrame.current) {
      return
    }

    pendingFrame.current = clampedFrame
    if (!isSeekingRef.current) {
      seekToFrame(clampedFrame, totalFrames)
    }
  }, [getEffectiveVideoFrameCount, seekToFrame, showAnimation, videoLoaded])

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
      if (video.readyState >= 2) {
        handleVideoReady()
      }
    }

    const events: Array<keyof HTMLMediaElementEventMap> = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']
    events.forEach(event => video.addEventListener(event, onReady))

    const fallbackTimeout = window.setTimeout(onReady, 1800)

    return () => {
      events.forEach(event => video.removeEventListener(event, onReady))
      window.clearTimeout(fallbackTimeout)
    }
  }, [handleVideoReady, resolvedVideoPath])

  useEffect(() => {
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

      if (!isSafariRef.current && pendingFrame.current !== lastRenderedFrame.current) {
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
  }, [drawVideoFrame, getEffectiveVideoFrameCount, seekToFrame])

  useEffect(() => {
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
  }, [drawVideoFrame])

  useEffect(() => {
    if (!videoLoaded || !showAnimation) return

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
  }, [scrollYProgress, showAnimation, updateVideoFrame, videoLoaded])

  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
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
            className="hidden"
            muted
            playsInline
            preload="auto"
            webkit-playsinline="true"
            x-webkit-airplay="allow"
          >
            <source src={resolvedVideoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

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

          {!showAnimation && (
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
