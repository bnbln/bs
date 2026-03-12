import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const projectsDirectory = path.join(process.cwd(), 'content/projects')
const archivedProjectsDirectory = path.join(projectsDirectory, 'archive')
type ProjectStatus = 'Draft' | 'Published'

function resolveFolder(input: string | string[] | undefined): 'projects' | 'archive' {
    if (Array.isArray(input)) {
        return input[0] === 'archive' ? 'archive' : 'projects'
    }
    return input === 'archive' ? 'archive' : 'projects'
}

function normalizeStatus(value: unknown): ProjectStatus {
    if (typeof value !== 'string') return 'Published'
    const normalized = value.trim().toLowerCase()
    if (normalized === 'draft') return 'Draft'
    if (normalized === 'published') return 'Published'
    return 'Published'
}

function normalizeHubSlug(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const normalized = value.trim().toLowerCase()
    if (normalized === 'uxui' || normalized === 'uiux') return 'ux-ui'
    if (normalized === 'design' || normalized === 'ux-ui' || normalized === 'development') return normalized
    return null
}

function normalizeHubValues(value: unknown): string[] {
    const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
    const normalized = values
        .map((entry) => normalizeHubSlug(entry))
        .filter((entry): entry is string => Boolean(entry))
    return Array.from(new Set(normalized))
}

function deriveContentHubsFromType(value: unknown): string[] {
    const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
    const derived = values
        .map((entry) => String(entry).trim().toLowerCase())
        .flatMap((entry) => {
            if (!entry) return []
            if (entry.includes('ux') && entry.includes('ui')) return ['ux-ui']
            if (entry.includes('develop') || entry === 'dev') return ['development']
            if (entry.includes('design')) return ['design']
            return []
        })
    return Array.from(new Set(derived))
}

function withManagedFrontmatter(rawContent: string, folder: 'projects' | 'archive'): {
    content: string
    status: ProjectStatus
    updatedAt: string
} {
    const parsed = matter(rawContent)
    const frontmatter = { ...(parsed.data as Record<string, unknown>) }
    const status: ProjectStatus = folder === 'archive' ? 'Draft' : normalizeStatus(frontmatter.status)
    const updatedAt = new Date().toISOString()

    frontmatter.status = status
    frontmatter.updatedAt = updatedAt
    const derivedFromType = deriveContentHubsFromType(frontmatter.type)
    const existingHubs = normalizeHubValues(frontmatter['content-hubs'] ?? frontmatter.contentHubs)
    frontmatter['content-hubs'] = derivedFromType.length > 0 ? derivedFromType : existingHubs
    if (frontmatter.contentHubs !== undefined) delete frontmatter.contentHubs

    return {
        content: matter.stringify(parsed.content, frontmatter),
        status,
        updatedAt,
    }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return res.status(403).json({ error: 'Forbidden' })
    }

    const { slug } = req.query
    if (typeof slug !== 'string') {
        return res.status(400).json({ error: 'Invalid slug' })
    }

    const folder = resolveFolder(req.query.folder)
    const targetDirectory = folder === 'archive' ? archivedProjectsDirectory : projectsDirectory

    // Prevent directory traversal
    const safeSlug = path.basename(slug)
    const fullPath = path.join(targetDirectory, `${safeSlug}.md`)

    if (req.method === 'GET') {
        try {
            const fileContents = fs.readFileSync(fullPath, 'utf8')
            res.status(200).json({ content: fileContents, folder })
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                res.status(404).json({ error: 'Project not found' })
            } else {
                res.status(500).json({ error: 'Failed to read file' })
            }
        }
    } else if (req.method === 'PUT') {
        try {
            const { content } = req.body
            if (typeof content !== 'string') {
                return res.status(400).json({ error: 'Invalid content' })
            }

            const nextDocument = withManagedFrontmatter(content, folder)
            fs.mkdirSync(targetDirectory, { recursive: true })
            fs.writeFileSync(fullPath, nextDocument.content, 'utf8')
            res.status(200).json({
                success: true,
                folder,
                status: nextDocument.status,
                updatedAt: nextDocument.updatedAt,
                content: nextDocument.content,
            })
        } catch (error) {
            res.status(500).json({ error: 'Failed to write file' })
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
