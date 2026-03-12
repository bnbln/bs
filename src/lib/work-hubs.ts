import type { Project } from './markdown'

export type WorkFilter = 'All' | 'Design' | 'UX/UI' | 'Development'
export type WorkHubSlug = 'design' | 'ux-ui' | 'development'

export const FILTER_OPTIONS: WorkFilter[] = ['All', 'Design', 'UX/UI', 'Development']

export interface SkillShapeConfig {
  object?: string
  scale?: [number, number, number]
  position?: [number, number, number]
  rotation?: [number, number, number]
  hoverScale?: [number, number, number]
}

export interface WorkHubDefinition {
  slug: WorkHubSlug
  filter: Exclude<WorkFilter, 'All'>
}

export const WORK_HUBS: WorkHubDefinition[] = [
  {
    slug: 'design',
    filter: 'Design',
  },
  {
    slug: 'ux-ui',
    filter: 'UX/UI',
  },
  {
    slug: 'development',
    filter: 'Development',
  },
]

export const WORK_HUB_SLUGS: WorkHubSlug[] = WORK_HUBS.map((hub) => hub.slug)

export const WORK_HUB_BY_SLUG: Record<WorkHubSlug, WorkHubDefinition> = WORK_HUBS.reduce(
  (acc, hub) => {
    acc[hub.slug] = hub
    return acc
  },
  {} as Record<WorkHubSlug, WorkHubDefinition>
)

export const normalizeTag = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')

function normalizeHubSlug(value: unknown): WorkHubSlug | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()

  if (normalized === 'uxui' || normalized === 'uiux') return 'ux-ui'
  if (normalized === 'design' || normalized === 'ux-ui' || normalized === 'development') {
    return normalized
  }

  return null
}

export function getProjectContentHubs(project: Project): WorkHubSlug[] {
  const raw = project as Project & Record<string, unknown>
  const preferred = Array.isArray(project.contentHubs)
    ? project.contentHubs
    : raw['content-hubs']
  const values = Array.isArray(preferred) ? preferred : typeof preferred === 'string' ? preferred.split(',') : []
  const normalized = values
    .map((entry) => normalizeHubSlug(entry))
    .filter((entry): entry is WorkHubSlug => Boolean(entry))

  return Array.from(new Set(normalized))
}

export const isUxUiTag = (value: string) => {
  const normalized = normalizeTag(value)
  return normalized.includes('uxui') || normalized.includes('uiux')
}

export const isDevelopmentTag = (value: string) => {
  const normalized = normalizeTag(value)
  return normalized.includes('development') || normalized.includes('developement') || normalized === 'dev'
}

export const isDesignTag = (value: string) => {
  if (isUxUiTag(value)) return false
  return normalizeTag(value).includes('design')
}

export function getProjectCategoryTags(project: Project) {
  const contentHubs = getProjectContentHubs(project)
  if (contentHubs.length > 0) {
    return {
      isDev: contentHubs.includes('development'),
      isDesign: contentHubs.includes('design'),
      isUxUi: contentHubs.includes('ux-ui'),
    }
  }

  if (project.type) {
    const types = Array.isArray(project.type) ? project.type : [project.type]
    const isUxUi = types.some(isUxUiTag)

    return {
      isDev: types.some(isDevelopmentTag),
      isDesign: types.some(isDesignTag),
      isUxUi,
    }
  }

  const catVal = project.category
  const rawCategoryTags = Array.isArray(catVal) ? catVal : [catVal || '']
  const categoryTags = rawCategoryTags
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  const isUxUi = categoryTags.some(isUxUiTag)
  const isDev = categoryTags.some(
    (tag) =>
      isDevelopmentTag(tag) ||
      normalizeTag(tag).includes('code') ||
      normalizeTag(tag).includes('tech')
  )
  const isDesign = categoryTags.some(
    (tag) =>
      isDesignTag(tag) ||
      normalizeTag(tag).includes('branding') ||
      normalizeTag(tag).includes('promotion') ||
      normalizeTag(tag).includes('art') ||
      normalizeTag(tag).includes('motion')
  )

  return { isDev, isDesign, isUxUi }
}

export function matchesWorkFilter(project: Project, filter: WorkFilter): boolean {
  if (filter === 'All') return true

  const { isDev, isDesign, isUxUi } = getProjectCategoryTags(project)

  if (filter === 'Design') return isDesign
  if (filter === 'UX/UI') return isUxUi
  if (filter === 'Development') return isDev

  return false
}

export function getHubBySlug(slug: string): WorkHubDefinition | undefined {
  return WORK_HUBS.find((hub) => hub.slug === slug)
}

export function getProjectsForHub(projects: Project[], slug: WorkHubSlug): Project[] {
  const hub = WORK_HUB_BY_SLUG[slug]
  return projects.filter((project) => matchesWorkFilter(project, hub.filter))
}
