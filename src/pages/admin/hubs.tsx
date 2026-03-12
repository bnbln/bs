import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { GetServerSideProps } from 'next'
import { PlusCircle, RefreshCcw, FileText, ExternalLink, Edit } from 'lucide-react'
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
      description="Manage your taxonomy by creating and editing Content Hub markdown files."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive, hubs: hubs.length }}
      actions={
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-[15px] font-bold tracking-wide text-slate-700 transition-colors hover:bg-slate-50 shadow-sm active:scale-95"
          >
            <RefreshCcw size={18} className="mr-2" />
            Reload
          </button>
        </div>
      }
    >
      {error ? (
        <StatePanel title="Hubs konnten nicht geladen werden" message={error} tone="error" />
      ) : (
        <div className="flex flex-col gap-6 lg:gap-8 w-full pb-8">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-[32px] bg-sky-50 p-6 flex flex-col justify-center border border-sky-100">
              <p className="text-[11px] uppercase tracking-widest text-sky-600 font-bold mb-1">Hub Files</p>
              <p className="text-3xl font-black text-sky-900">{hubs.length}</p>
            </div>
            <div className="rounded-[32px] bg-green-50 p-6 flex flex-col justify-center border border-green-100">
              <p className="text-[11px] uppercase tracking-widest text-green-600 font-bold mb-1">Published Posts</p>
              <p className="text-3xl font-black text-green-900">{totals.live}</p>
            </div>
            <div className="rounded-[32px] bg-orange-50 p-6 flex flex-col justify-center border border-orange-100">
              <p className="text-[11px] uppercase tracking-widest text-orange-600 font-bold mb-1">Archive Drafts</p>
              <p className="text-3xl font-black text-orange-900">{totals.archive}</p>
            </div>
          </section>

          <section className="rounded-[40px] border border-white/60 bg-white p-6 lg:p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 rounded-l-2xl"></div>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 pl-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <PlusCircle size={20} className="text-slate-400" />
                  Create New Hub
                </h3>
                <p className="text-[15px] font-medium text-slate-500 mt-1">Generates a new layout file under `content/work-hubs/`.</p>
              </div>
            </div>

            <form onSubmit={handleCreateHub} className="grid grid-cols-1 gap-6 md:grid-cols-4 pl-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-2">Page Title</label>
                <input
                  type="text"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. Design Systems"
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
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-2">Nav Label</label>
                <input
                  type="text"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. Design"
                  value={formState.navLabel}
                  onChange={(event) => setFormState((current) => ({ ...current, navLabel: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-2">URL Slug</label>
                <input
                  type="text"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="e.g. design-systems"
                  value={formState.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setFormState((current) => ({ ...current, slug: slugify(event.target.value) }))
                  }}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-[52px] content-center rounded-full bg-slate-900 px-6 text-[15px] font-bold tracking-wide text-white transition-colors hover:bg-slate-700 shadow-lg shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  {creating ? 'Erstelle Hub...' : 'Hub erstellen'}
                </button>
              </div>
            </form>

            {createError && <p className="mt-4 text-sm font-medium text-red-600 pl-6">{createError}</p>}
            {createSuccess && <p className="mt-4 text-sm font-medium text-emerald-600 pl-6">{createSuccess}</p>}
          </section>

          <section className="rounded-[40px] border border-white/60 bg-white p-6 lg:p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 flex-1 flex flex-col">
            <div className="mb-8 flex items-center justify-between gap-4 border-b border-slate-100/80 pb-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Hub Markdown Files</h3>
              <span className="rounded-full bg-slate-100 px-4 py-1.5 text-[13px] font-black text-slate-600 ring-1 ring-slate-200/50">
                {hubs.length} Hubs
              </span>
            </div>

            <div className="flex-1 overflow-auto rounded-[32px] bg-slate-50/50 p-4 border border-slate-100 custom-scrollbar">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-[15px] font-semibold text-slate-400 animate-pulse">Lade Hubs...</p>
                </div>
              ) : sortedHubs.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-[15px] font-semibold text-slate-400">Keine Hub-Dateien gefunden.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  {sortedHubs.map((hub) => (
                    <article key={hub.slug} className="group flex flex-col justify-between rounded-[32px] border border-white bg-white p-6 shadow-sm transition-all hover:shadow-[0_10px_40px_-15px_rgba(15,23,42,0.1)] hover:border-indigo-100 ring-1 ring-slate-100 hover:ring-indigo-100">
                      <div>
                        <div className="flex flex-col gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/10">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 leading-tight">{hub.pageTitle}</h4>
                              <p className="text-[15px] font-medium text-slate-500 mt-1">{hub.navLabel}</p>
                            </div>
                          </div>
                          <span className="shrink-0 w-fit rounded-full bg-slate-50 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200/50">
                            /{hub.slug}
                          </span>
                        </div>

                        <div className="space-y-2 rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                          <p className="text-[13px] font-mono text-slate-500 truncate" title={hub.filePath}>{hub.filePath}</p>
                          <p className="text-[13px] font-black text-slate-400">Edited: <span className="font-medium">{formatDateTime(hub.updatedAt)}</span></p>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link
                          href={`/admin/hub-editor/${hub.slug}`}
                          className="flex-1 inline-flex items-center justify-center gap-2.5 rounded-full bg-slate-900 px-4 py-3 text-[15px] font-bold text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                          <Edit size={16} />
                          Open Editor
                        </Link>
                        <Link
                          href={`/work/${hub.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-3 text-[15px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 group"
                        >
                          <span>Live View</span>
                          <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
