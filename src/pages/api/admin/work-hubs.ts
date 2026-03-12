import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { WorkHubListResponse, WorkHubSummary } from '../../../components/admin/types'

const workHubsDirectory = path.join(process.cwd(), 'content/work-hubs')
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface CreateWorkHubPayload {
  slug?: unknown
  navLabel?: unknown
  pageTitle?: unknown
}

function isAdminEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'
}

function quoteYaml(value: string): string {
  return JSON.stringify(value)
}

function parseWorkHubFile(slug: string): WorkHubSummary {
  const filePath = path.join(workHubsDirectory, `${slug}.md`)
  const content = fs.readFileSync(filePath, 'utf8')
  const { data } = matter(content)
  const stats = fs.statSync(filePath)
  const frontmatter = data as Record<string, unknown>
  const navLabel = typeof frontmatter.navLabel === 'string' && frontmatter.navLabel.trim()
    ? frontmatter.navLabel.trim()
    : slug
  const pageTitle = typeof frontmatter.pageTitle === 'string' && frontmatter.pageTitle.trim()
    ? frontmatter.pageTitle.trim()
    : navLabel

  return {
    slug,
    navLabel,
    pageTitle,
    filePath: `content/work-hubs/${slug}.md`,
    updatedAt: stats.mtime.toISOString(),
  }
}

function listWorkHubs(): WorkHubSummary[] {
  if (!fs.existsSync(workHubsDirectory)) return []

  return fs.readdirSync(workHubsDirectory)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''))
    .map((slug) => parseWorkHubFile(slug))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

function createWorkHubMarkdown({ slug, navLabel, pageTitle }: { slug: string; navLabel: string; pageTitle: string }): string {
  return [
    '---',
    `navLabel: ${quoteYaml(navLabel)}`,
    `skillsTitle: ${quoteYaml(pageTitle)}`,
    'skillsSubtitle: ""',
    `pageTitle: ${quoteYaml(pageTitle)}`,
    'subtitle: ""',
    'description: ""',
    `seoTitle: ${quoteYaml(`${pageTitle} Work`)}`,
    'seoDescription: ""',
    `projectsHeading: ${quoteYaml(`${navLabel} Projects`)}`,
    'cardDescription: ""',
    `articleTitle: ${quoteYaml(`How This ${navLabel} Hub Works`)}`,
    "headerColor: '#9CA3AF'",
    "canvasColor: '#6B7280'",
    'canvasSpeed: 1',
    'canvasOverscan: 16',
    'canvasOpacity: 1',
    'coreMethods: []',
    'deliverables: []',
    '---',
    '',
    `# ${pageTitle}`,
    '',
    'Describe this content hub.',
    '',
  ].join('\n')
}

function handleGet(_req: NextApiRequest, res: NextApiResponse<WorkHubListResponse>) {
  res.status(200).json({ hubs: listWorkHubs() })
}

function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const body = (req.body || {}) as CreateWorkHubPayload
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''

  if (!slugPattern.test(slug)) {
    return res.status(400).json({ error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' })
  }

  const navLabel = typeof body.navLabel === 'string' && body.navLabel.trim() ? body.navLabel.trim() : slug
  const pageTitle = typeof body.pageTitle === 'string' && body.pageTitle.trim() ? body.pageTitle.trim() : navLabel
  const filePath = path.join(workHubsDirectory, `${slug}.md`)

  fs.mkdirSync(workHubsDirectory, { recursive: true })
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: `A hub with slug "${slug}" already exists.` })
  }

  const markdown = createWorkHubMarkdown({ slug, navLabel, pageTitle })
  fs.writeFileSync(filePath, markdown, 'utf8')
  return res.status(201).json({ hub: parseWorkHubFile(slug) })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminEnabled()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    if (req.method === 'GET') return handleGet(req, res)
    if (req.method === 'POST') return handlePost(req, res)

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to process work hubs request' })
  }
}
