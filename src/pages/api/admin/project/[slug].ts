import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const projectsDirectory = path.join(process.cwd(), 'content/projects')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return res.status(403).json({ error: 'Forbidden' })
    }

    const { slug } = req.query
    if (typeof slug !== 'string') {
        return res.status(400).json({ error: 'Invalid slug' })
    }

    // Prevent directory traversal
    const safeSlug = path.basename(slug)
    const fullPath = path.join(projectsDirectory, `${safeSlug}.md`)

    if (req.method === 'GET') {
        try {
            const fileContents = fs.readFileSync(fullPath, 'utf8')
            res.status(200).json({ content: fileContents })
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
            fs.writeFileSync(fullPath, content, 'utf8')
            res.status(200).json({ success: true })
        } catch (error) {
            res.status(500).json({ error: 'Failed to write file' })
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
