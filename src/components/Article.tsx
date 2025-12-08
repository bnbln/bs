import React, { useRef } from 'react'
import { useRouter } from 'next/router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Project } from '../lib/markdown'
import { resolveAssetPath } from '../lib/assets'
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer'
import CodeBlock from './CodeBlock'
import ColorPalette from './ColorPalette'
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

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactElement[] = []
    let currentSection: string[] = []

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

      // Headers - Apple Style: Sharp, ample white space
      if (line.startsWith('#')) {
        flushCurrentSection()
        const level = line.match(/^#+/)[0].length
        const text = line.replace(/^#+\s*/, '')
        const sizes = {
            1: "text-[40px] md:text-[56px] leading-[1.07] tracking-[-0.015em] font-bold font-space-grotesk mt-20 mb-8 text-[#1D1D1F]",
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
        i++
        const bodyLines: string[] = []
        while (i < lines.length && !lines[i].trim().startsWith('```')) { bodyLines.push(lines[i]); i++ }
        const body = bodyLines.join('\n')

        if (type.toLowerCase() === 'palette') {
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
            <div key={`palette-${currentIndex++}`} className={`${colWide} my-16`}>
               <ColorPalette title={attrs.title} description={attrs.description} colors={colors} />
            </div>
          )
        } else {
             elements.push(
                <div key={`code-${currentIndex++}`} className={`${colWide} my-16`}>
                   <CodeBlock title={attrs.title} code={body} language={type || 'text'} filename={attrs.filename} />
                </div>
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
                  const mediaList = mediaUrl.split('|').map(url => url.trim())
                   elements.push(
                    <div key={`gallery-${currentIndex++}`} className={`${colWide} grid grid-cols-1 md:grid-cols-2 gap-6 my-12`}>
                        {mediaList.map((url, idx) => {
                             const path = resolveAssetPath(url)
                             const isV = isVideoFile(url)
                             return (
                                 <div key={idx} className="w-full rounded-2xl overflow-hidden bg-neutral-50 shadow-sm border border-black/5">
                                     {isV ? (
                                        <AdaptiveVideoPlayer videoUrl={path} autoStart={true} color={accentColor} />
                                     ) : (
                                        <img src={path} className="w-full h-auto object-cover" loading="lazy" />
                                     )}
                                 </div>
                             )
                        })}
                    </div>
                   )
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
                 {project.content && <MarkdownRenderer content={project.content} project={project} accentColor={accentColor} />}
            </section>
    
          </main>
      </div>

      <Footer />
    </div>
  )
}