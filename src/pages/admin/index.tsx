import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { Project, ProjectFolder } from '../../lib/markdown';
import type { SeoConfig } from '../../lib/seo';
import { SEO_PAGE_KEYS } from '../../lib/seo';

interface DashboardProject extends Project {
    folder: ProjectFolder;
    isArchived: boolean;
    filePath: string;
    excerptText: string;
}

interface SitePageSummary {
    route: string;
    filePath: string;
    label: string;
    dynamic: boolean;
}

interface DashboardResponse {
    projects?: DashboardProject[];
    archivedProjects?: DashboardProject[];
    sitePages?: SitePageSummary[];
}

interface SeoApiResponse {
    config: SeoConfig;
    generated: {
        robotsTxt: string;
        manifest: Record<string, unknown>;
        sitemapXml: string;
    };
}

interface NewArticleFormState {
    title: string;
    slug: string;
    subtitle: string;
    category: string;
    excerpt: string;
    folder: ProjectFolder;
    featured: boolean;
}

const initialFormState: NewArticleFormState = {
    title: '',
    slug: '',
    subtitle: 'Draft',
    category: 'Draft',
    excerpt: '',
    folder: 'archive',
    featured: false
};

const editableSeoPageKeys = SEO_PAGE_KEYS;

const slugify = (value: string): string => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatCategory = (project: DashboardProject): string => {
    if (Array.isArray(project.category)) return project.category.join(', ');
    return project.category || 'Unkategorisiert';
};

const projectEditorHref = (project: DashboardProject): string => (
    project.folder === 'archive'
        ? `/admin/editor/${project.slug}?folder=archive`
        : `/admin/editor/${project.slug}`
);

function FeaturedProjectsPreview({ project }: { project: DashboardProject }) {
    const aspectClass = project.featured ? 'aspect-[3/4]' : 'aspect-[4/3]';

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">FeaturedProjects.tsx</p>
            <div className={`relative ${aspectClass} w-full overflow-hidden rounded-2xl border border-neutral-200`}>
                {project.image ? (
                    <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-neutral-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-100 mb-1">{formatCategory(project)}</p>
                    <h4 className="text-sm leading-tight font-bold text-white line-clamp-2">{project.title}</h4>
                </div>
            </div>
        </div>
    );
}

function WorkPagePreview({ project }: { project: DashboardProject }) {
    const aspectClass = project.featured ? 'aspect-[3/4]' : 'aspect-video';

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">work.tsx</p>
            <div className="rounded-2xl border border-neutral-200 bg-white p-2">
                <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl bg-neutral-100`}>
                    {project.image ? (
                        <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-neutral-200" />
                    )}
                    <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold leading-tight text-black line-clamp-2">{project.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{project.subtitle || project.excerptText || 'No subtitle'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 text-neutral-500 text-lg leading-none">
                        ↗
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProjectCard({ project }: { project: DashboardProject }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900 leading-tight">{project.title}</h3>
                    <p className="text-sm text-neutral-500 mt-1">{project.slug}</p>
                    <p className="text-xs text-neutral-400 mt-2">{project.filePath}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] rounded-full ${project.featured ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                        {project.featured ? 'Featured' : 'Standard'}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] rounded-full ${project.isArchived ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                        {project.isArchived ? 'Archive' : 'Live'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FeaturedProjectsPreview project={project} />
                <WorkPagePreview project={project} />
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-500 line-clamp-2">
                    {project.excerptText || project.subtitle || 'Kein Excerpt vorhanden.'}
                </p>
                <Link
                    href={projectEditorHref(project)}
                    className="shrink-0 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                    Bearbeiten
                </Link>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [projects, setProjects] = useState<DashboardProject[]>([]);
    const [archivedProjects, setArchivedProjects] = useState<DashboardProject[]>([]);
    const [sitePages, setSitePages] = useState<SitePageSummary[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [formState, setFormState] = useState<NewArticleFormState>(initialFormState);
    const [slugTouched, setSlugTouched] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [seoConfig, setSeoConfig] = useState<SeoConfig | null>(null);
    const [seoGenerated, setSeoGenerated] = useState<SeoApiResponse['generated'] | null>(null);
    const [seoLoading, setSeoLoading] = useState(true);
    const [seoSaving, setSeoSaving] = useState(false);
    const [seoError, setSeoError] = useState('');
    const [seoSaveSuccess, setSeoSaveSuccess] = useState('');

    const loadDashboard = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const response = await fetch('/api/admin/projects');
            if (!response.ok) {
                throw new Error('Failed to load content. Ensure NEXT_PUBLIC_ADMIN=true and run npm run backend.');
            }

            const data = await response.json() as DashboardResponse;
            setProjects(data.projects || []);
            setArchivedProjects(data.archivedProjects || []);
            setSitePages(data.sitePages || []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const loadSeo = useCallback(async () => {
        try {
            setSeoLoading(true);
            setSeoError('');
            const response = await fetch('/api/admin/seo');
            if (!response.ok) {
                throw new Error('SEO data could not be loaded.');
            }

            const data = await response.json() as SeoApiResponse;
            setSeoConfig(data.config);
            setSeoGenerated(data.generated);
        } catch (loadError) {
            setSeoError(loadError instanceof Error ? loadError.message : 'Failed to load SEO settings.');
        } finally {
            setSeoLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSeo();
    }, [loadSeo]);

    const updateSeoConfig = useCallback((updater: (current: SeoConfig) => SeoConfig) => {
        setSeoConfig((current) => (current ? updater(current) : current));
    }, []);

    const updateSeoSiteField = (field: keyof SeoConfig['site'], value: string) => {
        updateSeoConfig((current) => ({
            ...current,
            site: {
                ...current.site,
                [field]: value,
            },
        }));
    };

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
        }));
    };

    const updateSeoAssetField = (field: keyof SeoConfig['assets'], value: string) => {
        updateSeoConfig((current) => ({
            ...current,
            assets: {
                ...current.assets,
                [field]: value,
            },
        }));
    };

    const updateSeoAppField = (field: keyof SeoConfig['app'], value: string) => {
        updateSeoConfig((current) => ({
            ...current,
            app: {
                ...current.app,
                [field]: value,
            },
        }));
    };

    const updateSeoPageField = (
        key: typeof editableSeoPageKeys[number],
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
        }));
    };

    const updateSeoProjectField = (
        field: string,
        value: string | number | boolean
    ) => {
        updateSeoConfig((current) => ({
            ...current,
            pages: {
                ...current.pages,
                project: {
                    ...(current.pages.project as unknown as Record<string, unknown>),
                    [field]: value,
                } as unknown as SeoConfig['pages']['project'],
            },
        }));
    };

    const updateSeoRobotsField = (field: keyof SeoConfig['robots'], value: string | string[]) => {
        updateSeoConfig((current) => ({
            ...current,
            robots: {
                ...current.robots,
                [field]: value,
            },
        }));
    };

    const parseTextAreaLines = (raw: string): string[] => raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const handleSaveSeo = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!seoConfig) return;

        setSeoSaving(true);
        setSeoError('');
        setSeoSaveSuccess('');

        try {
            const response = await fetch('/api/admin/seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: seoConfig }),
            });

            const payload = await response.json();
            if (!response.ok) {
                const errors = Array.isArray(payload.errors) ? payload.errors.join(' ') : '';
                throw new Error(payload.error ? `${payload.error} ${errors}`.trim() : 'Failed to save SEO settings.');
            }

            const data = payload as SeoApiResponse;
            setSeoConfig(data.config);
            setSeoGenerated(data.generated);
            setSeoSaveSuccess('SEO settings saved and artifacts regenerated.');
        } catch (saveError) {
            setSeoError(saveError instanceof Error ? saveError.message : 'Saving SEO settings failed.');
        } finally {
            setSeoSaving(false);
        }
    };

    const totals = useMemo(() => ({
        pages: sitePages.length,
        live: projects.length,
        archive: archivedProjects.length,
        featured: [...projects, ...archivedProjects].filter((project) => project.featured).length
    }), [archivedProjects, projects, sitePages.length]);

    const handleCreateArticle = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateError('');

        const trimmedTitle = formState.title.trim();
        const trimmedSlug = formState.slug.trim();

        if (!trimmedTitle) {
            setCreateError('Bitte einen Titel angeben.');
            return;
        }

        if (!trimmedSlug) {
            setCreateError('Bitte einen gültigen Slug angeben.');
            return;
        }

        setCreating(true);
        try {
            const response = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formState,
                    title: trimmedTitle,
                    slug: trimmedSlug
                })
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Artikel konnte nicht angelegt werden.');
            }

            setFormState({
                ...initialFormState,
                folder: formState.folder
            });
            setSlugTouched(false);
            await loadDashboard();
        } catch (creationError) {
            setCreateError(creationError instanceof Error ? creationError.message : 'Erstellen fehlgeschlagen.');
        } finally {
            setCreating(false);
        }
    };

    if (error) {
        return (
            <div className="p-10 font-sans min-h-screen bg-neutral-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-xl">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p>{error}</p>
                    <p className="mt-4 text-sm text-neutral-500 bg-neutral-100 p-2 rounded">npm run backend</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] py-10 px-4 sm:px-8 lg:px-12">
            <div className="max-w-[1500px] mx-auto font-sans">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">Local Content Editor Dashboard</h1>
                    <p className="text-neutral-500 mt-2">Übersicht über Seiten, Live-Artikel und Archiv-Entwürfe mit Frontend-Previews.</p>
                </header>

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-400 font-bold">Seiten</p>
                        <p className="text-2xl font-bold mt-1">{totals.pages}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-400 font-bold">Live Artikel</p>
                        <p className="text-2xl font-bold mt-1">{totals.live}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-400 font-bold">Archive Entwürfe</p>
                        <p className="text-2xl font-bold mt-1">{totals.archive}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-neutral-200 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-400 font-bold">Featured</p>
                        <p className="text-2xl font-bold mt-1">{totals.featured}</p>
                    </div>
                </section>

                <section className="rounded-2xl bg-white border border-neutral-200 p-6 mb-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">SEO & Meta</h2>
                            <p className="text-sm text-neutral-500 mt-1">Zentrale Quelle für Meta-Daten, Seiten-SEO, Icons, App-Farben und generierte SEO-Artefakte.</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadSeo}
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                            Reload
                        </button>
                    </div>

                    {seoLoading ? (
                        <p className="text-sm text-neutral-500">Lade SEO-Einstellungen…</p>
                    ) : seoConfig ? (
                        <form onSubmit={handleSaveSeo} className="space-y-6">
                            <div className="rounded-xl border border-neutral-200 p-4">
                                <h3 className="font-bold text-neutral-900 mb-3">Global Defaults</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Site URL"
                                        value={seoConfig.site.siteUrl}
                                        onChange={(event) => updateSeoSiteField('siteUrl', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Default Title"
                                        value={seoConfig.site.defaultTitle}
                                        onChange={(event) => updateSeoSiteField('defaultTitle', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Title Template"
                                        value={seoConfig.site.titleTemplate}
                                        onChange={(event) => updateSeoSiteField('titleTemplate', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Open Graph Site Name"
                                        value={seoConfig.site.siteName}
                                        onChange={(event) => updateSeoSiteField('siteName', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Locale"
                                        value={seoConfig.site.locale}
                                        onChange={(event) => updateSeoSiteField('locale', event.target.value)}
                                    />
                                    <select
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        value={seoConfig.site.twitter.cardType}
                                        onChange={(event) => updateSeoTwitterField('cardType', event.target.value)}
                                    >
                                        <option value="summary_large_image">summary_large_image</option>
                                        <option value="summary">summary</option>
                                        <option value="app">app</option>
                                        <option value="player">player</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Twitter Handle"
                                        value={seoConfig.site.twitter.handle || ''}
                                        onChange={(event) => updateSeoTwitterField('handle', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Twitter Site"
                                        value={seoConfig.site.twitter.site || ''}
                                        onChange={(event) => updateSeoTwitterField('site', event.target.value)}
                                    />
                                    <textarea
                                        className="md:col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[96px]"
                                        placeholder="Default Description"
                                        value={seoConfig.site.defaultDescription}
                                        onChange={(event) => updateSeoSiteField('defaultDescription', event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-neutral-200 p-4">
                                <h3 className="font-bold text-neutral-900 mb-3">Icons & App Branding</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="OG Default Image"
                                        value={seoConfig.assets.ogDefaultImage}
                                        onChange={(event) => updateSeoAssetField('ogDefaultImage', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Favicon .ico"
                                        value={seoConfig.assets.faviconIco}
                                        onChange={(event) => updateSeoAssetField('faviconIco', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Favicon 16x16"
                                        value={seoConfig.assets.favicon16}
                                        onChange={(event) => updateSeoAssetField('favicon16', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Favicon 32x32"
                                        value={seoConfig.assets.favicon32}
                                        onChange={(event) => updateSeoAssetField('favicon32', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Apple Touch Icon"
                                        value={seoConfig.assets.appleTouchIcon}
                                        onChange={(event) => updateSeoAssetField('appleTouchIcon', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Android Icon 192"
                                        value={seoConfig.assets.android192}
                                        onChange={(event) => updateSeoAssetField('android192', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Android Icon 512"
                                        value={seoConfig.assets.android512}
                                        onChange={(event) => updateSeoAssetField('android512', event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-neutral-200 p-4">
                                <h3 className="font-bold text-neutral-900 mb-3">App Meta & Colors</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="App Name"
                                        value={seoConfig.app.name}
                                        onChange={(event) => updateSeoAppField('name', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Short Name"
                                        value={seoConfig.app.shortName}
                                        onChange={(event) => updateSeoAppField('shortName', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Theme Color"
                                        value={seoConfig.app.themeColor}
                                        onChange={(event) => updateSeoAppField('themeColor', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Background Color"
                                        value={seoConfig.app.backgroundColor}
                                        onChange={(event) => updateSeoAppField('backgroundColor', event.target.value)}
                                    />
                                    <select
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        value={seoConfig.app.display}
                                        onChange={(event) => updateSeoAppField('display', event.target.value)}
                                    >
                                        <option value="standalone">standalone</option>
                                        <option value="browser">browser</option>
                                        <option value="minimal-ui">minimal-ui</option>
                                        <option value="fullscreen">fullscreen</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Start URL"
                                        value={seoConfig.app.startUrl}
                                        onChange={(event) => updateSeoAppField('startUrl', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Scope"
                                        value={seoConfig.app.scope}
                                        onChange={(event) => updateSeoAppField('scope', event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-neutral-200 p-4">
                                <h3 className="font-bold text-neutral-900 mb-3">Seiten-SEO Overrides</h3>
                                <div className="space-y-4">
                                    {editableSeoPageKeys.map((key) => {
                                        const page = seoConfig.pages[key];
                                        return (
                                            <div key={key} className="rounded-lg border border-neutral-200 p-3 bg-neutral-50">
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500 mb-2">{key}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
                                                        placeholder="Title"
                                                        value={page.title}
                                                        onChange={(event) => updateSeoPageField(key, 'title', event.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
                                                        placeholder="Path"
                                                        value={page.path}
                                                        onChange={(event) => updateSeoPageField(key, 'path', event.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
                                                        placeholder="OG Image"
                                                        value={page.ogImage || ''}
                                                        onChange={(event) => updateSeoPageField(key, 'ogImage', event.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="1"
                                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
                                                        placeholder="Priority"
                                                        value={Number(page.priority ?? 0)}
                                                        onChange={(event) => updateSeoPageField(key, 'priority', Number(event.target.value))}
                                                    />
                                                    <select
                                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
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
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 text-sm text-neutral-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(page.noindex)}
                                                                onChange={(event) => updateSeoPageField(key, 'noindex', event.target.checked)}
                                                            />
                                                            noindex
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm text-neutral-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={page.includeInSitemap !== false}
                                                                onChange={(event) => updateSeoPageField(key, 'includeInSitemap', event.target.checked)}
                                                            />
                                                            in sitemap
                                                        </label>
                                                    </div>
                                                    <textarea
                                                        className="md:col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white min-h-[84px]"
                                                        placeholder="Description"
                                                        value={page.description}
                                                        onChange={(event) => updateSeoPageField(key, 'description', event.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-xl border border-neutral-200 p-4">
                                <h3 className="font-bold text-neutral-900 mb-3">Projekt-Template</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Title Template"
                                        value={seoConfig.pages.project.titleTemplate}
                                        onChange={(event) => updateSeoProjectField('titleTemplate', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Path Prefix"
                                        value={seoConfig.pages.project.pathPrefix}
                                        onChange={(event) => updateSeoProjectField('pathPrefix', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="OG Image Fallback"
                                        value={seoConfig.pages.project.ogImageFallback || ''}
                                        onChange={(event) => updateSeoProjectField('ogImageFallback', event.target.value)}
                                    />
                                    <select
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        value={seoConfig.pages.project.openGraphType}
                                        onChange={(event) => updateSeoProjectField('openGraphType', event.target.value)}
                                    >
                                        <option value="article">article</option>
                                        <option value="website">website</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Priority"
                                        value={Number(seoConfig.pages.project.priority ?? 0.8)}
                                        onChange={(event) => updateSeoProjectField('priority', Number(event.target.value))}
                                    />
                                    <select
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
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
                                    <label className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-700">
                                        <input
                                            type="checkbox"
                                            checked={seoConfig.pages.project.includeInSitemap !== false}
                                            onChange={(event) => updateSeoProjectField('includeInSitemap', event.target.checked)}
                                        />
                                        Projektseiten in Sitemap eintragen
                                    </label>
                                    <textarea
                                        className="md:col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[84px]"
                                        placeholder="Description fallback"
                                        value={seoConfig.pages.project.descriptionFallback}
                                        onChange={(event) => updateSeoProjectField('descriptionFallback', event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-neutral-200 p-4">
                                <h3 className="font-bold text-neutral-900 mb-3">Robots & Outputs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="User-agent"
                                        value={seoConfig.robots.userAgent}
                                        onChange={(event) => updateSeoRobotsField('userAgent', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Allow"
                                        value={seoConfig.robots.allow}
                                        onChange={(event) => updateSeoRobotsField('allow', event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        placeholder="Sitemap Path"
                                        value={seoConfig.robots.sitemapPath}
                                        onChange={(event) => updateSeoRobotsField('sitemapPath', event.target.value)}
                                    />
                                    <textarea
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[84px]"
                                        placeholder="Disallow (one per line)"
                                        value={seoConfig.robots.disallow.join('\n')}
                                        onChange={(event) => updateSeoRobotsField('disallow', parseTextAreaLines(event.target.value))}
                                    />
                                    <textarea
                                        className="md:col-span-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[84px]"
                                        placeholder="Additional directives (one per line)"
                                        value={seoConfig.robots.additionalDirectives.join('\n')}
                                        onChange={(event) => updateSeoRobotsField('additionalDirectives', parseTextAreaLines(event.target.value))}
                                    />
                                </div>

                                {seoGenerated && (
                                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-1">robots.txt</p>
                                            <pre className="text-xs bg-neutral-950 text-neutral-100 rounded-lg p-3 h-52 overflow-auto whitespace-pre-wrap">{seoGenerated.robotsTxt}</pre>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-1">site.webmanifest</p>
                                            <pre className="text-xs bg-neutral-950 text-neutral-100 rounded-lg p-3 h-52 overflow-auto whitespace-pre-wrap">{JSON.stringify(seoGenerated.manifest, null, 2)}</pre>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-bold mb-1">sitemap.xml</p>
                                            <pre className="text-xs bg-neutral-950 text-neutral-100 rounded-lg p-3 h-52 overflow-auto whitespace-pre-wrap">{seoGenerated.sitemapXml}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={seoSaving}
                                    className="rounded-lg bg-black text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {seoSaving ? 'Saving…' : 'SEO speichern'}
                                </button>
                                {seoSaveSuccess && <p className="text-sm text-emerald-600">{seoSaveSuccess}</p>}
                                {seoError && <p className="text-sm text-red-600">{seoError}</p>}
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-red-600">SEO-Konfiguration konnte nicht geladen werden.</p>
                    )}
                </section>

                <section className="rounded-2xl bg-white border border-neutral-200 p-6 mb-8">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-neutral-900">Neuen Artikel anlegen</h2>
                        <p className="text-sm text-neutral-500 mt-1">Lege neue Live-Artikel oder Archiv-Entwürfe direkt hier an.</p>
                    </div>

                    <form onSubmit={handleCreateArticle} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <input
                            type="text"
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="Titel"
                            value={formState.title}
                            onChange={(event) => {
                                const nextTitle = event.target.value;
                                setFormState((current) => ({
                                    ...current,
                                    title: nextTitle,
                                    slug: slugTouched ? current.slug : slugify(nextTitle)
                                }));
                            }}
                        />

                        <input
                            type="text"
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="slug-zb-neuer-artikel"
                            value={formState.slug}
                            onChange={(event) => {
                                setSlugTouched(true);
                                setFormState((current) => ({
                                    ...current,
                                    slug: slugify(event.target.value)
                                }));
                            }}
                        />

                        <input
                            type="text"
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="Subtitle"
                            value={formState.subtitle}
                            onChange={(event) => setFormState((current) => ({ ...current, subtitle: event.target.value }))}
                        />

                        <input
                            type="text"
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="Category"
                            value={formState.category}
                            onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                        />

                        <input
                            type="text"
                            className="md:col-span-2 xl:col-span-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder="Excerpt (optional)"
                            value={formState.excerpt}
                            onChange={(event) => setFormState((current) => ({ ...current, excerpt: event.target.value }))}
                        />

                        <select
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            value={formState.folder}
                            onChange={(event) => setFormState((current) => ({
                                ...current,
                                folder: event.target.value === 'archive' ? 'archive' : 'projects'
                            }))}
                        >
                            <option value="archive">Archive (Entwurf)</option>
                            <option value="projects">Live (content/projects)</option>
                        </select>

                        <label className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700">
                            <input
                                type="checkbox"
                                className="rounded border-neutral-300"
                                checked={formState.featured}
                                onChange={(event) => setFormState((current) => ({ ...current, featured: event.target.checked }))}
                            />
                            Featured aktivieren
                        </label>

                        <button
                            type="submit"
                            disabled={creating}
                            className="rounded-lg bg-black text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {creating ? 'Erstelle…' : 'Artikel erstellen'}
                        </button>
                    </form>

                    {createError && (
                        <p className="mt-3 text-sm text-red-600">{createError}</p>
                    )}
                </section>

                <section className="rounded-2xl bg-white border border-neutral-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">Seitenübersicht</h2>
                    {loading ? (
                        <p className="text-neutral-500 text-sm">Lade Seiten…</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {sitePages.map((page) => (
                                <div key={page.filePath} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-neutral-900 truncate">{page.route}</p>
                                        <span className={`text-[10px] uppercase tracking-[0.16em] font-bold px-2 py-1 rounded-full ${page.dynamic ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {page.dynamic ? 'Dynamic' : 'Static'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">{page.filePath}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mb-10">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-neutral-900">Live Artikel</h2>
                        <p className="text-sm text-neutral-500">{projects.length} Einträge</p>
                    </div>
                    {loading ? (
                        <p className="text-neutral-500 text-sm">Lade Artikel…</p>
                    ) : projects.length === 0 ? (
                        <p className="text-neutral-500 text-sm">Keine Live-Artikel vorhanden.</p>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {projects.map((project) => (
                                <ProjectCard key={`live-${project.slug}`} project={project} />
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-neutral-900">Archive / Entwürfe</h2>
                        <p className="text-sm text-neutral-500">{archivedProjects.length} Einträge</p>
                    </div>
                    {loading ? (
                        <p className="text-neutral-500 text-sm">Lade Archive…</p>
                    ) : archivedProjects.length === 0 ? (
                        <p className="text-neutral-500 text-sm">Keine Archiv-Artikel vorhanden.</p>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {archivedProjects.map((project) => (
                                <ProjectCard key={`archive-${project.slug}`} project={project} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return { notFound: true };
    }
    return { props: {} };
};
