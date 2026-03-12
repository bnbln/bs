import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import type { FormEvent } from 'react'
import type { GetServerSideProps } from 'next'
import { Globe, Palette, Settings2, Save } from 'lucide-react'
import type { SeoConfig } from '../../lib/seo'
import { SEO_PAGE_KEYS } from '../../lib/seo'
import AdminLayout from '../../components/admin/AdminLayout'
import StatePanel from '../../components/admin/StatePanel'
import { useAdminContent } from '../../components/admin/useAdminContent'
import { useAdminSeo } from '../../components/admin/useAdminSeo'
import { requireAdminServerSideProps } from '../../lib/admin-auth'

const editableSeoPageKeys = SEO_PAGE_KEYS

type SettingsView = 'global' | 'assets' | 'pages' | 'project' | 'robots'

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-[32px] border border-white bg-white p-6 md:p-8 shadow-[0_10px_40px_-15px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 mb-8 last:mb-0 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 transition-colors"></div>
      <div className="mb-6 pl-4 border-b border-slate-100/80 pb-6">
        <h4 className="text-[19px] font-black tracking-tight text-slate-900">{title}</h4>
        {subtitle && <p className="mt-1.5 text-[15px] font-medium text-slate-500 leading-relaxed">{subtitle}</p>}
      </div>
      <div className="mt-6 pl-4">{children}</div>
    </div>
  )
}

function FieldLabel({ text }: { text: string }) {
  return <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-3 block mb-2">{text}</label>
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${props.className || ''}`}
    />
  )
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px] custom-scrollbar ${props.className || ''}`}
    />
  )
}

function SelectInput(props: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props as any}
      className={`w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer ${props.className || ''}`}
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
    />
  )
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
      actions={
        <div className="flex items-center gap-4">
          <button
            type="submit"
            form="settings-form"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-[15px] font-bold tracking-wide text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/20 disabled:opacity-60 active:scale-95"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      }
    >
      {error ? (
        <StatePanel title="Settings konnten nicht geladen werden" message={error} tone="error" />
      ) : loading || !seoConfig ? (
        <StatePanel title="Lade SEO-Konfiguration" message="Einen Moment bitte..." />
      ) : (
        <div className="flex flex-col gap-6 lg:gap-8 w-full pb-8">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[32px] bg-sky-50 p-6 flex flex-col justify-center border border-sky-100 relative overflow-hidden group">
              <Globe className="absolute right-4 bottom-4 text-sky-200/50 group-hover:scale-110 transition-transform" size={64} />
              <p className="text-[11px] uppercase tracking-widest text-sky-600 font-bold mb-1 relative z-10">Site URL</p>
              <p className="text-xl font-black text-sky-900 truncate relative z-10" title={seoConfig.site.siteUrl}>{seoConfig.site.siteUrl.replace(/^https?:\/\//, '')}</p>
            </div>
            <div className="rounded-[32px] bg-emerald-50 p-6 flex flex-col justify-center border border-emerald-100 relative overflow-hidden group">
              <Settings2 className="absolute right-4 bottom-4 text-emerald-200/50 group-hover:scale-110 transition-transform" size={64} />
              <p className="text-[11px] uppercase tracking-widest text-emerald-600 font-bold mb-1 relative z-10">Page Rules</p>
              <p className="text-3xl font-black text-emerald-900 relative z-10">{pageSettingCount}</p>
            </div>
            <div className="rounded-[32px] bg-violet-50 p-6 flex flex-col justify-center border border-violet-100 relative overflow-hidden group">
              <Palette className="absolute right-4 bottom-4 text-violet-200/50 group-hover:scale-110 transition-transform" size={64} />
              <p className="text-[11px] uppercase tracking-widest text-violet-600 font-bold mb-1 relative z-10">Theme Color</p>
              <div className="flex items-center gap-3 relative z-10 mt-1">
                <div className="w-6 h-6 rounded-full border border-black/10 ring-2 ring-white" style={{ backgroundColor: seoConfig.app.themeColor }}></div>
                <p className="text-lg font-black text-violet-900 font-mono tracking-wide">{seoConfig.app.themeColor}</p>
              </div>
            </div>
            <div className="rounded-[32px] bg-slate-100 p-6 flex flex-col justify-center border border-slate-200 relative overflow-hidden group">
              <Globe className="absolute right-4 bottom-4 text-slate-200/50 group-hover:scale-110 transition-transform" size={64} />
              <p className="text-[11px] uppercase tracking-widest text-slate-600 font-bold mb-1 relative z-10">Registry Pages</p>
              <p className="text-3xl font-black text-slate-900 relative z-10">{sitePages.length}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:gap-8 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
            <aside className="rounded-[40px] border border-white/60 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 h-fit sticky top-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5 px-3">Settings Areas</h3>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSettingsView(item.key)}
                    className={`w-full rounded-[24px] px-5 py-4 text-left transition-all active:scale-[0.98] ${settingsView === item.key
                      ? 'bg-slate-900 shadow-xl shadow-slate-900/20'
                      : 'bg-transparent hover:bg-slate-50'
                      }`}
                  >
                    <p className={`text-[15px] font-black tracking-wide ${settingsView === item.key ? 'text-white' : 'text-slate-700'}`}>{item.label}</p>
                    <p className={`text-[13px] mt-1 font-medium ${settingsView === item.key ? 'text-slate-300' : 'text-slate-500'}`}>{item.helper}</p>
                  </button>
                ))}
              </div>

              <div className="mt-10 px-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Registered Pages</p>
                <div className="max-h-64 space-y-2 overflow-auto pr-2 custom-scrollbar">
                  {sitePages.map((page) => (
                    <div key={page.filePath} className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <p className="truncate text-sm font-bold text-slate-900">{page.route}</p>
                      <p className="truncate text-[11px] mt-1 text-slate-500 font-mono">{page.filePath}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <form id="settings-form" onSubmit={handleSubmit} className="rounded-[40px] border border-white/60 bg-white p-6 md:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.05)] ring-1 ring-slate-100 min-h-[600px]">
              <div className="mb-10 flex items-center justify-between pb-6 border-b border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {menuItems.find(i => i.key === settingsView)?.label}
                </h3>
                {successMessage && <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-[13px] font-black text-emerald-700 ring-1 ring-emerald-500/20">{successMessage}</span>}
              </div>

              {settingsView === 'global' && (
                <SectionCard title="Site Metadata" subtitle="Globale Basis-URLs, Titel und Sprache fuer DefaultSeo.">
                  <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel text="Site URL" />
                      <TextInput value={seoConfig.site.siteUrl} onChange={(event) => updateSeoSiteField('siteUrl', event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Site Name" />
                      <TextInput value={seoConfig.site.siteName} onChange={(event) => updateSeoSiteField('siteName', event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Default Title" />
                      <TextInput
                        value={seoConfig.site.defaultTitle}
                        onChange={(event) => updateSeoSiteField('defaultTitle', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Title Template" />
                      <TextInput
                        value={seoConfig.site.titleTemplate}
                        onChange={(event) => updateSeoSiteField('titleTemplate', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Locale" />
                      <TextInput value={seoConfig.site.locale} onChange={(event) => updateSeoSiteField('locale', event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Twitter Card" />
                      <SelectInput
                        value={seoConfig.site.twitter.cardType}
                        onChange={(event) => updateSeoTwitterField('cardType', event.target.value)}
                      >
                        <option value="summary_large_image">summary_large_image</option>
                        <option value="summary">summary</option>
                        <option value="app">app</option>
                        <option value="player">player</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Twitter Handle" />
                      <TextInput value={seoConfig.site.twitter.handle || ''} onChange={(event) => updateSeoTwitterField('handle', event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Twitter Site" />
                      <TextInput value={seoConfig.site.twitter.site || ''} onChange={(event) => updateSeoTwitterField('site', event.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
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
                <>
                  <SectionCard title="Image Assets" subtitle="Pfade zu den wichtigsten Favicons und OpenGraph Bildern.">
                    <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <FieldLabel text="OG Default Image" />
                        <TextInput value={seoConfig.assets.ogDefaultImage} onChange={(event) => updateSeoAssetField('ogDefaultImage', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Favicon ICO" />
                        <TextInput value={seoConfig.assets.faviconIco} onChange={(event) => updateSeoAssetField('faviconIco', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Favicon 16x16" />
                        <TextInput value={seoConfig.assets.favicon16} onChange={(event) => updateSeoAssetField('favicon16', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Favicon 32x32" />
                        <TextInput value={seoConfig.assets.favicon32} onChange={(event) => updateSeoAssetField('favicon32', event.target.value)} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2 hidden md:block"><hr className="border-slate-200 my-2" /></div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Apple Touch Icon" />
                        <TextInput
                          value={seoConfig.assets.appleTouchIcon}
                          onChange={(event) => updateSeoAssetField('appleTouchIcon', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Android 192" />
                        <TextInput value={seoConfig.assets.android192} onChange={(event) => updateSeoAssetField('android192', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Android 512" />
                        <TextInput value={seoConfig.assets.android512} onChange={(event) => updateSeoAssetField('android512', event.target.value)} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Web Manifest" subtitle="Werte zur Generierung des site.webmanifest fuer PWA Eigenschaften.">
                    <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <FieldLabel text="App Name" />
                        <TextInput value={seoConfig.app.name} onChange={(event) => updateSeoAppField('name', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Short Name" />
                        <TextInput value={seoConfig.app.shortName} onChange={(event) => updateSeoAppField('shortName', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Theme Color" />
                        <TextInput value={seoConfig.app.themeColor} onChange={(event) => updateSeoAppField('themeColor', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Background Color" />
                        <TextInput
                          value={seoConfig.app.backgroundColor}
                          onChange={(event) => updateSeoAppField('backgroundColor', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 border-t border-slate-200 pt-4 md:col-span-2 hidden"></div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Display Mode" />
                        <SelectInput
                          value={seoConfig.app.display}
                          onChange={(event) => updateSeoAppField('display', event.target.value)}
                        >
                          <option value="standalone">standalone</option>
                          <option value="browser">browser</option>
                          <option value="minimal-ui">minimal-ui</option>
                          <option value="fullscreen">fullscreen</option>
                        </SelectInput>
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Start URL" />
                        <TextInput value={seoConfig.app.startUrl} onChange={(event) => updateSeoAppField('startUrl', event.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel text="Scope" />
                        <TextInput value={seoConfig.app.scope} onChange={(event) => updateSeoAppField('scope', event.target.value)} />
                      </div>
                    </div>
                  </SectionCard>
                </>
              )}

              {settingsView === 'pages' && (
                <div className="space-y-6">
                  {editableSeoPageKeys.map((key) => {
                    const page = seoConfig.pages[key]
                    return (
                      <article key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:p-6">
                        <p className="text-sm font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Route: {key}</p>
                        <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <FieldLabel text="Title" />
                            <TextInput value={page.title} onChange={(event) => updateSeoPageField(key, 'title', event.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel text="Path" />
                            <TextInput value={page.path} onChange={(event) => updateSeoPageField(key, 'path', event.target.value)} />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <FieldLabel text="Description" />
                            <TextArea
                              rows={2}
                              value={page.description}
                              onChange={(event) => updateSeoPageField(key, 'description', event.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel text="OG Image" />
                            <TextInput value={page.ogImage || ''} onChange={(event) => updateSeoPageField(key, 'ogImage', event.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel text="Changefreq" />
                            <SelectInput
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
                            </SelectInput>
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel text="Priority (0.0 - 1.0)" />
                            <TextInput
                              type="number"
                              step="0.1"
                              min="0"
                              max="1"
                              value={Number(page.priority ?? 0)}
                              onChange={(event) => updateSeoPageField(key, 'priority', Number(event.target.value))}
                            />
                          </div>

                          <div className="flex flex-col gap-4 justify-center pl-2 pt-2 md:pt-6">
                            <label className="flex items-center gap-4 text-[15px] font-bold text-slate-700 cursor-pointer group hover:text-slate-900 transition-colors">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900/20 focus:ring-offset-0 bg-slate-50 transition-all cursor-pointer"
                                checked={Boolean(page.noindex)}
                                onChange={(event) => updateSeoPageField(key, 'noindex', event.target.checked)}
                              />
                              Exclude from indexing (noindex)
                            </label>
                            <label className="flex items-center gap-4 text-[15px] font-bold text-slate-700 cursor-pointer group hover:text-slate-900 transition-colors">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900/20 focus:ring-offset-0 bg-slate-50 transition-all cursor-pointer"
                                checked={page.includeInSitemap !== false}
                                onChange={(event) => updateSeoPageField(key, 'includeInSitemap', event.target.checked)}
                              />
                              Include in Sitemap
                            </label>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {settingsView === 'project' && (
                <SectionCard title="Project Node Template" subtitle="Fallback-Werte fuer alle dynamischen Work Pages unter /work/[slug].">
                  <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel text="Title Template" />
                      <TextInput
                        value={seoConfig.pages.project.titleTemplate}
                        onChange={(event) => updateSeoProjectField('titleTemplate', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Path Prefix" />
                      <TextInput
                        value={seoConfig.pages.project.pathPrefix}
                        onChange={(event) => updateSeoProjectField('pathPrefix', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Open Graph Type" />
                      <SelectInput
                        value={seoConfig.pages.project.openGraphType}
                        onChange={(event) => updateSeoProjectField('openGraphType', event.target.value)}
                      >
                        <option value="article">article</option>
                        <option value="website">website</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="OG Image Fallback" />
                      <TextInput
                        value={seoConfig.pages.project.ogImageFallback || ''}
                        onChange={(event) => updateSeoProjectField('ogImageFallback', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
                      <FieldLabel text="Changefreq" />
                      <SelectInput
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
                      </SelectInput>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <FieldLabel text="Description Fallback" />
                      <TextArea
                        rows={3}
                        value={seoConfig.pages.project.descriptionFallback}
                        onChange={(event) => updateSeoProjectField('descriptionFallback', event.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100 pl-2">
                      <label className="flex items-center gap-4 text-[15px] font-bold text-slate-700 cursor-pointer group hover:text-slate-900 transition-colors">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900/20 focus:ring-offset-0 bg-slate-50 transition-all cursor-pointer"
                          checked={seoConfig.pages.project.includeInSitemap !== false}
                          onChange={(event) => updateSeoProjectField('includeInSitemap', event.target.checked)}
                        />
                        Projektseiten in Sitemap eintragen
                      </label>
                    </div>
                  </div>
                </SectionCard>
              )}

              {settingsView === 'robots' && (
                <SectionCard title="Crawler Settings" subtitle="Spezifische Richtlinien fuer robots.txt und die Generierung der Sitemap.">
                  <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel text="User Agent" />
                      <TextInput value={seoConfig.robots.userAgent} onChange={(event) => updateSeoRobotsField('userAgent', event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Allow" />
                      <TextInput value={seoConfig.robots.allow} onChange={(event) => updateSeoRobotsField('allow', event.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <FieldLabel text="Sitemap Path" />
                      <TextInput
                        value={seoConfig.robots.sitemapPath}
                        onChange={(event) => updateSeoRobotsField('sitemapPath', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel text="Disallow (one per line)" />
                      <TextArea
                        rows={4}
                        value={seoConfig.robots.disallow.join('\n')}
                        onChange={(event) => updateSeoRobotsField('disallow', parseTextAreaLines(event.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
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
                    <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">robots.txt</p>
                        <pre className="h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-xs font-medium leading-relaxed text-indigo-200 shadow-inner">
                          {generated.robotsTxt}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">site.webmanifest</p>
                        <pre className="h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-xs font-medium leading-relaxed text-indigo-200 shadow-inner">
                          {JSON.stringify(generated.manifest, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">sitemap.xml</p>
                        <pre className="h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-xs font-medium leading-relaxed text-indigo-200 shadow-inner">
                          {generated.sitemapXml}
                        </pre>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            </form>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = requireAdminServerSideProps
