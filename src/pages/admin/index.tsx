import Link from 'next/link'
import { FilePlus2, Layers, Rocket, Settings, Sparkles } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { formatDateTime } from '../../components/admin/utils'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

export default function AdminDashboardPage() {
  const { projects, archivedProjects, sitePages, totals, loading, error } = useAdminContent()

  const recentPosts = [...projects, ...archivedProjects]
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, 8)

  const dynamicPagesCount = sitePages.filter((page) => page.dynamic).length

  return (
    <AdminLayout
      active="dashboard"
      title="Dashboard"
      description="Zentrale Uebersicht mit Live-Status fuer Seiten, Artikel, Archive und SEO-Einstellungen."
      counts={{
        pages: totals.pages,
        livePosts: totals.live,
        archivedPosts: totals.archive,
      }}
      actions={
        <Link
          href="/admin/posts"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <FilePlus2 size={14} className="mr-2" />
          New Post
        </Link>
      }
    >
      {error ? (
        <StatePanel
          title="Access denied"
          message={`${error} Bitte starte den Admin-Server mit \"npm run backend\".`}
          tone="error"
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Pages" value={totals.pages} helper={`${dynamicPagesCount} dynamisch`} tone="green" />
            <KpiCard label="Published Posts" value={totals.live} helper="content/projects" tone="violet" />
            <KpiCard label="Archive Drafts" value={totals.archive} helper="content/projects/archive" tone="orange" />
            <KpiCard label="Featured Posts" value={totals.featured} helper="Sichtbar in Uebersicht" tone="blue" />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                <Link href="/admin/posts" className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                  Open Posts
                </Link>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-slate-500">Lade Aktivitaet...</p>
              ) : recentPosts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Noch keine Artikel vorhanden.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {recentPosts.map((post) => (
                    <div
                      key={`${post.folder}-${post.slug}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{post.title}</p>
                        <p className="text-xs text-slate-500">{post.slug}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.featured && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Featured
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                            post.isArchived ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {post.isArchived ? 'Archive' : 'Published'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
                <h3 className="text-lg font-bold text-slate-900">Quick Access</h3>
                <div className="mt-4 space-y-2">
                  <Link
                    href="/admin/pages"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Layers size={14} className="text-indigo-500" />
                    Page Registry
                  </Link>
                  <Link
                    href="/admin/posts"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Rocket size={14} className="text-violet-500" />
                    Post Workbench
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={14} className="text-sky-500" />
                    SEO & Meta Settings
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-[0_18px_35px_-20px_rgba(15,23,42,0.7)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">System Health</p>
                <p className="mt-2 text-2xl font-black">{loading ? 'Syncing...' : 'Ready'}</p>
                <p className="mt-2 text-sm text-slate-300">
                  Letztes Projekt-Datum: {recentPosts[0] ? formatDateTime(recentPosts[0].published) : '-'}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs text-white/85">
                  <Sparkles size={12} />
                  Live Admin Mode
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
