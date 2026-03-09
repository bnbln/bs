import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import type { AdminFileEntry, AdminFileKind, FilesApiResponse } from '../../../components/admin/types'

const publicDirectory = path.join(process.cwd(), 'public')
const contentDirectory = path.join(process.cwd(), 'content/projects')

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'])
const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm'])
const audioExtensions = new Set(['.mp3', '.wav', '.ogg', '.aac'])
const documentExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'])

function isAdminEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'
}

function getFileKind(extension: string): AdminFileKind {
  if (imageExtensions.has(extension)) return 'image'
  if (videoExtensions.has(extension)) return 'video'
  if (audioExtensions.has(extension)) return 'audio'
  if (documentExtensions.has(extension)) return 'document'
  if (extension === '.md' || extension === '.mdx') return 'markdown'
  return 'other'
}

function createEmptySummary(): FilesApiResponse['summary'] {
  return {
    totalFiles: 0,
    totalBytes: 0,
    byKind: {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      markdown: 0,
      other: 0,
    },
    bySource: {
      public: 0,
      content: 0,
      blob: 0,
    },
  }
}

function walkDirectory(params: {
  root: string
  currentDirectory: string
  source: 'public' | 'content'
  files: AdminFileEntry[]
}) {
  const { root, currentDirectory, source, files } = params

  if (!fs.existsSync(currentDirectory)) return

  const entries = fs.readdirSync(currentDirectory, { withFileTypes: true })

  entries.forEach((entry) => {
    if (entry.name.startsWith('.')) return

    const absolutePath = path.join(currentDirectory, entry.name)

    if (entry.isDirectory()) {
      walkDirectory({
        root,
        currentDirectory: absolutePath,
        source,
        files,
      })
      return
    }

    if (!entry.isFile()) return

    const relativePath = path.relative(root, absolutePath).replace(/\\/g, '/')
    const extension = path.extname(entry.name).toLowerCase()
    const stats = fs.statSync(absolutePath)

    files.push({
      id: `${source}:${relativePath}`,
      source,
      name: entry.name,
      relativePath,
      extension,
      kind: getFileKind(extension),
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
      ...(source === 'public' ? { publicUrl: `/${relativePath}` } : {}),
    })
  })
}

async function listBlobFiles(): Promise<AdminFileEntry[]> {
  const files: AdminFileEntry[] = []

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

        const name = pathname.split('/').pop() || pathname
        const extension = path.extname(pathname).toLowerCase()
        const uploadedAt = blob.uploadedAt instanceof Date
          ? blob.uploadedAt.toISOString()
          : new Date(blob.uploadedAt || Date.now()).toISOString()

        files.push({
          id: `blob:${pathname}`,
          source: 'blob',
          name,
          relativePath: pathname,
          extension,
          kind: getFileKind(extension),
          sizeBytes: typeof blob.size === 'number' ? blob.size : 0,
          updatedAt: uploadedAt,
          publicUrl: blob.url,
        })
      })

      if (!response.hasMore || !response.cursor) break
      cursor = response.cursor
      pageGuard += 1
    }
  } catch {
    // Blob listing is optional in local/dev environments without blob token.
  }

  return files
}

async function buildFilesResponse(): Promise<FilesApiResponse> {
  const files: AdminFileEntry[] = []

  walkDirectory({
    root: publicDirectory,
    currentDirectory: publicDirectory,
    source: 'public',
    files,
  })

  walkDirectory({
    root: contentDirectory,
    currentDirectory: contentDirectory,
    source: 'content',
    files,
  })

  const blobFiles = await listBlobFiles()
  files.push(...blobFiles)

  const summary = createEmptySummary()

  files.forEach((file) => {
    summary.totalFiles += 1
    summary.totalBytes += file.sizeBytes
    summary.byKind[file.kind] += 1
    summary.bySource[file.source] += 1
  })

  files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return { files, summary }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminEnabled()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const response = await buildFilesResponse()
    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process admin files request' })
  }
}
