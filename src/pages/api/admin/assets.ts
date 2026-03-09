import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { list, put } from '@vercel/blob'
import sharp from 'sharp'

type AssetSource = 'local' | 'blob'

interface AssetEntry {
  path: string
  name: string
  updatedAt: string
  sizeBytes: number
  source: AssetSource
}

interface AssetsResponse {
  recentImages: AssetEntry[]
  recentVideos: AssetEntry[]
}

const publicAssetsDirectory = path.join(process.cwd(), 'public/assets')

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v'])

export const config = {
  api: {
    bodyParser: {
      // Figma/macOS exports can exceed the Next.js default request limit.
      sizeLimit: '40mb',
    },
  },
}

function isAdminEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'
}

function toSafeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'upload'
}

function isImageExtension(extension: string): boolean {
  return imageExtensions.has(extension.toLowerCase())
}

function isVideoExtension(extension: string): boolean {
  return videoExtensions.has(extension.toLowerCase())
}

function scanLocalAssets(): AssetsResponse {
  const imageAssets: AssetEntry[] = []
  const videoAssets: AssetEntry[] = []

  const walk = (directory: string) => {
    if (!fs.existsSync(directory)) return

    const entries = fs.readdirSync(directory, { withFileTypes: true })
    entries.forEach((entry) => {
      if (entry.name.startsWith('.')) return

      const absolutePath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(absolutePath)
        return
      }

      if (!entry.isFile()) return

      const extension = path.extname(entry.name).toLowerCase()
      if (!imageExtensions.has(extension) && !videoExtensions.has(extension)) return

      const stats = fs.statSync(absolutePath)
      const relativePath = path.relative(publicAssetsDirectory, absolutePath).replace(/\\/g, '/')
      const payload: AssetEntry = {
        path: `assets/${relativePath}`,
        name: entry.name,
        updatedAt: stats.mtime.toISOString(),
        sizeBytes: stats.size,
        source: 'local',
      }

      if (isImageExtension(extension)) imageAssets.push(payload)
      if (isVideoExtension(extension)) videoAssets.push(payload)
    })
  }

  walk(publicAssetsDirectory)

  imageAssets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  videoAssets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return {
    recentImages: imageAssets.slice(0, 120),
    recentVideos: videoAssets.slice(0, 80),
  }
}

async function scanBlobAssets(): Promise<AssetsResponse> {
  const imageAssets: AssetEntry[] = []
  const videoAssets: AssetEntry[] = []

  try {
    let cursor: string | undefined
    let pageGuard = 0

    while (pageGuard < 30) {
      const response = await list({
        prefix: 'projects/',
        ...(cursor ? { cursor } : {}),
      })

      response.blobs.forEach((blob) => {
        const pathname = (blob.pathname || '').trim()
        if (!pathname) return

        const extension = path.extname(pathname).toLowerCase()
        if (!isImageExtension(extension) && !isVideoExtension(extension)) return

        const name = pathname.split('/').pop() || pathname
        const uploadedAt = blob.uploadedAt instanceof Date
          ? blob.uploadedAt.toISOString()
          : new Date(blob.uploadedAt || Date.now()).toISOString()

        const payload: AssetEntry = {
          path: blob.url,
          name,
          updatedAt: uploadedAt,
          sizeBytes: typeof blob.size === 'number' ? blob.size : 0,
          source: 'blob',
        }

        if (isImageExtension(extension)) imageAssets.push(payload)
        if (isVideoExtension(extension)) videoAssets.push(payload)
      })

      if (!response.hasMore || !response.cursor) break
      cursor = response.cursor
      pageGuard += 1
    }
  } catch {
    // Blob listing is optional when blob token is not configured.
  }

  imageAssets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  videoAssets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return {
    recentImages: imageAssets.slice(0, 120),
    recentVideos: videoAssets.slice(0, 80),
  }
}

async function scanAssets(): Promise<AssetsResponse> {
  const localAssets = scanLocalAssets()
  const blobAssets = await scanBlobAssets()

  const recentImages = [...blobAssets.recentImages, ...localAssets.recentImages]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 180)

  const recentVideos = [...blobAssets.recentVideos, ...localAssets.recentVideos]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 120)

  return { recentImages, recentVideos }
}

function parseImageDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+)(?:;[^,]*)?;base64,([a-zA-Z0-9+/=\s]+)$/)
  if (!match) {
    throw new Error('Invalid image data. Expected a base64 image data URL.')
  }

  const rawBase64 = match[2].replace(/\s+/g, '')
  if (!rawBase64) {
    throw new Error('Invalid image data. Base64 payload is empty.')
  }

  return Buffer.from(rawBase64, 'base64')
}

async function optimizeImageToWebpBuffer(params: { dataUrl: string }): Promise<Buffer> {
  const { dataUrl } = params

  const sourceBuffer = parseImageDataUrl(dataUrl)
  if (sourceBuffer.length === 0) {
    throw new Error('Image payload is empty.')
  }

  let image = sharp(sourceBuffer, {
    // Larger design exports (Figma) can hit Sharp's default pixel safety limit.
    limitInputPixels: false,
    failOn: 'none',
  }).rotate()
  const metadata = await image.metadata().catch(() => null)

  if (metadata?.width && metadata?.height && (metadata.width > 2800 || metadata.height > 2800)) {
    image = image.resize({ width: 2800, height: 2800, fit: 'inside', withoutEnlargement: true })
  }

  return image.webp({ quality: 80, effort: 4 }).toBuffer()
}

async function uploadImageToBlob(params: { filename: string; dataUrl: string }): Promise<string> {
  const { filename, dataUrl } = params
  const baseName = toSafeSlug(path.parse(filename).name || 'upload')
  const uniqueSuffix = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`
  const blobPathname = `projects/${baseName}-${uniqueSuffix}.webp`
  const webpBuffer = await optimizeImageToWebpBuffer({ dataUrl })

  const blob = await put(blobPathname, webpBuffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/webp',
  })

  return blob.url
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const filename = typeof req.body?.filename === 'string' ? req.body.filename : ''
  const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : ''

  if (!filename.trim() || !dataUrl.trim()) {
    return res.status(400).json({ error: 'Missing filename or dataUrl.' })
  }

  try {
    const savedPath = await uploadImageToBlob({
      filename: filename.trim(),
      dataUrl: dataUrl.trim(),
    })

    const assets = await scanAssets()
    return res.status(201).json({
      success: true,
      path: savedPath,
      assets,
    })
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Image upload failed.',
    })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminEnabled()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    if (req.method === 'GET') {
      const assets = await scanAssets()
      return res.status(200).json(assets)
    }

    if (req.method === 'POST') {
      return await handlePost(req, res)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process assets request' })
  }
}
