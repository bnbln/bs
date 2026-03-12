import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { ArrowLeft, Save } from 'lucide-react'
import AdminLayout from '../../../components/admin/AdminLayout'
import StatePanel from '../../../components/admin/StatePanel'
import { useAdminContent } from '../../../components/admin/useAdminContent'
import { requireAdminServerSideProps } from '../../../lib/admin-auth'

export default function AdminHubEditorPage() {
  const router = useRouter()
  const slugParam = router.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  const { totals } = useAdminContent()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!slug) return

    const load = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`/api/admin/work-hub/${slug}`)
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || 'Hub konnte nicht geladen werden.')
        }

        setContent(typeof payload.content === 'string' ? payload.content : '')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Hub konnte nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [slug])

  const handleSave = async () => {
    if (!slug) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/admin/work-hub/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Speichern fehlgeschlagen.')
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      active="hubs"
      title={slug ? `Hub Editor: ${slug}` : 'Hub Editor'}
      description="Markdown direkt bearbeiten. Diese Datei liegt unter content/work-hubs."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive }}
      actions={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link
            href="/admin/hubs"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back
          </Link>
          <button
            type="button"
            onClick={() => {
              void handleSave()
            }}
            disabled={saving || !slug}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={14} className="mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      {error ? (
        <StatePanel title="Hub Editor Fehler" message={error} tone="error" />
      ) : loading ? (
        <StatePanel title="Lade Hub..." message="Datei wird geladen." />
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
          <textarea
            className="h-[70vh] w-full resize-y rounded-2xl border border-slate-300 bg-[#0f172a] p-4 font-mono text-sm leading-relaxed text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            spellCheck={false}
          />
        </section>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
