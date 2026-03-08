import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { resolveProjectAssets } from './assets'

const projectsDirectory = path.join(process.cwd(), 'content/projects')
const archiveProjectsDirectory = path.join(projectsDirectory, 'archive')

export type ProjectFolder = 'projects' | 'archive'

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
  description?: string
  bgColor?: string
  image: string
  video?: string // Existing field for background videos
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

function getAllProjectSlugsFromDirectory(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  const fileNames = fs.readdirSync(directory)
  return fileNames
    .filter(name => name.endsWith('.md'))
    .map(fileName => fileName.replace(/\.md$/, ''))
}

function getProjectBySlugFromDirectory(slug: string, directory: string): Project {
  const fullPath = path.join(directory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const project = {
    slug,
    content,
    ...data
  } as Project

  return resolveProjectAssets(project)
}

function sortProjectsByPublishedDate(projects: Project[]): Project[] {
  return projects.sort((a, b) => (a.published > b.published ? -1 : 1))
}

export function getAllProjectSlugs(): string[] {
  return getAllProjectSlugsFromDirectory(projectsDirectory)
}

export function getAllProjects(): Project[] {
  const slugs = getAllProjectSlugs()
  const projects = slugs.map(slug => getProjectBySlugFromDirectory(slug, projectsDirectory))

  // Sort by published date, newest first
  return sortProjectsByPublishedDate(projects)
}

export function getAllArchivedProjectSlugs(): string[] {
  return getAllProjectSlugsFromDirectory(archiveProjectsDirectory)
}

export function getAllArchivedProjects(): Project[] {
  const slugs = getAllArchivedProjectSlugs()
  const projects = slugs.map(slug => getProjectBySlugFromDirectory(slug, archiveProjectsDirectory))
  return sortProjectsByPublishedDate(projects)
}

export function getProjectBySlug(slug: string): Project {
  return getProjectBySlugFromDirectory(slug, projectsDirectory)
}

export function getArchivedProjectBySlug(slug: string): Project {
  return getProjectBySlugFromDirectory(slug, archiveProjectsDirectory)
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
  const slugs = getAllProjectSlugs()
  return slugs.map(slug => ({
    params: { slug }
  }))
}
