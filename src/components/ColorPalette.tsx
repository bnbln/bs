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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {colors.map((color, index) => (
            <motion.div
              key={color.name + index}
              className="flex flex-col bg-neutral-50 rounded-2xl md:rounded-3xl overflow-hidden hover:bg-neutral-100 transition-colors duration-500 group"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <div
                className="aspect-video w-full relative cursor-pointer"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyToClipboard(color.hex)}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur rounded-full p-2 md:p-3 shadow-sm transform scale-75 md:scale-100"
                    whileHover={{ scale: 1.1 }}
                  >
                    {copiedColor === color.hex ? (
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-[#28C840]" />
                    ) : (
                      <Copy className="w-5 h-5 md:w-6 md:h-6 text-black" />
                    )}
                  </motion.div>
                </div>
              </div>
              <div className="p-4 md:p-8 flex flex-col gap-1.5 md:gap-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-0">
                     <h3 className="font-space-grotesk font-bold text-[16px] md:text-[24px] leading-[1.1] text-neutral-900 break-words">
                        {color.name}
                     </h3>
                     {color.usage && (
                        <span className="shrink-0 text-[9px] md:text-[11px] uppercase tracking-widest font-bold text-neutral-400 md:mt-1.5">
                            {color.usage}
                        </span>
                     )}
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] md:text-[18px] leading-tight font-medium text-neutral-500 group-hover:text-black transition-colors duration-300">
                        {color.hex}
                    </span>
                    {color.rgb && (
                        <span className="text-[11px] md:text-[14px] font-medium text-neutral-400 font-mono">
                            {color.rgb.replace('rgb(', '').replace(')', '')}
                        </span>
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
