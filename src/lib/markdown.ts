import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { resolveProjectAssets } from './assets'

const projectsDirectory = path.join(process.cwd(), 'content/projects')

export interface Project {
  id: number
  title: string
  slug: string
  category: string
  excerpts: string
  published: string
  description?: string
  bgColor?: string
  image: string
  video?: string // Existing field for background videos
  hasAnimation: boolean
  animationSequence?: {
    // Legacy image sequence support
    basePath?: string
    startFrame?: number
    endFrame?: number
    // New video sequence support
    videoPath?: string
    frameCount?: number
  }
  featured: boolean
  content?: string
  contentHtml?: string
}

export function getAllProjectSlugs(): string[] {
  const fileNames = fs.readdirSync(projectsDirectory)
  return fileNames
    .filter(name => name.endsWith('.md'))
    .map(fileName => fileName.replace(/\.md$/, ''))
}

export function getAllProjects(): Project[] {
  const slugs = getAllProjectSlugs()
  const projects = slugs.map(slug => getProjectBySlug(slug))
  
  // Sort by published date, newest first
  return projects.sort((a, b) => (a.published > b.published ? -1 : 1))
}

export function getProjectBySlug(slug: string): Project {
  const fullPath = path.join(projectsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const project = {
    slug,
    content,
    ...data
  } as Project

  return resolveProjectAssets(project)
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
    featuredProjects: allProjects.filter(p => p.featured)
  }
}

// Get projects for static generation
export function getStaticProjectPaths() {
  const slugs = getAllProjectSlugs()
  return slugs.map(slug => ({
    params: { slug }
  }))
} 