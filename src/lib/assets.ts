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
  if (!assetPath) return assetPath

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
export function resolveProjectAssets<T extends {
  image?: string;
  video?: string;
  pageVideo?: string;
  heroImage?: string;
  heroLottie?: string;
  animationSequence?: {
    basePath?: string;
    spritesheetPath?: string;
    mobileSpritesheetPath?: string;
    safariSpritesheetPath?: string;
    spriteCount?: number;
    columnCount?: number;
    rowCount?: number;
    scrollPixelsPerFrame?: number;
    scrollStartOffsetPx?: number;
    videoPath?: string;
    mobileVideoPath?: string;
    safariVideoPath?: string;
    startFrame?: number;
    endFrame?: number;
    frameCount?: number;
  }
}>(project: T): T {
  const resolved = { ...project }

  // Resolve main image path
  if (resolved.image) {
    resolved.image = resolveAssetPath(resolved.image)
  }

  // Resolve optional distinct hero image
  if (resolved.heroImage) {
    resolved.heroImage = resolveAssetPath(resolved.heroImage)
  }

  // Resolve optional hero Lottie animation
  if (resolved.heroLottie) {
    resolved.heroLottie = resolveAssetPath(resolved.heroLottie)
  }

  // Resolve video path (existing background video)
  if (resolved.video) {
    resolved.video = resolveAssetPath(resolved.video)
  }

  // Resolve page video path
  if (resolved.pageVideo) {
    resolved.pageVideo = resolveAssetPath(resolved.pageVideo)
  }

  // Resolve animation sequence paths
  if (resolved.animationSequence) {
    const animation = { ...resolved.animationSequence }

    // Resolve legacy image sequence base path
    if (animation.basePath) {
      animation.basePath = resolveAssetPath(animation.basePath)
    }

    // Resolve new video sequence path
    if (animation.videoPath) {
      animation.videoPath = resolveAssetPath(animation.videoPath)
    }

    // Resolve spritesheet sequence path
    if (animation.spritesheetPath) {
      animation.spritesheetPath = resolveAssetPath(animation.spritesheetPath)
    }

    // Resolve optional mobile-optimized spritesheet path
    if (animation.mobileSpritesheetPath) {
      animation.mobileSpritesheetPath = resolveAssetPath(animation.mobileSpritesheetPath)
    }

    // Resolve optional Safari-optimized spritesheet path
    if (animation.safariSpritesheetPath) {
      animation.safariSpritesheetPath = resolveAssetPath(animation.safariSpritesheetPath)
    }

    // Resolve optional mobile-optimized scrub video path
    if (animation.mobileVideoPath) {
      animation.mobileVideoPath = resolveAssetPath(animation.mobileVideoPath)
    }

    // Resolve optional Safari-optimized scrub video path
    if (animation.safariVideoPath) {
      animation.safariVideoPath = resolveAssetPath(animation.safariVideoPath)
    }

    resolved.animationSequence = animation
  }

  return resolved
}
