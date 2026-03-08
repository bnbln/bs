import type { SeoConfig } from '../lib/seo'
import { buildDefaultSeo, getSeoConfig } from '../lib/seo'

export const seoConfig: SeoConfig = getSeoConfig()
export const defaultSEO = buildDefaultSeo(seoConfig)
