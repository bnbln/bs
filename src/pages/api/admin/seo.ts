import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllProjects } from '../../../lib/markdown'
import {
  buildSeoArtifacts,
  getSeoConfig,
  normalizeSeoConfig,
  validateSeoConfig,
  type SeoConfig,
} from '../../../lib/seo'

const seoConfigPath = path.join(process.cwd(), 'src/config/seo.config.json')
const robotsPath = path.join(process.cwd(), 'public/robots.txt')
const manifestPath = path.join(process.cwd(), 'public/site.webmanifest')

function isAdminEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN === 'true'
}

function readSeoConfigFromDisk(): SeoConfig {
  if (!fs.existsSync(seoConfigPath)) {
    return getSeoConfig()
  }

  const raw = fs.readFileSync(seoConfigPath, 'utf8')
  const parsed = JSON.parse(raw) as Partial<SeoConfig>
  return normalizeSeoConfig(parsed)
}

function writeSeoConfigToDisk(config: SeoConfig) {
  fs.writeFileSync(seoConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

function writeSeoArtifacts(config: SeoConfig) {
  const projects = getAllProjects()
  const artifacts = buildSeoArtifacts(config, projects)

  fs.writeFileSync(robotsPath, artifacts.robotsTxt, 'utf8')
  fs.writeFileSync(manifestPath, `${JSON.stringify(artifacts.manifest, null, 2)}\n`, 'utf8')

  return artifacts
}

function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const config = readSeoConfigFromDisk()
  const artifacts = buildSeoArtifacts(config, getAllProjects())

  return res.status(200).json({
    config,
    generated: {
      robotsTxt: artifacts.robotsTxt,
      manifest: artifacts.manifest,
      sitemapXml: artifacts.sitemapXml,
    },
  })
}

function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const incomingConfig = req.body?.config as Partial<SeoConfig> | undefined
  if (!incomingConfig || typeof incomingConfig !== 'object') {
    return res.status(400).json({ error: 'Invalid payload. Expected { config: SeoConfig }.' })
  }

  const normalized = normalizeSeoConfig(incomingConfig)
  const validation = validateSeoConfig(normalized)
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid SEO configuration.',
      errors: validation.errors,
    })
  }

  writeSeoConfigToDisk(normalized)
  const artifacts = writeSeoArtifacts(normalized)

  return res.status(200).json({
    success: true,
    config: normalized,
    generated: {
      robotsTxt: artifacts.robotsTxt,
      manifest: artifacts.manifest,
      sitemapXml: artifacts.sitemapXml,
    },
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

    if (req.method === 'PUT') {
      return handlePut(req, res)
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process SEO request' })
  }
}
