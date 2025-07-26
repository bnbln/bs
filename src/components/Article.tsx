import React from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import arrowSvg from '../assets/arrow.svg'
import euWahl from '../assets/EU_wahl.jpg'
import euWahlVideo from '../assets/Eu Wahl Loop.mp4'
import zeitreise from '../assets/Zeitreise.jpg'
import book from '../assets/book.avif'

// Placeholder data structure matching your old Contentful setup
interface ArticleData {
  id: number
  title: string
  slug: string
  excerpts: string
  published: string
  description: string
  color: string
  image: string
  video?: string
  content: {
    type: 'paragraph' | 'heading' | 'image' | 'video'
    content: string
    level?: number // for headings
    src?: string // for images/videos
    alt?: string // for images
  }[]
}

// Default article content for your 3 projects
const articleData: Record<string, ArticleData> = {
  'eu-election-trailer': {
    id: 1,
    title: 'Trailer for EU election campaign',
    slug: 'eu-election-trailer',
    excerpts: 'A compelling visual narrative designed to engage voters and communicate the importance of European democracy through motion graphics and storytelling.',
    published: 'March 15, 2024',
    description: 'Motion Graphics',
    color: '#3B82F6',
    image: euWahl,
    video: euWahlVideo,
    content: [
      {
        type: 'paragraph',
        content: 'The European Union election campaign required a fresh, dynamic approach to reach younger demographics while maintaining the gravitas expected of political communication.'
      },
      {
        type: 'heading',
        content: 'Creative Challenge',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Our primary challenge was to distill complex political concepts into compelling visual narratives that would resonate across diverse European audiences. The trailer needed to inspire civic engagement while remaining politically neutral and accessible.'
      },
      {
        type: 'image',
        src: euWahl,
        alt: 'EU Election Campaign Visual',
        content: ''
      },
      {
        type: 'heading',
        content: 'Design Process',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'We began with extensive research into European visual culture and democratic symbolism. The motion graphics system we developed uses flowing geometric patterns that represent the interconnectedness of European nations while maintaining individual identity.'
      },
      {
        type: 'paragraph',
        content: 'The color palette draws from the European flag while expanding into warmer, more approachable tones. Typography choices reflect both tradition and modernity, using clean sans-serif fonts with subtle European character variations.'
      },
      {
        type: 'heading',
        content: 'Technical Execution',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Created using After Effects and Cinema 4D, the trailer combines 2D motion graphics with subtle 3D elements. The animation system is modular, allowing for easy adaptation across different European markets and languages.'
      },
      {
        type: 'paragraph',
        content: 'The final piece successfully launched across 12 European countries, adapted for local audiences while maintaining brand consistency and visual impact.'
      }
    ]
  },
  'history-documentary-design': {
    id: 2,
    title: 'Show Design for History Documentary Series',
    slug: 'history-documentary-design',
    excerpts: 'Comprehensive visual identity and motion graphics package for a historical documentary series, blending archival aesthetics with contemporary design principles.',
    published: 'January 22, 2024',
    description: 'Broadcast Design',
    color: '#8B5A3C',
    image: zeitreise,
    content: [
      {
        type: 'paragraph',
        content: 'The "Zeitreise" documentary series required a sophisticated visual identity that could bridge historical periods while maintaining contemporary broadcast standards.'
      },
      {
        type: 'heading',
        content: 'Visual Identity Development',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Our approach centered on creating a visual language that honors historical authenticity while ensuring accessibility for modern audiences. The design system incorporates period-appropriate typography and color palettes that evolve throughout each episode.'
      },
      {
        type: 'image',
        src: zeitreise,
        alt: 'Zeitreise Documentary Series Design',
        content: ''
      },
      {
        type: 'heading',
        content: 'Motion Graphics System',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'The motion graphics package includes animated maps, timeline visualizations, and document recreations. Each element is designed to enhance storytelling without overwhelming the historical content.'
      },
      {
        type: 'paragraph',
        content: 'We developed a modular system allowing historians and editors to easily incorporate new visual elements while maintaining design consistency across all episodes.'
      },
      {
        type: 'heading',
        content: 'Archival Integration',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Working closely with historical archives, we created seamless transitions between contemporary graphics and historical footage. Our restoration and enhancement techniques bring century-old materials into sharp focus for modern viewers.'
      },
      {
        type: 'paragraph',
        content: 'The series has been praised for its respectful yet engaging presentation of historical material, successfully attracting both academic and general audiences.'
      }
    ]
  },
  'book-3d-animation': {
    id: 3,
    title: 'Book 3D-Modeling & Animation for TV Spot',
    slug: 'book-3d-animation',
    excerpts: 'Photorealistic 3D book modeling and animation sequence for television commercial, featuring detailed texturing and dynamic page-turning effects.',
    published: 'February 8, 2024',
    description: '3D Animation',
    color: '#10B981',
    image: book,
    content: [
      {
        type: 'paragraph',
        content: 'This television commercial required a hero shot of a book that could seamlessly integrate with live-action footage while showcasing intricate details impossible to capture practically.'
      },
      {
        type: 'heading',
        content: '3D Modeling Process',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'The modeling process began with detailed photography of physical books to ensure accurate proportions and surface details. Every aspect from spine stitching to paper texture was meticulously recreated in 3D space.'
      },
      {
        type: 'image',
        src: book,
        alt: 'Book 3D Model Rendering',
        content: ''
      },
      {
        type: 'heading',
        content: 'Animation Challenges',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'The most complex aspect was creating realistic page-turning animation. We developed a custom rigging system that accurately simulates paper physics, including subtle bend deformation and edge curling.'
      },
      {
        type: 'paragraph',
        content: 'Lighting required particular attention to showcase the paper texture while maintaining the magical, aspirational quality needed for the commercial narrative.'
      },
      {
        type: 'heading',
        content: 'Technical Innovation',
        level: 2
      },
      {
        type: 'paragraph',
        content: 'Using Cinema 4D and Octane Render, we achieved photorealistic results that seamlessly integrated with practical footage. The animation sequence features over 350 individual frames, each carefully crafted to maintain lighting consistency.'
      },
      {
        type: 'paragraph',
        content: 'The final sequence became a key visual element in the commercial, demonstrating the power of combining traditional craftsmanship with cutting-edge 3D technology.'
      }
    ]
  }
}

const formatDate = (inputDate: string): string => {
  const date = new Date(inputDate)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const article = slug ? articleData[slug] : null

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const formattedDate = formatDate(article.published)

  const renderContent = (item: ArticleData['content'][0], index: number) => {
    switch (item.type) {
      case 'heading': {
        const level = item.level || 2
        const className = `font-bold mb-4 ${
          level === 1 ? 'text-3xl' : 
          level === 2 ? 'text-2xl' : 
          'text-xl'
        }`
        
        if (level === 1) {
          return <h1 key={index} className={className}>{item.content}</h1>
        } else if (level === 2) {
          return <h2 key={index} className={className}>{item.content}</h2>
        } else {
          return <h3 key={index} className={className}>{item.content}</h3>
        }
      }
      
      case 'paragraph':
        return (
          <p key={index} className="mb-6 text-lg leading-relaxed text-gray-700">
            {item.content}
          </p>
        )
      
      case 'image':
        return (
          <div key={index} className="my-8">
            <img
              src={item.src}
              alt={item.alt || ''}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )
      
      case 'video':
        return (
          <div key={index} className="my-8">
            <video
              src={item.src}
              controls
              autoPlay={false}
              loop
              muted
              playsInline
              className="w-full h-auto rounded-lg shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 z-50 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <img 
          src={arrowSvg} 
          alt="Back to work" 
          className="w-4 h-4 rotate-180" 
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </motion.button>

      {/* Header Section */}
      <motion.div
        className="relative w-full h-[70vh] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background */}
        {article.video ? (
          <video
            src={article.video}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={article.image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay Content */}
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <div className="w-full max-w-4xl mx-auto px-8 pb-16">
            <motion.div
              className="text-white"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-lg font-medium mb-2" style={{ color: article.color }}>
                {article.description}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {article.title}
              </h1>
              <p className="text-xl text-gray-200 mb-4 max-w-2xl">
                {article.excerpts}
              </p>
              <p className="text-sm text-gray-300">
                {formattedDate}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content Section */}
      <motion.div
        className="max-w-4xl mx-auto px-8 py-16"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="prose prose-lg max-w-none">
          {article.content.map((item, index) => renderContent(item, index))}
        </div>
      </motion.div>

      {/* Footer Navigation */}
      <motion.div
        className="bg-gray-50 py-16"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h3 className="text-2xl font-bold mb-8">Explore More Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(articleData)
              .filter(item => item.slug !== article.slug)
              .map((project) => (
                <motion.div
                  key={project.id}
                  className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate(`/project/${project.slug}`)}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <p className="text-sm font-medium mb-2" style={{ color: project.color }}>
                      {project.description}
                    </p>
                    <h4 className="font-bold text-lg mb-2">{project.title}</h4>
                    <p className="text-gray-600 text-sm">{project.excerpts}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Article 