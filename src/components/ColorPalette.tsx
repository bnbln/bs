import { Check, ChevronDown, Copy } from 'lucide-react'
import React, { useEffect, useId, useRef, useState } from 'react'
import {
  contrastRatio, deriveScale, hexToRgb, normalizeHex, readableText,
  type PaletteColor,
} from '../lib/color-palette'

interface ColorPaletteProps {
  title?: string
  description?: string
  hideHeader?: boolean
  scales?: boolean
  colors: PaletteColor[]
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ title, description, hideHeader = false, scales = false, colors }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paletteId = useId()

  useEffect(() => setExpanded({}), [scales])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copyColor = async (hex: string, name: string, key: string) => {
    if (timer.current) clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(key)
      setMessage(`${name}: ${hex} copied.`)
      timer.current = setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
      setMessage(`Could not copy. Select the HEX value ${hex} manually.`)
    }
  }

  const palette = colors.flatMap((color, index) => {
    const hex = normalizeHex(color.hex)
    if (!hex) return []
    const rank = Number.isFinite(color.rank) ? Math.max(1, Math.min(5, color.rank!)) : 3
    const steps = color.steps?.flatMap(step => {
      const stepHex = normalizeHex(step.hex)
      return stepHex ? [{ ...step, hex: stepHex }] : []
    })
    return [{ ...color, hex, rank, index, steps }]
  }).sort((a, b) => a.rank - b.rank || a.index - b.index)

  if (!palette.length) return null

  const focusStyle = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black'

  return (
    <section className="palette-block-section w-full" aria-label={title || 'Color palette'}>
      {!hideHeader && (title || description) && (
        <div className="palette-block-head">
          {title && <h2 className="palette-block-title">{title}</h2>}
          {description && <p className="palette-block-description">{description}</p>}
        </div>
      )}
      <div className="palette-block-frame !max-w-none font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {palette.map(color => {
            const key = `base-${color.index}`
            const open = expanded[color.index] ?? scales
            const authored = Boolean(color.steps?.length)
            const steps = authored ? color.steps! : deriveScale(color.hex)
            const panelId = `${paletteId}-${color.index}`
            return (
              <div key={key} className="min-w-0 rounded-2xl border border-black/10 overflow-hidden bg-[#FAFAFA]">
                <button
                  type="button"
                  onClick={() => copyColor(color.hex, color.name, key)}
                  aria-label={`Copy ${color.name}, ${color.hex}`}
                  className={`group w-full h-36 md:h-40 p-5 flex flex-col items-start justify-between text-left ${focusStyle}`}
                  style={{ backgroundColor: color.hex, color: readableText(color.hex) }}
                >
                  <span className="text-4xl font-space-grotesk tracking-tight" aria-hidden="true">Aa</span>
                  <span className="flex w-full items-center justify-between font-mono text-xs">
                    {color.hex}
                    {copied === key ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  </span>
                </button>
                <div className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-medium text-sm text-neutral-900 break-words">{color.name}</p>
                    {color.usage && <p className="text-xs text-neutral-600">{color.usage}</p>}
                  </div>
                  <p className="mt-1 text-[11px] font-mono text-neutral-600">RGB {hexToRgb(color.hex).join(', ')}</p>
                  <button
                    type="button"
                    aria-label={`${open ? 'Hide' : 'Show'} tonal scale for ${color.name}`}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setExpanded(current => ({ ...current, [color.index]: !open }))}
                    className={`mt-3 w-full flex items-center justify-between border-t border-black/10 pt-3 pb-1 min-h-[44px] text-xs text-neutral-700 ${focusStyle}`}
                  >
                    <span>Tonal scale <span className="ml-1 text-neutral-500">{authored ? '· Defined' : '· Preview'}</span></span>
                    <ChevronDown size={15} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <div id={panelId} hidden={!open} className="pt-3">
                    {!authored && <p className="sr-only">Derived preview, not documented project tokens.</p>}
                    <div className="grid grid-cols-3 gap-x-2 gap-y-3">
                      {steps.map((step, index) => {
                        const stepKey = `step-${color.index}-${index}`
                        const isBase = step.hex === color.hex
                        return (
                          <div key={stepKey} className="min-w-0">
                            <button
                              type="button"
                              onClick={() => copyColor(step.hex, `${color.name} ${step.label}`, stepKey)}
                              aria-label={`Copy ${color.name} ${step.label}, ${step.hex}${isBase ? ', base color' : ''}`}
                              title={`${step.label}: ${step.hex}${isBase ? ' · Base' : ''}`}
                              className={`w-full h-12 rounded-lg border border-black/10 px-2 flex items-center justify-between text-left ${focusStyle}`}
                              style={{ backgroundColor: step.hex, color: readableText(step.hex) }}
                            >
                              <span className="text-[11px] font-mono">{step.label}</span>
                              {copied === stepKey ? <Check size={12} aria-hidden="true" /> : isBase ? <span className="text-[9px] font-medium">Base</span> : null}
                            </button>
                            <p className="mt-1 text-[10px] font-mono text-neutral-600 select-all">{step.hex}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-[#FAFAFA] p-5 sm:p-6">
            <h3 className="text-base font-medium text-neutral-900">Text on base colors</h3>
            <p className="mt-2 mb-4 text-sm leading-relaxed text-neutral-600">Contrast for black and white text. AA for normal text requires at least 4.5:1.</p>
            <div className="divide-y divide-black/10">
              {palette.map(color => (
                <div key={`contrast-${color.index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-3 text-sm">
                  <span className="font-medium text-neutral-900">{color.name}</span>
                  {['#000000', '#FFFFFF'].map(text => {
                    const ratio = contrastRatio(color.hex, text)
                    return <span key={text} className="text-neutral-600">{text === '#000000' ? 'Black' : 'White'} · {ratio.toFixed(2)}:1 · {ratio >= 4.5 ? 'AA' : 'Below AA'}</span>
                  })}
                </div>
              ))}
            </div>
          </div>
        <p role="status" aria-live="polite" className="sr-only">{message}</p>
      </div>
    </section>
  )
}

export default ColorPalette
