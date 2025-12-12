import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Project } from '../lib/markdown'
import { resolveAssetPath } from '../lib/assets'
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer'
import CodeBlock from './CodeBlock'
import ColorPalette from './ColorPalette'
import Callout, { CalloutVariant } from './Callout'
import Navigation from './Navigation'
import { ArrowLeft } from 'lucide-react'

interface ArticleProps {
  project: Project
  allProjects?: Project[]
}

// Helper function to check if a file is a video
const isVideoFile = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp']
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext))
}

// Helper function to format date from YYYY-MM-DD to "Year" or full date
const formatYear = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '' 
  return date.getFullYear().toString()
}

// Attribute parser for fenced code blocks
const parseFenceAttributes = (attr: string): Record<string, string> => {
  const attrs: Record<string, string> = {}
  const regex = /(\w+)=(("[^"]*")|('[^']*')|([^\s]+))/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(attr)) !== null) {
    const key = m[1]
    let val = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    attrs[key] = val
  }
  return attrs
}

// Custom markdown components with "Apple-like" Grid Layout
const MarkdownRenderer = ({ content, project, accentColor, allProjects }: { content: string; project: Project; accentColor: string; allProjects?: Project[] }) => {
  
  // Layout Classes - Apple Style: highly tailored, centralized text, wide media
  const colText = "col-span-1 md:col-start-4 md:col-span-6" // 6 cols centered (approx 680-700px on large screens)
  const colWide = "col-span-1 md:col-start-2 md:col-span-10" // Wider breakout
  const colFull = "col-span-1 md:col-span-12" // Full width
  
  let currentIndex = 0

  type RowGalleryItem = { url: string; caption?: string }

  const DraggableRowGallery = ({ items }: { items: RowGalleryItem[] }) => {
    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)

    const isDownRef = useRef(false)
    const startXRef = useRef(0)
    const startScrollLeftRef = useRef(0)
    const didMoveRef = useRef(false)

    // Physics refs (borrowed behavior from FeaturedProjects, without animation libs)
    const velocityRef = useRef(0)
    const lastXRef = useRef(0)
    const lastTimeRef = useRef(0)

    useEffect(() => {
      if (!isDragging) return
      const prevCursor = document.body.style.cursor
      document.body.style.cursor = 'grabbing'
      return () => {
        document.body.style.cursor = prevCursor
      }
    }, [isDragging])

    const getItemEls = () => {
      const el = scrollerRef.current
      if (!el) return [] as HTMLElement[]
      return Array.from(el.querySelectorAll('[data-row-gallery-item="1"]')) as HTMLElement[]
    }

    const getNearestIndex = (scrollLeft: number) => {
      const els = getItemEls()
      if (!els.length) return 0
      let bestIdx = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let i = 0; i < els.length; i++) {
        const d = Math.abs(els[i].offsetLeft - scrollLeft)
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
      }
      return bestIdx
    }

    useEffect(() => {
      const el = scrollerRef.current
      if (!el) return

      let raf = 0
      const update = () => {
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const maxScroll = el.scrollWidth - el.clientWidth
          const left = el.scrollLeft
          setCanScrollLeft(left > 2)
          setCanScrollRight(left < maxScroll - 2)
          setActiveIndex(getNearestIndex(left))
        })
      }

      update()
      el.addEventListener('scroll', update, { passive: true } as any)
      window.addEventListener('resize', update)
      return () => {
        if (raf) cancelAnimationFrame(raf)
        el.removeEventListener('scroll', update as any)
        window.removeEventListener('resize', update)
      }
    }, [])

    const scrollToIndex = (idx: number) => {
      const el = scrollerRef.current
      if (!el) return
      const els = getItemEls()
      if (!els.length) return
      const clamped = Math.max(0, Math.min(els.length - 1, idx))
      el.scrollTo({ left: els[clamped].offsetLeft, behavior: 'smooth' })
    }

    const scrollPrev = () => {
      const el = scrollerRef.current
      if (!el) return
      const currentIdx = getNearestIndex(el.scrollLeft)
      scrollToIndex(currentIdx - 1)
    }

    const scrollNext = () => {
      const el = scrollerRef.current
      if (!el) return
      const currentIdx = getNearestIndex(el.scrollLeft)
      scrollToIndex(currentIdx + 1)
    }

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const el = scrollerRef.current
      if (!el) return
      isDownRef.current = true
      didMoveRef.current = false
      setIsDragging(true)
      startXRef.current = e.pageX
      startScrollLeftRef.current = el.scrollLeft

      // init physics
      velocityRef.current = 0
      lastXRef.current = e.pageX
      lastTimeRef.current = performance.now()
    }

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDownRef.current) return
      const el = scrollerRef.current
      if (!el) return
      e.preventDefault()
      const dx = e.pageX - startXRef.current
      if (Math.abs(dx) > 3) didMoveRef.current = true
      el.scrollLeft = startScrollLeftRef.current - dx

      // track velocity (px/ms)
      const now = performance.now()
      const dt = now - lastTimeRef.current
      const dxv = e.pageX - lastXRef.current
      if (dt > 0) {
        velocityRef.current = dxv / dt
        lastXRef.current = e.pageX
        lastTimeRef.current = now
      }
    }

    const endDrag = () => {
      if (!isDownRef.current) return
      const el = scrollerRef.current
      isDownRef.current = false
      setIsDragging(false)

      // Snap to nearest item, with a small inertial projection (similar feel as FeaturedProjects)
      if (el && didMoveRef.current) {
        const currentScroll = el.scrollLeft
        const velocity = velocityRef.current
        const inertia = Math.abs(velocity) > 0.5 ? 260 : 0
        const projected = currentScroll - velocity * inertia
        const targetIdx = getNearestIndex(projected)
        scrollToIndex(targetIdx)
      }
    }

    const onClickCapture = (e: React.MouseEvent) => {
      // Prevent accidental clicks (e.g. on video controls) when it was a drag
      if (didMoveRef.current) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    return (
      <div className={`${colFull} my-12`}>
        <div className="relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw]">
          <div
            ref={scrollerRef}
            className={[
              'scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto pb-2',
              'snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 md:scroll-px-12 lg:scroll-px-[100px] xl:scroll-px-[140px]',
              '[scroll-snap-stop:always] [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]',
              'cursor-grab select-none',
              isDragging ? 'cursor-grabbing' : '',
            ].join(' ')}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onClickCapture={onClickCapture}
          >
            {items.map((item, idx) => {
              const path = resolveAssetPath(item.url)
              const isV = isVideoFile(item.url)
              return (
                <figure
                  key={idx}
                  data-row-gallery-item="1"
                  className="snap-start snap-always shrink-0 first:ml-4 sm:first:ml-8 md:first:ml-12 lg:first:ml-[100px] xl:first:ml-[140px] last:mr-4 sm:last:mr-8 md:last:mr-12 lg:last:mr-[100px] xl:last:mr-[140px]"
                >
                  <div className="rounded-2xl overflow-hidden bg-neutral-50 shadow-sm border border-black/5 ring-1 ring-black/5">
                    {isV ? (
                      <div className="w-[92vw] sm:w-[78vw] md:w-[720px] lg:w-[840px] aspect-video">
                        <AdaptiveVideoPlayer videoUrl={path} autoStart={true} color={accentColor} />
                      </div>
                    ) : (
                      <img
                        src={path}
                        className="block h-[56vh] sm:h-[60vh] md:h-[66vh] w-auto max-w-[92vw] sm:max-w-[78vw] md:max-w-[720px] lg:max-w-[840px] object-contain"
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                  </div>
                  {item.caption && (
                    <figcaption className="mt-3 text-[12px] leading-snug text-[#86868b] font-inter tracking-[-0.01em]">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              )
            })}
          </div>

          {/* Minimal controls under gallery: small buttons + center stepper */}
          {items.length > 1 && (
            <div className="mt-4 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px]">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={scrollPrev}
                  disabled={!canScrollLeft}
                  aria-label="Previous image"
                  className="h-10 w-10 rounded-full border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-neutral-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <div className="flex items-center justify-center gap-2">
                  {items.map((_, idx) => {
                    const isActive = idx === activeIndex
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToIndex(idx)}
                        aria-label={`Image ${idx + 1} of ${items.length}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={[
                          'h-2 rounded-full transition-[width,background-color,opacity] duration-300',
                          isActive ? 'w-8' : 'w-2.5 opacity-60 hover:opacity-90',
                        ].join(' ')}
                        style={{ backgroundColor: isActive ? accentColor : 'rgba(0,0,0,0.18)' }}
                      />
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={scrollNext}
                  disabled={!canScrollRight}
                  aria-label="Next image"
                  className="h-10 w-10 rounded-full border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-neutral-200"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactElement[] = []
    let currentSection: string[] = []
    let prevWasTwoUpGallery = false

    const isTwoUpGalleryLine = (raw: string): boolean => {
      const s = (raw || '').trim()
      if (!s) return false
      if (s.includes('[video')) return false
      if (!s.startsWith('![')) return false

      // Support both syntaxes:
      // - Markdown: ![alt](a.jpg|b.jpg)
      // - Shorthand used in this repo: ![a.jpg|b.jpg]
      const match = s.match(/!\[.*?\]\((.*?)\)/) || s.match(/!\[(.*?)\]/)
      if (!match) return false
      const mediaUrl = (match[1] || '').trim()
      if (!mediaUrl.includes('|')) return false

      // Support optional captions via `asset.jpg::Caption`
      const urls = mediaUrl
        .split('|')
        .map(entry => {
          const [u] = entry.split('::')
          return (u || '').trim()
        })
        .filter(Boolean)

      return urls.length > 0 && urls.length <= 2
    }

    const nextNonEmptyLine = (startIdx: number): string | null => {
      for (let j = startIdx; j < lines.length; j++) {
        const v = (lines[j] || '').trim()
        if (v.length > 0) return lines[j]
      }
      return null
    }

    const paragraphsFromLines = (ls: string[]) => {
      const paragraphs: string[] = []
      let buffer: string[] = []
      ls.forEach(l => {
        if (l.trim() === '') {
          if (buffer.length) {
            paragraphs.push(buffer.join(' ').trim())
            buffer = []
          }
        } else {
          buffer.push(l.trim())
        }
      })
      if (buffer.length) paragraphs.push(buffer.join(' ').trim())
      return paragraphs.filter(Boolean)
    }

    const normalizeCalloutVariant = (rawType: string, attrType?: string): CalloutVariant | null => {
      const raw = (attrType || rawType || '').toLowerCase().trim()
      if (!raw) return null

      // allow ` ```callout type="insight"``` ` and direct fences like ` ```insight``` `
      if (rawType.toLowerCase() === 'callout' && !attrType) return 'note'

      const aliases: Record<string, CalloutVariant> = {
        // insight
        insight: 'insight',
        'key': 'insight',
        'keyinsight': 'insight',
        'key-insight': 'insight',
        // context
        context: 'context',
        kontext: 'context',
        // result
        result: 'result',
        ergebnis: 'result',
        // note
        note: 'note',
        hinweis: 'note',
        // warning
        warning: 'warning',
        warn: 'warning',
        achtung: 'warning',
      }
      return aliases[raw] || null
    }

    const flushCurrentSection = () => {
      if (currentSection.length > 0) {
        // Merge empty lines into paragraph breaks
        let buffer: string[] = []
        currentSection.forEach(l => {
            if (l.trim() === '') {
                if (buffer.length) {
                    elements.push(
                        <p key={`p-${currentIndex++}`} className={`${colText} text-[19px] sm:text-[21px] leading-[1.6] text-[#1D1D1F] font-inter font-normal tracking-[-0.01em] mb-6`}>
                            {parseInlineElements(buffer.join(' '))}
                        </p>
                    )
                    buffer = []
                }
            } else {
                buffer.push(l)
            }
        })
        if (buffer.length) {
            elements.push(
                <p key={`p-${currentIndex++}`} className={`${colText} text-[19px] sm:text-[21px] leading-[1.6] text-[#1D1D1F] font-inter font-normal tracking-[-0.01em] mb-6`}>
                    {parseInlineElements(buffer.join(' '))}
                </p>
            )
        }
        currentSection = []
      }
    }

    const parseInlineElements = (text: string) => {
      // Basic Bold & Link parsing
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = text.split(boldRegex)
      
      return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <strong key={index} className="font-semibold text-black">{part}</strong>
        }
        // Handle links
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        const nodes: React.ReactNode[] = []
        let lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = linkRegex.exec(part)) !== null) {
            if (m.index > lastIndex) nodes.push(part.slice(lastIndex, m.index))
            nodes.push(
                <a key={m.index} href={m[2]} target="_blank" rel="noopener" className="underline decoration-2 underline-offset-2 transition-colors font-medium hover:opacity-70" style={{ color: accentColor, textDecorationColor: `${accentColor}40` }}>
                    {m[1]}
                </a>
            )
            lastIndex = m.index + m[0].length
        }
        if (lastIndex < part.length) nodes.push(part.slice(lastIndex))
        return <React.Fragment key={index}>{nodes}</React.Fragment>
      })
    }

    let i = 0
    while (i < lines.length) {
      const rawLine = lines[i]
      const line = rawLine.trim()
      const isTwoUpGallery = isTwoUpGalleryLine(rawLine)

      // Any non-empty, non-2up-gallery line breaks the "consecutive 2-up gallery rows" chain.
      // Empty lines are ignored so authors can separate rows with blank lines.
      if (line.length > 0 && !isTwoUpGallery) {
        prevWasTwoUpGallery = false
      }

      // Project reference syntax: [project:slug] or [projects:slug1,slug2]
      // Renders linked cards (image + title) to related articles/projects.
      if (/^\[(project|projects):/i.test(line)) {
        flushCurrentSection()
        const match = line.match(/^\[(project|projects):(.*)\]$/i)
        if (match) {
          const listRaw = match[2].trim()
          const slugs = listRaw.split(/[,|]/).map(s => s.trim()).filter(Boolean)
          const refs = (allProjects || []).filter(p => slugs.includes(p.slug) && p.slug !== project.slug)
          if (refs.length > 0) {
            elements.push(
              <div key={`projrefs-${currentIndex++}`} className={`${colWide} my-12`}>
                <div className={`grid gap-6 ${refs.length > 1 ? 'md:grid-cols-2' : ''}`}>
                  {refs.map(ref => (
                    <a
                      key={ref.slug}
                      href={`/project/${ref.slug}`}
                      className="group project-ref-card rounded-2xl overflow-hidden bg-white border border-black/10 hover:border-black/20 shadow-sm hover:shadow-xl transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] flex flex-col focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/10 hover:-translate-y-0.5"
                      style={{ ['--ref-accent' as any]: ref.bgColor || accentColor }}
                    >
                      <div className="aspect-video relative bg-neutral-100 overflow-hidden ring-1 ring-black/5">
                        {ref.image && (
                          <img
                            src={resolveAssetPath(ref.image)}
                            alt={ref.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/70 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-5 flex flex-col gap-2 relative">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-space-grotesk font-semibold text-[18px] leading-snug text-[#1D1D1F]">
                            {ref.title}
                          </h4>
                          <span className="shrink-0 text-[11px] font-mono text-[#86868b] mt-1">
                            {formatYear(ref.published)}
                          </span>
                        </div>
                        {ref.excerpts && (
                          <p className="text-[15px] leading-snug text-[#6e6e73] font-inter">
                            {ref.excerpts}
                          </p>
                        )}
                        <span
                          className="mt-2 inline-flex items-center gap-1 text-[12px] font-inter font-medium tracking-[-0.01em] transition-colors"
                          style={{ color: ref.bgColor || accentColor }}
                        >
                          View project →
                        </span>
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-[color:var(--ref-accent)]/35 transition-colors pointer-events-none" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )
          }
        }
        i++
        continue
      }

      // Headers - Apple Style: Sharp, ample white space
      if (line.startsWith('#')) {
        flushCurrentSection()
        const match = line.match(/^#+/)
        const level = match ? match[0].length : 1
        const text = line.replace(/^#+\s*/, '')
        const sizes = {
            1: "text-[40px] md:text-[56px] leading-[1.07] tracking-[-0.015em] font-bold font-space-grotesk mt-20 mb-0 text-[#1D1D1F]",
            2: "text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.01em] font-bold font-space-grotesk mt-16 mb-6 text-[#1D1D1F]",
            3: "text-[24px] md:text-[28px] leading-[1.2] font-bold font-space-grotesk mt-10 mb-4 text-[#1D1D1F]"
        }
        elements.push(
             // @ts-ignore
            <div key={`h-${currentIndex++}`} className={`${colText} ${sizes[level] || sizes[1]}`}>
                {text}
            </div>
        )
      }
      // Lists
      else if (line.startsWith('- ')) {
        flushCurrentSection()
        const listItems: string[] = []
        while (i < lines.length && lines[i].trim().startsWith('- ')) { 
            listItems.push(lines[i].trim().replace('- ', ''))
            i++ 
        }
        i--
        elements.push(
            <ul key={`list-${currentIndex++}`} className={`${colText} space-y-3 mb-10 mt-2`}>
                {listItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-[19px] sm:text-[21px] leading-[1.6] text-[#1D1D1F] font-inter">
                        <span className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-neutral-300 transform" style={{ backgroundColor: accentColor }} />
                        <span>{parseInlineElements(item)}</span>
                    </li>
                ))}
            </ul>
        )
      }
      // Code Blocks
      else if (line.startsWith('```')) {
        flushCurrentSection()
        const fenceInfo = line.replace(/^```+/, '').trim()
        const [maybeType, ...restAttrParts] = fenceInfo.split(/\s+/)
        const attrs = parseFenceAttributes(restAttrParts.join(' '))
        const type = maybeType || ''
        const typeLower = type.toLowerCase()
        i++
        const bodyLines: string[] = []
        while (i < lines.length && !lines[i].trim().startsWith('```')) { bodyLines.push(lines[i]); i++ }
        const body = bodyLines.join('\n')

        const calloutVariant = normalizeCalloutVariant(typeLower, attrs.type)
        if (calloutVariant) {
          const paragraphs = paragraphsFromLines(bodyLines)
          elements.push(
            <div key={`callout-${currentIndex++}`} className={`${colText} my-10`}>
              <Callout
                variant={calloutVariant}
                title={attrs.title}
                accentColor={attrs.accent || accentColor}
              >
                {paragraphs.map((p, idx) => (
                  <p key={idx}>{parseInlineElements(p)}</p>
                ))}
              </Callout>
            </div>
          )
        }
        else if (typeLower === 'palette') {
          // Parse palette data... simple version for now
          const parsePaletteLines = (lines: string[]) => {
            return lines.filter(l => l.trim()).map(l => {
                const parts = l.split(/\s+/)
                return { name: parts[0], hex: parts.find(p => p.startsWith('#')) || '#000' }
            })
          }
           // @ts-ignore
          const colors = parsePaletteLines(bodyLines)
          elements.push(
            <React.Fragment key={`palette-${currentIndex++}`}>
              {(attrs.title || attrs.description) && (
                <div className={`${colText} mt-16`}>
                  {attrs.title && <h2 className="palette-block-title">{attrs.title}</h2>}
                  {attrs.description && <p className="palette-block-description">{attrs.description}</p>}
                </div>
              )}
              <div className={`${colWide} ${attrs.title || attrs.description ? 'mb-16' : 'my-16'}`}>
                <ColorPalette hideHeader title={attrs.title} description={attrs.description} colors={colors} />
              </div>
            </React.Fragment>
          )
        } else {
             elements.push(
                <React.Fragment key={`code-${currentIndex++}`}>
                  {(attrs.title || attrs.description) && (
                    <div className={`${colText} mt-16`}>
                      {attrs.title && <h2 className="code-block-title">{attrs.title}</h2>}
                      {attrs.description && <p className="code-block-description">{attrs.description}</p>}
                    </div>
                  )}
                  <div className={`${colWide} ${attrs.title || attrs.description ? 'mb-16' : 'my-16'}`}>
                    <CodeBlock
                      hideHeader
                      title={attrs.title}
                      description={attrs.description}
                      code={body}
                      language={type || 'text'}
                      filename={attrs.filename}
                      githubUrl={attrs.githubUrl}
                      liveUrl={attrs.liveUrl}
                    />
                  </div>
                </React.Fragment>
            )
        }
      }
      // Images / Videos
      else if (line.startsWith('![') || line.includes('[video')) {
         flushCurrentSection()
         let mediaUrl = ''
         let thumbnailUrl = ''
         let isVid = false
         
         if (line.includes('[video')) {
             const match = line.match(/\[video.*?\]\((.*?)\)/)
             if (match) {
                 const parts = match[1].split('|')
                 mediaUrl = parts[0]
                 if (parts[1]) thumbnailUrl = parts[1]
                 isVid = true
             }
         } else {
             const match = line.match(/!\[.*?\]\((.*?)\)/) || line.match(/!\[(.*?)\]/)
             if (match) mediaUrl = match[1]
         }

         if (mediaUrl) {
              // Check if multiple images
             if (mediaUrl.includes('|')) {
                  // Support optional captions via `asset.jpg::Caption`
                  const mediaList = mediaUrl.split('|').map(entry => {
                    const [u, c] = entry.split('::')
                    return { url: (u || '').trim(), caption: (c || '').trim() }
                  }).filter(item => item.url)

                  // <=2 images: keep clean 2-up grid
                  if (mediaList.length <= 2) {
                    const nextLine = nextNonEmptyLine(i + 1)
                    const nextIsTwoUpGallery = nextLine ? isTwoUpGalleryLine(nextLine) : false
                    const mtClass = prevWasTwoUpGallery ? 'mt-6' : 'mt-12'
                    const mbClass = nextIsTwoUpGallery ? 'mb-0' : 'mb-12'

                    elements.push(
                      <div key={`gallery-${currentIndex++}`} className={`${colWide} grid grid-cols-1 md:grid-cols-2 gap-6 ${mtClass} ${mbClass}`}>
                        {mediaList.map((item, idx) => {
                          const path = resolveAssetPath(item.url)
                          const isV = isVideoFile(item.url)
                          return (
                            <figure key={idx} className="w-full">
                              <div className="w-full rounded-2xl overflow-hidden bg-neutral-50 shadow-sm border border-black/5 ring-1 ring-black/5">
                                {isV ? (
                                  <AdaptiveVideoPlayer videoUrl={path} autoStart={true} color={accentColor} />
                                ) : (
                                  <img src={path} className="w-full h-auto object-cover" loading="lazy" />
                                )}
                              </div>
                              {item.caption && (
                                <figcaption className="mt-3 text-[12px] leading-snug text-[#86868b] font-inter tracking-[-0.01em]">
                                  {item.caption}
                                </figcaption>
                              )}
                            </figure>
                          )
                        })}
                      </div>
                    )
                    prevWasTwoUpGallery = true
                  } else {
                    // >2 images: full-bleed horizontal row gallery (clean + minimal)
                    elements.push(
                      <DraggableRowGallery key={`gallery-row-${currentIndex++}`} items={mediaList} />
                    )
                  }
             } else {
                 const path = resolveAssetPath(mediaUrl.trim())
                 const isV = isVid || isVideoFile(mediaUrl)
                 elements.push(
                    <figure key={`media-${currentIndex++}`} className={`${colWide} my-16`}>
                        <div className="w-full rounded-2xl overflow-hidden bg-neutral-50 shadow-lg shadow-black/5 ring-1 ring-black/5">
                             {isV ? (
                                <AdaptiveVideoPlayer 
                                  videoUrl={path} 
                                  thumbnailUrl={thumbnailUrl ? resolveAssetPath(thumbnailUrl.trim()) : undefined}
                                  autoStart={false} 
                                  color={accentColor} 
                                />
                             ) : (
                                <img src={path} className="w-full h-auto object-cover" loading="lazy" />
                             )}
                        </div>
                    </figure>
                 )
             }
         }
      }
      else if (line.length > 0) {
        currentSection.push(line)
      } else if (currentSection.length > 0) {
        currentSection.push('')
      }
      i++
    }
    flushCurrentSection()
    return elements
  }

  return (
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-x-6">
        {parseMarkdown(content)}
      </div>
  )
}

// Helper function to format date from YYYY-MM-DD to "Month Year"
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '' 
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

import Footer from './Footer'

// ... existing imports

export default function Article({ project, allProjects }: ArticleProps) {
  const router = useRouter()
  
  if (!project) return <div className="min-h-screen bg-white" />

  const accentColor = project.bgColor || '#0066CC' 
  
  const date = formatDate(project.published)
  const tags = ((project.category || '') + ',' + (project.title || '')).split(',').slice(0, 3) 
  
  const generateTags = (category: string) => {
    return category.split(' ').map(s => s.trim()).filter(Boolean)
  }
  const projectTags = generateTags(project.category)

  // Adjacent projects by published date (newest first)
  const projectsByTime = (allProjects || [])
    .slice()
    .sort((a, b) => (a.published > b.published ? -1 : 1))

  const currentIdx = projectsByTime.findIndex(p => p.slug === project.slug)
  const newerProject = currentIdx > 0 ? projectsByTime[currentIdx - 1] : null
  const olderProject =
    currentIdx >= 0 && currentIdx < projectsByTime.length - 1 ? projectsByTime[currentIdx + 1] : null

  const RelatedNavCard = ({
    p,
    label,
    direction,
  }: {
    p: Project
    label: string
    direction: 'newer' | 'older'
  }) => {
    const img = p.heroImage || p.image || ''
    const isNewer = direction === 'newer'
    return (
      <a
        href={`/project/${p.slug}`}
        className="group rounded-2xl border border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] p-5 md:p-6 flex flex-col gap-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/10 hover:-translate-y-0.5"
        style={{ ['--ref-accent' as any]: p.bgColor || accentColor }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">
            {label}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#86868b]">
            <ArrowLeft
              className={[
                'w-4 h-4 text-[#86868b] transition-transform duration-300',
                isNewer ? 'rotate-180 group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5',
              ].join(' ')}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-24 h-16 rounded-xl overflow-hidden bg-neutral-50 border border-black/5 ring-1 ring-black/5 shrink-0">
            {img ? (
              <img
                src={resolveAssetPath(img)}
                alt={p.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-space-grotesk font-semibold text-[18px] leading-snug text-[#1D1D1F]">
              {p.title}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#86868b]">
              About the project
            </div>
            {(p.subtitle || p.excerpts) && (
              <div className="mt-1 text-[14px] leading-snug text-[#6e6e73] font-inter">
                {p.subtitle || p.excerpts}
              </div>
            )}
            <div
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-inter font-medium tracking-[-0.01em] transition-colors"
              style={{ color: p.bgColor || accentColor }}
            >
              View project →
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-[color:var(--ref-accent)]/35 transition-colors pointer-events-none" />
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1D20] text-[#1D1D1F] selection:bg-[var(--accent)] selection:text-white" style={{ ['--accent' as any]: accentColor }}>
      
      {/* Main Content Wrapper - Slides over the footer */}
      <div className="relative z-10 bg-white shadow-2xl mb-0 md:mb-[500px] min-h-screen flex flex-col">
          {/* Navigation - Apple Style: Minimal, Blur */}
          <Navigation theme="light" />

          <main className="w-full pb-0 flex-grow">
            {/* Ambient Glow */}
            <div 
                className="absolute top-0 left-0 w-full h-[50vh] opacity-10 pointer-events-none z-0"
                style={{ 
                    background: `radial-gradient(ellipse at 50% 0%, ${accentColor}, transparent 70%)` 
                }}
            />

            {/* Header Section */}
            <section className="pt-32 md:pt-48 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] mb-20 relative z-10">
                 {/* ... existing header code ... */}
                 <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-x-6 pb-4">
                        {/* Title Column */}
                        <div className="md:col-span-8">
                            <motion.h1 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="text-[12vw] sm:text-[9vw] md:text-[7vw] leading-[0.9] tracking-[-0.03em] font-bold font-space-grotesk mb-8 text-black"
                            >
                                {project.title}
                            </motion.h1>
                            <motion.p 
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                 className="text-2xl md:text-3xl lg:text-[2.2rem] font-medium font-space-grotesk leading-tight max-w-3xl"
                                 style={{ color: accentColor }}
                            >
                                {project.subtitle || project.excerpts}
                            </motion.p>
                        </div>
    
                        {/* Metadata Grid Column - High End Data Look */}
                        <div className="md:col-span-4 flex flex-col justify-end pb-2">
                            <motion.div 
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                 className="grid grid-cols-2 gap-y-10 gap-x-8 font-inter bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-black/5"
                            >
                                {/* <div className="space-y-1">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Client</div>
                                    <div className="text-[15px] font-medium text-[#1d1d1f] break-words">{project.title.includes('Zeitreise') ? 'Production Company' : 'Client Name'}</div>
                                </div> */}
                                <div className="space-y-1">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Timeline</div>
                                    <div className="text-[15px] font-medium text-[#1d1d1f]">{date}</div>
                                </div>
                                 <div className="col-span-2 space-y-2">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#86868b]">Scope</div>
                                    <div className="flex flex-wrap gap-2">
                                        {projectTags.map((t, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-full bg-black/5 text-[#1d1d1f] text-[13px] font-medium">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                 </div>
            </section>
    
            {/* Hero Media - strict 16/9 aspect ratio */}
            {!project.heroHide && (
                <motion.div 
                    className="w-full px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] mb-32 relative z-10"
                    initial={{ opacity: 0, scale: 0.98, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                 <div className="max-w-[1400px] mx-auto rounded-2xl overflow-hidden bg-[#F5F5F7] shadow-2xl shadow-black/10 aspect-video relative group ring-1 ring-black/5">
                    {project.pageVideo ? (
                        <AdaptiveVideoPlayer 
                            videoUrl={project.pageVideo} 
                            thumbnailUrl={project.heroImage ? resolveAssetPath(project.heroImage) : resolveAssetPath(project.image)} 
                            autoStart={false} 
                            color={accentColor} 
                        />
                    ) : (
                        <img src={resolveAssetPath(project.heroImage || project.image || '')} className="w-full h-full object-cover" loading="eager" />
                    )}
                 </div>
                </motion.div>
            )}
    
            {/* Markdown Content */}
            <section className="px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative z-10 pb-32">
                 {project.content && <MarkdownRenderer content={project.content} project={project} accentColor={accentColor} allProjects={allProjects} />}

                 {(newerProject || olderProject) && (
                   <div className="mt-24">
                     <div className="max-w-[1400px] mx-auto">
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-8">
                         <div className="col-span-1 md:col-start-4 md:col-span-6">
                           <div className="h-px w-full bg-black/10 mb-10" />
                           <h2 className="text-[24px] md:text-[28px] leading-[1.2] font-bold font-space-grotesk text-[#1D1D1F]">
                             More Projects
                           </h2>
                           <p className="mt-2 text-[15px] leading-snug text-[#6e6e73] font-inter">
                             Next and previous projects you might like.
                           </p>
                         </div>

                         <div className="col-span-1 md:col-start-2 md:col-span-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                           {olderProject && (
                             <RelatedNavCard p={olderProject} label="Previous" direction="older" />
                           )}
                           {newerProject && (
                             <RelatedNavCard p={newerProject} label="Next" direction="newer" />
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
            </section>
    
          </main>
      </div>

      <Footer />
    </div>
  )
}