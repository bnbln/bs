import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

const workHubsDirectory = path.join(process.cwd(), 'content/work-hubs')
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isAdminEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminEnabled()) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { slug } = req.query
  if (typeof slug !== 'string' || !slugPattern.test(slug)) {
    return res.status(400).json({ error: 'Invalid slug' })
  }

  const fullPath = path.join(workHubsDirectory, `${slug}.md`)

  if (req.method === 'GET') {
    try {
      const content = fs.readFileSync(fullPath, 'utf8')
      return res.status(200).json({ content, slug })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'Work hub not found' })
      }
      return res.status(500).json({ error: 'Failed to read work hub file' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { content } = req.body
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid content' })
      }

      fs.mkdirSync(workHubsDirectory, { recursive: true })
      fs.writeFileSync(fullPath, content, 'utf8')
      return res.status(200).json({ success: true, slug })
    } catch (_error) {
      return res.status(500).json({ error: 'Failed to write work hub file' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
