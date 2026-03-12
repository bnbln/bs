import Link from 'next/link'
import { MoreHorizontal, GripVertical } from 'lucide-react'
import type { DashboardProject, WorkHubSummary } from './types'
import { formatDateTime } from './utils'

interface DashboardKanbanProps {
    projects: DashboardProject[]
    hubs: WorkHubSummary[]
}

const columnColors = [
    'bg-blue-100',
    'bg-amber-100',
    'bg-emerald-100',
    'bg-violet-100',
    'bg-pink-100',
]

const cardColors = [
    'bg-blue-50',
    'bg-amber-50',
    'bg-emerald-50',
    'bg-violet-50',
    'bg-pink-50',
]

const accentColors = [
    'text-blue-600 border-blue-200',
    'text-amber-600 border-amber-200',
    'text-emerald-600 border-emerald-200',
    'text-violet-600 border-violet-200',
    'text-pink-600 border-pink-200',
]

export default function DashboardKanban({ projects, hubs }: DashboardKanbanProps) {
    // Extract unique types from all available projects
    const allTypes = new Set<string>()
    projects.forEach(p => {
        if (Array.isArray(p.type)) {
            p.type.forEach(t => allTypes.add(t))
        } else if (typeof p.type === 'string' && p.type.trim() !== '') {
            allTypes.add(p.type)
        }
    })

    const uniqueTypes = Array.from(allTypes).sort()

    const columns = [
        ...uniqueTypes.map((type, idx) => ({
            id: type.toLowerCase().replace(/\s+/g, '-'),
            title: type,
            colorIdx: idx % columnColors.length,
            items: projects.filter((p) => {
                if (Array.isArray(p.type)) return p.type.includes(type)
                return p.type === type
            }),
        })),
        {
            id: 'uncategorized',
            title: 'Uncategorized',
            colorIdx: uniqueTypes.length % columnColors.length,
            items: projects.filter((p) => !p.type || (Array.isArray(p.type) && p.type.length === 0)),
        },
    ].filter((col) => col.items.length > 0 || col.id !== 'uncategorized')

    return (
        <div className="flex h-full w-full gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
            {columns.map((col) => (
                <div key={col.id} className="flex min-w-[320px] max-w-[320px] flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[15px] font-bold text-slate-800">{col.title}</h3>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                            {col.items.length}
                        </span>
                    </div>

                    <div
                        className={`flex flex-1 flex-col gap-3 rounded-[24px] ${columnColors[col.colorIdx]} p-3`}
                    >
                        {col.items.map((project) => (
                            <div
                                key={project.slug}
                                className={`group relative flex cursor-pointer flex-col gap-3 rounded-2xl border ${cardColors[col.colorIdx]} p-4 shadow-sm transition-shadow hover:shadow-md`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accentColors[col.colorIdx]}`}
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
                                        {project.folder === 'archive' ? 'Archive' : 'Work'} / {project.slug}
                                    </div>

                                    <Link
                                        href={
                                            project.folder === 'archive'
                                                ? `/admin/editor/${project.slug}?folder=archive`
                                                : `/admin/editor/${project.slug}`
                                        }
                                        className="absolute inset-0 z-10"
                                        aria-label={`Edit ${project.title}`}
                                    />
                                    <div className="relative z-20 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                                        <GripVertical size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {col.items.length === 0 && (
                            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
                                No posts
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
