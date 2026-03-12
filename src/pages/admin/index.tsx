import Link from 'next/link'
import { FilePlus2, Layers, Rocket, Settings, Sparkles, Activity } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import type { GetServerSideProps } from 'next'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { formatDateTime } from '../../components/admin/utils'
import { requireAdminServerSideProps } from '../../lib/admin-auth'
import DashboardKanban from '../../components/admin/DashboardKanban'
import CalendarWidget from '../../components/admin/CalendarWidget'
import type { WorkHubListResponse, WorkHubSummary, DashboardProject, SitePageSummary } from '../../components/admin/types'

type DashboardView = 'pipeline' | 'activity'

interface ActivityItem {
  id: string
  title: string
  type: string
  updatedAt: string
  url: string
}

export default function AdminDashboardPage() {
  const { projects, archivedProjects, sitePages, totals, loading, error } = useAdminContent()
  const [hubs, setHubs] = useState<WorkHubSummary[]>([])
  const [hubsLoading, setHubsLoading] = useState(true)
  const [view, setView] = useState<DashboardView>('pipeline')

  useEffect(() => {
    async function fetchHubs() {
      try {
        const res = await fetch('/api/admin/work-hubs')
        if (res.ok) {
          const data = (await res.json()) as WorkHubListResponse
          setHubs(data.hubs || [])
        }
      } catch (err) {
        console.error('Failed to fetch hubs', err)
      } finally {
        setHubsLoading(false)
      }
    }
    fetchHubs()
  }, [])

  const allProjects = [...projects, ...archivedProjects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const activities = useMemo(() => {
    const items: ActivityItem[] = []
    allProjects.forEach(p => {
      items.push({
        id: p.slug,
        title: p.title,
        type: 'Post',
        updatedAt: p.updatedAt,
        url: p.folder === 'archive' ? `/admin/editor/${p.slug}?folder=archive` : `/admin/editor/${p.slug}`
      })
    })
    hubs.forEach(h => {
      items.push({
        id: h.slug,
        title: h.navLabel || h.pageTitle,
        type: 'Content Hub',
        updatedAt: h.updatedAt,
        url: '/admin/hubs'
      })
    })
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [allProjects, hubs])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  return (
    <AdminLayout
      active="dashboard"
      title="Dashboard"
      description="Übersicht aller Work Posts, Content Hubs und Publikationen."
      counts={{
        pages: totals.pages,
        livePosts: totals.live,
        archivedPosts: totals.archive,
      }}
      actions={
        <Link
          href="/admin/posts"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-[15px] font-bold tracking-wide text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-95"
        >
          <FilePlus2 size={18} className="mr-2.5" />
          Create Task
        </Link>
      }
    >
      {error ? (
        <StatePanel
          title="Access denied"
          message={`${error} Bitte starte den Admin-Server mit "npm run backend".`}
          tone="error"
        />
      ) : (
        <div className="flex flex-col gap-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-800">
              {greeting}, Benedikt.
            </h2>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row pb-6 items-start">
            {/* Main Area: Kanban Boards / Activity */}
            <div className="flex flex-1 w-full flex-col overflow-hidden rounded-[40px] border border-white/60 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100/80 px-8 py-6 gap-4">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Daily Operation</h3>
                  <div className="flex rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
                    <button
                      onClick={() => setView('pipeline')}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${view === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      Pipeline
                    </button>
                    <button
                      onClick={() => setView('activity')}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${view === 'activity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      Activity
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 sm:gap-8">
                  <div className="text-center bg-indigo-50/50 px-4 py-2.5 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-0.5">Total Tasks</p>
                    <p className="text-2xl font-black text-indigo-700 leading-none">{allProjects.length}</p>
                  </div>
                  <div className="text-center bg-sky-50/50 px-4 py-2.5 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-0.5">Content Hubs</p>
                    <p className="text-2xl font-black text-sky-700 leading-none">{hubs.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto bg-slate-50/30 p-8 custom-scrollbar">
                {loading || hubsLoading ? (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400 animate-pulse">
                    Loading Data...
                  </div>
                ) : view === 'pipeline' ? (
                  <DashboardKanban projects={allProjects} hubs={hubs} />
                ) : (
                  <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                    {activities.length === 0 ? (
                      <div className="text-center py-10 text-sm font-semibold text-slate-400">No recent activity.</div>
                    ) : (
                      activities.map((item, i) => (
                        <Link key={i} href={item.url} className="flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <Activity size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</p>
                              <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">{item.type} • {item.id}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-slate-500">{formatDateTime(item.updatedAt)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar: Calendar & Timelines */}
            <aside className="flex w-full shrink-0 flex-col rounded-[40px] border border-white/60 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 xl:max-w-[340px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                  Loading Calendar...
                </div>
              ) : (
                <CalendarWidget projects={allProjects} />
              )}
            </aside>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
