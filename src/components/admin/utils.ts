import type { DashboardProject } from './types'

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const formatCategory = (project: DashboardProject): string => {
  if (Array.isArray(project.category)) return project.category.join(', ')
  return project.category || 'Unkategorisiert'
}

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  const precision = value >= 10 || index === 0 ? 0 : 1
  return `${value.toFixed(precision)} ${units[index]}`
}

export const formatDateTime = (iso: string): string => {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return '-'

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}
