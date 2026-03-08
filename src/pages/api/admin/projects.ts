import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
    getAllProjects,
    getAllArchivedProjects,
    getProjectBySlug,
    getArchivedProjectBySlug,
    Project,
    ProjectFolder
} from '../../../lib/markdown'

const projectsDirectory = path.join(process.cwd(), 'content/projects')
const archivedProjectsDirectory = path.join(projectsDirectory, 'archive')
const pagesDirectory = path.join(process.cwd(), 'src/pages')
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface SitePageSummary {
    route: string
    filePath: string
    label: string
    dynamic: boolean
}

interface AdminProjectSummary extends Project {
    folder: ProjectFolder
    isArchived: boolean
    filePath: string
    excerptText: string
}

interface CreateProjectPayload {
    slug?: unknown
    title?: unknown
    subtitle?: unknown
    category?: unknown
    excerpt?: unknown
    featured?: unknown
    folder?: unknown
}

const isAdminEnabled = () =>
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'

function resolveFolder(input: unknown): ProjectFolder {
    return input === 'archive' ? 'archive' : 'projects'
}

function getDirectoryForFolder(folder: ProjectFolder): string {
    return folder === 'archive' ? archivedProjectsDirectory : projectsDirectory
}

function quoteYaml(value: string): string {
    return JSON.stringify(value)
}

function getExcerpt(project: Project): string {
    const candidate = project as unknown as Record<string, unknown>
    const excerpt = typeof candidate.excerpt === 'string' ? candidate.excerpt.trim() : ''
    if (typeof project.excerpts === 'string' && project.excerpts.trim()) return project.excerpts.trim()
    if (excerpt) return excerpt
    if (typeof project.description === 'string' && project.description.trim()) return project.description.trim()
    return ''
}

function toAdminProject(project: Project, folder: ProjectFolder): AdminProjectSummary {
    return {
        ...project,
        folder,
        isArchived: folder === 'archive',
        filePath: folder === 'archive'
            ? `content/projects/archive/${project.slug}.md`
            : `content/projects/${project.slug}.md`,
        excerptText: getExcerpt(project)
    }
}

function toRouteFromPageFile(relativePagePath: string): string {
    const normalizedPath = relativePagePath.replace(/\\/g, '/')
    const withoutExtension = normalizedPath.replace(/\.(tsx|ts|jsx|js)$/, '')
    if (withoutExtension === 'index') return '/'
    if (withoutExtension.endsWith('/index')) return `/${withoutExtension.replace(/\/index$/, '')}`
    return `/${withoutExtension}`
}

function getPageLabel(route: string): string {
    if (route === '/') return 'Home'
    return route.replace(/\[(.+?)\]/g, ':$1')
}

function collectSitePages(): SitePageSummary[] {
    if (!fs.existsSync(pagesDirectory)) return []

    const pageFiles: SitePageSummary[] = []

    const walk = (currentDirectory: string, relativeDirectory = '') => {
        const entries = fs.readdirSync(currentDirectory, { withFileTypes: true })

        entries.forEach((entry) => {
            const absolutePath = path.join(currentDirectory, entry.name)
            const relativePath = path.join(relativeDirectory, entry.name).replace(/\\/g, '/')

            if (entry.isDirectory()) {
                if (entry.name === 'api' || entry.name === 'admin' || entry.name.startsWith('_')) return
                walk(absolutePath, relativePath)
                return
            }

            if (!entry.isFile()) return
            if (entry.name.startsWith('_')) return
            if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) return
            if (relativePath.startsWith('api/') || relativePath.startsWith('admin/')) return

            const route = toRouteFromPageFile(relativePath)
            pageFiles.push({
                route,
                filePath: `src/pages/${relativePath}`,
                label: getPageLabel(route),
                dynamic: route.includes('[')
            })
        })
    }

    walk(pagesDirectory)
    return pageFiles.sort((a, b) => a.route.localeCompare(b.route))
}

function createProjectMarkdown({
    nextId,
    title,
    subtitle,
    slug,
    category,
    excerpt,
    featured
}: {
    nextId: number
    title: string
    subtitle: string
    slug: string
    category: string
    excerpt: string
    featured: boolean
}): string {
    const publishedDate = new Date().toISOString().slice(0, 10)

    return [
        '---',
        `id: ${nextId}`,
        `title: ${quoteYaml(title)}`,
        `subtitle: ${quoteYaml(subtitle)}`,
        `slug: ${slug}`,
        `category: ${quoteYaml(category)}`,
        `published: '${publishedDate}'`,
        "image: assets/heroimage-bg.jpg",
        `excerpt: ${quoteYaml(excerpt)}`,
        "bgColor: '#E5E7EB'",
        'hasAnimation: false',
        `featured: ${featured ? 'true' : 'false'}`,
        `type: ${quoteYaml('Design')}`,
        '---',
        `# ${title}`,
        '',
        'Neuer Entwurf. Inhalt folgt.',
        ''
    ].join('\n')
}

function handleGet(req: NextApiRequest, res: NextApiResponse) {
    const projects = getAllProjects().map((project) => toAdminProject(project, 'projects'))
    const archivedProjects = getAllArchivedProjects().map((project) => toAdminProject(project, 'archive'))
    const sitePages = collectSitePages()

    res.status(200).json({
        projects,
        archivedProjects,
        sitePages
    })
}

function handlePost(req: NextApiRequest, res: NextApiResponse) {
    const body = (req.body || {}) as CreateProjectPayload
    const folder = resolveFolder(body.folder)
    const targetDirectory = getDirectoryForFolder(folder)
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''

    if (!slugPattern.test(slug)) {
        return res.status(400).json({ error: 'Invalid slug. Use lowercase letters, numbers, and hyphens only.' })
    }

    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : slug
    const subtitle = typeof body.subtitle === 'string' && body.subtitle.trim() ? body.subtitle.trim() : 'Draft'
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Draft'
    const excerpt = typeof body.excerpt === 'string' && body.excerpt.trim()
        ? body.excerpt.trim()
        : 'Neuer Artikelentwurf.'
    const featured = body.featured === true

    fs.mkdirSync(targetDirectory, { recursive: true })
    const targetFilePath = path.join(targetDirectory, `${slug}.md`)

    if (fs.existsSync(targetFilePath)) {
        return res.status(409).json({ error: `An article with slug "${slug}" already exists in ${folder}.` })
    }

    const allProjects = [...getAllProjects(), ...getAllArchivedProjects()]
    const nextId = allProjects.reduce((maxId, project) => {
        const projectId = Number(project.id)
        if (Number.isFinite(projectId)) return Math.max(maxId, projectId)
        return maxId
    }, 0) + 1

    const markdown = createProjectMarkdown({
        nextId,
        title,
        subtitle,
        slug,
        category,
        excerpt,
        featured
    })

    fs.writeFileSync(targetFilePath, markdown, 'utf8')

    const createdProject = folder === 'archive'
        ? getArchivedProjectBySlug(slug)
        : getProjectBySlug(slug)

    return res.status(201).json({
        project: toAdminProject(createdProject, folder)
    })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!isAdminEnabled()) {
        return res.status(403).json({ error: 'Forbidden' })
    }

    try {
        if (req.method === 'GET') {
            return handleGet(req, res)
        }

        if (req.method === 'POST') {
            return handlePost(req, res)
        }

        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (error) {
        return res.status(500).json({ error: 'Failed to process admin projects request' })
    }
}
