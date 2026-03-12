import Link from 'next/link'
import { useMemo } from 'react'
import {
  BarChart3,
  FileText,
  FolderKanban,
  Orbit,
  Layers,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { AdminSection } from './types'

interface AdminLayoutCounts {
  pages?: number
  livePosts?: number
  archivedPosts?: number
  hubs?: number
  files?: number
}

interface AdminLayoutProps {
  active: AdminSection
  title: string
  description: string
  counts?: AdminLayoutCounts
  actions?: ReactNode
  children: ReactNode
}

interface NavigationItem {
  key: AdminSection
  label: string
  href: string
  icon: ReactNode
  badge?: string
}

function badgeClass(active: boolean) {
  return active
    ? 'bg-white/25 text-white border border-white/40'
    : 'bg-white text-slate-500 border border-slate-200'
}

export default function AdminLayout({
  active,
  title,
  description,
  counts,
  actions,
  children,
}: AdminLayoutProps) {
  const navigation = useMemo<NavigationItem[]>(() => {
    return [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/admin',
        icon: <BarChart3 size={16} />,
      },
      {
        key: 'pages',
        label: 'Pages',
        href: '/admin/pages',
        icon: <Layers size={16} />,
        badge: typeof counts?.pages === 'number' ? String(counts.pages) : undefined,
      },
      {
        key: 'posts',
        label: 'Posts',
        href: '/admin/posts',
        icon: <FileText size={16} />,
        badge:
          typeof counts?.livePosts === 'number' || typeof counts?.archivedPosts === 'number'
            ? `${counts?.livePosts || 0}/${counts?.archivedPosts || 0}`
            : undefined,
      },
      {
        key: 'hubs',
        label: 'Hubs',
        href: '/admin/hubs',
        icon: <Orbit size={16} />,
        badge: typeof counts?.hubs === 'number' ? String(counts.hubs) : undefined,
      },
      {
        key: 'files',
        label: 'Files',
        href: '/admin/files',
        icon: <FolderKanban size={16} />,
        badge: typeof counts?.files === 'number' ? String(counts.files) : undefined,
      },
      {
        key: 'settings',
        label: 'Settings',
        href: '/admin/settings',
        icon: <Settings size={16} />,
      },
    ]
  }, [counts?.archivedPosts, counts?.files, counts?.hubs, counts?.livePosts, counts?.pages])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#f4f8ff_0%,#edf1f7_45%,#e6ebf2_100%)] px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1560px]">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white">
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-300">Local Editor</p>
              <h1 className="mt-2 text-xl font-black tracking-tight">Control Center</h1>
              <p className="mt-2 text-sm text-slate-300">
                Seiten, Posts, Files und SEO in einer klaren Admin-Architektur.
              </p>
            </div>

            <nav className="mt-5 space-y-1">
              {navigation.map((item) => {
                const isActive = active === item.key
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}>{item.icon}</span>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(isActive)}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="flex items-center gap-2 font-semibold text-slate-800">
                <Sparkles size={14} className="text-amber-500" />
                Workflow
              </p>
              <p className="mt-2 leading-relaxed">
                `Dashboard` fuer Kennzahlen, `Posts` fuer Artikel, `Hubs` fuer Content-Hub-Markdown, `Settings` fuer SEO und
                Seitendefinitionen.
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <header className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Admin</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                    <Search size={14} className="text-slate-400" />
                    <span className="truncate">Search (coming soon)</span>
                  </div>
                  {actions}
                </div>
              </div>
            </header>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
