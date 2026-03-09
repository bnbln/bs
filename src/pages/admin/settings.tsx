import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import type { FormEvent } from 'react'
import type { GetServerSideProps } from 'next'
import { Globe, Palette, Settings2 } from 'lucide-react'
import type { SeoConfig } from '../../lib/seo'
import { SEO_PAGE_KEYS } from '../../lib/seo'
import AdminLayout from '../../components/admin/AdminLayout'
import KpiCard from '../../components/admin/KpiCard'
import StatePanel from '../../components/admin/StatePanel'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { useAdminSeo } from '../../components/admin/useAdminSeo'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

const editableSeoPageKeys = SEO_PAGE_KEYS

type SettingsView = 'global' | 'assets' | 'pages' | 'project' | 'robots'

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function FieldLabel({ text }: { text: string }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{text}</label>
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rounded-xl border border-slate-300 px-3 py-2 text-sm ${props.className || ''}`} />
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`rounded-xl border border-slate-300 px-3 py-2 text-sm ${props.className || ''}`} />
}

export default function AdminSettingsPage() {
  const { sitePages, totals } = useAdminContent()
  const { config: seoConfig, generated, loading, error, saving, successMessage, setConfig, save } = useAdminSeo()
  const [settingsView, setSettingsView] = useState<SettingsView>('global')

  const pageSettingCount = useMemo(() => {
    return editableSeoPageKeys.length + 1
  }, [])

  const updateSeoConfig = (updater: (current: SeoConfig) => SeoConfig) => {
    setConfig((current) => (current ? updater(current) : current))
  }

  const updateSeoSiteField = (field: keyof SeoConfig['site'], value: string) => {
    updateSeoConfig((current) => ({
      ...current,
      site: {
        ...current.site,
        [field]: value,
      },
    }))
  }

  const updateSeoTwitterField = (field: keyof SeoConfig['site']['twitter'], value: string) => {
    updateSeoConfig((current) => ({
      ...current,
      site: {
        ...current.site,
        twitter: {
          ...current.site.twitter,
          [field]: value,
        },
      },
    }))
  }

  const updateSeoAssetField = (field: keyof SeoConfig['assets'], value: string) => {
    updateSeoConfig((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [field]: value,
      },
    }))
  }

  const updateSeoAppField = (field: keyof SeoConfig['app'], value: string) => {
    updateSeoConfig((current) => ({
      ...current,
      app: {
        ...current.app,
        [field]: value,
      },
    }))
  }

  const updateSeoPageField = (
    key: (typeof editableSeoPageKeys)[number],
    field: string,
    value: string | number | boolean
  ) => {
    updateSeoConfig((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [key]: {
          ...(current.pages[key] as unknown as Record<string, unknown>),
          [field]: value,
        } as unknown as SeoConfig['pages'][typeof key],
      },
    }))
  }

  const updateSeoProjectField = (field: string, value: string | number | boolean) => {
    updateSeoConfig((current) => ({
      ...current,
      pages: {
        ...current.pages,
        project: {
          ...(current.pages.project as unknown as Record<string, unknown>),
          [field]: value,
        } as unknown as SeoConfig['pages']['project'],
      },
    }))
  }

  const updateSeoRobotsField = (field: keyof SeoConfig['robots'], value: string | string[]) => {
    updateSeoConfig((current) => ({
      ...current,
      robots: {
        ...current.robots,
        [field]: value,
      },
    }))
  }

  const parseTextAreaLines = (raw: string): string[] =>
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!seoConfig) return
    await save(seoConfig)
  }

  const menuItems: Array<{ key: SettingsView; label: string; helper: string }> = [
    { key: 'global', label: 'Global Defaults', helper: 'Titles, URLs, locale' },
    { key: 'assets', label: 'Assets & App', helper: 'Icons, logos, colors' },
    { key: 'pages', label: 'Page Rules', helper: 'Route SEO and noindex' },
    { key: 'project', label: 'Project Template', helper: 'Dynamic post meta' },
    { key: 'robots', label: 'Robots & Outputs', helper: 'robots, sitemap, manifest' },
  ]

  return (
    <AdminLayout
      active="settings"
      title="Settings"
      description="Zentrale Stelle fuer SEO, Meta-Daten und Seitenregeln. Alle Outputs werden aus dieser Quelle erzeugt."
      counts={{ pages: totals.pages, livePosts: totals.live, archivedPosts: totals.archive }}
    >
      {error ? (
        <StatePanel title="Settings konnten nicht geladen werden" message={error} tone="error" />
      ) : loading || !seoConfig ? (
        <StatePanel title="Lade SEO-Konfiguration" message="Einen Moment bitte..." />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Site URL" value={seoConfig.site.siteUrl.replace(/^https?:\/\//, '')} tone="blue" icon={<Globe size={14} />} />
            <KpiCard label="Page Rules" value={pageSettingCount} tone="green" icon={<Settings2 size={14} />} />
            <KpiCard label="Theme Color" value={seoConfig.app.themeColor} tone="violet" icon={<Palette size={14} />} />
            <KpiCard label="Registry Pages" value={sitePages.length} tone="slate" />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Settings Areas</h3>
              <div className="mt-3 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSettingsView(item.key)}
                    className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${
                      settingsView === item.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className={`text-xs ${settingsView === item.key ? 'text-white/80' : 'text-slate-500'}`}>{item.helper}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Registered Pages</p>
                <div className="mt-2 max-h-64 space-y-1 overflow-auto pr-1">
                  {sitePages.map((page) => (
                    <div key={page.filePath} className="rounded-lg bg-white px-2 py-1 text-xs text-slate-600">
                      <p className="truncate font-semibold text-slate-800">{page.route}</p>
                      <p className="truncate">{page.filePath}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.45)]">
              {settingsView === 'global' && (
                <SectionCard title="Global Defaults" subtitle="Globale Site-Metadaten fuer DefaultSeo und strukturierte Daten.">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel text="Site URL" />
                      <TextInput value={seoConfig.site.siteUrl} onChange={(event) => updateSeoSiteField('siteUrl', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Site Name" />
                      <TextInput value={seoConfig.site.siteName} onChange={(event) => updateSeoSiteField('siteName', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Default Title" />
                      <TextInput
                        value={seoConfig.site.defaultTitle}
                        onChange={(event) => updateSeoSiteField('defaultTitle', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Title Template" />
                      <TextInput
                        value={seoConfig.site.titleTemplate}
                        onChange={(event) => updateSeoSiteField('titleTemplate', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Locale" />
                      <TextInput value={seoConfig.site.locale} onChange={(event) => updateSeoSiteField('locale', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Twitter Card" />
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={seoConfig.site.twitter.cardType}
                        onChange={(event) => updateSeoTwitterField('cardType', event.target.value)}
                      >
                        <option value="summary_large_image">summary_large_image</option>
                        <option value="summary">summary</option>
                        <option value="app">app</option>
                        <option value="player">player</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Twitter Handle" />
                      <TextInput value={seoConfig.site.twitter.handle || ''} onChange={(event) => updateSeoTwitterField('handle', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Twitter Site" />
                      <TextInput value={seoConfig.site.twitter.site || ''} onChange={(event) => updateSeoTwitterField('site', event.target.value)} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <FieldLabel text="Default Description" />
                      <TextArea
                        rows={4}
                        value={seoConfig.site.defaultDescription}
                        onChange={(event) => updateSeoSiteField('defaultDescription', event.target.value)}
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {settingsView === 'assets' && (
                <SectionCard title="Assets & App Metadata" subtitle="Alle Icons, App-Logos und Farbwerte an einer Stelle.">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel text="OG Default Image" />
                      <TextInput value={seoConfig.assets.ogDefaultImage} onChange={(event) => updateSeoAssetField('ogDefaultImage', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Favicon ICO" />
                      <TextInput value={seoConfig.assets.faviconIco} onChange={(event) => updateSeoAssetField('faviconIco', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Favicon 16" />
                      <TextInput value={seoConfig.assets.favicon16} onChange={(event) => updateSeoAssetField('favicon16', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Favicon 32" />
                      <TextInput value={seoConfig.assets.favicon32} onChange={(event) => updateSeoAssetField('favicon32', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Apple Touch Icon" />
                      <TextInput
                        value={seoConfig.assets.appleTouchIcon}
                        onChange={(event) => updateSeoAssetField('appleTouchIcon', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Android 192" />
                      <TextInput value={seoConfig.assets.android192} onChange={(event) => updateSeoAssetField('android192', event.target.value)} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <FieldLabel text="Android 512" />
                      <TextInput value={seoConfig.assets.android512} onChange={(event) => updateSeoAssetField('android512', event.target.value)} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel text="App Name" />
                      <TextInput value={seoConfig.app.name} onChange={(event) => updateSeoAppField('name', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Short Name" />
                      <TextInput value={seoConfig.app.shortName} onChange={(event) => updateSeoAppField('shortName', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Theme Color" />
                      <TextInput value={seoConfig.app.themeColor} onChange={(event) => updateSeoAppField('themeColor', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Background Color" />
                      <TextInput
                        value={seoConfig.app.backgroundColor}
                        onChange={(event) => updateSeoAppField('backgroundColor', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Display" />
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={seoConfig.app.display}
                        onChange={(event) => updateSeoAppField('display', event.target.value)}
                      >
                        <option value="standalone">standalone</option>
                        <option value="browser">browser</option>
                        <option value="minimal-ui">minimal-ui</option>
                        <option value="fullscreen">fullscreen</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Start URL" />
                      <TextInput value={seoConfig.app.startUrl} onChange={(event) => updateSeoAppField('startUrl', event.target.value)} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <FieldLabel text="Scope" />
                      <TextInput value={seoConfig.app.scope} onChange={(event) => updateSeoAppField('scope', event.target.value)} />
                    </div>
                  </div>
                </SectionCard>
              )}

              {settingsView === 'pages' && (
                <SectionCard title="Page SEO Overrides" subtitle="Seitenspezifische Regeln fuer Titel, Description, Canonical und Sitemap.">
                  <div className="space-y-3">
                    {editableSeoPageKeys.map((key) => {
                      const page = seoConfig.pages[key]
                      return (
                        <article key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{key}</p>
                          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <FieldLabel text="Title" />
                              <TextInput value={page.title} onChange={(event) => updateSeoPageField(key, 'title', event.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <FieldLabel text="Path" />
                              <TextInput value={page.path} onChange={(event) => updateSeoPageField(key, 'path', event.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <FieldLabel text="OG Image" />
                              <TextInput value={page.ogImage || ''} onChange={(event) => updateSeoPageField(key, 'ogImage', event.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <FieldLabel text="Priority" />
                              <TextInput
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                value={Number(page.priority ?? 0)}
                                onChange={(event) => updateSeoPageField(key, 'priority', Number(event.target.value))}
                              />
                            </div>
                            <div className="space-y-1">
                              <FieldLabel text="Changefreq" />
                              <select
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                value={page.changefreq || 'monthly'}
                                onChange={(event) => updateSeoPageField(key, 'changefreq', event.target.value)}
                              >
                                <option value="always">always</option>
                                <option value="hourly">hourly</option>
                                <option value="daily">daily</option>
                                <option value="weekly">weekly</option>
                                <option value="monthly">monthly</option>
                                <option value="yearly">yearly</option>
                                <option value="never">never</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-5">
                              <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(page.noindex)}
                                  onChange={(event) => updateSeoPageField(key, 'noindex', event.target.checked)}
                                />
                                noindex
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={page.includeInSitemap !== false}
                                  onChange={(event) => updateSeoPageField(key, 'includeInSitemap', event.target.checked)}
                                />
                                include in sitemap
                              </label>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <FieldLabel text="Description" />
                              <TextArea
                                rows={3}
                                value={page.description}
                                onChange={(event) => updateSeoPageField(key, 'description', event.target.value)}
                              />
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </SectionCard>
              )}

              {settingsView === 'project' && (
                <SectionCard title="Project SEO Template" subtitle="Template-Regeln fuer /project/[slug]-Seiten.">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel text="Title Template" />
                      <TextInput
                        value={seoConfig.pages.project.titleTemplate}
                        onChange={(event) => updateSeoProjectField('titleTemplate', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Path Prefix" />
                      <TextInput
                        value={seoConfig.pages.project.pathPrefix}
                        onChange={(event) => updateSeoProjectField('pathPrefix', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Open Graph Type" />
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={seoConfig.pages.project.openGraphType}
                        onChange={(event) => updateSeoProjectField('openGraphType', event.target.value)}
                      >
                        <option value="article">article</option>
                        <option value="website">website</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Priority" />
                      <TextInput
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={Number(seoConfig.pages.project.priority ?? 0.8)}
                        onChange={(event) => updateSeoProjectField('priority', Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Changefreq" />
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={seoConfig.pages.project.changefreq || 'monthly'}
                        onChange={(event) => updateSeoProjectField('changefreq', event.target.value)}
                      >
                        <option value="always">always</option>
                        <option value="hourly">hourly</option>
                        <option value="daily">daily</option>
                        <option value="weekly">weekly</option>
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                        <option value="never">never</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="OG Image Fallback" />
                      <TextInput
                        value={seoConfig.pages.project.ogImageFallback || ''}
                        onChange={(event) => updateSeoProjectField('ogImageFallback', event.target.value)}
                      />
                    </div>
                    <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={seoConfig.pages.project.includeInSitemap !== false}
                        onChange={(event) => updateSeoProjectField('includeInSitemap', event.target.checked)}
                      />
                      Projektseiten in Sitemap eintragen
                    </label>
                    <div className="space-y-1 md:col-span-2">
                      <FieldLabel text="Description Fallback" />
                      <TextArea
                        rows={4}
                        value={seoConfig.pages.project.descriptionFallback}
                        onChange={(event) => updateSeoProjectField('descriptionFallback', event.target.value)}
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {settingsView === 'robots' && (
                <SectionCard title="Robots, Manifest & Sitemap" subtitle="Direkte Kontrolle ueber Crawling-Regeln und generierte Outputs.">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel text="User Agent" />
                      <TextInput value={seoConfig.robots.userAgent} onChange={(event) => updateSeoRobotsField('userAgent', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Allow" />
                      <TextInput value={seoConfig.robots.allow} onChange={(event) => updateSeoRobotsField('allow', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Sitemap Path" />
                      <TextInput
                        value={seoConfig.robots.sitemapPath}
                        onChange={(event) => updateSeoRobotsField('sitemapPath', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel text="Disallow (one per line)" />
                      <TextArea
                        rows={4}
                        value={seoConfig.robots.disallow.join('\n')}
                        onChange={(event) => updateSeoRobotsField('disallow', parseTextAreaLines(event.target.value))}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <FieldLabel text="Additional Directives (one per line)" />
                      <TextArea
                        rows={4}
                        value={seoConfig.robots.additionalDirectives.join('\n')}
                        onChange={(event) =>
                          updateSeoRobotsField('additionalDirectives', parseTextAreaLines(event.target.value))
                        }
                      />
                    </div>
                  </div>

                  {generated && (
                    <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">robots.txt</p>
                        <pre className="mt-1 h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                          {generated.robotsTxt}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">site.webmanifest</p>
                        <pre className="mt-1 h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                          {JSON.stringify(generated.manifest, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">sitemap.xml</p>
                        <pre className="mt-1 h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                          {generated.sitemapXml}
                        </pre>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </form>
          </section>
        </>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
