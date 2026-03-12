import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { GetServerSideProps } from 'next'
import { PlusCircle, RefreshCcw } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import type { WorkHubListResponse, WorkHubSummary } from '../../components/admin/types'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { formatDateTime, slugify } from '../../components/admin/utils'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

interface HubFormState {
  pageTitle: string
  navLabel: string
  slug: string
}

const initialFormState: HubFormState = {
  pageTitle: '',
  navLabel: '',
  slug: '',
}

export default function AdminHubsPage() {
  const { totals } = useAdminContent()
  const [hubs, setHubs] = useState<WorkHubSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [formState, setFormState] = useState<HubFormState>(initialFormState)

  const reload = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/work-hubs')
      if (!response.ok) {
        throw new Error('Work hubs konnten nicht geladen werden.')
      }

      const payload = (await response.json()) as WorkHubListResponse
      setHubs(payload.hubs || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Work hubs konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const sortedHubs = useMemo(
    () => [...hubs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [hubs]
  )

  const handleCreateHub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')
    setCreateSuccess('')

    const slug = formState.slug.trim()
    if (!slug) {
      setCreateError('Bitte einen gueltigen Slug angeben.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/work-hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          navLabel: formState.navLabel.trim(),
          pageTitle: formState.pageTitle.trim(),
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Hub konnte nicht angelegt werden.')
      }

      setFormState(initialFormState)
      setSlugTouched(false)
      setCreateSuccess('Hub erfolgreich angelegt.')
      await reload()
    } catch (creationError) {
      setCreateError(creationError instanceof Error ? creationError.message : 'Hub konnte nicht angelegt werden.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AdminLayout
      active="hubs"
      title="Content Hubs"
      description="Markdown-Dateien unter content/work-hubs verwalten, neue Hubs anlegen und bestehende bearbeiten."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive, hubs: hubs.length }}
      actions={
        <button
          type="button"
          onClick={() => {
            void reload()
          }}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <RefreshCcw size={14} className="mr-2" />
          Reload
        </button>
      }
    >
      {error ? (
        <StatePanel title="Hubs konnten nicht geladen werden" message={error} tone="error" />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard label="Hub Files" value={hubs.length} tone="violet" />
            <KpiCard label="Published Posts" value={totals.live} tone="blue" />
            <KpiCard label="Archive Drafts" value={totals.archive} tone="orange" />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Hub</h3>
                <p className="text-sm text-slate-500">Erstellt eine neue Datei in content/work-hubs.</p>
              </div>
              <PlusCircle size={18} className="text-slate-400" />
            </div>

            <form onSubmit={handleCreateHub} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Page Title"
                value={formState.pageTitle}
                onChange={(event) => {
                  const nextTitle = event.target.value
                  setFormState((current) => ({
                    ...current,
                    pageTitle: nextTitle,
                    slug: slugTouched ? current.slug : slugify(nextTitle),
                    navLabel: current.navLabel || nextTitle,
                  }))
                }}
              />

              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nav Label"
                value={formState.navLabel}
                onChange={(event) => setFormState((current) => ({ ...current, navLabel: event.target.value }))}
              />

              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="slug-zb-design"
                value={formState.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setFormState((current) => ({ ...current, slug: slugify(event.target.value) }))
                }}
              />

              <button
                type="submit"
                disabled={creating}
                className="md:col-span-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Erstelle Hub...' : 'Hub erstellen'}
              </button>
            </form>

            {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
            {createSuccess && <p className="mt-3 text-sm text-emerald-600">{createSuccess}</p>}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">Hub Markdown Files</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {hubs.length} files
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Lade Hubs...</p>
            ) : sortedHubs.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Hub-Dateien gefunden.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {sortedHubs.map((hub) => (
                  <article key={hub.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{hub.slug}</p>
                        <h4 className="mt-1 text-base font-bold text-slate-900">{hub.pageTitle}</h4>
                        <p className="text-sm text-slate-600">{hub.navLabel}</p>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                        Hub
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">{hub.filePath}</p>
                    <p className="mt-1 text-xs text-slate-400">Updated: {formatDateTime(hub.updatedAt)}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/hub-editor/${hub.slug}`}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Edit Markdown
                      </Link>
                      <Link
                        href={`/work/${hub.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Open Route
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
