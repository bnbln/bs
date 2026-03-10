import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import {
  getHubBySlug,
  WORK_HUB_SLUGS,
  type SkillShapeConfig,
  type WorkHubSlug,
} from './work-hubs'

const workHubsDirectory = path.join(process.cwd(), 'content/work-hubs')

type Frontmatter = Record<string, unknown>

export interface WorkHubContent {
  slug: WorkHubSlug
  navLabel: string
  skillsTitle: string
  skillsSubtitle: string
  pageTitle: string
  subtitle: string
  description: string
  seoTitle: string
  seoDescription: string
  projectsHeading: string
  cardDescription: string
  articleTitle: string
  articleHtml: string
  coreMethods: string[]
  deliverables: string[]
  headerColor: string
  canvasColor: string
  canvasSpeed: number
  canvasOverscan: number
  canvasOpacity: number
  shapeConfig?: SkillShapeConfig
}

function ensureString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function ensureStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback]

  const result = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)

  return result.length > 0 ? result : [...fallback]
}

function ensureNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, numeric))
}

function ensureVector3(value: unknown): [number, number, number] | undefined {
  const parseParts = (parts: unknown[]): [number, number, number] | undefined => {
    const numbers = parts.map((entry) => (typeof entry === 'number' ? entry : Number(entry)))
    if (numbers.some((entry) => !Number.isFinite(entry))) return undefined

    if (numbers.length === 1) {
      const unit = numbers[0]
      return [unit, unit, unit]
    }

    if (numbers.length === 3) {
      return [numbers[0], numbers[1], numbers[2]]
    }

    return undefined
  }

  if (Array.isArray(value)) {
    return parseParts(value)
  }

  if (typeof value === 'string') {
    const parts = value
      .split(/[\s,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
    return parseParts(parts)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return [value, value, value]
  }

  return undefined
}

function parseShapeConfig(data: Frontmatter): SkillShapeConfig | undefined {
  const object = ensureString(data.canvasModel)
  const scale = ensureVector3(data.canvasScale)
  const position = ensureVector3(data.canvasPosition)
  const rotation = ensureVector3(data.canvasRotation)
  const hoverScale = ensureVector3(data.canvasHoverScale)

  if (!object && !scale && !position && !rotation && !hoverScale) {
    return undefined
  }

  const shapeConfig: SkillShapeConfig = {}

  if (object) shapeConfig.object = object
  if (scale) shapeConfig.scale = scale
  if (position) shapeConfig.position = position
  if (rotation) shapeConfig.rotation = rotation
  if (hoverScale) shapeConfig.hoverScale = hoverScale

  return shapeConfig
}

function getHubFilePath(slug: WorkHubSlug): string {
  return path.join(workHubsDirectory, `${slug}.md`)
}

function getDefaultHubContent(slug: WorkHubSlug): Omit<WorkHubContent, 'articleHtml'> {
  const baseHub = getHubBySlug(slug)
  if (!baseHub) {
    throw new Error(`Unknown work hub slug: ${slug}`)
  }

  const navLabel = baseHub.filter

  return {
    slug,
    navLabel,
    skillsTitle: navLabel,
    skillsSubtitle: '',
    pageTitle: navLabel,
    subtitle: '',
    description: '',
    seoTitle: `${navLabel} Work`,
    seoDescription: `${navLabel} work hub and matching case studies.`,
    projectsHeading: `${navLabel} Projects`,
    cardDescription: '',
    articleTitle: `How This ${navLabel} Hub Works`,
    coreMethods: [],
    deliverables: [],
    headerColor: '#9CA3AF',
    canvasColor: '#6B7280',
    canvasSpeed: 1,
    canvasOverscan: 16,
    canvasOpacity: 1,
    shapeConfig: undefined,
  }
}

export async function getWorkHubContentBySlug(slug: WorkHubSlug): Promise<WorkHubContent> {
  const defaults = getDefaultHubContent(slug)
  const filePath = getHubFilePath(slug)

  if (!fs.existsSync(filePath)) {
    return {
      ...defaults,
      articleHtml: '',
    }
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const frontmatter = data as Frontmatter

  const articleHtml = content.trim()
    ? (await remark().use(html).process(content)).toString()
    : ''

  const navLabel = ensureString(frontmatter.navLabel, defaults.navLabel)
  const pageTitle = ensureString(frontmatter.pageTitle, defaults.pageTitle)
  const description = ensureString(frontmatter.description, defaults.description)

  return {
    slug,
    navLabel,
    skillsTitle: ensureString(frontmatter.skillsTitle, pageTitle),
    skillsSubtitle: ensureString(frontmatter.skillsSubtitle),
    pageTitle,
    subtitle: ensureString(frontmatter.subtitle, defaults.subtitle),
    description,
    seoTitle: ensureString(frontmatter.seoTitle, `${pageTitle} Work`),
    seoDescription: ensureString(frontmatter.seoDescription, description || defaults.seoDescription),
    projectsHeading: ensureString(frontmatter.projectsHeading, `${navLabel} Projects`),
    cardDescription: ensureString(frontmatter.cardDescription, description),
    articleTitle: ensureString(frontmatter.articleTitle, `How This ${navLabel} Hub Works`),
    articleHtml,
    coreMethods: ensureStringArray(frontmatter.coreMethods, defaults.coreMethods),
    deliverables: ensureStringArray(frontmatter.deliverables, defaults.deliverables),
    headerColor: ensureString(frontmatter.headerColor, defaults.headerColor),
    canvasColor: ensureString(frontmatter.canvasColor, defaults.canvasColor),
    canvasSpeed: ensureNumber(frontmatter.canvasSpeed, defaults.canvasSpeed, 0.05, 5),
    canvasOverscan: ensureNumber(frontmatter.canvasOverscan, defaults.canvasOverscan, 0, 80),
    canvasOpacity: ensureNumber(frontmatter.canvasOpacity, defaults.canvasOpacity, 0.1, 1),
    shapeConfig: parseShapeConfig(frontmatter),
  }
}

export async function getAllWorkHubContent(): Promise<WorkHubContent[]> {
  return Promise.all(WORK_HUB_SLUGS.map((slug) => getWorkHubContentBySlug(slug)))
}
