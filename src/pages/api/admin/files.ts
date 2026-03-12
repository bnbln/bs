import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { copy, createFolder, del, head, list, put } from '@vercel/blob'
import type { AdminBlobMoveMapping, AdminFileEntry, AdminFileKind, AdminFilesStorage, FilesApiResponse } from '../../../components/admin/types'

const publicDirectory = path.join(process.cwd(), 'public')
const contentProjectsDirectory = path.join(process.cwd(), 'content/projects')
const contentRootDirectory = path.join(process.cwd(), 'content')
const blobRootPath = 'projects/'

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'])
const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm'])
const audioExtensions = new Set(['.mp3', '.wav', '.ogg', '.aac'])
const documentExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'])

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '45mb',
    },
  },
}

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

function resolveStorage(input: string | string[] | undefined): AdminFilesStorage {
  const value = Array.isArray(input) ? input[0] : input
  return value === 'blob' ? 'blob' : 'local'
}

function toSafeBlobPathSegment(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '-').trim()
}

function normalizeBlobPath(rawValue: string, options: { folder?: boolean; allowRoot?: boolean } = {}): string {
  const { folder = false, allowRoot = false } = options
  let value = rawValue.trim()
  if (!value) {
    throw new Error('Missing blob path.')
  }

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value)
    value = decodeURIComponent(url.pathname || '')
  }

  value = value.replace(/\\/g, '/').replace(/^\/+/, '')
  value = value.replace(/\/+/g, '/')
  if (value.startsWith(blobRootPath)) {
    value = value.slice(blobRootPath.length)
  }

  value = value.replace(/^\/+/, '')
  value = value.replace(/\/+$/, '')

  const segments = value
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(toSafeBlobPathSegment)
    .filter(Boolean)

  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('Invalid blob path.')
  }

  if (segments.length === 0) {
    if (!allowRoot) {
      throw new Error('Missing blob path.')
    }
    return folder ? blobRootPath : blobRootPath.slice(0, -1)
  }

  const pathname = `${blobRootPath}${segments.join('/')}`
  if (folder) {
    return pathname.endsWith('/') ? pathname : `${pathname}/`
  }
  return pathname.replace(/\/+$/, '')
}

function buildPathFromFolderAndName(folderPath: string, name: string): string {
  const safeName = toSafeBlobPathSegment(name)
  if (!safeName) {
    throw new Error('Invalid filename.')
  }
  return `${normalizeBlobPath(folderPath, { folder: true, allowRoot: true })}${safeName}`
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType?: string } {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,([a-zA-Z0-9+/=\s]+)$/)
  if (!match) {
    throw new Error('Invalid upload payload.')
  }

  const rawBase64 = match[2].replace(/\s+/g, '')
  if (!rawBase64) {
    throw new Error('Upload payload is empty.')
  }

  return {
    buffer: Buffer.from(rawBase64, 'base64'),
    contentType: match[1] || undefined,
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

function addFolderAndParents(folders: Set<string>, folderPath: string) {
  const normalized = normalizeBlobPath(folderPath, { folder: true, allowRoot: true })
  const segments = normalized.split('/').filter(Boolean)
  if (segments.length === 0) return

  let cursor = ''
  segments.forEach((segment) => {
    cursor += `${segment}/`
    folders.add(cursor)
  })
}

async function listBlobFilesAndFolders(): Promise<{ files: AdminFileEntry[]; folders: string[] }> {
  const files: AdminFileEntry[] = []
  const folders = new Set<string>([blobRootPath])

  try {
    let cursor: string | undefined
    let pageGuard = 0

    while (pageGuard < 40) {
      const response = await list({
        prefix: blobRootPath,
        ...(cursor ? { cursor } : {}),
      })

      response.blobs.forEach((blob) => {
        const pathname = (blob.pathname || '').trim()
        if (!pathname || !pathname.startsWith(blobRootPath)) return

        if (pathname.endsWith('/')) {
          addFolderAndParents(folders, pathname)
          return
        }

        const parentFolder = path.posix.dirname(pathname)
        if (parentFolder && parentFolder !== '.') {
          addFolderAndParents(folders, `${parentFolder}/`)
        }

        const extension = path.extname(pathname).toLowerCase()
        const uploadedAt = blob.uploadedAt instanceof Date
          ? blob.uploadedAt.toISOString()
          : new Date(blob.uploadedAt || Date.now()).toISOString()

        files.push({
          id: `blob:${pathname}`,
          source: 'blob',
          name: pathname.split('/').pop() || pathname,
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
    // Blob listing is optional when blob token is not configured.
  }

  files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const sortedFolders = Array.from(folders).sort((a, b) => a.localeCompare(b))
  return { files, folders: sortedFolders }
}

function withSummary(storage: AdminFilesStorage, files: AdminFileEntry[], folders: string[]): FilesApiResponse {
  const summary = createEmptySummary()

  files.forEach((file) => {
    summary.totalFiles += 1
    summary.totalBytes += file.sizeBytes
    summary.byKind[file.kind] += 1
    summary.bySource[file.source] += 1
  })

  if (storage === 'local') {
    summary.bySource.blob = 0
  }

  return {
    storage,
    files,
    folders,
    summary,
  }
}

async function buildLocalFilesResponse(): Promise<FilesApiResponse> {
  const files: AdminFileEntry[] = []

  walkDirectory({
    root: publicDirectory,
    currentDirectory: publicDirectory,
    source: 'public',
    files,
  })

  walkDirectory({
    root: contentProjectsDirectory,
    currentDirectory: contentProjectsDirectory,
    source: 'content',
    files,
  })

  files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return withSummary('local', files, [])
}

async function buildBlobFilesResponse(): Promise<FilesApiResponse> {
  const { files, folders } = await listBlobFilesAndFolders()
  return withSummary('blob', files, folders)
}

async function listBlobEntriesByPrefix(prefix: string): Promise<Array<{ pathname: string; url: string }>> {
  const entries: Array<{ pathname: string; url: string }> = []
  let cursor: string | undefined
  let pageGuard = 0

  while (pageGuard < 80) {
    const response = await list({
      prefix,
      ...(cursor ? { cursor } : {}),
    })

    response.blobs.forEach((blob) => {
      const pathname = (blob.pathname || '').trim()
      if (!pathname || !pathname.startsWith(prefix)) return
      entries.push({
        pathname,
        url: blob.url,
      })
    })

    if (!response.hasMore || !response.cursor) break
    cursor = response.cursor
    pageGuard += 1
  }

  return entries
}

async function moveBlobFile(fromPathRaw: string, toPathRaw: string): Promise<AdminBlobMoveMapping[]> {
  const fromPath = normalizeBlobPath(fromPathRaw)
  const toPath = normalizeBlobPath(toPathRaw)
  if (fromPath === toPath) {
    throw new Error('Source and destination path are identical.')
  }

  const sourceMeta = await head(fromPath)
  const copied = await copy(fromPath, toPath, {
    access: 'public',
    addRandomSuffix: false,
    ...(sourceMeta.contentType ? { contentType: sourceMeta.contentType } : {}),
  })
  await del(fromPath)

  return [
    {
      fromPath,
      toPath,
      fromUrl: sourceMeta.url,
      toUrl: copied.url,
    },
  ]
}

async function moveBlobFolder(fromPathRaw: string, toPathRaw: string): Promise<AdminBlobMoveMapping[]> {
  const fromPath = normalizeBlobPath(fromPathRaw, { folder: true })
  const toPath = normalizeBlobPath(toPathRaw, { folder: true })
  if (fromPath === blobRootPath) {
    throw new Error('Root folder cannot be moved.')
  }
  if (fromPath === toPath) {
    throw new Error('Source and destination path are identical.')
  }
  if (toPath.startsWith(fromPath)) {
    throw new Error('Destination cannot be inside source folder.')
  }

  const entries = await listBlobEntriesByPrefix(fromPath)
  if (entries.length === 0) {
    throw new Error('Folder is empty or missing in Blob storage.')
  }

  const mappings: AdminBlobMoveMapping[] = []
  const pathsToDelete = new Set<string>()

  await createFolder(toPath, { access: 'public' }).catch(() => null)

  for (const entry of entries) {
    const sourcePath = entry.pathname
    const suffix = sourcePath.slice(fromPath.length)

    if (!suffix) {
      pathsToDelete.add(sourcePath)
      continue
    }

    if (sourcePath.endsWith('/')) {
      await createFolder(`${toPath}${suffix}`, { access: 'public' }).catch(() => null)
      pathsToDelete.add(sourcePath)
      continue
    }

    const targetPath = `${toPath}${suffix}`
    const copied = await copy(sourcePath, targetPath, {
      access: 'public',
      addRandomSuffix: false,
    })

    mappings.push({
      fromPath: sourcePath,
      toPath: targetPath,
      fromUrl: entry.url,
      toUrl: copied.url,
    })
    pathsToDelete.add(sourcePath)
  }

  if (pathsToDelete.size > 0) {
    await del(Array.from(pathsToDelete))
  }

  return mappings
}

function parseMoveMappings(rawMappings: unknown): AdminBlobMoveMapping[] {
  if (!Array.isArray(rawMappings)) return []

  const mappings: AdminBlobMoveMapping[] = []
  const uniquePairs = new Set<string>()

  rawMappings.forEach((mapping) => {
    if (!mapping || typeof mapping !== 'object') return
    const candidate = mapping as Partial<AdminBlobMoveMapping>
    const fromUrl = typeof candidate.fromUrl === 'string' ? candidate.fromUrl.trim() : ''
    const toUrl = typeof candidate.toUrl === 'string' ? candidate.toUrl.trim() : ''
    const fromPath = typeof candidate.fromPath === 'string' ? candidate.fromPath.trim() : ''
    const toPath = typeof candidate.toPath === 'string' ? candidate.toPath.trim() : ''

    if (!fromUrl || !toUrl || fromUrl === toUrl) return
    const key = `${fromUrl}:::${toUrl}`
    if (uniquePairs.has(key)) return
    uniquePairs.add(key)

    mappings.push({
      fromPath,
      toPath,
      fromUrl,
      toUrl,
    })
  })

  return mappings
}

function walkMarkdownFiles(directory: string, files: string[]) {
  if (!fs.existsSync(directory)) return

  const entries = fs.readdirSync(directory, { withFileTypes: true })
  entries.forEach((entry) => {
    if (entry.name.startsWith('.')) return
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      walkMarkdownFiles(absolutePath, files)
      return
    }

    if (!entry.isFile()) return
    if (!entry.name.endsWith('.md') && !entry.name.endsWith('.mdx')) return
    files.push(absolutePath)
  })
}

function replaceAllOccurrences(content: string, searchValue: string, replaceValue: string): { next: string; replacements: number } {
  if (!searchValue) {
    return { next: content, replacements: 0 }
  }

  const parts = content.split(searchValue)
  if (parts.length <= 1) {
    return { next: content, replacements: 0 }
  }

  return {
    next: parts.join(replaceValue),
    replacements: parts.length - 1,
  }
}

async function replaceLinksInMarkdownFiles(mappings: AdminBlobMoveMapping[]): Promise<{
  changedFiles: number
  replacementCount: number
  files: string[]
}> {
  const markdownFiles: string[] = []
  walkMarkdownFiles(contentRootDirectory, markdownFiles)

  let changedFiles = 0
  let replacementCount = 0
  const touchedFiles: string[] = []

  markdownFiles.forEach((filePath) => {
    const currentContent = fs.readFileSync(filePath, 'utf8')
    let nextContent = currentContent
    let localReplacements = 0

    mappings.forEach((mapping) => {
      const result = replaceAllOccurrences(nextContent, mapping.fromUrl, mapping.toUrl)
      nextContent = result.next
      localReplacements += result.replacements
    })

    if (localReplacements > 0 && nextContent !== currentContent) {
      fs.writeFileSync(filePath, nextContent, 'utf8')
      changedFiles += 1
      replacementCount += localReplacements
      touchedFiles.push(path.relative(process.cwd(), filePath).replace(/\\/g, '/'))
    }
  })

  return {
    changedFiles,
    replacementCount,
    files: touchedFiles,
  }
}

function parseAction(req: NextApiRequest): string {
  return typeof req.body?.action === 'string' ? req.body.action.trim() : ''
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const action = parseAction(req)
  if (!action) {
    return res.status(400).json({ error: 'Missing action.' })
  }

  try {
    if (action === 'create-folder') {
      const targetPath = typeof req.body?.path === 'string' ? req.body.path : ''
      const pathname = normalizeBlobPath(targetPath, { folder: true })
      const created = await createFolder(pathname, { access: 'public' })
      return res.status(200).json({
        success: true,
        folder: {
          pathname: created.pathname,
          url: created.url,
        },
      })
    }

    if (action === 'upload-file') {
      const folderPath = typeof req.body?.folderPath === 'string' ? req.body.folderPath : blobRootPath
      const filename = typeof req.body?.filename === 'string' ? req.body.filename : ''
      const pathnameInput = typeof req.body?.pathname === 'string' ? req.body.pathname : ''
      const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : ''

      if (!dataUrl.trim()) {
        return res.status(400).json({ error: 'Missing upload payload.' })
      }

      const pathname = pathnameInput.trim()
        ? normalizeBlobPath(pathnameInput)
        : buildPathFromFolderAndName(folderPath, filename)
      const { buffer, contentType } = parseDataUrl(dataUrl)
      const uploaded = await put(pathname, buffer, {
        access: 'public',
        addRandomSuffix: false,
        ...(contentType ? { contentType } : {}),
      })

      return res.status(200).json({
        success: true,
        file: {
          pathname: uploaded.pathname,
          url: uploaded.url,
          downloadUrl: uploaded.downloadUrl,
        },
      })
    }

    if (action === 'move-file') {
      const fromPath = typeof req.body?.fromPath === 'string' ? req.body.fromPath : ''
      const toPath = typeof req.body?.toPath === 'string' ? req.body.toPath : ''
      const mappings = await moveBlobFile(fromPath, toPath)
      return res.status(200).json({ success: true, mappings })
    }

    if (action === 'move-folder') {
      const fromPath = typeof req.body?.fromPath === 'string' ? req.body.fromPath : ''
      const toPath = typeof req.body?.toPath === 'string' ? req.body.toPath : ''
      const mappings = await moveBlobFolder(fromPath, toPath)
      return res.status(200).json({ success: true, mappings })
    }

    if (action === 'replace-markdown-links') {
      const mappings = parseMoveMappings(req.body?.mappings)
      if (mappings.length === 0) {
        return res.status(400).json({ error: 'No URL mappings provided.' })
      }

      const result = await replaceLinksInMarkdownFiles(mappings)
      return res.status(200).json({
        success: true,
        changedFiles: result.changedFiles,
        replacementCount: result.replacementCount,
        files: result.files,
      })
    }

    return res.status(400).json({ error: `Unsupported action: ${action}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process files action.'
    return res.status(400).json({ error: message })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminEnabled()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    if (req.method === 'GET') {
      const storage = resolveStorage(req.query.storage)
      const response = storage === 'blob'
        ? await buildBlobFilesResponse()
        : await buildLocalFilesResponse()
      return res.status(200).json(response)
    }

    if (req.method === 'POST') {
      return await handlePost(req, res)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch {
    return res.status(500).json({ error: 'Failed to process admin files request' })
  }
}
