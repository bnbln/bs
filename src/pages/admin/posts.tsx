import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { PlusCircle, Search, RefreshCcw, LayoutGrid, List, MoreHorizontal, GripVertical } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import ProjectPreviewCard from '../../components/admin/ProjectPreviewCard'
import StatePanel from '../../components/admin/StatePanel'
import type { DashboardProject } from '../../components/admin/types'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

type PostView = 'published' | 'archive'
type LayoutMode = 'list' | 'kanban'
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

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('kanban')
  const [view, setView] = useState<PostView>('published')
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('all')
  const [showFeaturedPreview, setShowFeaturedPreview] = useState(true)
  const [showWorkPreview, setShowWorkPreview] = useState(true)

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
    // If in kanban mode, we filter ALL posts, not just 'activePosts' (which depends on 'view')
    const sourcePosts = layoutMode === 'kanban' ? allPosts : activePosts
    const normalizedQuery = query.trim().toLowerCase()
    const searched = !normalizedQuery
      ? sourcePosts
      : sourcePosts.filter((post) => {
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
  }, [activePosts, allPosts, featuredFilter, layoutMode, query, sortDirection, sortField, statusFilter])

  // Splitting posts for Kanban mode
  const kanbanPublished = useMemo(() => filteredPosts.filter((p) => p.folder === 'projects'), [filteredPosts])
  const kanbanArchive = useMemo(() => filteredPosts.filter((p) => p.folder === 'archive'), [filteredPosts])

  return (
    <AdminLayout
      active="posts"
      title="Posts"
      description="Manage all your work posts in list or kanban view."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive }}
      actions={
        <div className="flex items-center gap-4">
          <div className="flex rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
            <button
              onClick={() => setLayoutMode('list')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${layoutMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <List size={16} /> List
            </button>
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${layoutMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
          </div>
          <button
            type="button"
            onClick={() => void handleQuickDraft()}
            disabled={openingEditor}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-[15px] font-bold tracking-wide text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-60"
          >
            <PlusCircle size={18} className="mr-2.5" />
            {openingEditor ? 'Opening...' : 'Neuer Post'}
          </button>
        </div>
      }
    >
      {error ? (
        <StatePanel
          title="Posts konnten nicht geladen werden"
          message={`${error} Bitte pruefe deinen Admin-Server.`}
          tone="error"
        />
      ) : (
        <div className="flex flex-col gap-6 w-full pb-6">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-[32px] bg-green-50 p-6 flex flex-col justify-center border border-green-100">
              <p className="text-[11px] uppercase tracking-widest text-green-600 font-bold mb-1">Published</p>
              <p className="text-3xl font-black text-green-900">{totals.live}</p>
            </div>
            <div className="rounded-[32px] bg-orange-50 p-6 flex flex-col justify-center border border-orange-100">
              <p className="text-[11px] uppercase tracking-widest text-orange-600 font-bold mb-1">Archive</p>
              <p className="text-3xl font-black text-orange-900">{totals.archive}</p>
            </div>
            <div className="rounded-[32px] bg-purple-50 p-6 flex flex-col justify-center border border-purple-100">
              <p className="text-[11px] uppercase tracking-widest text-purple-600 font-bold mb-1">Featured</p>
              <p className="text-3xl font-black text-purple-900">{totals.featured}</p>
            </div>
            {createError && <p className="mt-2 text-sm text-red-600 md:col-span-3">{createError}</p>}
          </section>

          <section className="rounded-[40px] border border-white/60 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 flex-1 flex flex-col xl:p-8">
            <div className="mb-8 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">

              {layoutMode === 'list' && (
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1.5">
                  <button
                    type="button"
                    onClick={() => setView('published')}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${view === 'published' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Published ({projects.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('archive')}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${view === 'archive' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Archive ({archivedProjects.length})
                  </button>
                </div>
              )}

              {layoutMode === 'kanban' && <div className="hidden lg:block flex-1" />}

              <div className="flex flex-col gap-4">
                {/* Top Row: Search and Options */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[280px]">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="Search titles or slugs..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void reload()}
                      className="flex items-center justify-center p-2.5 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200"
                      title="Reload Data"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Pill Filters */}
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                  {/* Status Toggle Group */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                    <div className="flex rounded-full bg-slate-100 p-1 ring-1 ring-slate-200/50">
                      {(['all', 'published', 'draft'] as StatusFilter[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`rounded-full px-3 py-1 text-[12px] font-bold transition-all ${statusFilter === status
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Featured Toggle Group */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Featured</span>
                    <div className="flex rounded-full bg-slate-100 p-1 ring-1 ring-slate-200/50">
                      {(['all', 'featured', 'standard'] as FeaturedFilter[]).map((feat) => (
                        <button
                          key={feat}
                          onClick={() => setFeaturedFilter(feat)}
                          className={`rounded-full px-3 py-1 text-[12px] font-bold transition-all ${featuredFilter === feat
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                          {feat.charAt(0).toUpperCase() + feat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings Toggles */}
                  <div className="flex items-center gap-2 lg:ml-auto">
                    <button
                      onClick={() => setShowFeaturedPreview(!showFeaturedPreview)}
                      className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all border ${showFeaturedPreview
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                      Featured Previews
                    </button>
                    <button
                      onClick={() => setShowWorkPreview(!showWorkPreview)}
                      className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all border ${showWorkPreview
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                      Work Previews
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm font-semibold text-slate-400 animate-pulse">Lade Artikel...</p>
              </div>
            ) : layoutMode === 'list' ? (
              <div className="flex-1 overflow-auto rounded-[32px] bg-slate-50/50 p-4 border border-slate-100 custom-scrollbar">
                {filteredPosts.length === 0 ? (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-sm font-semibold text-slate-400">Keine Eintraege gefunden.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
              </div>
            ) : (
              <div className="flex w-full gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
                {/* Drafts Column */}
                <div className="flex flex-1 min-w-[320px] max-w-[400px] flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[15px] font-bold text-slate-800">Archive / Drafts</h3>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {kanbanArchive.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 rounded-[24px] bg-amber-100 p-3">
                    {kanbanArchive.map((project) => (
                      <div
                        key={`${project.folder}-${project.slug}`}
                        className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-amber-50 border-amber-200 p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200"
                            >
                              {project.status}
                            </span>
                            {project.featured && (
                              <span className="rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                Featured
                              </span>
                            )}
                          </div>
                          <button className="text-slate-400 opacity-0 transition-opacity hover:text-slate-600 group-hover:opacity-100">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-bold leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {project.title}
                          </h4>
                          {project.subtitle && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {project.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-3">
                          <div className="text-[10px] uppercase tracking-widest text-slate-400">
                            Archive / {project.slug}
                          </div>

                          <Link
                            href={`/admin/editor/${project.slug}?folder=archive`}
                            className="absolute inset-0 z-10"
                            aria-label={`Edit ${project.title}`}
                          />
                          <div className="relative z-20 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                            <GripVertical size={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {kanbanArchive.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
                        Keine Drafts
                      </div>
                    )}
                  </div>
                </div>

                {/* Published Column */}
                <div className="flex flex-1 min-w-[320px] max-w-[400px] flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[15px] font-bold text-slate-800">Live / Published</h3>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {kanbanPublished.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 rounded-[24px] bg-emerald-100 p-3">
                    {kanbanPublished.map((project) => (
                      <div
                        key={`${project.folder}-${project.slug}`}
                        className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-emerald-50 border-emerald-200 p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border-emerald-200"
                            >
                              {project.status}
                            </span>
                            {project.featured && (
                              <span className="rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                Featured
                              </span>
                            )}
                          </div>
                          <button className="text-slate-400 opacity-0 transition-opacity hover:text-slate-600 group-hover:opacity-100">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-bold leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {project.title}
                          </h4>
                          {project.subtitle && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {project.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-3">
                          <div className="text-[10px] uppercase tracking-widest text-slate-400">
                            Work / {project.slug}
                          </div>

                          <Link
                            href={`/admin/editor/${project.slug}`}
                            className="absolute inset-0 z-10"
                            aria-label={`Edit ${project.title}`}
                          />
                          <div className="relative z-20 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                            <GripVertical size={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {kanbanPublished.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
                        Keine Live Posts
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
