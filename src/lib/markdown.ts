import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { resolveProjectAssets } from './assets'
import type { WorkHubSlug } from './work-hubs'

const projectsDirectory = path.join(process.cwd(), 'content/projects')
const archiveProjectsDirectory = path.join(projectsDirectory, 'archive')

export type ProjectFolder = 'projects' | 'archive'
export type ProjectStatus = 'Draft' | 'Published'

const CONTENT_HUB_VALUES: WorkHubSlug[] = ['design', 'ux-ui', 'development']

interface ProjectQueryOptions {
  includeDrafts?: boolean
}

export interface Project {
  id: number
  title: string
  subtitle?: string
  slug: string
  category: string | string[]
  client?: string[]
  collaboration?: any[]
  awards?: string[]
  type?: string | string[]
  excerpts: string
  published: string
  status: ProjectStatus
  updatedAt: string
  contentHubs?: WorkHubSlug[]
  description?: string
  bgColor?: string
  image: string
  video?: string // Existing field for background videos
  featuredMedia?: string // Optional featured media pair: "video|poster"
  pageVideo?: string // New field for page-specific videos
  heroImage?: string // Optional: separates hero image from generic image
  heroLottie?: string // Optional: renders a Lottie animation
  heroHide?: boolean // Optional: hide hero media block entirely
  heroAspect?: string // Optional: custom aspect ratio (e.g. "16/9" or "1298/730.125")
  hasAnimation: boolean
  animationSequence?: {
    // Legacy image sequence support
    basePath?: string
    startFrame?: number
    endFrame?: number
    // Spritesheet sequence support (preferred)
    spritesheetPath?: string
    mobileSpritesheetPath?: string
    safariSpritesheetPath?: string
    spriteCount?: number
    columnCount?: number
    rowCount?: number
    // Optional: control scrub speed in Work cards (lower = faster)
    scrollPixelsPerFrame?: number
    // Optional: delay scrub start by N scroll pixels
    scrollStartOffsetPx?: number
    // New video sequence support
    videoPath?: string
    mobileVideoPath?: string
    safariVideoPath?: string
    frameCount?: number
  }
  featured: boolean
  content?: string
  contentHtml?: string
}

function toProjectStatus(value: unknown, fallback: ProjectStatus): ProjectStatus {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()

  if (normalized === 'draft') return 'Draft'
  if (normalized === 'published') return 'Published'
  return fallback
}

function normalizeDateString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed
}

function normalizeContentHubs(value: unknown): WorkHubSlug[] {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const normalized = rawValues
    .map((entry) => String(entry).trim().toLowerCase())
    .map((entry) => (entry === 'uxui' || entry === 'uiux' ? 'ux-ui' : entry))
    .filter((entry): entry is WorkHubSlug => CONTENT_HUB_VALUES.includes(entry as WorkHubSlug))

  return Array.from(new Set(normalized))
}

function getAllProjectSlugsFromDirectory(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  const fileNames = fs.readdirSync(directory)
  return fileNames
    .filter(name => name.endsWith('.md'))
    .map(fileName => fileName.replace(/\.md$/, ''))
}

function getProjectBySlugFromDirectory(slug: string, directory: string, folder: ProjectFolder): Project {
  const fullPath = path.join(directory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  const frontmatter = data as Record<string, unknown>
  const contentHubs = normalizeContentHubs(frontmatter.contentHubs ?? frontmatter['content-hubs'])
  const fallbackPublished = normalizeDateString(frontmatter.published, '1970-01-01')
  const fallbackUpdatedAt = `${fallbackPublished}T00:00:00.000Z`
  const normalizedStatus = folder === 'archive'
    ? 'Draft'
    : toProjectStatus(frontmatter.status, 'Published')

  const project: Project = {
    slug,
    content,
    ...frontmatter,
    status: normalizedStatus,
    updatedAt: normalizeDateString(frontmatter.updatedAt, fallbackUpdatedAt),
    contentHubs,
  } as Project

  return resolveProjectAssets(project)
}

function sortProjectsByPublishedDate(projects: Project[]): Project[] {
  return projects.sort((a, b) => (a.published > b.published ? -1 : 1))
}

export function isPublishedProject(project: Project): boolean {
  return project.status === 'Published'
}

export function getAllProjectSlugs(options: ProjectQueryOptions = {}): string[] {
  return getAllProjects(options).map((project) => project.slug)
}

export function getAllProjects(options: ProjectQueryOptions = {}): Project[] {
  const slugs = getAllProjectSlugsFromDirectory(projectsDirectory)
  const projects = slugs.map((slug) => getProjectBySlugFromDirectory(slug, projectsDirectory, 'projects'))
  const visibleProjects = options.includeDrafts ? projects : projects.filter(isPublishedProject)

  // Sort by published date, newest first
  return sortProjectsByPublishedDate(visibleProjects)
}

export function getAllArchivedProjectSlugs(): string[] {
  return getAllProjectSlugsFromDirectory(archiveProjectsDirectory)
}

export function getAllArchivedProjects(): Project[] {
  const slugs = getAllArchivedProjectSlugs()
  const projects = slugs.map((slug) => getProjectBySlugFromDirectory(slug, archiveProjectsDirectory, 'archive'))
  return sortProjectsByPublishedDate(projects)
}

export function getProjectBySlug(slug: string): Project {
  return getProjectBySlugFromDirectory(slug, projectsDirectory, 'projects')
}

export function getArchivedProjectBySlug(slug: string): Project {
  return getProjectBySlugFromDirectory(slug, archiveProjectsDirectory, 'archive')
}

export async function getProjectWithHtml(slug: string): Promise<Project> {
  const project = getProjectBySlug(slug)

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(project.content || '')

  const contentHtml = processedContent.toString()

  return resolveProjectAssets({
    ...project,
    contentHtml
  })
}

// Helper functions for your current data structure
export function getProjectsData(): {
  projects: Project[]
  featuredProjects: Project[]
} {
  const allProjects = getAllProjects()

  return {
    projects: allProjects.filter(p => !p.featured),
    // FeaturedProjects-Carousel: soll ALLE Projekte zeigen (neueste zuerst)
    featuredProjects: allProjects
  }
}

// Get projects for static generation
export function getStaticProjectPaths() {
  const slugs = getAllProjects().map((project) => project.slug)
  return slugs.map(slug => ({
    params: { slug }
  }))
}
