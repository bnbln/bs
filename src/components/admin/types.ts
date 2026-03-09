import type { Project, ProjectFolder } from '../../lib/markdown'
import type { SeoConfig } from '../../lib/seo'

export type AdminSection = 'dashboard' | 'pages' | 'posts' | 'files' | 'settings'

export interface DashboardProject extends Project {
  folder: ProjectFolder
  isArchived: boolean
  filePath: string
  excerptText: string
}

export interface SitePageSummary {
  route: string
  filePath: string
  label: string
  dynamic: boolean
}

export interface DashboardResponse {
  projects?: DashboardProject[]
  archivedProjects?: DashboardProject[]
  sitePages?: SitePageSummary[]
}

export interface SeoApiResponse {
  config: SeoConfig
  generated: {
    robotsTxt: string
    manifest: Record<string, unknown>
    sitemapXml: string
  }
}

export type AdminFileKind = 'image' | 'video' | 'audio' | 'document' | 'markdown' | 'other'

export interface AdminFileEntry {
  id: string
  source: 'public' | 'content' | 'blob'
  name: string
  relativePath: string
  extension: string
  kind: AdminFileKind
  sizeBytes: number
  updatedAt: string
  publicUrl?: string
}

export interface FilesApiResponse {
  files: AdminFileEntry[]
  summary: {
    totalFiles: number
    totalBytes: number
    byKind: Record<AdminFileKind, number>
    bySource: {
      public: number
      content: number
      blob: number
    }
  }
}

export interface NewArticleFormState {
  title: string
  slug: string
  subtitle: string
  category: string
  excerpt: string
  folder: ProjectFolder
  featured: boolean
}
