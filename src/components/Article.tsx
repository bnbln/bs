import React from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Project } from '../lib/markdown'

interface ArticleProps {
  project: Project
}

export default function Article({ project }: ArticleProps) {
  const router = useRouter()

  if (!project) {
    return (
      <div className="min-h-screen bg-[#1C1D20] text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1D20] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1C1D20]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="text-white hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 pt-24 pb-12">
        <motion.header 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {project.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-8">
            <span className="px-3 py-1 bg-gray-800 rounded-full">
              {project.category}
            </span>
            <span>{project.published}</span>
          </div>

          <div className="text-lg text-gray-300 max-w-2xl">
            {project.excerpts}
          </div>
        </motion.header>

        {/* Featured Image */}
        {project.image && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img 
              src={project.image} 
              alt={project.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </motion.div>
        )}

        {/* Animation Sequence (if available) */}
        {project.hasAnimation && project.animationSequence && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Interactive Animation</h3>
              <p className="text-gray-400 mb-4">
                Frame sequence: {project.animationSequence.startFrame} - {project.animationSequence.endFrame}
              </p>
              <div className="bg-gray-800 p-4 rounded text-center text-gray-400">
                Animation sequence component would be rendered here
                <br />
                <small>{project.animationSequence.basePath}</small>
              </div>
            </div>
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div 
          className="prose prose-invert prose-lg max-w-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {project.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
          ) : (
            <div className="text-gray-300">
              <p>Content is being processed...</p>
            </div>
          )}
        </motion.div>

        {/* Back to Home Button */}
        <motion.div 
          className="mt-16 pt-8 border-t border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Portfolio
          </button>
        </motion.div>
      </article>
    </div>
  )
} 