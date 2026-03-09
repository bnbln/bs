import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DashboardResponse, DashboardProject, SitePageSummary } from './types'

interface AdminContentState {
  projects: DashboardProject[]
  archivedProjects: DashboardProject[]
  sitePages: SitePageSummary[]
  loading: boolean
  error: string
  reload: () => Promise<void>
  totals: {
    pages: number
    live: number
    archive: number
    featured: number
  }
}

export function useAdminContent(): AdminContentState {
  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [archivedProjects, setArchivedProjects] = useState<DashboardProject[]>([])
  const [sitePages, setSitePages] = useState<SitePageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/projects')
      if (!response.ok) {
        throw new Error('Failed to load content. Ensure NEXT_PUBLIC_ADMIN=true and run npm run backend.')
      }

      const data = (await response.json()) as DashboardResponse
      setProjects(data.projects || [])
      setArchivedProjects(data.archivedProjects || [])
      setSitePages(data.sitePages || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const totals = useMemo(() => {
    const all = [...projects, ...archivedProjects]
    return {
      pages: sitePages.length,
      live: projects.length,
      archive: archivedProjects.length,
      featured: all.filter((project) => project.featured).length,
    }
  }, [archivedProjects, projects, sitePages.length])

  return {
    projects,
    archivedProjects,
    sitePages,
    loading,
    error,
    reload,
    totals,
  }
}
