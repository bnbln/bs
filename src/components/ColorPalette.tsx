import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import React, { useState } from 'react'

interface ColorPaletteProps {
  title?: string
  description?: string
  colors: Array<{
    name: string
    hex: string
    rgb?: string
    usage?: string
  }>
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ title, description, colors }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedColor(color)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (_) { /* ignore */ }
  }

  return (
    <section className="palette-block-section">
      {(title || description) && (
        <div className="palette-block-head">
          {title && <h2 className="text-2xl md:text-3xl font-bold mb-4 font-space-grotesk">{title}</h2>}
          {description && (
            <p className="text-[rgba(255,255,255,0.75)] text-sm md:text-base max-w-2xl font-inter">{description}</p>
          )}
        </div>
      )}
      <div className="palette-block-frame mt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colors.map((color, index) => (
            <motion.div
              key={color.name + index}
              className="bg-[#111318] border border-[#262a33] rounded-lg overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <div
                className="h-32 relative cursor-pointer group"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-center justify-center">
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-sm rounded-full p-2"
                    whileHover={{ scale: 1.08 }}
                  >
                    {copiedColor === color.hex ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Copy className="w-5 h-5 text-white" />
                    )}
                  </motion.div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2 font-inter text-sm md:text-base">{color.name}</h3>
                <div className="space-y-1 text-[11px] md:text-xs text-[rgba(255,255,255,0.65)] font-mono">
                  <p>{color.hex}</p>
                  {color.rgb && <p>{color.rgb}</p>}
                  {color.usage && <p className="italic font-inter not-italic text-[10px] md:text-[11px] text-[rgba(255,255,255,0.55)]">{color.usage}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ColorPalette
