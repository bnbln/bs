import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { resolveAssetPath } from '../lib/assets'
import { getScrubVideoManager } from '../utils/scrubVideoManager'

const VIDEO_SCROLL_START_OFFSET = '92%'
const VIDEO_SCROLL_END_OFFSET = '-120%'
const INTRO_END_PROGRESS = 0.16
const OUTRO_START_PROGRESS = 0.6
const OUTRO_END_PROGRESS = 0.9
const REVEAL_DELAY_MS = 120

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
  const revealTimeoutRef = useRef<number | null>(null)
  const hasLoadedRef = useRef<boolean>(false)

  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
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
    const iosDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const androidDevice = /Android/i.test(ua)
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const mobileDevice = coarsePointer || iosDevice || androidDevice
    const safariBrowser =
      /Safari/i.test(ua) &&
      !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|SamsungBrowser|Android/i.test(ua)
    const safariDesktop = safariBrowser && !iosDevice && finePointer

    setIsMobileDevice(mobileDevice)
    setIsIOS(iosDevice)
    setIsSafariDesktop(safariDesktop)
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
    const video = videoRef.current
    if (!video) return

    hasLoadedRef.current = false
    setVideoLoaded(false)
    setShowAnimation(false)

    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current)
      revealTimeoutRef.current = null
    }

    const onReady = () => {
      if (hasLoadedRef.current || video.readyState < 1) return
      hasLoadedRef.current = true
      setVideoLoaded(true)

      const revealDelay = isMobileDevice ? 0 : REVEAL_DELAY_MS
      revealTimeoutRef.current = window.setTimeout(() => {
        setShowAnimation(true)
        revealTimeoutRef.current = null
      }, revealDelay)
    }

    const events: Array<keyof HTMLMediaElementEventMap> = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']
    events.forEach(event => video.addEventListener(event, onReady))

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.currentTime = 0
    video.removeAttribute('src')
    video.load()

    if (video.readyState >= 1) {
      onReady()
    }

    const fallbackTimeout = window.setTimeout(onReady, 1400)

    return () => {
      events.forEach(event => video.removeEventListener(event, onReady))
      window.clearTimeout(fallbackTimeout)
    }
  }, [isMobileDevice, resolvedVideoPath])

  useEffect(() => {
    const wrapper = scrollTrackRef.current
    if (!wrapper) return

    const manager = getScrubVideoManager()
    manager.register(wrapper)

    return () => {
      manager.unregister(wrapper)
    }
  }, [resolvedVideoPath])

  useEffect(() => {
    getScrubVideoManager().refreshWrapperPositions()
  }, [entryFrame.height, entryFrame.width, scrollSpanVh, stickyTopOffset, videoLoaded])

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={scrollTrackRef}
      className={`scrub-video-wrapper relative ${className}`}
      style={{ height: `${scrollSpanVh}vh` }}
    >
      <motion.div
        className="scrub-video-container sticky overflow-visible"
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
            className={`h-full w-full object-cover pointer-events-none select-none transition-opacity duration-500 ${
              showAnimation ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
            preload="auto"
            webkit-playsinline="true"
            x-webkit-airplay="allow"
          >
            <source src={resolvedVideoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

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
