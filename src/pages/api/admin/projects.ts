import { NextApiRequest, NextApiResponse } from 'next'
import { getAllProjects } from '../../../lib/markdown'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return res.status(403).json({ error: 'Forbidden' })
    }

    try {
        const projects = getAllProjects()
        res.status(200).json({ projects })
    } catch (error) {
        res.status(500).json({ error: 'Failed to load projects' })
    }
}
