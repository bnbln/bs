import { useMemo, useState } from 'react'
import type { GetServerSideProps } from 'next'
import { FileImage, FileText, Film, FolderOpen } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import type { AdminFileEntry, AdminFileKind } from '../../components/admin/types'
import { useAdminFiles } from '../../components/admin/useAdminFiles'
import { formatBytes, formatDateTime } from '../../components/admin/utils'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

function kindLabel(kind: AdminFileKind): string {
  switch (kind) {
    case 'image':
      return 'Image'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'document':
      return 'Document'
    case 'markdown':
      return 'Markdown'
    default:
      return 'Other'
  }
}

function kindColor(kind: AdminFileKind): string {
  switch (kind) {
    case 'image':
      return 'bg-emerald-100 text-emerald-700'
    case 'video':
      return 'bg-violet-100 text-violet-700'
    case 'audio':
      return 'bg-amber-100 text-amber-700'
    case 'document':
      return 'bg-sky-100 text-sky-700'
    case 'markdown':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-neutral-200 text-neutral-700'
  }
}

function renderPreview(file: AdminFileEntry) {
  if (!file.publicUrl) {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
        content
      </div>
    )
  }

  if (file.kind === 'image') {
    return (
      <div className="h-12 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.publicUrl} alt={file.name} className="h-full w-full object-cover" />
      </div>
    )
  }

  if (file.kind === 'video') {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-200 bg-violet-50 text-violet-600">
        <Film size={14} />
      </div>
    )
  }

  return (
    <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
      <FileText size={14} />
    </div>
  )
}

export default function AdminFilesPage() {
  const { files, summary, loading, error } = useAdminFiles()
  const [sourceFilter, setSourceFilter] = useState<'all' | 'public' | 'content'>('all')
  const [kindFilter, setKindFilter] = useState<'all' | AdminFileKind>('all')
  const [query, setQuery] = useState('')

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return files.filter((file) => {
      if (sourceFilter !== 'all' && file.source !== sourceFilter) return false
      if (kindFilter !== 'all' && file.kind !== kindFilter) return false

      if (!normalizedQuery) return true
      return (
        file.name.toLowerCase().includes(normalizedQuery) ||
        file.relativePath.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [files, kindFilter, query, sourceFilter])

  return (
    <AdminLayout
      active="files"
      title="Files"
      description="Datei-Uebersicht fuer Assets und Content-Dateien mit Filtersystem."
      counts={{ files: summary.totalFiles }}
    >
      {error ? (
        <StatePanel
          title="Files konnten nicht geladen werden"
          message={`${error} Bitte pruefe deinen Admin-Server.`}
          tone="error"
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="All Files" value={summary.totalFiles} tone="blue" icon={<FolderOpen size={14} />} />
            <KpiCard label="Images" value={summary.byKind.image} tone="green" icon={<FileImage size={14} />} />
            <KpiCard label="Videos" value={summary.byKind.video} tone="violet" icon={<Film size={14} />} />
            <KpiCard label="Storage" value={formatBytes(summary.totalBytes)} tone="slate" icon={<FileText size={14} />} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as 'all' | 'public' | 'content')}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Sources</option>
                <option value="public">public/</option>
                <option value="content">content/</option>
              </select>

              <select
                value={kindFilter}
                onChange={(event) => setKindFilter(event.target.value as 'all' | AdminFileKind)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
                <option value="markdown">Markdown</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
                placeholder="Suche nach Name oder Pfad"
              />
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Scanne Dateien...</p>
            ) : filteredFiles.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Dateien fuer diesen Filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-2 py-1">Preview</th>
                      <th className="px-2 py-1">File</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Source</th>
                      <th className="px-2 py-1">Size</th>
                      <th className="px-2 py-1">Updated</th>
                      <th className="px-2 py-1">Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="rounded-xl bg-slate-50 text-slate-700">
                        <td className="px-2 py-2 align-middle">{renderPreview(file)}</td>
                        <td className="px-2 py-2 font-semibold text-slate-900">{file.name}</td>
                        <td className="px-2 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${kindColor(file.kind)}`}>
                            {kindLabel(file.kind)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-xs uppercase tracking-[0.14em] text-slate-500">{file.source}</td>
                        <td className="px-2 py-2">{formatBytes(file.sizeBytes)}</td>
                        <td className="px-2 py-2 text-xs text-slate-500">{formatDateTime(file.updatedAt)}</td>
                        <td className="px-2 py-2 font-mono text-xs text-slate-500">{file.relativePath}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
