import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const projectsDirectory = path.join(process.cwd(), 'content/projects')
const archivedProjectsDirectory = path.join(projectsDirectory, 'archive')

function resolveFolder(input: string | string[] | undefined): 'projects' | 'archive' {
    if (Array.isArray(input)) {
        return input[0] === 'archive' ? 'archive' : 'projects'
    }
    return input === 'archive' ? 'archive' : 'projects'
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
            fs.mkdirSync(targetDirectory, { recursive: true })
            fs.writeFileSync(fullPath, content, 'utf8')
            res.status(200).json({ success: true, folder })
        } catch (error) {
            res.status(500).json({ error: 'Failed to write file' })
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
