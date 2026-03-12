import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminFileEntry, AdminFilesStorage, FilesApiResponse } from './types'

interface AdminFilesState {
  storage: AdminFilesStorage
  files: AdminFileEntry[]
  folders: string[]
  loading: boolean
  error: string
  reload: () => Promise<void>
  summary: FilesApiResponse['summary']
}

interface UseAdminFilesOptions {
  enabled?: boolean
}

const emptyFolders: string[] = []

const emptySummary: FilesApiResponse['summary'] = {
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

export function useAdminFiles(storage: AdminFilesStorage, options: UseAdminFilesOptions = {}): AdminFilesState {
  const { enabled = true } = options
  const [files, setFiles] = useState<AdminFileEntry[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<FilesApiResponse['summary']>(emptySummary)

  const reload = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/admin/files?storage=${storage}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${storage} files overview.`)
      }

      const data = (await response.json()) as FilesApiResponse
      setFiles(data.files || [])
      setFolders(Array.isArray(data.folders) ? data.folders : emptyFolders)
      setSummary(data.summary || emptySummary)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `Failed to load ${storage} files overview.`)
    } finally {
      setLoading(false)
    }
  }, [enabled, storage])

  useEffect(() => {
    if (!enabled) return
    reload()
  }, [enabled, reload])

  const stableSummary = useMemo(() => summary || emptySummary, [summary])
  const stableFolders = useMemo(() => folders || emptyFolders, [folders])

  return {
    storage,
    files,
    folders: stableFolders,
    loading,
    error,
    reload,
    summary: stableSummary,
  }
}
