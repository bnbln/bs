import Link from 'next/link'
import type { DashboardProject } from './types'
import { formatCategory } from './utils'

const projectEditorHref = (project: DashboardProject): string =>
  project.folder === 'archive'
    ? `/admin/editor/${project.slug}?folder=archive`
    : `/admin/editor/${project.slug}`

const projectPreviewHref = (project: DashboardProject): string =>
  project.isArchived ? projectEditorHref(project) : `/project/${project.slug}`

function FeaturedProjectsPreview({ project }: { project: DashboardProject }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2">
      <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        FeaturedProjects.tsx
      </p>
      <div className={`relative mt-2 w-full overflow-hidden rounded-xl ${project.featured ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
        {project.image ? (
          <img src={project.image} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-slate-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">{formatCategory(project)}</p>
          <h4 className="mt-1 line-clamp-2 text-sm font-bold text-white">{project.title}</h4>
        </div>
      </div>
    </div>
  )
}

function WorkPagePreview({ project }: { project: DashboardProject }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2">
      <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">work.tsx</p>
      <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
        <div className={`relative w-full overflow-hidden rounded-lg ${project.featured ? 'aspect-[3/4]' : 'aspect-video'}`}>
          {project.image ? (
            <img src={project.image} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-slate-200" />
          )}
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="line-clamp-2 text-sm font-bold leading-tight text-slate-900">{project.title}</h4>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {project.subtitle || project.excerptText || 'No subtitle'}
            </p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-lg leading-none text-slate-500">
            ↗
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectPreviewCard({ project }: { project: DashboardProject }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)] transition-shadow hover:shadow-[0_26px_40px_-24px_rgba(15,23,42,0.45)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{project.slug}</p>
          <h3 className="mt-1 text-lg font-bold leading-tight text-slate-900">{project.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">{project.excerptText || project.subtitle}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
              project.featured ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {project.featured ? 'Featured' : 'Standard'}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
              project.isArchived ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
            }`}
          >
            {project.isArchived ? 'Archive' : 'Published'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FeaturedProjectsPreview project={project} />
        <WorkPagePreview project={project} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">{project.filePath}</p>
        <div className="flex items-center gap-2">
          <Link
            href={projectPreviewHref(project)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {project.isArchived ? 'Draft View' : 'Open Site'}
          </Link>
          <Link
            href={projectEditorHref(project)}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Edit
          </Link>
        </div>
      </div>
    </article>
  )
}
