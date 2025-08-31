import React from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Project } from '../lib/markdown'
import { resolveAssetPath } from '../lib/assets'
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer'
import CodeBlock from './CodeBlock'
import ColorPalette from './ColorPalette'

interface ArticleProps {
  project: Project
}

// Helper function to check if a file is a video
const isVideoFile = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp']
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext))
}

// Helper function to format date from YYYY-MM-DD to "Month Day, Year"
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString // Return original if invalid date
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Attribute parser for fenced code blocks (key=value pairs, quotes supported)
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

// Try to parse JSON color palette body
const tryParsePaletteJSON = (body: string) => {
  try {
    const parsed = JSON.parse(body)
    if (Array.isArray(parsed)) return parsed
  } catch (_) { /* ignore */ }
  return null
}

// Parse simple line-based palette lines (Name #HEX rgb(...) usage=...)
const parsePaletteLines = (lines: string[]) => {
  return lines.filter(l => l.trim()).map(l => {
    const usageMatch = l.match(/usage=(.*)$/)
    let usage: string | undefined
    if (usageMatch) {
      usage = usageMatch[1].trim()
      l = l.replace(/usage=.*$/, '').trim()
    }
    const parts = l.split(/\s+/)
    const name = parts[0]
    const hex = parts.find(p => p.startsWith('#')) || '#000000'
    const rgb = parts.find(p => p.startsWith('rgb'))
    return { name, hex, rgb, usage }
  })
}

// Custom markdown components
const MarkdownRenderer = ({ content, project, accentColor }: { content: string; project: Project; accentColor: string }) => {
  // Einzel-Item Animation (Viewport getriggert)
  const itemBase = { opacity: 0, y: 32 }
  const itemShow = { opacity: 1, y: 0 }

  // Type Guards
  const hasClassName = (el: any): el is React.ReactElement<{ className?: string; style?: React.CSSProperties }> => {
    return React.isValidElement(el) && typeof (el.props as any)?.className === 'string'
  }
  const isHeadingElement = (el: any): el is React.ReactElement<{ children?: React.ReactNode }> => {
    return React.isValidElement(el) && ['h1','h2','h3'].includes(String(el.type))
  }

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactElement[] = []
    let currentSection: string[] = []
    let currentIndex = 0
    const fullBleed = "relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] transform" // kept for legacy (videos), not for images now
    const blockSpacing = 'block-spacing'

    const flushCurrentSection = () => {
      if (currentSection.length > 0) {
        // Merge empty lines into paragraph breaks
        const paragraphs: string[] = []
        let buffer: string[] = []
        currentSection.forEach(l => {
          if (l.trim() === '') {
            if (buffer.length) {
              paragraphs.push(buffer.join(' '))
              buffer = []
            }
          } else {
            buffer.push(l)
          }
        })
        if (buffer.length) paragraphs.push(buffer.join(' '))
        elements.push(
          <div key={`text-${currentIndex++}`} className={blockSpacing}>
            {paragraphs.map((p, i) => (
              <p key={i}>{parseInlineElements(p)}</p>
            ))}
          </div>
        )
        currentSection = []
      }
    }

    const parseInlineElements = (text: string) => {
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = text.split(boldRegex)
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} style={{ color: accentColor }}>{part}</strong>
          )
        }
        return part
      })
    }

    let i = 0
    while (i < lines.length) {
      const rawLine = lines[i]
      const line = rawLine.trim()

      if (line.startsWith('```')) {
        flushCurrentSection()
        const fenceInfo = line.replace(/^```+/, '').trim()
        const [maybeType, ...restAttrParts] = fenceInfo.split(/\s+/)
        const attrs = parseFenceAttributes(restAttrParts.join(' '))
        const type = maybeType || ''
        i++
        const bodyLines: string[] = []
        while (i < lines.length && !lines[i].trim().startsWith('```')) { bodyLines.push(lines[i]); i++ }
        const body = bodyLines.join('\n')

        if (type.toLowerCase() === 'palette') {
          let colorsData: any = tryParsePaletteJSON(body) || parsePaletteLines(bodyLines)
          elements.push(
            <div key={`palette-${currentIndex++}`}>
              <ColorPalette title={attrs.title} description={attrs.description} colors={colorsData} />
            </div>
          )
        } else {
          const language = type || attrs.lang || 'text'
          elements.push(
            <div key={`code-${currentIndex++}`}>
              <CodeBlock
                title={attrs.title}
                description={attrs.description}
                code={body}
                language={language}
                filename={attrs.filename}
                githubUrl={attrs.github}
                liveUrl={attrs.live}
              />
            </div>
          )
        }
      }
      else if (line.startsWith('###')) {
        flushCurrentSection()
        elements.push(<h3 key={`h3-${currentIndex++}`}>{line.replace('### ', '')}</h3>)
      }
      else if (line.startsWith('##')) {
        flushCurrentSection()
        elements.push(<h2 key={`h2-${currentIndex++}`}>{line.replace('## ', '')}</h2>)
      }
      else if (line.startsWith('#')) {
        flushCurrentSection()
        elements.push(<h1 key={`h1-${currentIndex++}`}>{line.replace('# ', '')}</h1>)
      }
      else if (line.startsWith('- ')) {
        flushCurrentSection()
        const listItems: string[] = []
        while (i < lines.length && lines[i].trim().startsWith('- ')) { listItems.push(lines[i].trim().replace('- ', '')); i++ }
        i--
        elements.push(
          <ul key={`list-${currentIndex++}`} className={blockSpacing}>
            {listItems.map((item, idx) => <li key={idx}>{parseInlineElements(item)}</li>)}
          </ul>
        )
      }
      else if (line.includes('![') && line.includes('|')) {
        flushCurrentSection()
        const match = line.match(/!\[(.*?)\]/)
        if (match) {
          const images = match[1].split('|')
          elements.push(
            <figure key={`gallery-${currentIndex++}`} className={"media-row my-10 last:mb-0"}>
              <div className="media-row-inner">
                <div className={(images.length > 1 ? 'gallery-grid' : 'flex justify-center') }>
                  {images.map((img, idx) => {
                    const trimmed = img.trim()
                    const assetPath = resolveAssetPath(trimmed)
                    if (isVideoFile(trimmed)) {
                      return (
                        <div key={idx} className="relative w-full aspect-video overflow-hidden rounded-md bg-black">
                          <AdaptiveVideoPlayer videoUrl={assetPath} color={accentColor} autoStart={true} />
                        </div>
                      )
                    }
                    return (
                      <img key={idx} src={assetPath} alt="" className="block w-full h-auto rounded-md object-cover" loading="lazy" decoding="async" />
                    )
                  })}
                </div>
              </div>
            </figure>
          )
        }
      }
      else if (line.startsWith('![')) {
        flushCurrentSection()
        let match = line.match(/!\[.*?\]\((.*?)\)/)
        let mediaUrl: string | null = null
        if (match) mediaUrl = match[1]; else { match = line.match(/!\[(.*?)\]/); if (match) mediaUrl = match[1] }
        if (mediaUrl) {
          const assetPath = resolveAssetPath(mediaUrl.trim())
          if (isVideoFile(mediaUrl.trim())) {
            elements.push(
              <figure key={`video-${currentIndex++}`} className={fullBleed + " my-10 last:mb-0 article-video-block"}>
                <div className="aspect-video overflow-hidden bg-black">
                  <AdaptiveVideoPlayer videoUrl={assetPath} color={accentColor} autoStart={false} />
                </div>
              </figure>
            )
          } else {
            elements.push(
              <figure key={`image-${currentIndex++}`} className={"media-row my-10 last:mb-0"}>
                <div className="media-row-inner">
                  <img src={assetPath} alt="" className="block w-full h-auto mx-auto object-cover rounded-md" loading="lazy" decoding="async" />
                </div>
              </figure>
            )
          }
        }
      }
      else if (line.includes('[video')) {
        flushCurrentSection()
        const match = line.match(/\[video([^\]]*)\]\((.*?)\)/)
        if (match) {
          const optionsRaw = match[1].trim()
          const parts = match[2].split('|')
          const rawVideoRef = parts[0].trim()
          const videoPath = resolveAssetPath(rawVideoRef)
          const thumbnailPath = parts[1] ? resolveAssetPath(parts[1].trim()) : undefined
          const finalThumbnailPath = thumbnailPath || (parts[1] ? resolveAssetPath(`assets/${parts[1].trim()}`) : undefined)
          const optionSet = new Set(optionsRaw ? optionsRaw.split(/\s+/).map(o => o.toLowerCase()) : [])
          const isLoop = optionSet.has('loop')
          const isAutoplay = isLoop || optionSet.has('autoplay')
          const isMuted = isLoop || optionSet.has('muted') || optionSet.has('silent')
          const isMinimal = isLoop || optionSet.has('minimal') || optionSet.has('bare')
          elements.push(
            <div key={`video-${currentIndex++}`} className={"media-row my-10 last:mb-0 article-video-block"}>
              <div className="media-row-inner">
                <div className="aspect-[16/9] rounded-[4.5px] overflow-hidden">
                  <AdaptiveVideoPlayer
                    videoUrl={videoPath}
                    thumbnailUrl={isMinimal ? undefined : finalThumbnailPath}
                    color={accentColor}
                    autoStart={isAutoplay}
                    loop={isLoop}
                    muted={isMuted}
                    minimal={isMinimal}
                  />
                </div>
              </div>
            </div>
          )
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

    // Post-process: highlight final heading + trailing video block(s)
    const enhanced = [...elements]
    // Collect trailing video blocks
    let tailIndex = enhanced.length - 1
    const trailingVideos: React.ReactElement[] = []
    while (tailIndex >= 0) {
      const el = enhanced[tailIndex]
      if (hasClassName(el) && el.props.className!.includes('article-video-block')) {
        trailingVideos.unshift(el)
        tailIndex--
        continue
      }
      break
    }
    if (trailingVideos.length) {
      const possibleHeadingIndex = tailIndex
      const headingEl = enhanced[possibleHeadingIndex]
      if (isHeadingElement(headingEl)) {
        const headingText = headingEl.props.children

        // Helper: Extract AdaptiveVideoPlayer from original wrapper
        const extractPlayer = (node: React.ReactElement): React.ReactElement | null => {
          if (!React.isValidElement(node)) return null
          if ((node.type as any) === AdaptiveVideoPlayer) return node as React.ReactElement
          const children = (node.props as any)?.children
          if (!children) return null
          const arr = React.Children.toArray(children) as React.ReactElement[]
          for (const child of arr) {
            const found = extractPlayer(child)
            if (found) return found
          }
          return null
        }

        const rebuiltVideos = trailingVideos.map((orig, i) => {
          const player = extractPlayer(orig)
          if (player) {
            return (
              <div key={i} className="final-highlight-video w-full max-w-5xl aspect-video overflow-hidden rounded-[4.5px] bg-black flex items-center justify-center shadow-lg">
                {React.cloneElement(player, { key: 'p', autoStart: player.props?.autoStart ?? false })}
              </div>
            )
          }
          // Fallback: clone original but neutralize layout classes
            if (hasClassName(orig)) {
              return React.cloneElement(orig, { key: i, className: 'final-highlight-video w-full max-w-5xl m-0 aspect-video overflow-hidden rounded-[4.5px] bg-black flex items-center justify-center shadow-lg', style: { ...(orig.props.style||{}), margin:0, left:'auto', transform:'none', maxWidth:'100%' } })
            }
          return orig
        })

        // Remove heading + trailing videos
        enhanced.splice(possibleHeadingIndex, trailingVideos.length + 1, (
          <section key="final-highlight" className="final-highlight-section mt-24 md:mt-32" style={{ backgroundColor: accentColor }}>
            <div className="h-screen w-full flex items-center">
              <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
                <h1 className="font-space-grotesk font-bold leading-tight mb-12 text-black" style={{ fontSize: 'clamp(2.6rem,6vw,4.5rem)' }}>
                  {headingText}
                </h1>
                <div className="w-full flex flex-col gap-14 items-center justify-center">
                  {rebuiltVideos.map(v => {
                    if (hasClassName(v)) {
                      return React.cloneElement(v, { className: 'final-highlight-video mx-auto w-full aspect-video overflow-hidden rounded-[4.5px] bg-black flex items-center justify-center shadow-lg' })
                    }
                    return v
                  })}
                </div>
              </div>
            </div>
          </section>
        ))
      }
    }

    return enhanced
  }

  // Parse markdown to elements (includes potential final highlight transform)
  const elements = parseMarkdown(content)
  // Detect final highlight wrapper
  const highlightIndex = elements.findIndex(el => (
    React.isValidElement(el) && typeof (el.props as any)?.className === 'string' && (el.props as any).className.includes('final-highlight-section')
  ))

  if (highlightIndex === -1) {
    return <div className="w-full" style={{ ['--accent-color' as any]: accentColor }}>
      <div className="prose-article py-14 md:py-24">
        {elements.map((el, i) => (
          <motion.div
            key={(el as any)?.key || i}
            initial={itemBase}
            whileInView={itemShow}
            viewport={{ once: true, margin: '0px 0px 0px 0px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
          >
            {el}
          </motion.div>
        ))}
      </div>
    </div>
  }

  const before = elements.slice(0, highlightIndex)
  const highlight = elements[highlightIndex]
  const after = elements.slice(highlightIndex + 1) // aktuell leer (Highlight am Ende), aber generisch gelassen

  return <div className="w-full" style={{ ['--accent-color' as any]: accentColor }}>
    {before.length > 0 && (
      <div className="prose-article pt-14 md:pt-24 pb-0 md:pb-0">
        {before.map((el, i) => (
          <motion.div
            key={(el as any)?.key || `b-${i}`}
            initial={itemBase}
            whileInView={itemShow}
            viewport={{ once: true, margin: '0px 0px 0px 0px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
          >
            {el}
          </motion.div>
        ))}
      </div>
    )}
    <motion.div
      key={(highlight as any)?.key || 'final-highlight'}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {highlight}
    </motion.div>
    {after.length > 0 && (
      <div className="prose-article py-14 md:py-24">
        {after.map((el, i) => (
          <motion.div
            key={(el as any)?.key || `a-${i}`}
            initial={itemBase}
            whileInView={itemShow}
            viewport={{ once: true, margin: '0px 0px 0px 0px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
          >
            {el}
          </motion.div>
        ))}
      </div>
    )}
  </div>
}

export default function Article({ project }: ArticleProps) {
  const router = useRouter()

  if (!project) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  // Extract accent color from project or use fallback
  const getAccentColor = (bgColor?: string) => {
    if (!bgColor) return '#3DB1FF'
    
    // If it's a hex color, use it directly
    if (bgColor.startsWith('#')) return bgColor
    
    // Map CSS classes to colors
    const colorMap: { [key: string]: string } = {
      'bg-blue': '#0000FF',
      'bg-orange': '#F18825',
      'bg-azure': '#172340',
    }
    
    return colorMap[bgColor] || '#3DB1FF'
  }
  
  const accentColor = getAccentColor(project.bgColor)
  
  // Extract tags from category or create relevant ones
  const generateTags = (category: string, title: string) => {
    const tags: string[] = []
    
    // Add category-based tags
    if (category.includes('Motion') || category.includes('Design')) tags.push('#Motion Design')
    if (category.includes('Trailer') || category.includes('Campaign')) tags.push('#Trailer')
    if (category.includes('Politics') || title.includes('EU') || title.includes('Election')) tags.push('#Politics')
    if (category.includes('AI') || category.includes('Artificial Intelligence')) tags.push('#AI')
    if (category.includes('UX') || category.includes('UI')) tags.push('#UX/UI')
    if (category.includes('Development')) tags.push('#Development')
    if (category.includes('Award')) tags.push('#Award')
    if (category.includes('Animation')) tags.push('#Animation')
    if (category.includes('3D')) tags.push('#3D')
    if (category.includes('Automation')) tags.push('#Automation')
    if (category.includes('Show Design')) tags.push('#Show Design')
    
    // Ensure at least one tag exists
    if (tags.length === 0) {
      tags.push(`#${category}`)
    }
    
    return tags.slice(0, 3) // Limit to 3 tags for design consistency
  }
  
  const tags = generateTags(project.category, project.title)

  return (
    <div className="min-h-screen bg-[rgba(0,0,0,0.92)] text-white" style={{ ['--accent-color' as any]: accentColor }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="text-white hover:text-gray-300 transition-colors font-inter font-normal text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Article Content */}
      <article className="w-full">
        {/* Header Section */}
        <motion.div 
          className="bg-[#000000] pt-[100px] lg:pt-[170px] pb-16 px-4 sm:px-8 md:px-16 lg:px-[159px] w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-[72ch] space-y-10">
            <div className="space-y-4">
              <h1 className="font-space-grotesk font-bold leading-tight" style={{ fontSize: 'clamp(2.6rem,6vw,4.5rem)', color: accentColor }}>
                {project.title}
              </h1>
              {project.subtitle && (
                <h2 className="font-inter font-light leading-tight text-[rgba(255,255,255,0.88)]" style={{ fontSize: 'clamp(1.6rem,4.5vw,3rem)' }}>
                  {project.subtitle}
                </h2>
              )}
            </div>
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2.5">
                {tags.map((tag, index) => (
                  <span key={index} className="tag" style={{ backgroundColor: 'rgba(255,255,255,1)' }}>{tag}</span>
                ))}
              </div>
              <p className="font-inter text-[15px] md:text-[16px] leading-[1.55] text-[rgba(255,255,255,0.88)] max-w-[60ch]">{project.excerpts}</p>
              <p className="font-inter text-[11px] md:text-[12px] tracking-wide uppercase text-[#969696]">{formatDate(project.published)}</p>
            </div>
          </div>
        </motion.div>

        {/* Hero Media (Video or Image) */}
        {project.pageVideo ? (
          <motion.div 
            className="w-full aspect-[1298/730.125] mb-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 0.95 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AdaptiveVideoPlayer 
              videoUrl={project.pageVideo}
              thumbnailUrl={project.image}
              color={accentColor}
              autoStart={false}
            />
          </motion.div>
        ) : project.image ? (
          <motion.div 
            className="w-full aspect-[1298/730.125] bg-center bg-cover bg-no-repeat mb-16"
            style={{ backgroundImage: `url('${project.image}')` }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        ) : null}

        {/* Article Content with Enhanced Markdown */}
        <motion.div 
          className="" /* padding moved into MarkdownRenderer to allow flush highlight bottom */
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {project.content ? (
            <MarkdownRenderer content={project.content} project={project} accentColor={accentColor} />
          ) : (
            <div className="content-container py-8 text-gray-300 font-inter"><p>Content is being processed...</p></div>
          )}
        </motion.div>
      </article>
    </div>
  )
}