import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { PlusCircle, RefreshCcw } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import ProjectPreviewCard from '../../components/admin/ProjectPreviewCard'
import StatePanel from '../../components/admin/StatePanel'
import type { DashboardProject, NewArticleFormState } from '../../components/admin/types'
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
type SortField = 'updatedAt' | 'published' | 'id' | 'title'
type SortDirection = 'desc' | 'asc'
type StatusFilter = 'all' | 'published' | 'draft'
type FeaturedFilter = 'all' | 'featured' | 'standard'

const comparePosts = (a: DashboardProject, b: DashboardProject, field: SortField): number => {
  if (field === 'title') return a.title.localeCompare(b.title)
  if (field === 'id') return Number(a.id) - Number(b.id)
  if (field === 'published') return a.published.localeCompare(b.published)
  return a.updatedAt.localeCompare(b.updatedAt)
}

export default function AdminPostsPage() {
  const router = useRouter()
  const { projects, archivedProjects, totals, loading, error, reload } = useAdminContent()

  const [view, setView] = useState<PostView>('published')
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('all')
  const [showFeaturedPreview, setShowFeaturedPreview] = useState(true)
  const [showWorkPreview, setShowWorkPreview] = useState(true)

  const [formState, setFormState] = useState<NewArticleFormState>(initialFormState)
  const [slugTouched, setSlugTouched] = useState(false)
  const [openingEditor, setOpeningEditor] = useState(false)
  const [createError, setCreateError] = useState('')

  const allPosts = useMemo(() => [...projects, ...archivedProjects], [archivedProjects, projects])
  const activePosts = view === 'published' ? projects : archivedProjects

  const getNextProjectId = () =>
    allPosts.reduce((max, post) => {
      const id = Number(post.id)
      return Number.isFinite(id) ? Math.max(max, id) : max
    }, 0) + 1

  const buildUniqueDraftSlug = (seedId: number) => {
    const existingSlugs = new Set(allPosts.map((post) => post.slug))
    let candidate = `draft-${seedId}`
    let suffix = seedId

    while (existingSlugs.has(candidate)) {
      suffix += 1
      candidate = `draft-${suffix}`
    }

    return candidate
  }

  const openEditorForNewPost = async ({
    id,
    slug,
    folder,
    title,
    subtitle,
    category,
    excerpt,
    featured,
  }: {
    id: number
    slug: string
    folder: 'projects' | 'archive'
    title: string
    subtitle: string
    category: string
    excerpt: string
    featured: boolean
  }) => {
    setOpeningEditor(true)
    try {
      const params = new URLSearchParams({
        new: '1',
        folder,
        id: String(id),
        title,
        subtitle,
        category,
        excerpt,
        featured: featured ? '1' : '0',
      })
      await router.push(`/admin/editor/${slug}?${params.toString()}`)
    } catch (creationError) {
      setCreateError(creationError instanceof Error ? creationError.message : 'Editor konnte nicht geoeffnet werden.')
    } finally {
      setOpeningEditor(false)
    }
  }

  const handleQuickDraft = async () => {
    setCreateError('')
    const nextId = getNextProjectId()
    const draftSlug = buildUniqueDraftSlug(nextId)

    await openEditorForNewPost({
      id: nextId,
      slug: draftSlug,
      folder: 'archive',
      title: `Draft ${nextId}`,
      subtitle: 'Draft',
      category: 'Draft',
      excerpt: '',
      featured: false,
    })
  }

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const searched = !normalizedQuery
      ? activePosts
      : activePosts.filter((post) => {
          return (
            post.title.toLowerCase().includes(normalizedQuery) ||
            post.slug.toLowerCase().includes(normalizedQuery) ||
            post.filePath.toLowerCase().includes(normalizedQuery)
          )
        })

    const byStatus = searched.filter((post) => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'draft') return post.status === 'Draft'
      return post.status === 'Published'
    })

    const byFeatured = byStatus.filter((post) => {
      if (featuredFilter === 'all') return true
      if (featuredFilter === 'featured') return post.featured
      return !post.featured
    })

    const sorted = [...byFeatured].sort((a, b) => comparePosts(a, b, sortField))
    return sortDirection === 'asc' ? sorted : sorted.reverse()
  }, [activePosts, featuredFilter, query, sortDirection, sortField, statusFilter])

  const handleCreateArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')

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

    const postsInTargetFolder = formState.folder === 'archive' ? archivedProjects : projects
    const existsInFolder = postsInTargetFolder.some((post) => post.slug === trimmedSlug)
    if (existsInFolder) {
      setCreateError(`Ein Artikel mit dem Slug "${trimmedSlug}" existiert bereits in dieser Ansicht.`)
      return
    }

    const nextId = getNextProjectId()

    await openEditorForNewPost({
      id: nextId,
      slug: trimmedSlug,
      folder: formState.folder,
      title: trimmedTitle,
      subtitle: formState.subtitle.trim(),
      category: formState.category.trim(),
      excerpt: formState.excerpt.trim(),
      featured: formState.featured,
    })
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
                <p className="text-sm text-slate-500">Oeffnet den Editor mit leerem Dokument. Datei wird erst beim ersten Save angelegt.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleQuickDraft()
                  }}
                  disabled={openingEditor}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle size={13} />
                  Leeren Draft direkt oeffnen
                </button>
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  SEO danach in Settings pflegen
                </Link>
              </div>
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
                disabled={openingEditor}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {openingEditor ? 'Oeffne Editor...' : 'Im Editor erstellen'}
              </button>
            </form>

            {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-6">
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value as SortField)}
                >
                  <option value="updatedAt">Sort: Aktualisierung</option>
                  <option value="published">Sort: Published</option>
                  <option value="id">Sort: ID</option>
                  <option value="title">Sort: Titel</option>
                </select>

                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                >
                  <option value="desc">Absteigend</option>
                  <option value="asc">Aufsteigend</option>
                </select>

                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="all">Status: Alle</option>
                  <option value="published">Status: Published</option>
                  <option value="draft">Status: Draft</option>
                </select>

                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={featuredFilter}
                  onChange={(event) => setFeaturedFilter(event.target.value as FeaturedFilter)}
                >
                  <option value="all">Featured: Alle</option>
                  <option value="featured">Featured only</option>
                  <option value="standard">Ohne Featured</option>
                </select>

                <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showFeaturedPreview}
                    onChange={(event) => setShowFeaturedPreview(event.target.checked)}
                  />
                  Featured-Preview
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showWorkPreview}
                    onChange={(event) => setShowWorkPreview(event.target.checked)}
                  />
                  Work-Preview
                </label>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Lade Artikel...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Eintraege fuer diese Ansicht.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredPosts.map((project) => (
                  <ProjectPreviewCard
                    key={`${project.folder}-${project.slug}`}
                    project={project}
                    showFeaturedPreview={showFeaturedPreview}
                    showWorkPreview={showWorkPreview}
                  />
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
