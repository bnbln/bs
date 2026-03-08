import type { DefaultSeoProps, NextSeoProps } from 'next-seo'
import seoConfigJson from '../config/seo.config.json'
import type { Project } from './markdown'

export const SEO_PAGE_KEYS = [
  'home',
  'about',
  'work',
  'contact',
  'impressum',
  'datenschutzerklaerung',
] as const

type SeoStaticPageKey = typeof SEO_PAGE_KEYS[number]
type SeoChangefreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

const SEO_CHANGEFREQ_VALUES: SeoChangefreq[] = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]

export interface SeoTwitterConfig {
  cardType: 'summary' | 'summary_large_image' | 'app' | 'player'
  handle?: string
  site?: string
}

export interface SeoSiteConfig {
  siteUrl: string
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  siteName: string
  locale: string
  twitter: SeoTwitterConfig
}

export interface SeoAssetsConfig {
  ogDefaultImage: string
  faviconIco: string
  favicon16: string
  favicon32: string
  appleTouchIcon: string
  android192: string
  android512: string
}

export interface SeoAppConfig {
  name: string
  shortName: string
  themeColor: string
  backgroundColor: string
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  startUrl: string
  scope: string
}

export interface SeoPageConfig {
  title: string
  description: string
  path: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  noindex?: boolean
  includeInSitemap?: boolean
  changefreq?: SeoChangefreq
  priority?: number
}

export interface SeoProjectPageConfig {
  titleTemplate: string
  descriptionFallback: string
  pathPrefix: string
  openGraphType: 'article' | 'website'
  ogImageFallback?: string
  includeInSitemap?: boolean
  changefreq?: SeoChangefreq
  priority?: number
}

export interface SeoPagesConfig {
  home: SeoPageConfig
  about: SeoPageConfig
  work: SeoPageConfig
  contact: SeoPageConfig
  impressum: SeoPageConfig
  datenschutzerklaerung: SeoPageConfig
  project: SeoProjectPageConfig
}

export interface SeoRobotsConfig {
  userAgent: string
  allow: string
  disallow: string[]
  additionalDirectives: string[]
  sitemapPath: string
}

export interface SeoConfig {
  site: SeoSiteConfig
  assets: SeoAssetsConfig
  app: SeoAppConfig
  pages: SeoPagesConfig
  robots: SeoRobotsConfig
}

export interface SeoArtifacts {
  robotsTxt: string
  manifest: Record<string, unknown>
  sitemapXml: string
}

const defaultSeoConfig = seoConfigJson as SeoConfig

function sanitizeStringArray(input: unknown, fallback: string[]): string[] {
  if (!Array.isArray(input)) return [...fallback]
  return input
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
}

function sanitizePriority(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(1, Math.max(0, Number(num)))
}

function sanitizeChangefreq(value: unknown, fallback: SeoChangefreq): SeoChangefreq {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase() as SeoChangefreq
  return SEO_CHANGEFREQ_VALUES.includes(normalized) ? normalized : fallback
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function getSeoConfig(): SeoConfig {
  return clone(defaultSeoConfig)
}

export function normalizeSeoConfig(input: Partial<SeoConfig> | null | undefined): SeoConfig {
  const source = input || {}
  const defaults = getSeoConfig()

  const normalized: SeoConfig = {
    site: {
      ...defaults.site,
      ...(source.site || {}),
      twitter: {
        ...defaults.site.twitter,
        ...(source.site?.twitter || {}),
      },
    },
    assets: {
      ...defaults.assets,
      ...(source.assets || {}),
    },
    app: {
      ...defaults.app,
      ...(source.app || {}),
    },
    pages: {
      home: { ...defaults.pages.home, ...(source.pages?.home || {}) },
      about: { ...defaults.pages.about, ...(source.pages?.about || {}) },
      work: { ...defaults.pages.work, ...(source.pages?.work || {}) },
      contact: { ...defaults.pages.contact, ...(source.pages?.contact || {}) },
      impressum: { ...defaults.pages.impressum, ...(source.pages?.impressum || {}) },
      datenschutzerklaerung: {
        ...defaults.pages.datenschutzerklaerung,
        ...(source.pages?.datenschutzerklaerung || {}),
      },
      project: { ...defaults.pages.project, ...(source.pages?.project || {}) },
    },
    robots: {
      ...defaults.robots,
      ...(source.robots || {}),
      disallow: sanitizeStringArray(source.robots?.disallow, defaults.robots.disallow),
      additionalDirectives: sanitizeStringArray(
        source.robots?.additionalDirectives,
        defaults.robots.additionalDirectives
      ),
    },
  }

  normalized.pages.home.priority = sanitizePriority(normalized.pages.home.priority, defaults.pages.home.priority || 1)
  normalized.pages.about.priority = sanitizePriority(normalized.pages.about.priority, defaults.pages.about.priority || 0.8)
  normalized.pages.work.priority = sanitizePriority(normalized.pages.work.priority, defaults.pages.work.priority || 0.8)
  normalized.pages.contact.priority = sanitizePriority(normalized.pages.contact.priority, defaults.pages.contact.priority || 0.8)
  normalized.pages.impressum.priority = sanitizePriority(normalized.pages.impressum.priority, defaults.pages.impressum.priority || 0.3)
  normalized.pages.datenschutzerklaerung.priority = sanitizePriority(
    normalized.pages.datenschutzerklaerung.priority,
    defaults.pages.datenschutzerklaerung.priority || 0.3
  )
  normalized.pages.project.priority = sanitizePriority(
    normalized.pages.project.priority,
    defaults.pages.project.priority || 0.8
  )

  normalized.pages.home.changefreq = sanitizeChangefreq(normalized.pages.home.changefreq, defaults.pages.home.changefreq || 'weekly')
  normalized.pages.about.changefreq = sanitizeChangefreq(normalized.pages.about.changefreq, defaults.pages.about.changefreq || 'monthly')
  normalized.pages.work.changefreq = sanitizeChangefreq(normalized.pages.work.changefreq, defaults.pages.work.changefreq || 'monthly')
  normalized.pages.contact.changefreq = sanitizeChangefreq(normalized.pages.contact.changefreq, defaults.pages.contact.changefreq || 'monthly')
  normalized.pages.impressum.changefreq = sanitizeChangefreq(normalized.pages.impressum.changefreq, defaults.pages.impressum.changefreq || 'monthly')
  normalized.pages.datenschutzerklaerung.changefreq = sanitizeChangefreq(
    normalized.pages.datenschutzerklaerung.changefreq,
    defaults.pages.datenschutzerklaerung.changefreq || 'monthly'
  )
  normalized.pages.project.changefreq = sanitizeChangefreq(
    normalized.pages.project.changefreq,
    defaults.pages.project.changefreq || 'monthly'
  )

  return normalized
}

export function validateSeoConfig(config: SeoConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const urlRegex = /^https?:\/\/[^/]+/i
  const colorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

  if (!urlRegex.test(config.site.siteUrl)) {
    errors.push('site.siteUrl must be an absolute URL (http/https).')
  }

  if (!config.site.defaultTitle.trim()) errors.push('site.defaultTitle is required.')
  if (!config.site.titleTemplate.trim()) errors.push('site.titleTemplate is required.')
  if (!config.site.defaultDescription.trim()) errors.push('site.defaultDescription is required.')
  if (!config.site.locale.trim()) errors.push('site.locale is required.')

  if (!colorRegex.test(config.app.themeColor)) errors.push('app.themeColor must be a hex color (#RRGGBB or #RGB).')
  if (!colorRegex.test(config.app.backgroundColor)) errors.push('app.backgroundColor must be a hex color (#RRGGBB or #RGB).')

  SEO_PAGE_KEYS.forEach((key) => {
    const page = config.pages[key]
    if (!page.path.startsWith('/')) errors.push(`pages.${key}.path must start with "/".`)
  })

  if (!config.pages.project.pathPrefix.startsWith('/')) {
    errors.push('pages.project.pathPrefix must start with "/".')
  }

  if (!config.robots.allow.startsWith('/')) {
    errors.push('robots.allow must start with "/".')
  }

  if (!config.robots.sitemapPath.startsWith('/')) {
    errors.push('robots.sitemapPath must start with "/".')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function trimSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '')
}

function normalizePath(pathValue: string): string {
  const clean = (pathValue || '').split('?')[0].split('#')[0].trim()
  if (!clean) return '/'

  const withLeadingSlash = clean.startsWith('/') ? clean : `/${clean}`
  if (withLeadingSlash === '/') return '/'

  if (/\.[a-z0-9]+$/i.test(withLeadingSlash)) return withLeadingSlash
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function toAbsoluteUrl(config: SeoConfig, value: string): string {
  if (!value) return trimSiteUrl(config.site.siteUrl)
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`

  const normalizedSite = trimSiteUrl(config.site.siteUrl)
  return `${normalizedSite}${value.startsWith('/') ? value : `/${value}`}`
}

function applyTitleTemplate(rawTitle: string, template: string): string {
  const title = rawTitle.trim()
  if (!title) return ''
  if (template.includes('%s')) return template.replace('%s', title)
  return `${title} ${template}`.trim()
}

function buildOgImages(config: SeoConfig, imagePath: string | undefined, alt: string) {
  const image = imagePath || config.assets.ogDefaultImage
  return [
    {
      url: toAbsoluteUrl(config, image),
      width: 1200,
      height: 630,
      alt,
    },
  ]
}

function withOptionalTwitter(config: SeoConfig): DefaultSeoProps['twitter'] {
  return {
    cardType: config.site.twitter.cardType,
    ...(config.site.twitter.handle ? { handle: config.site.twitter.handle } : {}),
    ...(config.site.twitter.site ? { site: config.site.twitter.site } : {}),
  }
}

function formatPriority(priority: number | undefined, fallback: number): string {
  const value = sanitizePriority(priority, fallback)
  return value.toFixed(1)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toSitemapEntry(params: {
  loc: string
  lastmod: string
  changefreq: SeoChangefreq
  priority: string
}): string {
  return [
    '<url>',
    `<loc>${escapeXml(params.loc)}</loc>`,
    `<lastmod>${escapeXml(params.lastmod)}</lastmod>`,
    `<changefreq>${escapeXml(params.changefreq)}</changefreq>`,
    `<priority>${escapeXml(params.priority)}</priority>`,
    '</url>',
  ].join('')
}

function normalizePublishedDate(dateValue: string | undefined): string {
  if (!dateValue) return new Date().toISOString()
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function buildProjectPath(pathPrefix: string, slug: string): string {
  const prefix = pathPrefix.replace(/^\/+|\/+$/g, '')
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '')
  return normalizePath(`/${prefix}/${cleanSlug}`)
}

export function buildCanonical(config: SeoConfig, pathValue: string): string {
  if (/^https?:\/\//i.test(pathValue || '')) {
    return pathValue
  }
  if ((pathValue || '').startsWith('//')) {
    return `https:${pathValue}`
  }
  return toAbsoluteUrl(config, normalizePath(pathValue))
}

export function buildDefaultSeo(config: SeoConfig, pathForCanonical = '/'): DefaultSeoProps {
  const canonical = buildCanonical(config, pathForCanonical)
  const ogTitle = config.site.defaultTitle
  const ogDescription = config.site.defaultDescription

  return {
    titleTemplate: config.site.titleTemplate,
    defaultTitle: config.site.defaultTitle,
    description: config.site.defaultDescription,
    canonical,
    openGraph: {
      type: 'website',
      locale: config.site.locale,
      url: canonical,
      siteName: config.site.siteName,
      title: ogTitle,
      description: ogDescription,
      images: buildOgImages(config, config.assets.ogDefaultImage, config.site.defaultTitle),
    },
    twitter: withOptionalTwitter(config),
    additionalMetaTags: [
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'theme-color',
        content: config.app.themeColor,
      },
    ],
    additionalLinkTags: [
      {
        rel: 'icon',
        href: config.assets.faviconIco,
      },
      {
        rel: 'icon',
        href: config.assets.favicon16,
        sizes: '16x16',
        type: 'image/png',
      },
      {
        rel: 'icon',
        href: config.assets.favicon32,
        sizes: '32x32',
        type: 'image/png',
      },
      {
        rel: 'apple-touch-icon',
        href: config.assets.appleTouchIcon,
        sizes: '180x180',
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    ],
  }
}

export function buildPageSeo(config: SeoConfig, key: SeoStaticPageKey): NextSeoProps {
  const page = config.pages[key]
  const canonical = buildCanonical(config, page.path)
  const cleanTitle = page.title.trim()
  const title = cleanTitle || undefined
  const description = page.description || config.site.defaultDescription
  const ogTitle = page.ogTitle || (title ? applyTitleTemplate(title, config.site.titleTemplate) : config.site.defaultTitle)
  const ogDescription = page.ogDescription || description

  return {
    ...(title ? { title } : {}),
    description,
    canonical,
    noindex: Boolean(page.noindex),
    openGraph: {
      type: 'website',
      locale: config.site.locale,
      siteName: config.site.siteName,
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      images: buildOgImages(config, page.ogImage, ogTitle),
    },
  }
}

export function buildProjectSeo(config: SeoConfig, project: Project): NextSeoProps {
  const projectConfig = config.pages.project
  const titleBase = project.title || 'Project'
  const title = applyTitleTemplate(titleBase, projectConfig.titleTemplate || '%s') || titleBase
  const description = project.excerpts || projectConfig.descriptionFallback || config.site.defaultDescription
  const canonical = buildCanonical(config, buildProjectPath(projectConfig.pathPrefix, project.slug))
  const section = Array.isArray(project.category)
    ? (project.category[0] || 'Project')
    : (project.category || 'Project')
  const heroImage = project.heroImage || project.image || projectConfig.ogImageFallback || config.assets.ogDefaultImage

  const openGraph: NonNullable<NextSeoProps['openGraph']> = {
    type: projectConfig.openGraphType,
    locale: config.site.locale,
    siteName: config.site.siteName,
    url: canonical,
    title,
    description,
    images: buildOgImages(config, heroImage, titleBase),
  }

  if (projectConfig.openGraphType === 'article') {
    openGraph.article = {
      publishedTime: normalizePublishedDate(project.published),
      section,
    }
  }

  return {
    title,
    description,
    canonical,
    openGraph,
  }
}

export function buildRobots(config: SeoConfig): string {
  const lines = [
    `User-agent: ${config.robots.userAgent}`,
    `Allow: ${config.robots.allow}`,
  ]

  config.robots.disallow.forEach((value) => {
    lines.push(`Disallow: ${value}`)
  })

  config.robots.additionalDirectives.forEach((value) => {
    lines.push(value)
  })

  lines.push(`Sitemap: ${toAbsoluteUrl(config, config.robots.sitemapPath)}`)
  return `${lines.join('\n')}\n`
}

export function buildManifest(config: SeoConfig): Record<string, unknown> {
  return {
    name: config.app.name,
    short_name: config.app.shortName,
    icons: [
      {
        src: config.assets.android192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: config.assets.android512,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: config.app.themeColor,
    background_color: config.app.backgroundColor,
    display: config.app.display,
    start_url: config.app.startUrl,
    scope: config.app.scope,
  }
}

export function buildSitemap(config: SeoConfig, projects: Project[]): string {
  const entries: string[] = []
  const now = new Date().toISOString()

  SEO_PAGE_KEYS.forEach((key) => {
    const page = config.pages[key]
    if (page.includeInSitemap === false || page.noindex) return

    entries.push(
      toSitemapEntry({
        loc: buildCanonical(config, page.path),
        lastmod: now,
        changefreq: page.changefreq || 'monthly',
        priority: formatPriority(page.priority, key === 'home' ? 1 : 0.8),
      })
    )
  })

  if (config.pages.project.includeInSitemap !== false) {
    projects.forEach((project) => {
      if (!project.slug) return
      entries.push(
        toSitemapEntry({
          loc: buildCanonical(config, buildProjectPath(config.pages.project.pathPrefix, project.slug)),
          lastmod: normalizePublishedDate(project.published),
          changefreq: config.pages.project.changefreq || 'monthly',
          priority: formatPriority(config.pages.project.priority, 0.8),
        })
      )
    })
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join('')
}

export function buildSeoArtifacts(config: SeoConfig, projects: Project[]): SeoArtifacts {
  return {
    robotsTxt: buildRobots(config),
    manifest: buildManifest(config),
    sitemapXml: buildSitemap(config, projects),
  }
}

export function toHtmlLang(locale: string): string {
  if (!locale) return 'en'
  return locale.split('_')[0].toLowerCase()
}
