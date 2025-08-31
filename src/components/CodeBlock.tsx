import { motion } from 'framer-motion'
import { Copy, Check, ExternalLink } from 'lucide-react'
import React, { useState } from 'react'

interface CodeBlockProps {
  title?: string
  description?: string
  code: string
  language?: string
  filename?: string
  githubUrl?: string
  liveUrl?: string
}

// Lightweight code block styled similarly to motion-meets-code project
const CodeBlock: React.FC<CodeBlockProps> = ({
  title,
  description,
  code,
  language = 'text',
  filename,
  githubUrl,
  liveUrl
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (e) {
      // ignore
    }
  }

  const highlightCode = (raw: string, lang: string) => {
    let highlighted = raw
    if (/(ts|js|typescript|javascript)/.test(lang)) {
      highlighted = highlighted
        .replace(/\b(const|let|var|function|return|import|export|from|if|else|for|while|async|await|try|catch|throw|new)\b/g, '<span class="text-purple-400">$1<\/span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-orange-400">$1<\/span>')
        .replace(/'(.*?)'/g, "<span class='text-green-400'>'$1'<\/span>")
        .replace(/"(.*?)"/g, '<span class="text-green-400">"$1"<\/span>')
        .replace(/`([^`]*?)`/g, '<span class="text-green-400">`$1`<\/span>')
        .replace(/\/\/.*$/gm, '<span class="text-gray-500">$&<\/span>')
    }
    return highlighted
  }

  return (
    <section className="py-12">
      {(title || description) && (
        <div className="mb-8">
          {title && <h2 className="text-2xl md:text-3xl font-bold mb-3 font-space-grotesk">{title}</h2>}
          {description && <p className="text-[rgba(255,255,255,0.75)] text-sm md:text-base max-w-2xl font-inter">{description}</p>}
        </div>
      )}

      <motion.div
        className="bg-[#111318] rounded-[8px] overflow-hidden border border-[#262a33] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between bg-[#1b1f27] px-4 py-3 border-b border-[#262a33]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            {filename && <span className="text-gray-400 text-xs font-mono">{filename}</span>}
            {language && <span className="text-gray-500 text-[10px] uppercase tracking-wide">{language}</span>}
          </div>
          <div className="flex items-center gap-2">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-[#262a33]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white bg-[#262a33] hover:bg-[#323744] text-[10px] px-2 py-1 rounded transition-colors">Live</a>
            )}
            <button onClick={copyToClipboard} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-[#262a33]">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="p-4 md:p-6 overflow-x-auto">
          <pre className="text-[11px] md:text-sm leading-relaxed font-mono text-[rgba(255,255,255,0.85)]"><code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} /></pre>
        </div>
      </motion.div>
    </section>
  )
}

export default CodeBlock
