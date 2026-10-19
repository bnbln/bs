// Helpers for routing plain <img> tags and CSS background images through the
// Next.js image optimizer (/_next/image), for places where <Image> doesn't fit.

// Must match the widths Next.js accepts (default deviceSizes + imageSizes).
const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
const DEFAULT_SRCSET_WIDTHS = [640, 1080, 1920, 2048, 3840]

// Keep in sync with images.remotePatterns in next.config.js.
const REMOTE_HOST_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i
const RASTER_PATTERN = /\.(jpe?g|png|webp|avif)$/i

export function isOptimizableImage(src?: string | null): src is string {
  if (!src) return false
  const path = src.split(/[?#]/)[0]
  if (!RASTER_PATTERN.test(path)) return false
  return src.startsWith('/') || REMOTE_HOST_PATTERN.test(src)
}

function nearestAllowedWidth(width: number) {
  return ALLOWED_WIDTHS.find((w) => w >= width) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1]
}

// Returns the optimized URL, or the original src for SVGs, GIFs, videos and unknown hosts.
export function getOptimizedImageUrl(src: string, width = 1920, quality = 75): string {
  if (!isOptimizableImage(src)) return src
  // Trailing slash matches `trailingSlash: true` in next.config.js (avoids a 308 redirect).
  return `/_next/image/?url=${encodeURIComponent(src)}&w=${nearestAllowedWidth(width)}&q=${quality}`
}

// Props for a responsive plain <img>: optimized src plus a width-based srcSet.
export function getOptimizedImageProps(src: string, sizes = '100vw', widths = DEFAULT_SRCSET_WIDTHS) {
  if (!isOptimizableImage(src)) return { src }
  return {
    src: getOptimizedImageUrl(src, 1920),
    srcSet: widths.map((w) => `${getOptimizedImageUrl(src, w)} ${nearestAllowedWidth(w)}w`).join(', '),
    sizes,
  }
}
