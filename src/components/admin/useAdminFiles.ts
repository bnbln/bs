import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminFileEntry, FilesApiResponse } from './types'

interface AdminFilesState {
  files: AdminFileEntry[]
  loading: boolean
  error: string
  reload: () => Promise<void>
  summary: FilesApiResponse['summary']
}

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
  },
}

export function useAdminFiles(): AdminFilesState {
  const [files, setFiles] = useState<AdminFileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<FilesApiResponse['summary']>(emptySummary)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/files')
      if (!response.ok) {
        throw new Error('Failed to load files overview.')
      }

      const data = (await response.json()) as FilesApiResponse
      setFiles(data.files || [])
      setSummary(data.summary || emptySummary)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load files overview.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const stableSummary = useMemo(() => summary || emptySummary, [summary])

  return {
    files,
    loading,
    error,
    reload,
    summary: stableSummary,
  }
}
