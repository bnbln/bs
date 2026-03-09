import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { Code2, FileText, Workflow } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

export default function AdminPagesPage() {
  const { sitePages, totals, loading, error } = useAdminContent()

  const staticPages = sitePages.filter((page) => !page.dynamic)
  const dynamicPages = sitePages.filter((page) => page.dynamic)

  return (
    <AdminLayout
      active="pages"
      title="Pages"
      description="Alle Frontend-Seiten inklusive Dateipfad und Routing-Typ."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive }}
      actions={
        <Link
          href="/admin/settings"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Page Settings
        </Link>
      }
    >
      {error ? (
        <StatePanel
          title="Pages konnten nicht geladen werden"
          message={`${error} Bitte pruefe deinen Admin-Server.`}
          tone="error"
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard label="Total Pages" value={sitePages.length} tone="blue" icon={<FileText size={14} />} />
            <KpiCard label="Static" value={staticPages.length} tone="green" icon={<Workflow size={14} />} />
            <KpiCard label="Dynamic" value={dynamicPages.length} tone="violet" icon={<Code2 size={14} />} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">Page Registry</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {sitePages.length} routes
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Lade Seiten...</p>
            ) : sitePages.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Seiten gefunden.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sitePages.map((page) => (
                  <article key={page.filePath} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-sm font-bold text-slate-900">{page.route}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                          page.dynamic ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {page.dynamic ? 'Dynamic' : 'Static'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{page.filePath}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{page.label}</span>
                      <Link href="/admin/settings" className="text-xs font-semibold text-indigo-600">
                        SEO Rules
                      </Link>
                    </div>
                  </article>
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
