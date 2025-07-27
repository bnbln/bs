import React from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Project } from '../lib/markdown'
import { resolveAssetPath } from '../lib/assets'
import CustomVideoPlayer from './CustomVideoPlayer'

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

// Custom markdown components
const MarkdownRenderer = ({ content, project, accentColor }: { content: string; project: Project; accentColor: string }) => {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactElement[] = []
    let currentSection: string[] = []
    let currentIndex = 0
    const pagepx = "px-4 sm:px-8 md:px-16 lg:px-[159px] mx-auto"

    const flushCurrentSection = () => {
      if (currentSection.length > 0) {
        elements.push(
          <div key={`text-${currentIndex++}`} className={"py-8 " + pagepx}>
            <div className={"text-[12px] sm:text-sm md:text-base text-[rgba(255,255,255,0.92)] font-inter font-normal leading-[24px] space-y-4" }>
              {currentSection.map((paragraph, idx) => (
                <p key={idx} className="leading-[24px]">
                  {parseInlineElements(paragraph)}
                </p>
              ))}
            </div>
          </div>
        )
        currentSection = []
      }
    }

    const parseInlineElements = (text: string) => {
      // Handle bold text with golden highlight
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = text.split(boldRegex)
      
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          // This is bold text
          return (
            <span key={index} className="font-inter font-bold" style={{ color: accentColor }}>
              {part}
            </span>
          )
        }
        return part
      })
    }

    let i = 0
    while (i < lines.length) {
      const line = lines[i].trim()

      // Handle headers
      if (line.startsWith('###')) {
        flushCurrentSection()
        elements.push(
          <div key={`h3-${currentIndex++}`} className={"pt-4 pb-2 " + pagepx}>
            <h3 className="text-[14px] sm:text-lg md:text-xl text-[rgba(255,255,255,0.92)] font-space-grotesk font-bold leading-[24px]">
              {line.replace('### ', '')}
            </h3>
          </div>
        )
      } else if (line.startsWith('##')) {
        flushCurrentSection()
        elements.push(
          <div key={`h2-${currentIndex++}`} className={"pt-6 pb-3 " + pagepx}>
            <h2 className="text-[16px] sm:text-xl md:text-2xl text-[rgba(255,255,255,0.92)] font-space-grotesk font-bold leading-[24px]">
              {line.replace('## ', '')}
            </h2>
          </div>
        )
      } else if (line.startsWith('#')) {
        flushCurrentSection()
        elements.push(
          <div key={`h1-${currentIndex++}`} className={"pt-16 pb-8 " + pagepx}>
            <h1 className="text-[32px] sm:text-4xl md:text-5xl text-[rgba(255,255,255,0.92)] font-space-grotesk font-bold leading-[24px]">
              {line.replace('# ', '')}
            </h1>
          </div>
        )
      }
      // Handle code blocks
      else if (line.startsWith('```')) {
        flushCurrentSection()
        i++
        const codeLines: string[] = []
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        elements.push(
          <div key={`code-${currentIndex++}`} className={"py-4 " + pagepx}>
            <div className="bg-[rgba(34,36,42,0.5)] rounded-[4.5px] p-[8px]">
              <code className="text-[10px] sm:text-xs md:text-sm text-[rgba(255,255,255,0.75)] font-space-grotesk font-normal leading-[1.75] block">
                {codeLines.join('\n')}
              </code>
            </div>
          </div>
        )
      }
      // Handle bullet lists
      else if (line.startsWith('- ')) {
        flushCurrentSection()
        const listItems: string[] = []
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          listItems.push(lines[i].trim().replace('- ', ''))
          i++
        }
        i-- // Back up one since we'll increment at end of loop
        
        elements.push(
          <div key={`list-${currentIndex++}`} className={"py-4 " + pagepx}>
            <ul className="space-y-2">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-4 mt-[-2px]" style={{ color: accentColor }}>•</span>
                  <span className="text-[12px] sm:text-sm md:text-base text-[rgba(255,255,255,0.92)] font-inter font-normal leading-[24px]">
                    {parseInlineElements(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
      // Handle image galleries (special syntax: ![img1|img2])
      else if (line.includes('![') && line.includes('|')) {
        flushCurrentSection()
        const match = line.match(/!\[(.*?)\]/)
        if (match) {
          const images = match[1].split('|')
          elements.push(
                         <div key={`gallery-${currentIndex++}`} className={"bg-[rgba(34,36,42,0.5)] p-4 md:p-8  min-h-[700px]" + pagepx}>
               <div className="flex gap-4 md:gap-8">
                {images.map((img, idx) => {
                  const assetPath = resolveAssetPath(img.trim())
                  if (isVideoFile(img.trim())) {
                    return (
                      <div key={idx} className="flex-1 aspect-[1298/730.125] rounded-[4.5px] overflow-hidden">
                        <CustomVideoPlayer 
                          videoUrl={assetPath}
                          color={accentColor}
                          startPlaying={true}
                        />
                      </div>
                    )
                  }
                  return (
                    <div key={idx} className="flex-1 aspect-[1298/730.125] bg-center bg-cover bg-no-repeat rounded-[4.5px]" 
                         style={{ backgroundImage: `url('${assetPath}')` }} />
                  )
                })}
              </div>
            </div>
          )
        }
      }
      // Handle single images and videos
      else if (line.startsWith('![')) {
        flushCurrentSection()
        // Try to match ![alt](url) format first
        let match = line.match(/!\[.*?\]\((.*?)\)/)
        let mediaUrl = null
        
        if (match) {
          mediaUrl = match[1]
        } else {
          // Try to match ![url] format
          match = line.match(/!\[(.*?)\]/)
          if (match) {
            mediaUrl = match[1]
          }
        }
        
        if (mediaUrl) {
          const assetPath = resolveAssetPath(mediaUrl.trim())
          
          if (isVideoFile(mediaUrl.trim())) {
            elements.push(
              <div key={`video-${currentIndex++}`} className="w-full">
                <div className="aspect-[1298/730.125] rounded-[4.5px] overflow-hidden">
                  <CustomVideoPlayer 
                    videoUrl={assetPath}
                    color={accentColor}
                    startPlaying={false}
                  />
                </div>
              </div>
            )
          } else {
            elements.push(
              <div key={`image-${currentIndex++}`} className="w-full">
                <div className="aspect-[1298/730.125] bg-center bg-cover bg-no-repeat" 
                     style={{ backgroundImage: `url('${assetPath}')` }} />
              </div>
            )
          }
        }
      }
      // Handle video embeds (special syntax: [video](path|thumbnail))
      else if (line.includes('[video]')) {
        flushCurrentSection()
        const match = line.match(/\[video\]\((.*?)\)/)
        if (match) {
          const parts = match[1].split('|')
          const videoPath = resolveAssetPath(parts[0].trim())
          const thumbnailPath = parts[1] ? resolveAssetPath(parts[1].trim()) : undefined
          
          // If thumbnail path doesn't start with http/https, try to resolve it as an asset
          const finalThumbnailPath = thumbnailPath || (parts[1] ? resolveAssetPath(`assets/${parts[1].trim()}`) : undefined)
          

          
          elements.push(
            <div key={`video-${currentIndex++}`} className="px-6 py-4">
              <div className="aspect-[345/194] rounded-[4.5px] overflow-hidden">
                <CustomVideoPlayer 
                  videoUrl={videoPath}
                  thumbnailUrl={finalThumbnailPath}
                  color={accentColor}
                  startPlaying={false}
                />
              </div>
            </div>
          )
        }
      }
      // Regular text lines
      else if (line.length > 0) {
        currentSection.push(line)
      }
      // Empty lines create paragraph breaks
      else if (currentSection.length > 0) {
        currentSection.push('')
      }

      i++
    }

    flushCurrentSection()
    return elements
  }

  return <div className="w-full">{parseMarkdown(content)}</div>
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
    <div className="min-h-screen bg-[rgba(0,0,0,0.92)] text-white">
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
          className="bg-[#000000] py-[100px] lg:py-[190px] px-4 sm:px-8 md:px-16 lg:px-[159px] relative w-full "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-8 md:space-y-16" style={{ maxWidth: '760px' }}>
            {/* Title */}
            <div className="space-y-1 md:space-y-2">
              <h1 className="text-[42px] sm:text-5xl md:text-6xl lg:text-7xl font-space-grotesk font-bold leading-none" style={{ color: accentColor }}>
                {project.title}
              </h1>
              {project.subtitle && (
                <h2 className="text-[34px] sm:text-4xl md:text-5xl lg:text-6xl text-white font-inter font-extralight leading-[1.2] w-[80%]">
                  {project.subtitle}
                </h2>
              )}
            </div>

            {/* Tags and Info */}
            <div className="space-y-4">
              {/* Category Tags */}
              <div className="flex flex-wrap gap-2.5">
                {tags.map((tag, index) => (
                  <div key={index} className="px-2 py-0 rounded-[20px]" style={{ backgroundColor: accentColor, opacity: 0.5 }}>
                    <span className="text-[8px] sm:text-xs md:text-sm text-black font-inter font-bold lowercase leading-[24px]">
                      {tag}
                    </span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p className="text-[14px] sm:text-md text-[rgba(255,255,255,0.92)] font-inter font-normal leading-[24px] md:w-[80%]">
                {project.excerpts}
              </p>

              {/* Date */}
              <p className="text-[10px] sm:text-xs md:text-sm text-[#969696] font-inter font-normal leading-[24px]">
                {formatDate(project.published)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hero Media (Video or Image) */}
        {project.pageVideo ? (
          <motion.div 
            className="w-full aspect-[1298/730.125]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <CustomVideoPlayer 
              videoUrl={project.pageVideo}
              thumbnailUrl={project.image}
              color={accentColor}
              startPlaying={false}
            />
          </motion.div>
        ) : project.image ? (
          <motion.div 
            className="w-full aspect-[1298/730.125] bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('${project.image}')` }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        ) : null}

        {/* Article Content with Enhanced Markdown */}
        {/* <motion.div 
          className="py-[100px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {project.content ? (
            <MarkdownRenderer content={project.content} project={project} accentColor={accentColor} />
          ) : (
            <div className="px-6 py-8">
              <div className="text-gray-300 font-inter font-normal">
                <p>Content is being processed...</p>
              </div>
            </div>
          )}
        </motion.div> */}

        {/* Next Project Section */}
        {/* <motion.div 
          className="bg-[#1f5c85] px-6 py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-[14px] sm:text-lg md:text-xl text-[rgba(255,255,255,0.92)] font-space-grotesk font-bold leading-[24px] mb-8">
            Next Project
          </h3>
          
          <div className="bg-white p-[18px] rounded-[4.5px] max-w-[345px] mx-auto h-[460px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[4.5px]">
              <div className="p-4 h-full flex flex-col justify-between">
                <span className="text-white font-inter font-normal text-[16px] leading-[24px] text-left">
                  Award
                </span>
                <div className="text-left">
                  <h4 className="text-white font-helvetica font-bold text-[19.844px] leading-[24px]">
                    Multiple Projects won an Eyes
                    <br />
                    and Ears Award 2024
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </motion.div> */}
      </article>
    </div>
  )
} 