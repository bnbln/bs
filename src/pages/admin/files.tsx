import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { GetServerSideProps } from 'next'
import { ArrowUp, Copy, FileImage, FileText, Film, FolderOpen, FolderPlus, RefreshCw, Upload } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import type { AdminBlobMoveMapping, AdminFileEntry, AdminFileKind, AdminFilesStorage } from '../../components/admin/types'
import { useAdminFiles } from '../../components/admin/useAdminFiles'
import { formatBytes, formatDateTime } from '../../components/admin/utils'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

interface BlobFolderEntry {
  path: string
  name: string
}

function kindLabel(kind: AdminFileKind): string {
  switch (kind) {
    case 'image':
      return 'Image'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'document':
      return 'Document'
    case 'markdown':
      return 'Markdown'
    default:
      return 'Other'
  }
}

function kindColor(kind: AdminFileKind): string {
  switch (kind) {
    case 'image':
      return 'bg-emerald-100 text-emerald-700'
    case 'video':
      return 'bg-violet-100 text-violet-700'
    case 'audio':
      return 'bg-amber-100 text-amber-700'
    case 'document':
      return 'bg-sky-100 text-sky-700'
    case 'markdown':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-neutral-200 text-neutral-700'
  }
}

function renderPreview(file: AdminFileEntry) {
  if (!file.publicUrl) {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
        content
      </div>
    )
  }

  if (file.kind === 'image') {
    return (
      <div className="h-12 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.publicUrl} alt={file.name} className="h-full w-full object-cover" />
      </div>
    )
  }

  if (file.kind === 'video') {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-200 bg-violet-50 text-violet-600">
        <Film size={14} />
      </div>
    )
  }

  return (
    <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
      <FileText size={14} />
    </div>
  )
}

function normalizeFolderPath(rawPath: string): string {
  let value = rawPath.trim().replace(/\\/g, '/').replace(/^\/+/, '')
  if (!value) return 'projects/'
  if (value.startsWith('projects/')) {
    value = value.slice('projects/'.length)
  }
  value = value.replace(/^\/+/, '').replace(/\/+/g, '/').replace(/\/+$/, '')
  if (!value) return 'projects/'
  return `projects/${value}/`
}

function resolveBlobPathInput(currentFolderPath: string, rawInput: string): string {
  const value = rawInput.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('projects/') || value.startsWith('/projects/')) return value.replace(/^\/+/, '')
  return `${normalizeFolderPath(currentFolderPath)}${value}`.replace(/\/+/g, '/')
}

function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler.'
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsDataURL(file)
  })
}

function parseMappings(payload: unknown): AdminBlobMoveMapping[] {
  if (!payload || typeof payload !== 'object') return []
  const value = (payload as { mappings?: unknown }).mappings
  if (!Array.isArray(value)) return []

  return value.filter((entry): entry is AdminBlobMoveMapping => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Partial<AdminBlobMoveMapping>
    return (
      typeof candidate.fromPath === 'string' &&
      typeof candidate.toPath === 'string' &&
      typeof candidate.fromUrl === 'string' &&
      typeof candidate.toUrl === 'string'
    )
  })
}

export default function AdminFilesPage() {
  const [activeStorage, setActiveStorage] = useState<AdminFilesStorage>('local')

  const localFilesState = useAdminFiles('local', { enabled: true })
  const blobFilesState = useAdminFiles('blob', { enabled: activeStorage === 'blob' })

  const [sourceFilter, setSourceFilter] = useState<'all' | 'public' | 'content'>('all')
  const [kindFilter, setKindFilter] = useState<'all' | AdminFileKind>('all')
  const [query, setQuery] = useState('')

  const [blobPath, setBlobPath] = useState('projects/')
  const [blobActionLoading, setBlobActionLoading] = useState(false)
  const [blobActionError, setBlobActionError] = useState('')
  const [copiedUrl, setCopiedUrl] = useState('')
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const filteredLocalFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return localFilesState.files.filter((file) => {
      if (sourceFilter !== 'all' && file.source !== sourceFilter) return false
      if (kindFilter !== 'all' && file.kind !== kindFilter) return false

      if (!normalizedQuery) return true
      return (
        file.name.toLowerCase().includes(normalizedQuery) ||
        file.relativePath.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [kindFilter, localFilesState.files, query, sourceFilter])

  const blobBreadcrumbs = useMemo(() => {
    const segments = normalizeFolderPath(blobPath).split('/').filter(Boolean)
    let current = ''
    return segments.map((segment) => {
      current += `${segment}/`
      return {
        label: segment,
        path: current,
      }
    })
  }, [blobPath])

  const blobParentPath = useMemo(() => {
    const normalized = normalizeFolderPath(blobPath)
    if (normalized === 'projects/') return null

    const withoutTrailingSlash = normalized.slice(0, -1)
    const lastSlashIndex = withoutTrailingSlash.lastIndexOf('/')
    if (lastSlashIndex < 0) return 'projects/'
    return `${withoutTrailingSlash.slice(0, lastSlashIndex + 1)}`
  }, [blobPath])

  const blobDirectory = useMemo(() => {
    const currentPath = normalizeFolderPath(blobPath)
    const folderMap = new Map<string, BlobFolderEntry>()
    const files: AdminFileEntry[] = []

    blobFilesState.folders.forEach((folderPath) => {
      const normalizedFolder = normalizeFolderPath(folderPath)
      if (!normalizedFolder.startsWith(currentPath) || normalizedFolder === currentPath) return

      const remainder = normalizedFolder.slice(currentPath.length)
      const firstSegment = remainder.split('/').filter(Boolean)[0]
      if (!firstSegment) return

      const nextFolderPath = `${currentPath}${firstSegment}/`
      folderMap.set(nextFolderPath, {
        path: nextFolderPath,
        name: firstSegment,
      })
    })

    blobFilesState.files.forEach((file) => {
      if (!file.relativePath.startsWith(currentPath)) return
      const remainder = file.relativePath.slice(currentPath.length)
      if (!remainder) return

      const slashIndex = remainder.indexOf('/')
      if (slashIndex >= 0) {
        const firstSegment = remainder.slice(0, slashIndex)
        if (!firstSegment) return

        const nextFolderPath = `${currentPath}${firstSegment}/`
        folderMap.set(nextFolderPath, {
          path: nextFolderPath,
          name: firstSegment,
        })
        return
      }

      files.push(file)
    })

    const folders = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    files.sort((a, b) => a.name.localeCompare(b.name))

    return {
      folders,
      files,
    }
  }, [blobFilesState.files, blobFilesState.folders, blobPath])

  useEffect(() => {
    if (activeStorage !== 'blob') return
    if (blobPath === 'projects/') return

    const folderExists = blobFilesState.folders.some((folderPath) => normalizeFolderPath(folderPath) === normalizeFolderPath(blobPath))
    if (!folderExists) {
      setBlobPath('projects/')
    }
  }, [activeStorage, blobFilesState.folders, blobPath])

  useEffect(() => {
    if (!copiedUrl) return
    const timeout = window.setTimeout(() => setCopiedUrl(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [copiedUrl])

  const postFilesAction = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch('/api/admin/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const rawResponse = await response.text()
    let parsedResponse: unknown = {}
    try {
      parsedResponse = rawResponse ? JSON.parse(rawResponse) : {}
    } catch {
      parsedResponse = { error: rawResponse || `Request failed (HTTP ${response.status})` }
    }

    if (!response.ok) {
      const errorMessage =
        parsedResponse && typeof parsedResponse === 'object' && typeof (parsedResponse as { error?: unknown }).error === 'string'
          ? (parsedResponse as { error: string }).error
          : `Request failed (HTTP ${response.status})`
      throw new Error(errorMessage)
    }

    return parsedResponse
  }, [])

  const maybeReplaceMarkdownLinks = useCallback(
    async (mappings: AdminBlobMoveMapping[]) => {
      const validMappings = mappings.filter((mapping) => mapping.fromUrl && mapping.toUrl && mapping.fromUrl !== mapping.toUrl)
      if (validMappings.length === 0) return

      const replaceLinks = window.confirm(
        `Die URL hat sich geaendert (${validMappings.length} Datei${validMappings.length > 1 ? 'en' : ''}). Alte Links in allen .md/.mdx Dateien ersetzen?`
      )
      if (!replaceLinks) return

      const result = await postFilesAction({
        action: 'replace-markdown-links',
        mappings: validMappings,
      })

      const changedFiles =
        result && typeof result === 'object' && typeof (result as { changedFiles?: unknown }).changedFiles === 'number'
          ? (result as { changedFiles: number }).changedFiles
          : 0
      const replacementCount =
        result && typeof result === 'object' && typeof (result as { replacementCount?: unknown }).replacementCount === 'number'
          ? (result as { replacementCount: number }).replacementCount
          : 0

      window.alert(`${replacementCount} Link(s) in ${changedFiles} Markdown-Datei(en) ersetzt.`)
    },
    [postFilesAction]
  )

  const handleCopyUrl = useCallback(async (url: string) => {
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
    } catch {
      window.prompt('URL kopieren:', url)
    }
  }, [])

  const handleCreateBlobFolder = useCallback(async () => {
    const folderInput = window.prompt('Neuer Ordner (Name oder Path):', '')
    if (!folderInput) return

    setBlobActionLoading(true)
    setBlobActionError('')
    try {
      await postFilesAction({
        action: 'create-folder',
        path: resolveBlobPathInput(blobPath, folderInput),
      })
      await blobFilesState.reload()
    } catch (error) {
      const message = asErrorMessage(error)
      setBlobActionError(message)
      window.alert(message)
    } finally {
      setBlobActionLoading(false)
    }
  }, [blobFilesState, blobPath, postFilesAction])

  const handleMoveBlobFile = useCallback(
    async (file: AdminFileEntry) => {
      const targetInput = window.prompt('Neuer Path fuer die Datei:', file.relativePath)
      if (!targetInput) return

      setBlobActionLoading(true)
      setBlobActionError('')
      try {
        const result = await postFilesAction({
          action: 'move-file',
          fromPath: file.relativePath,
          toPath: resolveBlobPathInput(blobPath, targetInput),
        })

        const mappings = parseMappings(result)
        await blobFilesState.reload()
        await maybeReplaceMarkdownLinks(mappings)
      } catch (error) {
        const message = asErrorMessage(error)
        setBlobActionError(message)
        window.alert(message)
      } finally {
        setBlobActionLoading(false)
      }
    },
    [blobFilesState, blobPath, maybeReplaceMarkdownLinks, postFilesAction]
  )

  const handleMoveBlobFolder = useCallback(
    async (folder: BlobFolderEntry) => {
      const targetInput = window.prompt('Neuer Path fuer den Ordner:', folder.path)
      if (!targetInput) return

      const resolvedTarget = normalizeFolderPath(resolveBlobPathInput(blobPath, targetInput))
      setBlobActionLoading(true)
      setBlobActionError('')
      try {
        const result = await postFilesAction({
          action: 'move-folder',
          fromPath: folder.path,
          toPath: resolvedTarget,
        })

        if (normalizeFolderPath(blobPath).startsWith(normalizeFolderPath(folder.path))) {
          const suffix = normalizeFolderPath(blobPath).slice(normalizeFolderPath(folder.path).length)
          setBlobPath(`${resolvedTarget}${suffix}`.replace(/\/+/g, '/'))
        }

        const mappings = parseMappings(result)
        await blobFilesState.reload()
        await maybeReplaceMarkdownLinks(mappings)
      } catch (error) {
        const message = asErrorMessage(error)
        setBlobActionError(message)
        window.alert(message)
      } finally {
        setBlobActionLoading(false)
      }
    },
    [blobFilesState, blobPath, maybeReplaceMarkdownLinks, postFilesAction]
  )

  const handleBlobUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files
      if (!selectedFiles || selectedFiles.length === 0) return

      setBlobActionLoading(true)
      setBlobActionError('')
      try {
        for (const file of Array.from(selectedFiles)) {
          const dataUrl = await toDataUrl(file)
          await postFilesAction({
            action: 'upload-file',
            folderPath: blobPath,
            filename: file.name,
            dataUrl,
          })
        }

        await blobFilesState.reload()
      } catch (error) {
        const message = asErrorMessage(error)
        setBlobActionError(message)
        window.alert(message)
      } finally {
        event.target.value = ''
        setBlobActionLoading(false)
      }
    },
    [blobFilesState, blobPath, postFilesAction]
  )

  const activeSummary = activeStorage === 'local' ? localFilesState.summary : blobFilesState.summary

  return (
    <AdminLayout
      active="files"
      title="Files"
      description="Dateiverwaltung fuer lokale Dateien und Vercel Blob."
      counts={{ files: activeSummary.totalFiles }}
    >
      <section className="mb-4 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeStorage === 'local' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setActiveStorage('local')}
        >
          Lokal
        </button>
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeStorage === 'blob' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          onClick={() => setActiveStorage('blob')}
        >
          Vercel Blob
        </button>
      </section>

      {activeStorage === 'local' ? (
        localFilesState.error ? (
          <StatePanel
            title="Lokale Dateien konnten nicht geladen werden"
            message={`${localFilesState.error} Bitte pruefe deinen Admin-Server.`}
            tone="error"
          />
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="All Files" value={localFilesState.summary.totalFiles} tone="blue" icon={<FolderOpen size={14} />} />
              <KpiCard label="Images" value={localFilesState.summary.byKind.image} tone="green" icon={<FileImage size={14} />} />
              <KpiCard label="Videos" value={localFilesState.summary.byKind.video} tone="violet" icon={<Film size={14} />} />
              <KpiCard label="Storage" value={formatBytes(localFilesState.summary.totalBytes)} tone="slate" icon={<FileText size={14} />} />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
              <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value as 'all' | 'public' | 'content')}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="public">public/</option>
                  <option value="content">content/</option>
                </select>

                <select
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value as 'all' | AdminFileKind)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                  <option value="markdown">Markdown</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
                  placeholder="Suche nach Name oder Pfad"
                />
              </div>

              {localFilesState.loading ? (
                <p className="text-sm text-slate-500">Scanne Dateien...</p>
              ) : filteredLocalFiles.length === 0 ? (
                <p className="text-sm text-slate-500">Keine Dateien fuer diesen Filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-2 py-1">Preview</th>
                        <th className="px-2 py-1">File</th>
                        <th className="px-2 py-1">Type</th>
                        <th className="px-2 py-1">Source</th>
                        <th className="px-2 py-1">Size</th>
                        <th className="px-2 py-1">Updated</th>
                        <th className="px-2 py-1">Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocalFiles.map((file) => (
                        <tr key={file.id} className="rounded-xl bg-slate-50 text-slate-700">
                          <td className="px-2 py-2 align-middle">{renderPreview(file)}</td>
                          <td className="px-2 py-2 font-semibold text-slate-900">{file.name}</td>
                          <td className="px-2 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${kindColor(file.kind)}`}>
                              {kindLabel(file.kind)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-xs uppercase tracking-[0.14em] text-slate-500">{file.source}</td>
                          <td className="px-2 py-2">{formatBytes(file.sizeBytes)}</td>
                          <td className="px-2 py-2 text-xs text-slate-500">{formatDateTime(file.updatedAt)}</td>
                          <td className="px-2 py-2 font-mono text-xs text-slate-500">{file.relativePath}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      ) : blobFilesState.error ? (
        <StatePanel
          title="Blob-Dateien konnten nicht geladen werden"
          message={`${blobFilesState.error} Bitte pruefe Vercel Blob Token/Config.`}
          tone="error"
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Blob Files" value={blobFilesState.summary.totalFiles} tone="blue" icon={<FolderOpen size={14} />} />
            <KpiCard label="Folders" value={Math.max(blobFilesState.folders.length - 1, 0)} tone="green" icon={<FolderPlus size={14} />} />
            <KpiCard label="Images" value={blobFilesState.summary.byKind.image} tone="violet" icon={<FileImage size={14} />} />
            <KpiCard label="Storage" value={formatBytes(blobFilesState.summary.totalBytes)} tone="slate" icon={<FileText size={14} />} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 disabled:opacity-50"
                onClick={() => blobParentPath && setBlobPath(blobParentPath)}
                disabled={!blobParentPath || blobActionLoading}
              >
                <ArrowUp size={14} />
                Up
              </button>

              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                {blobBreadcrumbs.map((crumb, index) => (
                  <button
                    key={crumb.path}
                    type="button"
                    className={`rounded px-2 py-1 transition-colors ${normalizeFolderPath(blobPath) === normalizeFolderPath(crumb.path) ? 'bg-white font-semibold text-slate-900' : 'hover:bg-white'}`}
                    onClick={() => setBlobPath(normalizeFolderPath(crumb.path))}
                    disabled={blobActionLoading}
                  >
                    {index > 0 ? ' / ' : ''}
                    {crumb.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 disabled:opacity-50"
                  onClick={handleCreateBlobFolder}
                  disabled={blobActionLoading}
                >
                  <FolderPlus size={14} />
                  Neuer Ordner
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 disabled:opacity-50"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={blobActionLoading}
                >
                  <Upload size={14} />
                  Upload
                </button>
                <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={handleBlobUpload} />

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 disabled:opacity-50"
                  onClick={() => blobFilesState.reload()}
                  disabled={blobActionLoading || blobFilesState.loading}
                >
                  <RefreshCw size={14} className={blobFilesState.loading ? 'animate-spin' : ''} />
                  Reload
                </button>
              </div>
            </div>

            {blobActionError ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{blobActionError}</p> : null}

            {blobFilesState.loading ? (
              <p className="text-sm text-slate-500">Lade Blob-Dateien...</p>
            ) : blobDirectory.folders.length === 0 && blobDirectory.files.length === 0 ? (
              <p className="text-sm text-slate-500">Dieser Ordner ist leer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-2 py-1">Item</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Size</th>
                      <th className="px-2 py-1">Updated</th>
                      <th className="px-2 py-1">Path</th>
                      <th className="px-2 py-1">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blobDirectory.folders.map((folder) => (
                      <tr key={folder.path} className="rounded-xl bg-slate-50 text-slate-700">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-slate-600"
                            onClick={() => setBlobPath(normalizeFolderPath(folder.path))}
                            disabled={blobActionLoading}
                          >
                            <FolderOpen size={16} />
                            {folder.name}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">folder</td>
                        <td className="px-2 py-2 text-slate-500">-</td>
                        <td className="px-2 py-2 text-slate-500">-</td>
                        <td className="px-2 py-2 font-mono text-xs text-slate-500">{folder.path}</td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              onClick={() => setBlobPath(normalizeFolderPath(folder.path))}
                              disabled={blobActionLoading}
                            >
                              Oeffnen
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              onClick={() => handleMoveBlobFolder(folder)}
                              disabled={blobActionLoading}
                            >
                              Verschieben
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {blobDirectory.files.map((file) => (
                      <tr key={file.id} className="rounded-xl bg-slate-50 text-slate-700">
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-3">
                            {renderPreview(file)}
                            <span className="font-semibold text-slate-900">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${kindColor(file.kind)}`}>
                            {kindLabel(file.kind)}
                          </span>
                        </td>
                        <td className="px-2 py-2">{formatBytes(file.sizeBytes)}</td>
                        <td className="px-2 py-2 text-xs text-slate-500">{formatDateTime(file.updatedAt)}</td>
                        <td className="px-2 py-2 font-mono text-xs text-slate-500">{file.relativePath}</td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              onClick={() => handleCopyUrl(file.publicUrl || '')}
                              disabled={blobActionLoading || !file.publicUrl}
                            >
                              <Copy size={12} />
                              {copiedUrl === file.publicUrl ? 'Kopiert' : 'URL kopieren'}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              onClick={() => handleMoveBlobFile(file)}
                              disabled={blobActionLoading}
                            >
                              Verschieben
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
