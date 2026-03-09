import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { SeoConfig } from '../../lib/seo'
import type { SeoApiResponse } from './types'

interface AdminSeoState {
  config: SeoConfig | null
  generated: SeoApiResponse['generated'] | null
  loading: boolean
  saving: boolean
  error: string
  successMessage: string
  reload: () => Promise<void>
  setConfig: Dispatch<SetStateAction<SeoConfig | null>>
  save: (config: SeoConfig) => Promise<boolean>
}

export function useAdminSeo(): AdminSeoState {
  const [config, setConfig] = useState<SeoConfig | null>(null)
  const [generated, setGenerated] = useState<SeoApiResponse['generated'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/seo')
      if (!response.ok) {
        throw new Error('SEO data could not be loaded.')
      }

      const data = (await response.json()) as SeoApiResponse
      setConfig(data.config)
      setGenerated(data.generated)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load SEO settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(async (nextConfig: SeoConfig): Promise<boolean> => {
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: nextConfig }),
      })

      const payload = await response.json()
      if (!response.ok) {
        const errors = Array.isArray(payload.errors) ? payload.errors.join(' ') : ''
        throw new Error(payload.error ? `${payload.error} ${errors}`.trim() : 'Failed to save SEO settings.')
      }

      const data = payload as SeoApiResponse
      setConfig(data.config)
      setGenerated(data.generated)
      setSuccessMessage('SEO settings saved and artifacts regenerated.')
      return true
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Saving SEO settings failed.')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    config,
    generated,
    loading,
    saving,
    error,
    successMessage,
    reload,
    setConfig,
    save,
  }
}
