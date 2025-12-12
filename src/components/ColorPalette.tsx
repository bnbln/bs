import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import React, { useState } from 'react'

interface ColorPaletteProps {
  title?: string
  description?: string
  hideHeader?: boolean
  colors: Array<{
    name: string
    hex: string
    rgb?: string
    usage?: string
  }>
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ title, description, hideHeader = false, colors }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedColor(color)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (_) { /* ignore */ }
  }

  return (
    <section className="palette-block-section w-full">
      {!hideHeader && (title || description) && (
        <div className="palette-block-head">
          {title && <h2 className="palette-block-title">{title}</h2>}
          {description && (
            <p className="palette-block-description">{description}</p>
          )}
        </div>
      )}
      <div className="palette-block-frame">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {colors.map((color, index) => (
            <motion.div
              key={color.name + index}
              className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <div
                className="h-32 relative cursor-pointer"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-sm"
                    whileHover={{ scale: 1.1 }}
                  >
                    {copiedColor === color.hex ? (
                      <Check className="w-5 h-5 text-[#28C840]" />
                    ) : (
                      <Copy className="w-5 h-5 text-black" />
                    )}
                  </motion.div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold font-space-grotesk text-[#1D1D1F] text-lg">{color.name}</h3>
                    {color.usage && (
                        <span className="text-[10px] uppercase tracking-wide font-bold text-[#86868b] bg-[#F5F5F7] px-1.5 py-0.5 rounded">
                            {color.usage}
                        </span>
                    )}
                </div>
                <div className="space-y-0.5 text-[13px] font-mono text-[#86868b]">
                  <div className="flex justify-between">
                    <span>HEX</span>
                    <span className="text-[#1D1D1F]">{color.hex}</span>
                  </div>
                  {color.rgb && (
                    <div className="flex justify-between">
                      <span>RGB</span>
                      <span className="text-[#1D1D1F]">{color.rgb.replace('rgb(', '').replace(')', '')}</span>
                    </div>
                  )}
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
