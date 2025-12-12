import { motion } from 'framer-motion'
import { Copy, Check, ExternalLink } from 'lucide-react'
import React, { useState } from 'react'

interface CodeBlockProps {
  title?: string
  description?: string
  hideHeader?: boolean
  code: string
  language?: string
  filename?: string
  githubUrl?: string
  liveUrl?: string
}

// Escape raw code
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  title,
  description,
  hideHeader = false,
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
    let highlighted = escapeHtml(raw)

    const splitSpanRegex = /(<span[^>]*>[\s\S]*?<\/span>)/g
    const replaceOutsideSpans = (input: string, pattern: RegExp, replacer: string | ((...args: any[]) => string)) => {
      return input
        .split(splitSpanRegex)
        .map((seg, i) => (i % 2 === 0 ? seg.replace(pattern, replacer as any) : seg))
        .join('')
    }

    // Light Theme Highlighting logic
    if (/(tsx|jsx|ts|js|typescript|javascript)/i.test(lang)) {
      // Strings (Green -> Forest Green)
      highlighted = replaceOutsideSpans(highlighted, /'(.*?)'/g, "<span class='text-[#2E7D32]'>'$1'<\/span>")
      highlighted = replaceOutsideSpans(highlighted, /"(.*?)"/g, '<span class="text-[#2E7D32]">"$1"<\/span>')
      highlighted = replaceOutsideSpans(highlighted, /`([^`]*?)`/g, '<span class="text-[#2E7D32]">`$1`<\/span>')

      // Comments (Gray -> Neutral Gray)
      highlighted = replaceOutsideSpans(highlighted, /\/\/.*$/gm, '<span class="text-[#86868b] italic">$&<\/span>')

      // Booleans / nullish (Orange -> Burnt Orange)
      highlighted = replaceOutsideSpans(highlighted, /\b(true|false|null|undefined)\b/g, '<span class="text-[#D32F2F]">$1<\/span>')

      // Keywords (Purple -> Purple/Blue)
      highlighted = replaceOutsideSpans(
        highlighted,
        /\b(const|let|var|function|return|import|export|from|if|else|for|while|async|await|try|catch|throw|new)\b/g,
        '<span class="text-[#7B1FA2]">$1<\/span>'
      )

      // Numbers (Amber -> Blue)
      highlighted = replaceOutsideSpans(highlighted, /\b(\d+(?:\.(?:\d+)?)?)\b/g, '<span class="text-[#1565C0]">$1<\/span>')

      // JSX/TSX tags
      highlighted = replaceOutsideSpans(
        highlighted,
        /(&lt;\/?)([A-Za-z][\w.:-]*)/g,
        '<span class="text-[#1D1D1F]">$1<\/span><span class="text-[#0277BD]">$2<\/span>'
      )

      // JSX props
      highlighted = replaceOutsideSpans(
        highlighted,
        /(\s)([A-Za-z_:][\w:.-]*)(=)/g,
        '$1<span class="text-[#00838F]">$2<\/span>$3'
      )

      // Punctuation
      highlighted = replaceOutsideSpans(highlighted, /([{}()[\],.])/g, '<span class="text-[#86868b]">$1<\/span>')
    }
    return highlighted
  }

  return (
    <section className="code-block-section w-full">
      {!hideHeader && (title || description) && (
        <div className="code-block-head mb-4">
          {title && <h2 className="code-block-title">{title}</h2>}
          {description && <p className="code-block-description">{description}</p>}
        </div>
      )}
      <div className="code-block-frame">
        <motion.div
          className="bg-[#FAFAFA] rounded-xl overflow-hidden shadow-sm border border-black/5"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#F5F5F7] px-4 py-3 border-b border-black/5">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] border border-black/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] border border-black/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C840] border border-black/10" />
              </div>
              {filename && <span className="text-[#86868b] text-xs font-mono font-medium">{filename}</span>}
            </div>
            <div className="flex items-center gap-2">
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#86868b] hover:text-[#1D1D1F] transition-colors p-1.5 rounded hover:bg-black/5">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button 
                onClick={copyToClipboard} 
                className="text-[#86868b] hover:text-[#1D1D1F] transition-colors p-1.5 rounded hover:bg-black/5"
              >
                {copied ? <Check className="w-4 h-4 text-[#28C840]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Code Area */}
          <div className="p-5 md:p-6 overflow-x-auto bg-[#FAFAFA]">
            <pre className="text-[13px] md:text-[14px] leading-[1.6] font-mono font-normal text-[#1D1D1F] whitespace-pre tab-[2]">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CodeBlock
