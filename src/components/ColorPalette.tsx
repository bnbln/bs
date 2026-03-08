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
    rank?: number
  }>
}

type RankedColor = {
  name: string
  hex: string
  rgb?: string
  usage?: string
  rank: number
  index: number
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

  const normalizeHex = (hex: string) => {
    if (!hex) return '#000000'
    if (hex.startsWith('#')) return hex
    return `#${hex}`
  }

  const pickTextColor = (hex: string) => {
    const normalized = normalizeHex(hex).replace('#', '')
    const expanded = normalized.length === 3
      ? normalized.split('').map(ch => ch + ch).join('')
      : normalized
    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return '#F4F7FF'

    const r = parseInt(expanded.slice(0, 2), 16)
    const g = parseInt(expanded.slice(2, 4), 16)
    const b = parseInt(expanded.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.62 ? '#0F172A' : '#F4F7FF'
  }

  const normalizeRank = (rank?: number) => {
    const n = Number(rank)
    if (!Number.isFinite(n)) return 3
    return Math.max(1, Math.min(5, Math.round(n)))
  }

  const rankedColors: RankedColor[] = colors
    .map((color, index) => ({ ...color, rank: normalizeRank(color.rank), index }))
    .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))

  const rank1Colors = rankedColors.filter((c) => c.rank === 1)
  const rank2Colors = rankedColors.filter((c) => c.rank === 2)
  const rank3Colors = rankedColors.filter((c) => c.rank === 3)
  const rank45Colors = rankedColors.filter((c) => c.rank === 4 || c.rank === 5)
  const compactRankColors = rankedColors.filter((c) => c.rank >= 3)
  const topRankOnly = rank3Colors.length === 0 && rank45Colors.length === 0
  const useCenteredTopRankLayout = topRankOnly && rankedColors.length <= 3

  const renderTextTile = (
    color: RankedColor,
    key: string,
    className: string,
    delay: number,
    compact = false
  ) => {
    const tileHex = normalizeHex(color.hex)
    const textColor = pickTextColor(tileHex)
    const usageLabel = (color.usage || '').trim().toUpperCase()

    return (
      <motion.div
        key={key}
        className={`relative rounded-xl md:rounded-2xl overflow-hidden group ring-1 ring-black/15 shadow-[0_8px_22px_rgba(0,0,0,0.16)] transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        style={{ backgroundColor: tileHex, color: textColor }}
      >
        <button
          onClick={() => copyToClipboard(tileHex)}
          className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 text-black rounded-full p-1.5"
          title="Copy HEX"
        >
          {copiedColor === tileHex ? (
            <Check className="w-3.5 h-3.5 text-[#28C840]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <div className={`h-full w-full ${compact ? 'p-3 md:p-3.5' : 'p-3 md:p-4'} flex flex-col justify-between`}>
          <div className="space-y-0.5">
            <p className={`${compact ? 'text-[10px] md:text-[10px]' : 'text-[10px] md:text-[11px]'} tracking-[0.14em] uppercase font-semibold opacity-95 leading-tight`}>
              {color.name}
            </p>
            <p className={`${compact ? 'text-[11px] md:text-[12px]' : 'text-[11px] md:text-[13px]'} font-semibold`}>
              {tileHex.toUpperCase()}
            </p>
            {color.rgb && (
              <p className={`${compact ? 'text-[11px] md:text-[12px]' : 'text-[11px] md:text-[13px]'} font-medium opacity-95`}>
                {color.rgb}
              </p>
            )}
          </div>

          <div className="flex items-end">
            {usageLabel && (
              <span className="text-[10px] md:text-[11px] tracking-[0.12em] uppercase opacity-90">
                {usageLabel}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const renderMobileCompactSquare = (color: RankedColor, key: string, delay: number) => {
    const tileHex = normalizeHex(color.hex)
    const textColor = pickTextColor(tileHex)
    return (
      <motion.button
        key={key}
        type="button"
        onClick={() => copyToClipboard(tileHex)}
        className="relative aspect-square w-full rounded-xl overflow-hidden ring-1 ring-black/10 shadow-[0_4px_14px_rgba(0,0,0,0.14)] text-left"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.45 }}
        style={{ backgroundColor: tileHex }}
        title={`${color.name} ${tileHex}`}
      >
        <span
          className="absolute left-2 bottom-1.5 text-[9px] uppercase tracking-[0.12em] font-semibold"
          style={{ color: textColor, opacity: 0.9 }}
        >
          {color.name}
        </span>
      </motion.button>
    )
  }

  return (
    <section className="palette-block-section w-full">
      {!hideHeader && (title || description) && (
        <div className="palette-block-head">
          {title && <h2 className="palette-block-title">{title}</h2>}
          {description && <p className="palette-block-description">{description}</p>}
        </div>
      )}
      <div className="palette-block-frame">
        <div className="md:hidden flex flex-col gap-2.5">
          {rank1Colors.length > 0 && (
            <div className="grid grid-cols-1 auto-rows-[112px] gap-2.5">
              {rank1Colors.map((color, index) =>
                renderTextTile(
                  color,
                  `mobile-r1-${color.name}-${color.index}`,
                  'col-span-1 row-span-2',
                  index * 0.04
                )
              )}
            </div>
          )}

          {rank2Colors.length > 0 && (
            <div className="grid grid-cols-2 auto-rows-[112px] gap-2.5">
              {rank2Colors.map((color, index) =>
                renderTextTile(
                  color,
                  `mobile-r2-${color.name}-${color.index}`,
                  'col-span-1 row-span-1',
                  (rank1Colors.length + index) * 0.04
                )
              )}
            </div>
          )}

          {compactRankColors.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {compactRankColors.map((color, index) =>
                renderMobileCompactSquare(
                  color,
                  `mobile-r3plus-square-${color.name}-${color.index}`,
                  (rank1Colors.length + rank2Colors.length + index) * 0.04
                )
              )}
            </div>
          )}
        </div>

        <div className={`hidden md:grid ${useCenteredTopRankLayout ? 'grid-cols-2 max-w-[920px] auto-rows-[150px]' : 'grid-cols-12 auto-rows-[118px] lg:auto-rows-[140px] xl:auto-rows-[164px]'} gap-3.5 w-full mx-auto`}>
          {rank1Colors.map((color, index) =>
            renderTextTile(
              color,
              `rank1-${color.name}-${color.index}`,
              useCenteredTopRankLayout ? 'col-span-1 row-span-2' : 'col-span-6 row-span-2',
              index * 0.05
            )
          )}

          {rank2Colors.map((color, index) =>
            renderTextTile(
              color,
              `rank2-${color.name}-${color.index}`,
              useCenteredTopRankLayout
                ? 'col-span-1 row-span-1'
                : `${rank2Colors.length === 1 ? 'col-span-12' : rank2Colors.length === 2 ? 'col-span-6' : 'col-span-4'} row-span-1`,
              (rank1Colors.length + index) * 0.05
            )
          )}

          {rank3Colors.map((color, index) =>
            renderTextTile(
              color,
              `rank3-${color.name}-${color.index}`,
              'col-span-4 row-span-1',
              (rank1Colors.length + rank2Colors.length + index) * 0.05,
              true
            )
          )}

          {rank45Colors.map((color, index) => {
            const tileHex = normalizeHex(color.hex)
            const textColor = pickTextColor(tileHex)
            const showName = color.rank === 4
            const squareHeight = color.rank === 5 ? 'h-[68%]' : 'h-full'
            return (
              <motion.div
                key={`rank45-${color.name}-${color.index}`}
                className="col-span-2 row-span-1"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (rank1Colors.length + rank2Colors.length + rank3Colors.length + index) * 0.05, duration: 0.5 }}
                title={`${color.name} ${tileHex}`}
              >
                <div
                  className={`relative ${squareHeight} aspect-square rounded-xl ring-1 ring-black/10 shadow-[0_4px_14px_rgba(0,0,0,0.14)] overflow-hidden`}
                  style={{ backgroundColor: tileHex }}
                >
                  {showName && (
                    <span
                      className="absolute left-2.5 bottom-2 text-[10px] uppercase tracking-[0.12em] font-semibold"
                      style={{ color: textColor, opacity: 0.9 }}
                    >
                      {color.name}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ColorPalette
