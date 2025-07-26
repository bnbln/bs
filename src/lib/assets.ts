/**
 * Asset path utilities for Next.js deployment flexibility
 */

// Get the base path from Next.js config (useful for subdirectory deployments)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

/**
 * Converts a relative asset path to an absolute path that works in any deployment scenario
 * @param assetPath - Relative path like "assets/book.avif" or "book-webp/book_0001.webp"
 * @returns Absolute path like "/assets/book.avif" or "/subdirectory/assets/book.avif"
 */
export function resolveAssetPath(assetPath: string): string {
  // If already absolute, return as-is
  if (assetPath.startsWith('/') || assetPath.startsWith('http')) {
    return assetPath
  }
  
  // Convert relative path to absolute with base path
  return `${basePath}/${assetPath}`
}

/**
 * Processes a project object to ensure all asset paths are absolute
 * @param project - Project object from markdown
 * @returns Project with resolved asset paths
 */
export function resolveProjectAssets<T extends { image?: string; video?: string; animationSequence?: { basePath: string } }>(project: T): T {
  const resolved = { ...project }
  
  // Resolve main image path
  if (resolved.image) {
    resolved.image = resolveAssetPath(resolved.image)
  }
  
  // Resolve video path
  if (resolved.video) {
    resolved.video = resolveAssetPath(resolved.video)
  }
  
  // Resolve animation sequence base path
  if (resolved.animationSequence?.basePath) {
    resolved.animationSequence = {
      ...resolved.animationSequence,
      basePath: resolveAssetPath(resolved.animationSequence.basePath)
    }
  }
  
  return resolved
} 