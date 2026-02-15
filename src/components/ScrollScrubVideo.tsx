import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useScroll } from 'framer-motion'
import { resolveAssetPath } from '../lib/assets'

const SCRUB_FPS_CAP = 60
const VIDEO_SCROLL_START_OFFSET = '99%'
const VIDEO_SCROLL_END_OFFSET = '-120%'

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

  const resolvedVideoPath = resolveAssetPath(videoPath)

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: [`start ${VIDEO_SCROLL_START_OFFSET}`, `end ${VIDEO_SCROLL_END_OFFSET}`]
  })

  useEffect(() => {
    if (typeof navigator === 'undefined') return

    const ua = navigator.userAgent
    const detectedSafari =
      /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|SamsungBrowser|Android/i.test(ua)

    isSafariRef.current = detectedSafari
  }, [])

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
    const targetFrame = Math.round(Math.max(0, Math.min(1, scrollProgress)) * (totalFrames - 1))
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
    <div ref={scrollTrackRef} className={`relative min-h-[115vh] md:min-h-[140vh] ${className}`}>
      <div className="sticky top-8 md:top-12">
        <div className="relative w-full aspect-[4/3] md:aspect-video overflow-hidden rounded-2xl bg-[#0D0E11] shadow-[0_24px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/10">
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
              imageRendering: 'pixelated',
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
        </div>
      </div>
    </div>
  )
}
