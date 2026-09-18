export interface PaletteStep { label: string; hex: string }
export interface PaletteColor {
  name: string
  hex: string
  rgb?: string
  usage?: string
  rank?: number
  steps?: PaletteStep[]
}

export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '')
  if (/^[\da-f]{3}$/i.test(hex)) return `#${hex.split('').map(char => char + char).join('').toUpperCase()}`
  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null
}

export function hexToRgb(hex: string): number[] {
  const value = normalizeHex(hex)
  if (!value) throw new Error(`Invalid color: ${hex}`)
  return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16))
}

export function luminance(hex: string): number {
  const channels = hexToRgb(hex).map(channel => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first), b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function readableText(hex: string): '#000000' | '#FFFFFF' {
  return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#FFFFFF') ? '#000000' : '#FFFFFF'
}

// Illustrative tints and shades, not a project's authored design tokens.
export function deriveScale(hex: string): PaletteStep[] {
  const base = hexToRgb(hex)
  return [0.9, 0.7, 0.5, 0.25, 0, -0.2, -0.4, -0.6, -0.8].map((amount, index) => ({
    label: String((index + 1) * 100),
    hex: `#${base.map(channel => Math.round(amount >= 0
      ? channel + (255 - channel) * amount
      : channel * (1 + amount)).toString(16).padStart(2, '0')).join('').toUpperCase()}`,
  }))
}

/** Optional fence attribute: steps="100:#EEF4FF,500:#2563EB,900:#172554" */
export function parsePaletteSteps(value?: string): PaletteStep[] | undefined {
  if (!value) return undefined
  const steps = value.split(',').flatMap(entry => {
    const [label, rawHex] = entry.split(':').map(part => part.trim())
    const hex = rawHex ? normalizeHex(rawHex) : null
    return label && hex ? [{ label, hex }] : []
  })
  return steps.length ? steps : undefined
}
