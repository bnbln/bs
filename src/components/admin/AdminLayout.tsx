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

function badgeClass(isActive: boolean) {
  return isActive
    ? 'bg-white text-slate-900 border border-transparent shadow-sm'
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
        icon: <BarChart3 size={18} />,
      },
      {
        key: 'pages',
        label: 'Pages',
        href: '/admin/pages',
        icon: <Layers size={18} />,
        badge: typeof counts?.pages === 'number' ? String(counts.pages) : undefined,
      },
      {
        key: 'posts',
        label: 'Posts',
        href: '/admin/posts',
        icon: <FileText size={18} />,
        badge:
          typeof counts?.livePosts === 'number' || typeof counts?.archivedPosts === 'number'
            ? `${counts?.livePosts || 0}/${counts?.archivedPosts || 0}`
            : undefined,
      },
      {
        key: 'hubs',
        label: 'Hubs',
        href: '/admin/hubs',
        icon: <Orbit size={18} />,
        badge: typeof counts?.hubs === 'number' ? String(counts.hubs) : undefined,
      },
      {
        key: 'files',
        label: 'Files',
        href: '/admin/files',
        icon: <FolderKanban size={18} />,
        badge: typeof counts?.files === 'number' ? String(counts.files) : undefined,
      },
      {
        key: 'settings',
        label: 'Settings',
        href: '/admin/settings',
        icon: <Settings size={18} />,
      },
    ]
  }, [counts?.archivedPosts, counts?.files, counts?.hubs, counts?.livePosts, counts?.pages])

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 py-6 sm:px-8 lg:px-10 lg:py-8 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="mx-auto max-w-[1600px] h-[calc(100vh-48px)] lg:h-[calc(100vh-64px)] grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">
        {/* Sticky Sidebar */}
        <aside className="sticky top-6 lg:top-8 h-fit lg:h-full flex flex-col rounded-[40px] bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] border border-slate-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>

          <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20">
                <Sparkles size={18} className="text-white relative z-10 drop-shadow-md" fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Environment</p>
                <h1 className="mt-0.5 text-lg font-black tracking-tight leading-tight">Local CMS</h1>
              </div>
            </div>
          </div>

          <nav className="mt-8 flex-1 space-y-2 relative z-10">
            {navigation.map((item) => {
              const isActive = active === item.key
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group flex items-center justify-between gap-3 rounded-full px-5 py-3.5 text-[15px] font-bold transition-all ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-1 ring-slate-900/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span className="flex items-center gap-4">
                    <span className={`transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'}`}>{item.icon}</span>
                    <span className="tracking-wide">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${badgeClass(isActive)}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-8 relative z-10 border-t border-slate-100">
            <Link
              href="/"
              className="flex items-center gap-4 rounded-full px-5 py-3.5 text-[15px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 group"
            >
              <Orbit size={18} className="text-slate-400 group-hover:text-slate-600 transition-transform duration-300 group-hover:-rotate-90 group-hover:scale-110" />
              <span className="tracking-wide">Exit Admin</span>
            </Link>
          </div>
        </aside>

        {/* Scrollable Main Area */}
        <div className="flex flex-col gap-6 lg:gap-8 overflow-y-auto pr-2 pb-16 custom-scrollbar">
          {title && active !== 'dashboard' && (
            <header className="shrink-0 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between rounded-[40px] bg-white p-6 lg:px-10 lg:py-7 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] border border-slate-100/50 border-t-0 border-l-0">
              <div>
                <h2 className="text-[28px] font-black tracking-tight text-slate-900 leading-none">{title}</h2>
                {description && <p className="mt-2 text-[15px] text-slate-500 font-medium">{description}</p>}
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                {actions}
              </div>
            </header>
          )}

          <main className="flex-1 w-full mx-auto pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
