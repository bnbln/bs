import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import type { GetServerSideProps } from 'next'
import { PlusCircle, RefreshCcw } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import ProjectPreviewCard from '../../components/admin/ProjectPreviewCard'
import StatePanel from '../../components/admin/StatePanel'
import type { NewArticleFormState } from '../../components/admin/types'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { slugify } from '../../components/admin/utils'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

const initialFormState: NewArticleFormState = {
  title: '',
  slug: '',
  subtitle: 'Draft',
  category: 'Draft',
  excerpt: '',
  folder: 'archive',
  featured: false,
}

type PostView = 'published' | 'archive'

export default function AdminPostsPage() {
  const { projects, archivedProjects, totals, loading, error, reload } = useAdminContent()

  const [view, setView] = useState<PostView>('published')
  const [query, setQuery] = useState('')

  const [formState, setFormState] = useState<NewArticleFormState>(initialFormState)
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  const activePosts = view === 'published' ? projects : archivedProjects

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return activePosts

    return activePosts.filter((post) => {
      return (
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.slug.toLowerCase().includes(normalizedQuery) ||
        post.filePath.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [activePosts, query])

  const handleCreateArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')
    setCreateSuccess('')

    const trimmedTitle = formState.title.trim()
    const trimmedSlug = formState.slug.trim()

    if (!trimmedTitle) {
      setCreateError('Bitte einen Titel angeben.')
      return
    }

    if (!trimmedSlug) {
      setCreateError('Bitte einen gueltigen Slug angeben.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          title: trimmedTitle,
          slug: trimmedSlug,
        }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Artikel konnte nicht angelegt werden.')
      }

      setFormState({
        ...initialFormState,
        folder: formState.folder,
      })
      setSlugTouched(false)
      setCreateSuccess('Artikel erfolgreich angelegt.')
      await reload()
      setView(formState.folder === 'archive' ? 'archive' : 'published')
    } catch (creationError) {
      setCreateError(creationError instanceof Error ? creationError.message : 'Erstellen fehlgeschlagen.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AdminLayout
      active="posts"
      title="Posts"
      description="Veroeffentlichte Artikel und Archive-Entwuerfe inklusive echter Frontend-Previews fuer FeaturedProjects und Work-Grid."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive }}
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
        <StatePanel
          title="Posts konnten nicht geladen werden"
          message={`${error} Bitte pruefe deinen Admin-Server.`}
          tone="error"
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard label="Published" value={totals.live} tone="violet" />
            <KpiCard label="Archive" value={totals.archive} tone="orange" />
            <KpiCard label="Featured" value={totals.featured} tone="green" />
          </section>

          <section id="new-post" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Post</h3>
                <p className="text-sm text-slate-500">Direkt als Published oder Archive anlegen.</p>
              </div>
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <PlusCircle size={13} />
                SEO danach in Settings pflegen
              </Link>
            </div>

            <form onSubmit={handleCreateArticle} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Titel"
                value={formState.title}
                onChange={(event) => {
                  const nextTitle = event.target.value
                  setFormState((current) => ({
                    ...current,
                    title: nextTitle,
                    slug: slugTouched ? current.slug : slugify(nextTitle),
                  }))
                }}
              />

              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="slug-zb-neuer-post"
                value={formState.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setFormState((current) => ({ ...current, slug: slugify(event.target.value) }))
                }}
              />

              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Subtitle"
                value={formState.subtitle}
                onChange={(event) => setFormState((current) => ({ ...current, subtitle: event.target.value }))}
              />

              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Category"
                value={formState.category}
                onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
              />

              <input
                type="text"
                className="md:col-span-2 xl:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Excerpt (optional)"
                value={formState.excerpt}
                onChange={(event) => setFormState((current) => ({ ...current, excerpt: event.target.value }))}
              />

              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={formState.folder}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    folder: event.target.value === 'archive' ? 'archive' : 'projects',
                  }))
                }
              >
                <option value="projects">Published (content/projects)</option>
                <option value="archive">Archive Draft (content/projects/archive)</option>
              </select>

              <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formState.featured}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                />
                Featured in Uebersicht
              </label>

              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Erstelle...' : 'Artikel erstellen'}
              </button>
            </form>

            {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
            {createSuccess && <p className="mt-3 text-sm text-emerald-600">{createSuccess}</p>}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setView('published')}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                    view === 'published' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Published ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setView('archive')}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                    view === 'archive' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Archive ({archivedProjects.length})
                </button>
              </div>

              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:min-w-[260px]"
                placeholder="Suche nach Titel oder Slug"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Lade Artikel...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Eintraege fuer diese Ansicht.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredPosts.map((project) => (
                  <ProjectPreviewCard key={`${project.folder}-${project.slug}`} project={project} />
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
