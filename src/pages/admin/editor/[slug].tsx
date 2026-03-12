import React, { useEffect, useState, useMemo, useLayoutEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Reorder, motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, Type, LayoutTemplate, Palette, Video, Code, List as ListIcon, Link as LinkIcon, Play, Monitor, Smartphone, Tablet, BarChart, RotateCw, Expand, FileText, ImagePlus, Upload } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Block, parseMarkdownToBlocks, serializeBlocksToMarkdown, generateId, BlockType, parseFenceAttributes, serializeFenceAttributes } from '../../../lib/editor-blocks';
import { resolveAssetPath } from '../../../lib/assets';
import Article from '../../../components/Article';
import type { Project } from '../../../lib/markdown';

// --- Shared Components ---

interface AutoResizeTextareaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    onBlur?: () => void;
    onFocus?: () => void;
    autoFocus?: boolean;
    maxHeight?: number;
}

const AutoResizeTextarea = ({
    value,
    onChange,
    placeholder,
    className,
    rows = 1,
    onBlur,
    onFocus,
    autoFocus,
    maxHeight = 640,
}: AutoResizeTextareaProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const resize = useCallback(() => {
        const element = textareaRef.current;
        if (!element) return;

        element.style.height = '0px';
        const nextHeight = Math.min(element.scrollHeight, maxHeight);
        const minimumHeight = rows * 24;

        element.style.height = `${Math.max(nextHeight, minimumHeight)}px`;
        element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [maxHeight, rows]);

    useLayoutEffect(() => {
        resize();
    }, [value, resize]);

    return (
        <textarea
            ref={textareaRef}
            className={`resize-none ${className || ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            autoFocus={autoFocus}
            placeholder={placeholder}
            rows={rows}
            spellCheck
        />
    );
};

interface AssetLibraryEntry {
    path: string;
    name: string;
    updatedAt: string;
    sizeBytes: number;
    source?: 'local' | 'blob';
}

type AssetFieldKind = 'image' | 'video';

interface CollaborationPerson {
    name: string;
    url: string;
}

type EditorFolder = 'projects' | 'archive';
type EditorProjectStatus = 'Draft' | 'Published';

const PROJECT_TYPE_OPTIONS = ['Design', 'UX/UI', 'Developement'] as const;
const mapProjectTypeToContentHubs = (value: string): string[] => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return [];
    if (normalized.includes('ux') && normalized.includes('ui')) return ['ux-ui'];
    if (normalized.includes('develop') || normalized === 'dev') return ['development'];
    if (normalized.includes('design')) return ['design'];
    return [];
};

const readQueryString = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
    return typeof value === 'string' ? value : '';
};

const quoteYaml = (value: string): string => JSON.stringify(value);

function buildNewProjectDocument({
    id,
    slug,
    folder,
    title,
    subtitle,
    category,
    excerpt,
    featured,
}: {
    id: number;
    slug: string;
    folder: EditorFolder;
    title: string;
    subtitle: string;
    category: string;
    excerpt: string;
    featured: boolean;
}): { markdown: string; project: Project } {
    const now = new Date();
    const published = now.toISOString().slice(0, 10);
    const updatedAt = now.toISOString();
    const status: EditorProjectStatus = folder === 'archive' ? 'Draft' : 'Published';
    const projectType = 'Design';
    const contentHubs = mapProjectTypeToContentHubs(projectType);

    const markdown = [
        '---',
        `id: ${id}`,
        `title: ${quoteYaml(title)}`,
        `subtitle: ${quoteYaml(subtitle)}`,
        `slug: ${slug}`,
        `category: ${quoteYaml(category)}`,
        `published: '${published}'`,
        `status: ${quoteYaml(status)}`,
        `updatedAt: ${quoteYaml(updatedAt)}`,
        `content-hubs: ${JSON.stringify(contentHubs)}`,
        "image: 'assets/heroimage-bg.jpg'",
        `excerpts: ${quoteYaml(excerpt)}`,
        "bgColor: '#E5E7EB'",
        'hasAnimation: false',
        `featured: ${featured ? 'true' : 'false'}`,
        `type: ${JSON.stringify([projectType])}`,
        `description: ${quoteYaml(excerpt || subtitle || title)}`,
        '---',
        `# ${title}`,
        '',
        'Neuer Entwurf. Inhalt folgt.',
        '',
    ].join('\n');

    const project: Project = {
        id,
        title,
        subtitle,
        slug,
        category,
        excerpts: excerpt,
        published,
        status,
        updatedAt,
        contentHubs: contentHubs as Project['contentHubs'],
        description: excerpt || subtitle,
        bgColor: '#E5E7EB',
        image: 'assets/heroimage-bg.jpg',
        hasAnimation: false,
        featured,
        type: [projectType],
    };

    return { markdown, project };
}

const toPreviewSource = (assetPath: string): string => resolveAssetPath(assetPath || '');

const normalizeUrl = (value: string): string => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const parseCollaborationPeople = (input: any): CollaborationPerson[] => {
    if (!Array.isArray(input)) return [];

    return input
        .map((entry): CollaborationPerson | null => {
            if (typeof entry === 'string') {
                const name = entry.trim();
                return name ? { name, url: '' } : null;
            }

            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                return null;
            }

            const entries = Object.entries(entry as Record<string, unknown>)
                .map(([key, value]) => [String(key).trim(), typeof value === 'string' ? value.trim() : ''] as const)
                .filter(([key]) => Boolean(key));

            if (entries.length === 0) return null;

            const [firstKey, firstValue] = entries[0];
            let name = firstKey;
            let url = firstValue || '';

            if (!url && entries.length > 1) {
                const [secondKey, secondValue] = entries[1];
                if (secondValue) {
                    url = secondValue;
                } else if ((firstKey.includes('.') || /^https?:\/\//i.test(firstKey)) && !secondKey.includes('.')) {
                    name = secondKey;
                    url = firstKey;
                } else if (secondKey.includes('.') || /^https?:\/\//i.test(secondKey)) {
                    url = secondKey;
                }
            }

            return {
                name,
                url: normalizeUrl(url),
            };
        })
        .filter((person): person is CollaborationPerson => Boolean(person && person.name));
};

const serializeCollaborationPeople = (people: CollaborationPerson[]): Array<Record<string, string | null>> => {
    return people
        .map((person) => ({
            name: (person.name || '').trim(),
            url: (person.url || '').trim(),
        }))
        .filter((person) => person.name.length > 0)
        .map((person) => ({
            [person.name]: person.url ? normalizeUrl(person.url) : null,
        }));
};

const parseMediaMarkdownWithAttrs = (raw: string): { base: string; attrs: Record<string, string> } => {
    const value = (raw || '').trim();
    const match = value.match(/\{([^{}]+)\}\s*$/);
    if (!match) return { base: value, attrs: {} };

    const attrs = parseFenceAttributes(`\`\`\`media ${match[1]}`);
    const base = value.slice(0, match.index).trim();
    return { base: base || value, attrs };
};

const normalizeMediaAttrs = (attrs: Record<string, string>): Record<string, string> => {
    const out = { ...attrs };
    const shadowRaw = (out.shadow || '').trim().toLowerCase();
    const radiusRaw = (out.radius || '').trim().toLowerCase();
    const paddingRaw = Number(out.padding || '0');

    if (shadowRaw !== 'false' && shadowRaw !== '0') delete out.shadow;
    else out.shadow = 'false';

    if (radiusRaw !== 'false' && radiusRaw !== '0') delete out.radius;
    else out.radius = 'false';

    if (!Number.isFinite(paddingRaw) || paddingRaw <= 0) {
        delete out.padding;
    } else {
        out.padding = String(Math.max(0, Math.round(paddingRaw)));
    }

    return out;
};

const serializeMediaMarkdownWithAttrs = (base: string, attrs: Record<string, string>): string => {
    const cleanBase = (base || '').trim();
    const normalizedAttrs = normalizeMediaAttrs(attrs);
    const attrStr = Object.entries(normalizedAttrs)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${key}="${String(value).replace(/"/g, "'")}"`)
        .join(' ');

    if (!attrStr) return cleanBase;
    return `${cleanBase} {${attrStr}}`;
};

// --- Block Editors ---

function HeaderBlockEditor({ block, updateBlock, accentColor }: { block: Block, updateBlock: (id: string, updates: Partial<Block>) => void, accentColor: string }) {
    const [focused, setFocused] = useState(block.content === '' || block.content === '# New Header');

    const hLevel = block.content.match(/^#+/)?.[0]?.length || 1;
    const textContent = block.content.replace(/^#+\s*/, '');
    const sizes = {
        1: "text-4xl md:text-7xl lg:text-[6vw] leading-[1.05] tracking-[-0.03em] font-bold text-black mt-16 md:mt-24 mb-6 md:mb-12",
        2: "text-4xl md:text-7xl lg:text-[6vw] leading-[1.05] tracking-[-0.03em] font-bold text-black mt-16 md:mt-24 mb-0",
        3: "text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.01em] font-black font-space-grotesk mt-12 md:mt-16 mb-0",
        4: "text-[22px] md:text-[28px] leading-[1.2] font-bold font-space-grotesk mt-8 md:mt-10 mb-3 md:mb-4 text-[#1D1D1F]"
    };
    // @ts-ignore
    const headerClass = sizes[hLevel] || sizes[1];
    const headerStyle = hLevel === 3 ? { color: accentColor || '#1D1D1F' } : undefined;

    if (focused) {
        return (
            <div className="relative group/header bg-white shadow-sm border rounded-xl p-2 -mx-2 -my-2 z-10">
                <AutoResizeTextarea
                    className={`w-full bg-transparent border-none focus:ring-0 resize-none font-mono text-xl text-neutral-800 p-2`}
                    value={block.content}
                    onChange={(val) => updateBlock(block.id, { content: val })}
                    onBlur={() => setFocused(false)}
                    autoFocus
                    placeholder="# Header"
                />
            </div>
        );
    }

    return (
        <div
            className={`relative group/header cursor-text px-3 ${headerClass} hover:bg-neutral-50 rounded-lg transition-colors border border-transparent`}
            style={headerStyle}
            onClick={() => setFocused(true)}
        >
            {textContent || <span className="text-neutral-300"># Header (Empty)</span>}
            <div className="absolute -left-6 top-3 text-xs font-mono text-neutral-300 opacity-0 group-hover/header:opacity-100 transition-opacity select-none pointer-events-none">
                H{hLevel}
            </div>
        </div>
    );
}

function ParagraphBlockEditor({
    block,
    updateBlock,
    variant = 'normal',
    onVariantChange,
}: {
    block: Block,
    updateBlock: (id: string, updates: Partial<Block>) => void,
    variant?: 'normal' | 'small',
    onVariantChange?: (nextVariant: 'normal' | 'small') => void,
}) {
    const [focused, setFocused] = useState(block.content === '');
    const isSmall = variant === 'small';
    const variantValue: 'normal' | 'small' = isSmall ? 'small' : 'normal';

    const parseMD = (text: string) => {
        if (!text) return '';
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/~([^~]+)~/g, '<small class="text-[0.72em] leading-[2] align-baseline">$1</small>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline text-blue-600 cursor-pointer pointer-events-none" target="_blank" rel="noopener noreferrer">$1</a>');
        html = html.replace(/\n/g, '<br/>');
        return html;
    };

    const variantSelect = (
        <select
            value={variantValue}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onVariantChange?.(event.target.value === 'small' ? 'small' : 'normal')}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 transition-colors focus:border-black focus:ring-black"
            aria-label="Paragraph size"
        >
            <option value="normal">Large</option>
            <option value="small">Small</option>
        </select>
    );

    if (focused) {
        return (
            <div className="group/text rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)] -mx-2 transition-all">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Paragraph</span>
                    {variantSelect}
                </div>
                <AutoResizeTextarea
                    className={`w-full border-none bg-transparent p-0 font-sans text-neutral-800 placeholder-neutral-300 focus:ring-0 ${isSmall ? 'text-[15px] md:text-[18px] leading-[1.45]' : 'text-lg md:text-xl leading-[1.6]'}`}
                    value={block.content}
                    onChange={(val) => updateBlock(block.id, { content: val })}
                    onBlur={() => setFocused(false)}
                    autoFocus
                    placeholder={isSmall ? 'Small paragraph...' : 'Write something... Use **bold**, *italic*, or [Links](url)'}
                    maxHeight={560}
                />
                <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-xs text-neutral-400">
                    <span>**bold**</span>
                    <span>*italic*</span>
                    <span>[link label](url)</span>
                    {isSmall && <span className="text-indigo-500">small block</span>}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`w-full cursor-text rounded-xl border border-transparent p-3 font-sans text-neutral-800 transition-colors hover:bg-slate-50 ${isSmall ? 'text-[15px] md:text-[18px] leading-[1.45]' : 'text-lg md:text-xl leading-[1.6]'} min-h-[3rem]`}
            onClick={() => setFocused(true)}
        >
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{isSmall ? 'Small' : 'Large'} Paragraph</span>
                {variantSelect}
            </div>
            <div
                dangerouslySetInnerHTML={{ __html: parseMD(block.content) || '<span class="text-neutral-400">Write something...</span>' }}
            />
        </div>
    );
}

function ProjectRefEditor({ block, updateBlock, allProjects }: { block: Block, updateBlock: (id: string, updates: Partial<Block>) => void, allProjects: Project[] }) {
    const rawContent = block.content;
    const match = rawContent.match(/^\[(project|projects):(.*)\]$/i);
    const slugs = match ? match[2].split(/[,|]/).map(s => s.trim()).filter(Boolean) : [];

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const getProjectImageSrc = (imagePath?: string) => {
        if (!imagePath) return '';
        return resolveAssetPath(imagePath);
    };

    const updateSlugs = (newSlugs: string[]) => {
        if (newSlugs.length === 0) {
            updateBlock(block.id, { content: '[project:]' });
        } else if (newSlugs.length === 1) {
            updateBlock(block.id, { content: `[project:${newSlugs[0]}]` });
        } else {
            updateBlock(block.id, { content: `[projects:${newSlugs.join(',')}]` });
        }
    };

    const removeSlug = (slugToRemove: string) => {
        updateSlugs(slugs.filter(s => s !== slugToRemove));
    };

    const addSlug = (slugToAdd: string) => {
        if (!slugs.includes(slugToAdd)) {
            updateSlugs([...slugs, slugToAdd]);
        }
        setDropdownOpen(false);
    };

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const newSlugs = [...slugs];
        [newSlugs[idx - 1], newSlugs[idx]] = [newSlugs[idx], newSlugs[idx - 1]];
        updateSlugs(newSlugs);
    };

    const moveDown = (idx: number) => {
        if (idx === slugs.length - 1) return;
        const newSlugs = [...slugs];
        [newSlugs[idx + 1], newSlugs[idx]] = [newSlugs[idx], newSlugs[idx + 1]];
        updateSlugs(newSlugs);
    };

    const availableProjects = allProjects.filter(p => !slugs.includes(p.slug));

    return (
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><LinkIcon size={16} /> Project References</div>

            <div className="flex flex-col gap-2">
                {slugs.length === 0 && <div className="text-sm text-neutral-400 italic py-2">No projects selected.</div>}

                {slugs.map((s, idx) => {
                    const p = allProjects.find(ap => ap.slug === s);
                    if (!p) return <div key={s} className="text-xs text-red-500 p-2 border border-red-200 rounded">Project &quot;{s}&quot; not found. <button onClick={() => removeSlug(s)} className="underline font-bold">Remove</button></div>;

                    const img = p.heroImage || p.image;

                    return (
                        <div key={s} className="flex gap-4 items-center bg-[#F5F5F7] p-2 rounded-xl group/proj relative overflow-hidden">
                            {img ? (
                                <div className="w-16 h-12 shrink-0 bg-neutral-200 border rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
                                    <img src={getProjectImageSrc(img)} alt={p.title || p.slug} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-12 shrink-0 bg-neutral-200 border rounded-lg shadow-inner flex items-center justify-center text-[10px] text-neutral-400">No Img</div>
                            )}
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-bold text-sm text-neutral-800 truncate">{p.title}</span>
                                <span className="text-xs text-neutral-500 truncate">{p.subtitle || p.slug}</span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover/proj:opacity-100 transition-opacity bg-[#F5F5F7] pl-2 drop-shadow-sm">
                                <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1.5 text-neutral-400 hover:text-black hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent"><ArrowLeft size={16} className="rotate-90" /></button>
                                <button onClick={() => moveDown(idx)} disabled={idx === slugs.length - 1} className="p-1.5 text-neutral-400 hover:text-black hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent"><ArrowLeft size={16} className="-rotate-90" /></button>
                                <button onClick={() => removeSlug(s)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 ml-1 rounded-md"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="relative mt-2">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full text-left bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 border-dashed rounded-lg py-3 px-4 text-sm text-neutral-500 font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Add Project Reference
                </button>

                {dropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto p-1 flex flex-col gap-1">
                        {availableProjects.length === 0 ? (
                            <div className="p-4 text-center text-sm text-neutral-500">No more projects available.</div>
                        ) : (
                            availableProjects.map(p => {
                                const img = p.heroImage || p.image;
                                return (
                                    <button
                                        key={p.slug}
                                        onClick={() => addSlug(p.slug)}
                                        className="flex gap-3 items-center w-full text-left p-2 hover:bg-neutral-50 rounded-lg transition-colors"
                                    >
                                        {img ? (
                                            <div className="w-10 h-8 shrink-0 bg-neutral-200 rounded overflow-hidden">
                                                <img src={getProjectImageSrc(img)} alt={p.title || p.slug} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-8 shrink-0 bg-neutral-200 rounded" />
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm text-neutral-800 truncate">{p.title}</span>
                                            <span className="text-xs text-neutral-400 truncate">{p.subtitle || p.slug}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
        </div>
    );
}

function AssetPreviewTile({
    path,
    title,
    kind = 'image',
}: {
    path: string;
    title?: string;
    kind?: AssetFieldKind;
}) {
    const resolved = toPreviewSource(path);

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
            {kind === 'image' ? (
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolved} alt={title || path} className="h-full w-full object-cover" />
                </div>
            ) : (
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
                    <Video size={16} />
                </div>
            )}

            <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700">{title || 'Selected Asset'}</p>
                <p className="truncate text-xs text-slate-500">{path}</p>
            </div>
        </div>
    );
}

function AssetSelectionField({
    label,
    value,
    onChange,
    placeholder,
    kind = 'image',
    recentAssets,
    onUploadImage,
    helperText,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    kind?: AssetFieldKind;
    recentAssets: AssetLibraryEntry[];
    onUploadImage?: (file: File) => Promise<string | null>;
    helperText?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [recentSource, setRecentSource] = useState<'local' | 'blob'>('blob');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canUpload = kind === 'image' && typeof onUploadImage === 'function';
    const localAssets = recentAssets.filter((asset) => (asset.source || 'local') === 'local');
    const blobAssets = recentAssets.filter((asset) => asset.source === 'blob');
    const hasLocalAssets = localAssets.length > 0;
    const hasBlobAssets = blobAssets.length > 0;
    const visibleRecentAssets = (recentSource === 'blob' ? blobAssets : localAssets).slice(0, 24);

    useEffect(() => {
        if (recentSource === 'blob' && !hasBlobAssets && hasLocalAssets) {
            setRecentSource('local');
        }
    }, [hasBlobAssets, hasLocalAssets, recentSource]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !canUpload || !onUploadImage) return;

        try {
            setUploading(true);
            const uploadedPath = await onUploadImage(file);
            if (uploadedPath) {
                onChange(uploadedPath);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">{label}</label>
            <input
                className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
            />

            {value && <AssetPreviewTile path={value} title="Current Asset" kind={kind} />}

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setShowRecent((current) => !current)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                    <FileText size={14} />
                    {showRecent ? 'Recent Files ausblenden' : 'Recent Files anzeigen'}
                </button>

                {canUpload ? (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {uploading ? <Upload size={14} className="animate-pulse" /> : <ImagePlus size={14} />}
                            {uploading ? 'Upload...' : 'Bild hochladen'}
                        </button>
                    </>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        Keine Upload-Option fuer diesen Feldtyp
                    </div>
                )}
            </div>

            {showRecent && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Recent Source</span>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                            <button
                                type="button"
                                onClick={() => setRecentSource('local')}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${recentSource === 'local' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                Local ({localAssets.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRecentSource('blob')}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${recentSource === 'blob' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                Blob ({blobAssets.length})
                            </button>
                        </div>
                    </div>
                    {visibleRecentAssets.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-slate-500">
                            Keine recent files fuer <strong>{recentSource}</strong> gefunden.
                        </p>
                    ) : (
                        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-3">
                            {visibleRecentAssets.map((asset) => {
                                const isSelected = value === asset.path;
                                return (
                                    <button
                                        key={asset.path}
                                        type="button"
                                        onClick={() => {
                                            onChange(asset.path);
                                            setShowRecent(false);
                                        }}
                                        className={`overflow-hidden rounded-lg border text-left transition-colors ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-slate-200 hover:border-indigo-200'} bg-white`}
                                        title={asset.path}
                                    >
                                        {kind === 'image' ? (
                                            <div className="h-24 w-full bg-slate-200">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={toPreviewSource(asset.path)} alt={asset.name} className="h-full w-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="flex h-24 w-full items-center justify-center bg-slate-100 text-slate-500">
                                                <Video size={18} />
                                            </div>
                                        )}
                                        <div className="space-y-0.5 px-2 py-1.5">
                                            <p className="truncate text-[11px] font-semibold text-slate-700">{asset.name}</p>
                                            <p className="truncate text-[10px] text-slate-500">{asset.path}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        </div>
    );
}

// Inline component for the Add Menu
function AddMenu({
    onAdd,
    variant = 'inline',
    copiedBlock = null,
}: {
    onAdd: (type: BlockType) => void,
    variant?: 'inline' | 'footer',
    copiedBlock?: { type: 'copy' | 'cut', block: Block } | null,
}) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
        width: 620,
        maxHeight: 440,
        opensUpward: false,
    });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const isInline = variant === 'inline';
    const buttonSizeClass = isInline ? 'w-8 h-8' : 'w-10 h-10';
    const plusSize = isInline ? 14 : 16;

    const menuItems: Array<{ type: BlockType; label: string; icon: React.ReactNode }> = [
        { type: 'text', label: 'Paragraph', icon: <Type size={16} className="text-slate-500" /> },
        { type: 'header', label: 'Header', icon: <span className="text-xs font-bold text-slate-500">H1</span> },
        { type: 'list', label: 'List', icon: <ListIcon size={16} className="text-slate-500" /> },
        { type: 'mockup', label: 'Mockup', icon: <ImageIcon size={16} className="text-slate-500" /> },
        { type: 'callout', label: 'Callout', icon: <LayoutTemplate size={16} className="text-slate-500" /> },
        { type: 'video', label: 'Inline Video', icon: <Play size={16} className="text-slate-500" /> },
        { type: 'gallery', label: 'Gallery', icon: <ImageIcon size={16} className="text-slate-500" /> },
        { type: 'palette', label: 'Palette', icon: <Palette size={16} className="text-slate-500" /> },
        { type: 'stats', label: 'Stats', icon: <BarChart size={16} className="text-slate-500" /> },
        { type: 'font', label: 'Font', icon: <Type size={16} className="text-slate-500" /> },
        { type: 'code', label: 'Code', icon: <Code size={16} className="text-slate-500" /> },
        { type: 'project-ref', label: 'Project Ref', icon: <LinkIcon size={16} className="text-slate-500" /> },
        { type: 'animation-sequence', label: 'Anim Seq', icon: <Video size={16} className="text-slate-500" /> },
        { type: 'three', label: '3D Scene', icon: <Monitor size={16} className="text-slate-500" /> },
    ];

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        const viewportPadding = 12;
        const gap = 10;
        const width = Math.max(300, Math.min(680, window.innerWidth - viewportPadding * 2));
        const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
        const availableAbove = rect.top - viewportPadding;
        const maxHeight = Math.max(260, Math.min(560, Math.floor(window.innerHeight * 0.72)));
        const opensUpward = availableBelow < 300 && availableAbove > availableBelow;

        const unclampedLeft = rect.left + rect.width / 2;
        const halfWidth = width / 2;
        const minCenter = viewportPadding + halfWidth;
        const maxCenter = window.innerWidth - viewportPadding - halfWidth;
        const left = Math.max(minCenter, Math.min(maxCenter, unclampedLeft));

        const top = opensUpward
            ? Math.max(viewportPadding, rect.top - maxHeight - gap)
            : Math.min(window.innerHeight - viewportPadding - maxHeight, rect.bottom + gap);

        setMenuPosition({
            top,
            left,
            width,
            maxHeight,
            opensUpward,
        });
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;

        updateMenuPosition();
        const onReposition = () => updateMenuPosition();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, updateMenuPosition]);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (menuRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;
            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const handleToggle = () => {
        if (!open) updateMenuPosition();
        setOpen((current) => !current);
    };

    const menuContent = (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: menuPosition.opensUpward ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: menuPosition.opensUpward ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed z-[2100] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans shadow-[0_28px_48px_-28px_rgba(15,23,42,0.8)]"
            style={{ top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, maxHeight: menuPosition.maxHeight }}
        >
            <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Add Block</p>
            </div>

            <div className="overflow-y-auto p-2">
                {copiedBlock && (
                    <div className="mb-2 border-b border-slate-100 pb-2 flex">
                        <button
                            onClick={() => {
                                onAdd('paste');
                                setOpen(false);
                            }}
                            className="flex flex-1 items-center justify-start gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 hover:border-indigo-400 hover:bg-indigo-100 transition-colors"
                        >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm font-bold text-indigo-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            </span>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-bold text-indigo-900 leading-tight">Paste Block</span>
                                <span className="text-[10px] text-indigo-600/70 font-semibold uppercase tracking-wider">{copiedBlock.type} {copiedBlock.block.type}</span>
                            </div>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.type}
                            onClick={() => {
                                onAdd(item.type);
                                setOpen(false);
                            }}
                            className="flex min-h-[78px] flex-col items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50"
                        >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                                {item.icon}
                            </span>
                            <span className="text-xs font-semibold leading-tight text-slate-700">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className={`relative flex items-center justify-center group/add ${open ? 'z-[120]' : 'z-20'}`}>
            <div className={`absolute left-1/2 top-1/2 -z-10 h-[2px] -translate-x-1/2 -translate-y-1/2 bg-slate-300 transition-all ${isInline ? 'w-24 group-hover/add:w-36' : 'w-40 group-hover/add:w-52'}`} />
            <button
                ref={triggerRef}
                onClick={handleToggle}
                className={`${buttonSizeClass} flex items-center justify-center rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-[0_14px_24px_-16px_rgba(15,23,42,0.85)] transition-all hover:scale-105 active:scale-95`}
                aria-label="Open add block menu"
            >
                <Plus size={plusSize} />
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {open && menuContent}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

function FontBlockEditor({ block, updateBlock }: { block: Block, updateBlock: (id: string, updates: Partial<Block>) => void }) {
    const attrs = parseFenceAttributes(block.fenceInfo || '');
    const [localFontPath, setLocalFontPath] = useState('');
    const [generating, setGenerating] = useState(false);

    const handleGenerateSVG = async () => {
        if (!localFontPath || !attrs.name) {
            alert('Font Name and Local Font Path are required.');
            return;
        }
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/generate-font-svg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fontPath: localFontPath,
                    fontName: attrs.name,
                    generateSpecimen: true
                })
            });
            const data = await res.json();
            if (data.success) {
                updateBlock(block.id, {
                    fenceInfo: serializeFenceAttributes('font', {
                        ...attrs,
                        svgAa: data.files.aa,
                        svgTitle: data.files.title
                    })
                });
                setLocalFontPath('');
            } else {
                alert(data.error || 'Failed to generate SVG');
            }
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><Type size={16} /> Font Specimen</div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Font Name</label>
                    <input type="text" className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors" value={attrs.name || 'Inter'} onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('font', { ...attrs, name: e.target.value }) })} />
                </div>
                <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Styles</label>
                    <input type="text" className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors" value={attrs.styles || 'Regular, Medium, Bold'} onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('font', { ...attrs, styles: e.target.value }) })} />
                </div>
                <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Background Color</label>
                    <input type="text" className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors" value={attrs.bgColor || '#F5F5F7'} onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('font', { ...attrs, bgColor: e.target.value }) })} />
                </div>
                <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Text Color</label>
                    <input type="text" className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors" value={attrs.color || '#E6A105'} onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('font', { ...attrs, color: e.target.value }) })} />
                </div>

                <div className="col-span-2 mt-2 pt-3 border-t flex flex-col gap-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Local SVG Generator</label>
                    <p className="text-xs text-neutral-400">Generate path SVGs for text directly from a local font file. Useful for self-hosting custom fonts.</p>
                    <div className="flex gap-2 items-center">
                        <input type="text" className="flex-1 bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors" placeholder="e.g. /Library/Fonts/SFPro.ttf" value={localFontPath} onChange={(e) => setLocalFontPath(e.target.value)} />
                        <button
                            disabled={generating || !localFontPath}
                            onClick={handleGenerateSVG}
                            className="bg-black text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors shrink-0"
                        >
                            {generating ? 'Generating...' : 'Generate SVG'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- Main Editor Component ---

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${props.className || ''}`}
        />
    )
}

function SelectInput(props: React.InputHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props as any}
            className={`w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-[15px] font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer ${props.className || ''}`}
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', ...props.style }}
        />
    )
}

function StyledTextArea({ value, onChange, placeholder, rows }: { value: string, onChange: (val: string) => void, placeholder?: string, rows?: number }) {
    return (
        <AutoResizeTextarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows || 3}
            className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all custom-scrollbar min-h-[120px]"
        />
    )
}

function FrontmatterEditor({
    block,
    updateBlock,
    recentImageAssets,
    recentVideoAssets,
    onUploadImage,
    folder,
}: {
    block: Block;
    updateBlock: (id: string, updates: Partial<Block>) => void;
    recentImageAssets: AssetLibraryEntry[];
    recentVideoAssets: AssetLibraryEntry[];
    onUploadImage: (file: File) => Promise<string | null>;
    folder: EditorFolder;
}) {
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [rawMode, setRawMode] = useState(false);

    useEffect(() => {
        const cleanYaml = block.content.replace(/^---\n|\n---$/g, '').trim();
        fetch('/api/admin/yaml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'parse', payload: cleanYaml })
        })
            .then(r => r.json())
            .then(res => {
                if (res.data && typeof res.data === 'object') {
                    setData(res.data);
                } else {
                    setRawMode(true);
                }
            })
            .catch(() => setRawMode(true));
    }, [block.id]);

    const handleChange = (key: string, value: any) => {
        if (!data) return;
        const newData = { ...data, [key]: value };
        setData(newData);
        saveToBlock(newData);
    };

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveToBlock = (newData: any) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            const res = await fetch('/api/admin/yaml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stringify', payload: newData })
            });
            const json = await res.json();
            if (json.data) {
                updateBlock(block.id, { content: `---\n${json.data}---` });
            }
        }, 500);
    };

    if (rawMode || !data) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-medium mb-2">
                    <span className="text-neutral-500">Raw YAML Code</span>
                    <button onClick={() => { if (data) setRawMode(false) }} className="text-blue-500 hover:text-blue-600 underline">Try Form View</button>
                </div>
                <AutoResizeTextarea
                    className="w-full bg-[#1D1D1F] text-[#E5E5EA] border border-[#333336] rounded-xl p-5 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-white/20 focus:border-white transition-all shadow-inner"
                    value={block.content}
                    onChange={(val) => updateBlock(block.id, { content: val })}
                    rows={15}
                />
            </div>
        );
    }

    const {
        title = '',
        subtitle = '',
        slug = '',
        category = [],
        collaboration = [],
        excerpts = '',
        published = '',
        status = 'Published',
        updatedAt = '',
        description = '',
        bgColor = '',
        image = '',
        video = '',
        hasAnimation = false,
        animationSequence = {},
        featured = false,
        type = [],
        id = 0,
        awards = [],
        client = ''
    } = data;

    const toCommaStr = (arr: any) => Array.isArray(arr) ? arr.join(', ') : (typeof arr === 'string' ? arr : '');
    const fromCommaStr = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);
    const collaborationPeople = parseCollaborationPeople(collaboration);
    const typeValues = Array.isArray(type) ? type.map((item: unknown) => String(item)) : (typeof type === 'string' ? [type] : []);
    const selectedType = typeValues[0] || '';
    const typeOptions = selectedType && !PROJECT_TYPE_OPTIONS.includes(selectedType as typeof PROJECT_TYPE_OPTIONS[number])
        ? [selectedType, ...PROJECT_TYPE_OPTIONS]
        : [...PROJECT_TYPE_OPTIONS];
    const animationData: Record<string, any> = animationSequence && typeof animationSequence === 'object' ? animationSequence : {};
    const normalizedStatus: EditorProjectStatus = folder === 'archive'
        ? 'Draft'
        : status === 'Draft' ? 'Draft' : 'Published';
    const publishedValue = typeof published === 'string' ? published : '';
    const updatedAtValue = typeof updatedAt === 'string'
        ? updatedAt
        : updatedAt instanceof Date
            ? updatedAt.toISOString()
            : '';

    const updateCollaborationPerson = (index: number, key: 'name' | 'url', value: string) => {
        const nextPeople = [...collaborationPeople];
        const base = nextPeople[index] || { name: '', url: '' };
        nextPeople[index] = { ...base, [key]: value };
        handleChange('collaboration', serializeCollaborationPeople(nextPeople));
    };

    const handleTypeChange = (nextType: string) => {
        if (!data) return;
        const mappedContentHubs = mapProjectTypeToContentHubs(nextType);
        const nextData = {
            ...data,
            type: nextType ? [nextType] : [],
            'content-hubs': mappedContentHubs,
        };
        setData(nextData);
        saveToBlock(nextData);
    };

    const addCollaborationPerson = () => {
        handleChange('collaboration', serializeCollaborationPeople([...collaborationPeople, { name: 'New Person', url: '' }]));
    };

    const removeCollaborationPerson = (index: number) => {
        handleChange(
            'collaboration',
            serializeCollaborationPeople(collaborationPeople.filter((_, candidateIndex) => candidateIndex !== index))
        );
    };

    return (
        <div className="flex flex-col gap-0 text-neutral-800">
            <SectionCard title="Project Core" subtitle="Identity, Slug, Description & Lifecycle">
                <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-12">
                    {/* Text Unit (Full Width) */}
                    <div className="space-y-1.5 md:col-span-12">
                        <FieldLabel text="Project Title" />
                        <TextInput value={title} onChange={e => handleChange('title', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-12">
                        <FieldLabel text="Subtitle" />
                        <TextInput value={subtitle} onChange={e => handleChange('subtitle', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-12">
                        <FieldLabel text="Project Type" />
                        <SelectInput
                            value={selectedType}
                            onChange={(event) => handleTypeChange(event.target.value)}
                        >
                            <option value="">Not set</option>
                            {typeOptions.map((entry) => (
                                <option key={entry} value={entry}>
                                    {entry}
                                </option>
                            ))}
                        </SelectInput>
                    </div>
                    <div className="space-y-1.5 md:col-span-12">
                        <FieldLabel text="Excerpt (Hero Intro)" />
                        <StyledTextArea value={excerpts} onChange={val => handleChange('excerpts', val)} rows={3} />
                    </div>
                    <div className="space-y-1.5 md:col-span-12 mb-4">
                        <FieldLabel text="SEO Description" />
                        <StyledTextArea value={description} onChange={val => handleChange('description', val)} rows={2} />
                    </div>

                    {/* 3-Col Row: Publish Date, Status, Updated At */}
                    <div className="space-y-1.5 md:col-span-4 border-t border-slate-100 pt-6">
                        <FieldLabel text="Publish Date (YYYY-MM-DD)" />
                        <TextInput value={publishedValue} onChange={e => handleChange('published', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-4 border-t border-slate-100 pt-6">
                        <FieldLabel text="Status" />
                        <SelectInput
                            value={normalizedStatus}
                            onChange={(event) => handleChange('status', event.target.value === 'Draft' ? 'Draft' : 'Published')}
                            disabled={folder === 'archive'}
                            className="disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                        </SelectInput>
                    </div>
                    <div className="space-y-1.5 md:col-span-4 border-t border-slate-100 pt-6">
                        <FieldLabel text="Updated At (Auto)" />
                        <TextInput
                            value={updatedAtValue || 'Wird beim Speichern gesetzt'}
                            readOnly
                            className="bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                        />
                    </div>

                    {/* 2-Col Row: Project ID, Slug */}
                    <div className="space-y-1.5 md:col-span-6 mt-2">
                        <FieldLabel text="Project ID" />
                        <TextInput type="number" value={id} onChange={e => handleChange('id', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-6 mt-2">
                        <FieldLabel text="URL Slug" />
                        <TextInput value={slug} onChange={e => handleChange('slug', e.target.value)} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Hero Assets" subtitle="Media & Visual Setup">
                <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                        <AssetSelectionField
                            label="Cover / Hero Image"
                            value={image}
                            onChange={(next) => handleChange('image', next)}
                            placeholder="assets/..."
                            kind="image"
                            recentAssets={recentImageAssets}
                            onUploadImage={onUploadImage}
                            helperText="Aus Recent Files wählen oder direkt hochladen."
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <AssetSelectionField
                            label="Cover Video Loop (Optional)"
                            value={video}
                            onChange={(next) => handleChange('video', next)}
                            placeholder="assets/..."
                            kind="video"
                            recentAssets={recentVideoAssets}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel text="Project Brand Color" />
                        <div className="flex items-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all pl-2">
                            <input type="color" className="h-8 w-8 cursor-pointer rounded-full border-none bg-transparent p-0" value={bgColor} onChange={e => handleChange('bgColor', e.target.value)} />
                            <input className="flex-1 w-full bg-transparent border-none py-3.5 text-[15px] font-mono text-slate-800 focus:outline-none" value={bgColor} onChange={e => handleChange('bgColor', e.target.value)} placeholder="#007EFF" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pt-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900/20 focus:ring-offset-0 bg-slate-50 transition-all cursor-pointer" checked={featured} onChange={e => handleChange('featured', e.target.checked)} />
                            <span className="text-[15px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Featured Project</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900/20 focus:ring-offset-0 bg-slate-50 transition-all cursor-pointer" checked={hasAnimation} onChange={e => handleChange('hasAnimation', e.target.checked)} />
                            <span className="text-[15px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Has Animation</span>
                        </label>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Category & Awards" subtitle="Tags und Klassifizierung">
                <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <FieldLabel text="Category (Comma sep.)" />
                        <TextInput value={toCommaStr(category)} onChange={e => handleChange('category', fromCommaStr(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel text="Awards (Comma sep.)" />
                        <TextInput value={toCommaStr(awards)} onChange={e => handleChange('awards', fromCommaStr(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel text="Client" />
                        <TextInput value={client} onChange={e => handleChange('client', e.target.value)} placeholder="e.g. Apple" />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Collaboration" subtitle="Beteiligte Personen & Partner">
                {collaborationPeople.length === 0 ? (
                    <div className="mb-4 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                        <p className="text-sm font-medium text-slate-500">Noch keine Personen hinterlegt.</p>
                        <button
                            type="button"
                            onClick={addCollaborationPerson}
                            className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 uppercase tracking-widest shadow-sm"
                        >
                            <Plus size={14} /> Add Person
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 mb-5">
                        {collaborationPeople.map((person, index) => (
                            <div key={`${person.name}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center">
                                <div className="flex-1 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <TextInput
                                        value={person.name}
                                        onChange={(event) => updateCollaborationPerson(index, 'name', event.target.value)}
                                        placeholder="Name"
                                        className="!py-2.5 text-sm"
                                    />
                                    <TextInput
                                        value={person.url}
                                        onChange={(event) => updateCollaborationPerson(index, 'url', event.target.value)}
                                        placeholder="URL (optional)"
                                        className="!py-2.5 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCollaborationPerson(index)}
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition-colors hover:bg-red-50 shadow-sm self-end md:self-auto"
                                    aria-label="Remove collaborator"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {collaborationPeople.length > 0 && (
                    <button
                        type="button"
                        onClick={addCollaborationPerson}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 uppercase tracking-widest shadow-sm"
                    >
                        <Plus size={14} /> Add Person
                    </button>
                )}
            </SectionCard>

            {hasAnimation && (
                <SectionCard title="Scrub Sequence Paths" subtitle="Animation Video Pfade">
                    <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
                        <div className="space-y-1.5 md:col-span-2">
                            <AssetSelectionField
                                label="Desktop Video Path (.mp4)"
                                value={animationData.videoPath || ''}
                                onChange={(next) => handleChange('animationSequence', { ...animationData, videoPath: next })}
                                kind="video"
                                recentAssets={recentVideoAssets}
                                placeholder="assets/..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <AssetSelectionField
                                label="Safari Native Video Path"
                                value={animationData.safariVideoPath || ''}
                                onChange={(next) => handleChange('animationSequence', { ...animationData, safariVideoPath: next })}
                                kind="video"
                                recentAssets={recentVideoAssets}
                                placeholder="assets/..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <AssetSelectionField
                                label="Mobile Video Path"
                                value={animationData.mobileVideoPath || ''}
                                onChange={(next) => handleChange('animationSequence', { ...animationData, mobileVideoPath: next })}
                                kind="video"
                                recentAssets={recentVideoAssets}
                                placeholder="assets/..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel text="Total Frame Count" />
                            <TextInput type="number" value={animationData.frameCount || 0} onChange={e => handleChange('animationSequence', { ...animationData, frameCount: parseInt(e.target.value || '0', 10) || 0 })} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel text="Legacy Spritesheet Path" />
                            <TextInput value={animationData.spritesheetPath || ''} onChange={e => handleChange('animationSequence', { ...animationData, spritesheetPath: e.target.value })} />
                        </div>
                    </div>
                </SectionCard>
            )}

            <div className="mt-2 border-t border-slate-100 pt-4 px-2">
                <button onClick={() => setRawMode(true)} className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-black hover:bg-neutral-100 px-3 py-1.5 rounded-full w-max">
                    <Code size={12} /> View Raw Context
                </button>
            </div>
        </div >
    );
}

function SortableBlockRow({
    block,
    index,
    bodyIndex,
    isFrontmatter,
    isActive,
    renderBlockEditor,
    deleteBlock,
    handleBlockAction,
    copiedBlock,
    addBlock,
    focusBlockAndSyncPreview,
}: {
    block: Block,
    index: number,
    bodyIndex: number,
    isFrontmatter: boolean,
    isActive: boolean,
    renderBlockEditor: (block: Block) => React.ReactNode,
    deleteBlock: (id: string) => void,
    handleBlockAction: (action: 'copy' | 'cut', block: Block) => void,
    copiedBlock: { type: 'copy' | 'cut', block: Block } | null,
    addBlock: (index: number, type: BlockType) => void,
    focusBlockAndSyncPreview: (block: Block, bodyIndex: number) => void,
}) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            key={block.id}
            value={block}
            dragListener={false}
            dragControls={dragControls}
            dragElastic={0}
            dragMomentum={false}
            transition={{ layout: { duration: 0.14, ease: 'easeOut' } }}
            whileDrag={{
                scale: 1.01,
                boxShadow: '0 18px 34px -24px rgba(15,23,42,0.7)',
            }}
            onPointerDownCapture={() => focusBlockAndSyncPreview(block, bodyIndex)}
            onFocusCapture={() => focusBlockAndSyncPreview(block, bodyIndex)}
            className={`relative group py-1 transition-all ${isActive ? 'z-30' : ''}`}
        >
            <div className={`flex items-start gap-2 rounded-2xl px-1 py-1 transition-colors ${isFrontmatter ? 'opacity-60' : ''} ${isActive ? 'bg-white shadow-[0_16px_28px_-22px_rgba(15,23,42,0.6)] ring-1 ring-indigo-100' : ''}`}>
                {/* Drag Handle */}
                <div className="w-8 flex flex-col justify-center items-center h-12 shrink-0 mt-1">
                    {!isFrontmatter && (
                        <button
                            type="button"
                            onPointerDown={(event) => dragControls.start(event)}
                            className="cursor-grab active:cursor-grabbing rounded-md p-1.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-90 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Drag block"
                        >
                            <GripVertical size={18} />
                        </button>
                    )}
                </div>

                {/* Block Content */}
                <div className={`flex-1 relative ${block.type === 'text' || block.type === 'small-text' || block.type === 'header' ? 'py-1' : ''}`}>
                    {renderBlockEditor(block)}
                </div>

                {/* Block actions */}
                <div className="w-8 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 gap-1">
                    {!isFrontmatter && (
                        <>
                            <button
                                onClick={() => handleBlockAction('copy', block)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
                                title="Copy Block"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                            <button
                                onClick={() => handleBlockAction('cut', block)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
                                title="Cut Block"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                            </button>
                            <button
                                onClick={() => deleteBlock(block.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                title="Delete Block"
                            >
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Add Menu (appears between blocks) */}
            {!isFrontmatter && (
                <div className="relative mt-2 h-0">
                    <div className="absolute inset-x-0 top-0 flex -translate-y-1/2 justify-center">
                        <div className={`rounded-full bg-[#f7f9fc] px-2 py-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <AddMenu onAdd={(type) => addBlock(index, type)} variant="inline" copiedBlock={copiedBlock} />
                        </div>
                    </div>
                </div>
            )}
        </Reorder.Item>
    );
}

// --- Main Editor Component ---
export default function EditorPage() {
    const router = useRouter();
    const slugParam = router.query.slug;
    const folderParam = router.query.folder;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const folder = Array.isArray(folderParam)
        ? (folderParam[0] === 'archive' ? 'archive' : 'projects')
        : (folderParam === 'archive' ? 'archive' : 'projects');
    const folderQuery = folder === 'archive' ? '?folder=archive' : '';
    const newParam = readQueryString(router.query.new).toLowerCase();
    const isNewDocument = newParam === '1' || newParam === 'true' || newParam === 'yes';
    const queryTitle = readQueryString(router.query.title).trim();
    const querySubtitle = readQueryString(router.query.subtitle).trim();
    const queryCategory = readQueryString(router.query.category).trim();
    const queryExcerpt = readQueryString(router.query.excerpt).trim();
    const queryFeatured = readQueryString(router.query.featured).toLowerCase();
    const queryId = Number(readQueryString(router.query.id));

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [initialProject, setInitialProject] = useState<Project | null>(null);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'body' | 'header'>('body');
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [recentImageAssets, setRecentImageAssets] = useState<AssetLibraryEntry[]>([]);
    const [recentVideoAssets, setRecentVideoAssets] = useState<AssetLibraryEntry[]>([]);

    // Live Preview State
    const [previewVisible, setPreviewVisible] = useState(true);
    const [previewPanelWidth, setPreviewPanelWidth] = useState(860);
    const [viewportWidth, setViewportWidth] = useState(1440);
    const [previewViewport, setPreviewViewport] = useState<'mobile' | 'tablet' | 'desktop' | 'full'>('desktop');
    const [previewOrientation, setPreviewOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [previewZoom, setPreviewZoom] = useState<number>(100);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);
    const previewResizingRef = useRef(false);

    // Block Clipboard State
    const [copiedBlock, setCopiedBlock] = useState<{ type: 'copy' | 'cut', block: Block } | null>(null);

    const loadAssetLibrary = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/assets');
            if (!response.ok) return;

            const payload = await response.json();
            if (Array.isArray(payload?.recentImages)) {
                setRecentImageAssets(payload.recentImages);
            }
            if (Array.isArray(payload?.recentVideos)) {
                setRecentVideoAssets(payload.recentVideos);
            }
        } catch {
            // Silent fallback: editor remains usable without asset API
        }
    }, []);

    const uploadImageAsset = useCallback(async (file: File): Promise<string | null> => {
        try {
            if (file.size > 35 * 1024 * 1024) {
                alert('Bild ist zu gross. Bitte unter 35MB bleiben.');
                return null;
            }

            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
                reader.onerror = () => reject(new Error('Failed reading file'));
                reader.readAsDataURL(file);
            });

            if (!dataUrl) return null;

            const response = await fetch('/api/admin/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    dataUrl,
                }),
            });

            const rawResponse = await response.text();
            let payload: any = null;
            try {
                payload = rawResponse ? JSON.parse(rawResponse) : null;
            } catch {
                payload = { error: rawResponse || `Upload fehlgeschlagen (HTTP ${response.status})` };
            }

            if (!response.ok) {
                alert(payload?.error || `Bild-Upload fehlgeschlagen (HTTP ${response.status}).`);
                return null;
            }

            if (Array.isArray(payload?.assets?.recentImages)) {
                setRecentImageAssets(payload.assets.recentImages);
            }
            if (Array.isArray(payload?.assets?.recentVideos)) {
                setRecentVideoAssets(payload.assets.recentVideos);
            }

            if (typeof payload?.path === 'string') {
                try {
                    await navigator.clipboard.writeText(payload.path);
                } catch {
                    // Clipboard can fail on insecure contexts; URL insert still works.
                }
                return payload.path;
            }

            return null;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload.';
            alert(`Bild-Upload fehlgeschlagen: ${message}`);
            return null;
        }
    }, []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'PREVIEW_READY') {
                setIframeReady(true);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        loadAssetLibrary();
    }, [loadAssetLibrary]);

    const clampPreviewPanelWidth = useCallback((candidate: number) => {
        const minWidth = 460;
        const maxWidth = Math.max(560, window.innerWidth - 120);
        return Math.max(minWidth, Math.min(maxWidth, candidate));
    }, []);

    useEffect(() => {
        const updateViewportWidth = () => setViewportWidth(window.innerWidth);
        updateViewportWidth();
        window.addEventListener('resize', updateViewportWidth);
        return () => window.removeEventListener('resize', updateViewportWidth);
    }, []);

    useEffect(() => {
        setPreviewPanelWidth((current) => clampPreviewPanelWidth(current));
    }, [clampPreviewPanelWidth]);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!previewResizingRef.current) return;
            const nextWidth = window.innerWidth - event.clientX;
            setPreviewPanelWidth(clampPreviewPanelWidth(nextWidth));
        };

        const handlePointerUp = () => {
            if (!previewResizingRef.current) return;
            previewResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        const handleWindowResize = () => {
            setPreviewPanelWidth((current) => clampPreviewPanelWidth(current));
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('resize', handleWindowResize);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [clampPreviewPanelWidth]);

    const handlePreviewResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        previewResizingRef.current = true;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;

        const loadEditor = async () => {
            setLoading(true);
            try {
                const projectsResponse = await fetch('/api/admin/projects');
                const projectsPayload = await projectsResponse.json().catch(() => ({}));
                if (!projectsResponse.ok) {
                    throw new Error(projectsPayload?.error || 'Projekte konnten nicht geladen werden.');
                }

                const liveProjects = Array.isArray(projectsPayload?.projects) ? projectsPayload.projects : [];
                const archivedProjects = Array.isArray(projectsPayload?.archivedProjects) ? projectsPayload.archivedProjects : [];
                const combinedProjects = [...liveProjects, ...archivedProjects] as Project[];
                if (cancelled) return;
                setAllProjects(combinedProjects);

                const activeList = (folder === 'archive' ? archivedProjects : liveProjects) as Project[];
                const projectInFolder = activeList.find((project) => project.slug === slug);
                const projectAny = combinedProjects.find((project) => project.slug === slug);
                const existingProject = projectInFolder || projectAny;

                if (isNewDocument && !projectInFolder) {
                    const maxId = combinedProjects.reduce((max: number, project) => {
                        const value = Number(project.id);
                        return Number.isFinite(value) ? Math.max(max, value) : max;
                    }, 0);
                    const nextId = Number.isFinite(queryId) && queryId > 0 ? queryId : maxId + 1;
                    const featuredFromQuery = ['1', 'true', 'yes', 'on'].includes(queryFeatured);
                    const cleanTitle = queryTitle || slug;
                    const seed = buildNewProjectDocument({
                        id: nextId,
                        slug,
                        folder,
                        title: cleanTitle,
                        subtitle: querySubtitle || 'Draft',
                        category: queryCategory || 'Draft',
                        excerpt: queryExcerpt || 'Neuer Artikelentwurf.',
                        featured: featuredFromQuery,
                    });
                    if (cancelled) return;
                    setInitialProject(seed.project);
                    setBlocks(parseMarkdownToBlocks(seed.markdown));
                    return;
                }

                if (existingProject) {
                    if (cancelled) return;
                    setInitialProject(existingProject);
                }

                const markdownResponse = await fetch(`/api/admin/project/${slug}${folderQuery}`);
                const markdownPayload = await markdownResponse.json().catch(() => ({}));
                if (!markdownResponse.ok) {
                    throw new Error(markdownPayload?.error || 'Markdown konnte nicht geladen werden.');
                }
                if (!cancelled && typeof markdownPayload?.content === 'string') {
                    setBlocks(parseMarkdownToBlocks(markdownPayload.content));
                }
            } catch (loadError) {
                if (!cancelled) {
                    const message = loadError instanceof Error ? loadError.message : 'Editor konnte nicht geladen werden.';
                    alert(message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadEditor();

        return () => {
            cancelled = true;
        };
    }, [folder, folderQuery, isNewDocument, queryCategory, queryExcerpt, queryFeatured, queryId, querySubtitle, queryTitle, slug]);

    const handleSave = async () => {
        if (!slug) return;
        setSaving(true);
        try {
            const md = serializeBlocksToMarkdown(blocks);
            const response = await fetch(`/api/admin/project/${slug}${folderQuery}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: md })
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error || 'Speichern fehlgeschlagen.');
            }

            if (payload?.content && typeof payload.content === 'string') {
                setBlocks(parseMarkdownToBlocks(payload.content));
            }
            if (isNewDocument) {
                await router.replace(`/admin/editor/${slug}${folderQuery}`);
            }
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : 'Speichern fehlgeschlagen.';
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    const updateBlock = (id: string, updates: Partial<Block>) => {
        setBlocks(b => b.map(block => block.id === id ? { ...block, ...updates } : block));
    };

    const deleteBlock = (id: string) => {
        setBlocks(b => b.filter(block => block.id !== id));
    };

    const addBlock = (index: number, type: BlockType) => {
        const newBlock: Block = {
            id: generateId(),
            type,
            content: '',
            fenceInfo: ''
        };

        if (type === 'paste') {
            if (!copiedBlock) return;
            const pastedBlock = {
                ...copiedBlock.block,
                id: generateId()
            };
            const newBlocks = [...blocks];
            newBlocks.splice(index + 1, 0, pastedBlock);

            if (copiedBlock.type === 'cut') {
                const finalBlocks = newBlocks.filter(b => b.id !== copiedBlock.block.id);
                setBlocks(finalBlocks);
                setCopiedBlock(null);
            } else {
                setBlocks(newBlocks);
            }
            return;
        }

        if (type === 'mockup') {
            newBlock.fenceInfo = '```mockup type="iphone" image="" bgColor="#F5F5F7"';
        } else if (type === 'callout') {
            newBlock.fenceInfo = '```insight';
        } else if (type === 'palette') {
            newBlock.fenceInfo = '```palette';
            newBlock.content = 'name="Primary" hex="#FFFFFF" rgb="255,255,255" rank="1"';
        } else if (type === 'gallery') {
            newBlock.content = '![]';
        } else if (type === 'video') {
            newBlock.content = '[video](assets/video.mp4|assets/poster.jpg)';
        } else if (type === 'project-ref') {
            newBlock.content = '[project:some-slug]';
        } else if (type === 'header') {
            newBlock.content = '# New Header';
        } else if (type === 'list') {
            newBlock.fenceInfo = '```list style="numbered" split="none"';
            newBlock.content = '- Item 1\n- Item 2';
        } else if (type === 'small-text') {
            newBlock.fenceInfo = '```small';
            newBlock.content = 'This is a small paragraph block with tighter leading.';
        } else if (type === 'code') {
            newBlock.fenceInfo = '```code type="typescript"';
            newBlock.content = '// Your code here';
        } else if (type === 'animation-sequence') {
            newBlock.fenceInfo = '```animationsequence videoPath=""';
        } else if (type === 'three') {
            newBlock.fenceInfo = '```three';
            newBlock.content = 'preset="city"\nautoRotate="true"\nheight="90vh"\nmodel=""\nscale="1"\nposition="0, 0, 0"\nrotation="0, 0, 0"';
        }

        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
    };

    const buildBlockSnippet = useCallback((raw: string): string => {
        return raw
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/!\[[^\]]*\]\(([^)]+)\)/g, '')
            .replace(/\[video(?:\s+loop)?\]\(([^)]+)\)/gi, '')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
            .replace(/[`*_~>#-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 180);
    }, []);

    const focusBlockAndSyncPreview = useCallback((block: Block, bodyIndex: number) => {
        setActiveBlockId(block.id);

        if (viewMode !== 'body') return;
        if (block.type === 'frontmatter') return;
        if (!iframeReady || !iframeRef.current) return;

        iframeRef.current.contentWindow?.postMessage({
            type: 'SCROLL_TO_BLOCK',
            payload: {
                bodyIndex,
                blockType: block.type,
                snippet: buildBlockSnippet(block.content),
                rawContent: block.content,
                fenceInfo: block.fenceInfo || '',
            },
        }, '*');
    }, [buildBlockSnippet, iframeReady, viewMode]);

    const frontmatterContent = blocks.find(b => b.type === 'frontmatter')?.content || '';
    const editorAccentColor =
        frontmatterContent.match(/^bgColor:\s*['"]?(.*?)['"]?$/m)?.[1] ||
        initialProject?.bgColor ||
        '#1D1D1F';

    const renderBlockEditor = (block: Block) => {
        if (block.type === 'frontmatter') {
            return null; // Frontmatter is edited in the Header View
        }

        if (block.type === 'header') return <HeaderBlockEditor block={block} updateBlock={updateBlock} accentColor={editorAccentColor} />;
        if (block.type === 'text' || block.type === 'small-text') {
            return (
                <ParagraphBlockEditor
                    block={block}
                    updateBlock={updateBlock}
                    variant={block.type === 'small-text' ? 'small' : 'normal'}
                    onVariantChange={(nextVariant) => {
                        if (nextVariant === 'small') {
                            const nextFenceInfo =
                                block.fenceInfo && block.fenceInfo.trim().startsWith('```small')
                                    ? block.fenceInfo
                                    : '```small';
                            updateBlock(block.id, { type: 'small-text', fenceInfo: nextFenceInfo });
                            return;
                        }
                        updateBlock(block.id, { type: 'text' });
                    }}
                />
            );
        }
        if (block.type === 'project-ref') return <ProjectRefEditor block={block} updateBlock={updateBlock} allProjects={allProjects} />;

        if (block.type === 'list') {
            const attrs = parseFenceAttributes(block.fenceInfo || '');
            const styleValue = attrs.style || 'numbered';
            const splitValue = attrs.split || 'none';
            const splitAfterValue = attrs.splitAfter || (splitValue === 'height' ? '12' : '6');
            const shortWordsValue = attrs.shortWords || '4';

            const updateListConfig = (updates: Record<string, string>) => {
                const nextAttrs = { ...attrs, ...updates };
                if (!nextAttrs.style) nextAttrs.style = 'numbered';
                if (!nextAttrs.split) nextAttrs.split = 'none';

                if (nextAttrs.split === 'none') {
                    delete nextAttrs.splitAfter;
                    delete nextAttrs.shortWords;
                } else {
                    if (!nextAttrs.splitAfter) nextAttrs.splitAfter = nextAttrs.split === 'height' ? '12' : '6';
                    if (!nextAttrs.shortWords) nextAttrs.shortWords = '4';
                }

                updateBlock(block.id, { fenceInfo: serializeFenceAttributes('list', nextAttrs) });
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><ListIcon size={16} /> List</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Style</label>
                            <select
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={styleValue}
                                onChange={(e) => updateListConfig({ style: e.target.value })}
                            >
                                <option value="numbered">Numbered</option>
                                <option value="plain">Plain (ohne Zahlen)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Desktop Split</label>
                            <select
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={splitValue}
                                onChange={(e) => {
                                    const nextSplit = e.target.value;
                                    updateListConfig({
                                        split: nextSplit,
                                        splitAfter: nextSplit === 'height' ? '12' : '6'
                                    });
                                }}
                            >
                                <option value="none">Off</option>
                                <option value="count">By item count</option>
                                <option value="height">By estimated height</option>
                            </select>
                        </div>
                        {splitValue !== 'none' && (
                            <>
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1 block">
                                        {splitValue === 'count' ? 'Break after items' : 'Break height (est.)'}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                        value={splitAfterValue}
                                        onChange={(e) => updateListConfig({ splitAfter: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1 block">Short item max words</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                        value={shortWordsValue}
                                        onChange={(e) => updateListConfig({ shortWords: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-neutral-500">
                        Desktop only: Split applies only for short entries. Mobile stays single-column.
                    </p>
                    <AutoResizeTextarea
                        className="w-full bg-neutral-50 border rounded p-3 font-sans text-base focus:ring-black focus:border-black transition-colors"
                        value={block.content}
                        onChange={(val) => updateBlock(block.id, { content: val })}
                        placeholder="- Item 1&#10;- Item 2"
                        rows={3}
                    />
                </div>
            );
        }

        if (block.type === 'mockup') {
            const attrs = parseFenceAttributes(block.fenceInfo || '');
            const mediaMode: 'image' | 'video' = attrs.video ? 'video' : 'image';
            const updateMockupAttrs = (nextAttrs: Record<string, string>) => {
                updateBlock(block.id, { fenceInfo: serializeFenceAttributes('mockup', nextAttrs) });
            };

            const switchMockupMediaMode = (nextMode: 'image' | 'video') => {
                const nextAttrs = { ...attrs };
                if (nextMode === 'video') {
                    delete nextAttrs.image;
                    nextAttrs.video = attrs.video || '';
                } else {
                    delete nextAttrs.video;
                    nextAttrs.image = attrs.image || '';
                }
                updateMockupAttrs(nextAttrs);
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><ImageIcon size={16} /> Mockup Device</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                            <select
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={attrs.type || 'iphone'}
                                onChange={(e) => updateMockupAttrs({ ...attrs, type: e.target.value })}
                            >
                                <option value="iphone">iPhone</option>
                                <option value="android">Android</option>
                                <option value="ipad">iPad</option>
                                <option value="macbook">MacBook</option>
                                <option value="safari-tab">Safari Tab</option>
                                <option value="tv">TV</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Background Color</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={attrs.bgColor || '#F5F5F7'}
                                onChange={(e) => updateMockupAttrs({ ...attrs, bgColor: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-neutral-500 mb-1 block">Media Source</label>
                            <select
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={mediaMode}
                                onChange={(e) => switchMockupMediaMode(e.target.value === 'video' ? 'video' : 'image')}
                            >
                                <option value="image">Image</option>
                                <option value="video">Video URL</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            {mediaMode === 'video' ? (
                                <AssetSelectionField
                                    label="Video Path"
                                    value={attrs.video || ''}
                                    onChange={(nextPath) => updateMockupAttrs({ ...attrs, video: nextPath })}
                                    placeholder="assets/mockup-video.mp4"
                                    kind="video"
                                    recentAssets={recentVideoAssets}
                                    helperText="Mockups (auch TV) koennen direkt Video-URLs nutzen."
                                />
                            ) : (
                                <AssetSelectionField
                                    label="Image Path"
                                    value={attrs.image || ''}
                                    onChange={(nextPath) => updateMockupAttrs({ ...attrs, image: nextPath })}
                                    placeholder="assets/project/img.png"
                                    kind="image"
                                    recentAssets={recentImageAssets}
                                    onUploadImage={uploadImageAsset}
                                />
                            )}
                        </div>
                        {(attrs.type === 'safari-tab' || attrs.type === 'safari') && (
                            <div className="col-span-2">
                                <label className="text-xs text-neutral-500 mb-1 block">URL (optional, makes mockup clickable)</label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                    value={attrs.url || ''}
                                    placeholder="https://example.com"
                                    onChange={(e) => updateMockupAttrs({ ...attrs, url: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (block.type === 'video') {
            const match = block.content.match(/\[(video.*?)\]\((.*?)\)/);
            let videoUrl = '';
            let posterUrl = '';
            let isLoop = false;

            if (match) {
                isLoop = match[1].toLowerCase().includes('loop');
                const parts = match[2].split('|');
                videoUrl = parts[0] || '';
                posterUrl = parts[1] || '';
            }

            const constructVideoStr = (url: string, poster: string, loop: boolean) => {
                return `[video${loop ? ' loop' : ''}](${url}${poster ? '|' + poster : ''})`;
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><Play size={16} /> Video Block</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <AssetSelectionField
                                label="Video URL (.mp4)"
                                value={videoUrl}
                                onChange={(nextVideo) => updateBlock(block.id, { content: constructVideoStr(nextVideo, posterUrl, isLoop) })}
                                placeholder="assets/video.mp4"
                                kind="video"
                                recentAssets={recentVideoAssets}
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isLoop}
                                onChange={(e) => updateBlock(block.id, { content: constructVideoStr(videoUrl, posterUrl, e.target.checked) })}
                                className="rounded focus:ring-black text-black"
                            />
                            <label className="text-sm font-medium">Loop infinitely</label>
                        </div>
                        <div className="col-span-2">
                            <AssetSelectionField
                                label="Poster Image (Optional)"
                                value={posterUrl}
                                onChange={(nextPoster) => updateBlock(block.id, { content: constructVideoStr(videoUrl, nextPoster, isLoop) })}
                                placeholder="assets/poster.webp"
                                kind="image"
                                recentAssets={recentImageAssets}
                                onUploadImage={uploadImageAsset}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (block.type === 'gallery') {
            const parsed = parseMediaMarkdownWithAttrs(block.content);
            const baseValue = parsed.base || block.content;
            const shadowEnabled = !['false', '0'].includes((parsed.attrs.shadow || '').trim().toLowerCase());
            const radiusEnabled = !['false', '0'].includes((parsed.attrs.radius || '').trim().toLowerCase());
            const parsedPadding = Number(parsed.attrs.padding || '0');
            const paddingValue = Number.isFinite(parsedPadding) && parsedPadding > 0 ? Math.round(parsedPadding) : 0;
            const galleryMatch = baseValue.trim().match(/^!\[(.*)\]$/);
            const galleryItems = galleryMatch
                ? galleryMatch[1].split('|').map((item) => item.trim())
                : [];

            const updateGalleryBase = (nextBase: string) => {
                updateBlock(block.id, { content: serializeMediaMarkdownWithAttrs(nextBase, parsed.attrs) });
            };

            const updateGalleryAttrs = (nextAttrs: Record<string, string>) => {
                updateBlock(block.id, { content: serializeMediaMarkdownWithAttrs(baseValue, nextAttrs) });
            };

            const updateGalleryItems = (nextItems: string[]) => {
                const nextBase = `![${nextItems.join('|')}]`;
                updateGalleryBase(nextBase);
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><ImageIcon size={16} /> Image Gallery</div>
                    <p className="text-xs text-neutral-500">Jedes Bild hat Quick-Preview, Recent Files Dropdown und Upload nach <code>public/assets/upload</code>.</p>
                    <div className="space-y-3">
                        {galleryItems.length === 0 && (
                            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
                                Keine Bilder gesetzt. Fuege unten das erste Galerie-Bild hinzu.
                            </p>
                        )}
                        {galleryItems.map((item, index) => (
                            <div key={`${item}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <AssetSelectionField
                                            label={`Gallery Image ${index + 1}`}
                                            value={item}
                                            onChange={(nextPath) => {
                                                const nextItems = [...galleryItems];
                                                nextItems[index] = nextPath;
                                                updateGalleryItems(nextItems);
                                            }}
                                            placeholder="assets/gallery/image.webp"
                                            kind="image"
                                            recentAssets={recentImageAssets}
                                            onUploadImage={uploadImageAsset}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateGalleryItems(galleryItems.filter((_, currentIndex) => currentIndex !== index))}
                                        className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-red-500 transition-colors hover:bg-red-50"
                                        aria-label="Remove gallery image"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => updateGalleryItems([...galleryItems, ''])}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                            <Plus size={14} />
                            Add Gallery Image
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-end">
                        <label className="flex items-center gap-2 text-sm text-neutral-700 font-medium">
                            <input
                                type="checkbox"
                                checked={shadowEnabled}
                                onChange={(e) => {
                                    const nextAttrs = { ...parsed.attrs };
                                    if (e.target.checked) delete nextAttrs.shadow;
                                    else nextAttrs.shadow = 'false';
                                    updateGalleryAttrs(nextAttrs);
                                }}
                                className="rounded focus:ring-black text-black"
                            />
                            Shadow
                        </label>
                        <label className="flex items-center gap-2 text-sm text-neutral-700 font-medium">
                            <input
                                type="checkbox"
                                checked={radiusEnabled}
                                onChange={(e) => {
                                    const nextAttrs = { ...parsed.attrs };
                                    if (e.target.checked) delete nextAttrs.radius;
                                    else nextAttrs.radius = 'false';
                                    updateGalleryAttrs(nextAttrs);
                                }}
                                className="rounded focus:ring-black text-black"
                            />
                            Radius
                        </label>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Padding (px)</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={paddingValue}
                                onChange={(e) => {
                                    const nextAttrs = { ...parsed.attrs };
                                    const n = Number(e.target.value || '0');
                                    if (!Number.isFinite(n) || n <= 0) delete nextAttrs.padding;
                                    else nextAttrs.padding = String(Math.round(n));
                                    updateGalleryAttrs(nextAttrs);
                                }}
                            />
                        </div>
                    </div>
                    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-600">Raw Gallery Markdown</summary>
                        <AutoResizeTextarea
                            className="mt-2 w-full rounded border bg-white p-2 text-sm font-mono transition-colors focus:border-black focus:ring-black"
                            value={baseValue}
                            onChange={updateGalleryBase}
                            placeholder="![image1.png|image2.png]"
                            rows={1}
                        />
                        <p className="mt-2 text-xs text-neutral-500">
                            Optional syntax: <code>{'![img1|img2] {shadow="false" radius="false" padding="12"}'}</code>
                        </p>
                    </details>
                </div>
            );
        }

        if (block.type === 'palette') {
            const lines = block.content.split('\n').filter(l => l.trim() !== '');
            const normalizeHex = (hex: string) => {
                const value = (hex || '').trim().replace(/^#/, '');
                if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(value)) return null;
                const expanded = value.length === 3 ? value.split('').map(ch => ch + ch).join('') : value;
                return `#${expanded.toUpperCase()}`;
            };

            const hexToRgb = (hex: string) => {
                const normalized = normalizeHex(hex);
                if (!normalized) return null;
                const value = normalized.slice(1);
                const r = parseInt(value.slice(0, 2), 16);
                const g = parseInt(value.slice(2, 4), 16);
                const b = parseInt(value.slice(4, 6), 16);
                return `${r},${g},${b}`;
            };

            const rgbToHex = (rgb: string) => {
                const match = rgb.match(/^\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*$/);
                if (!match) return null;
                const channels = [Number(match[1]), Number(match[2]), Number(match[3])];
                if (channels.some(ch => !Number.isFinite(ch) || ch < 0 || ch > 255)) return null;
                return `#${channels.map(ch => ch.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
            };

            const parsePaletteLine = (line: string, idx: number) => {
                const attrs = parseFenceAttributes(line);
                const hexMatch = line.match(/#([0-9a-fA-F]{3,8})/);
                const rgbFnMatch = line.match(/rgb\s*\(([^)]+)\)/i);
                const usageMatch = line.match(/usage\s*=\s*(?:"([^"]+)"|(.+?))(?:\s+(?:rank|priority)\s*=|$)/i);
                const rankMatch = line.match(/(?:rank|priority)\s*=\s*("?)([1-5])\1/i);
                const firstHexIndex = line.indexOf('#');
                const fallbackName = firstHexIndex > 0 ? line.slice(0, firstHexIndex).trim() : `Color ${idx + 1}`;

                const rankRaw = attrs.rank || attrs.priority || rankMatch?.[2] || '3';
                const parsedRank = Number(rankRaw);
                const rank = Number.isFinite(parsedRank) ? String(Math.max(1, Math.min(5, parsedRank))) : '3';
                const rawHex = (attrs.hex || (hexMatch ? `#${hexMatch[1]}` : '')).trim();
                const normalizedHex = normalizeHex(rawHex);
                const hex = normalizedHex || rawHex || '#CCCCCC';
                const rgbFromInput = (attrs.rgb || (rgbFnMatch?.[1] || '')).trim();
                const rgb = rgbFromInput || (normalizedHex ? (hexToRgb(normalizedHex) || '') : '');

                return {
                    name: attrs.name || fallbackName || `Color ${idx + 1}`,
                    hex,
                    rgb,
                    usage: attrs.usage || (usageMatch?.[1] || usageMatch?.[2] || '').trim(),
                    rank
                };
            };

            const rows = lines.map(parsePaletteLine);

            const serializePaletteLine = (row: { name: string; hex: string; rgb: string; usage: string; rank: string }) => {
                const clean = (value: string) => (value || '').replace(/"/g, "'");
                const rawHex = (row.hex || '').trim();
                const normalizedHex = normalizeHex(rawHex);
                const hexToPersist = normalizedHex || rawHex || '#CCCCCC';
                const normalizedRgb = row.rgb?.trim() || (normalizedHex ? (hexToRgb(normalizedHex) || '') : '');
                const parts = [`name="${clean(row.name)}"`];
                parts.push(`hex="${clean(hexToPersist)}"`);
                if (normalizedRgb) parts.push(`rgb="${clean(normalizedRgb)}"`);
                if ((row.usage || '').trim()) parts.push(`usage="${clean(row.usage.trim())}"`);
                parts.push(`rank="${clean(row.rank || '3')}"`);
                return parts.join(' ');
            };

            const syncRows = (nextRows: { name: string; hex: string; rgb: string; usage: string; rank: string }[]) => {
                updateBlock(block.id, { content: nextRows.map(serializePaletteLine).join('\n') });
            };

            const updateRow = (idx: number, key: 'name' | 'hex' | 'rgb' | 'usage' | 'rank', value: string) => {
                const nextRows = [...rows];
                const nextRow = { ...nextRows[idx], [key]: value };
                if (key === 'hex') {
                    const normalizedHex = normalizeHex(value);
                    if (normalizedHex) {
                        nextRow.hex = normalizedHex;
                        const rgb = hexToRgb(normalizedHex);
                        if (rgb) nextRow.rgb = rgb;
                    }
                } else if (key === 'rgb') {
                    const hex = rgbToHex(value);
                    if (hex) nextRow.hex = hex;
                }
                nextRows[idx] = nextRow;
                syncRows(nextRows);
            };

            const addLine = () => {
                syncRows([
                    ...rows,
                    {
                        name: `Color ${rows.length + 1}`,
                        hex: '#CCCCCC',
                        rgb: '200,200,200',
                        usage: '',
                        rank: String(Math.min(5, rows.length + 1))
                    }
                ]);
            };

            const removeLine = (idx: number) => {
                syncRows(rows.filter((_, i) => i !== idx));
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><Palette size={16} /> Color Palette</div>
                    <div className="flex flex-col gap-2">
                        {rows.map((row, idx) => {
                            const hex = /^#([0-9a-fA-F]{3,8})$/.test(row.hex) ? row.hex : '#cccccc';

                            return (
                                <div key={idx} className="bg-neutral-50 border rounded-lg p-3 group/swatch relative">
                                    <div className="grid grid-cols-6 gap-2 items-center">
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Name</label>
                                            <input
                                                className="w-full bg-white border rounded px-2 py-1.5 text-sm font-medium focus:ring-black focus:border-black"
                                                value={row.name}
                                                onChange={(e) => updateRow(idx, 'name', e.target.value)}
                                                placeholder="Primary Blue"
                                            />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">HEX</label>
                                            <div className="flex gap-1.5">
                                                <input
                                                    type="color"
                                                    className="w-8 h-8 border rounded cursor-pointer bg-transparent p-0"
                                                    value={hex}
                                                    onChange={(e) => updateRow(idx, 'hex', e.target.value)}
                                                />
                                                <input
                                                    className="w-full bg-white border rounded px-2 py-1.5 text-sm font-mono focus:ring-black focus:border-black"
                                                    value={row.hex}
                                                    onChange={(e) => updateRow(idx, 'hex', e.target.value)}
                                                    placeholder="#1F299C"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">RGB</label>
                                            <input
                                                className="w-full bg-white border rounded px-2 py-1.5 text-sm font-mono focus:ring-black focus:border-black"
                                                value={row.rgb}
                                                onChange={(e) => updateRow(idx, 'rgb', e.target.value)}
                                                placeholder="31,41,156"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-1">
                                            <label className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Usage</label>
                                            <input
                                                className="w-full bg-white border rounded px-2 py-1.5 text-sm focus:ring-black focus:border-black"
                                                value={row.usage}
                                                onChange={(e) => updateRow(idx, 'usage', e.target.value)}
                                                placeholder="Primary"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Rank</label>
                                            <select
                                                className="w-full bg-white border rounded px-2 py-1.5 text-sm focus:ring-black focus:border-black"
                                                value={row.rank}
                                                onChange={(e) => updateRow(idx, 'rank', e.target.value)}
                                            >
                                                <option value="1">1 (Primary)</option>
                                                <option value="2">2 (Secondary)</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeLine(idx)}
                                        className="absolute top-2 right-2 opacity-0 group-hover/swatch:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                        <button onClick={addLine} className="mt-2 text-xs text-neutral-500 bg-neutral-50 hover:bg-neutral-100 border border-dashed rounded-lg py-2 flex items-center justify-center gap-2 transition-colors">
                            <Plus size={14} /> Add Color Row
                        </button>
                    </div>
                </div>
            );
        }

        if (block.type === 'stats') {
            const lines = block.content.split('\n').filter(l => l.trim() !== '');
            const updateLine = (idx: number, newLine: string) => {
                const newLines = [...lines];
                newLines[idx] = newLine;
                updateBlock(block.id, { content: newLines.join('\n') });
            };
            const addLine = () => {
                updateBlock(block.id, { content: [...lines, '1.2M::Daily active users'].join('\n') });
            };
            const removeLine = (idx: number) => {
                const newLines = lines.filter((_, i) => i !== idx);
                updateBlock(block.id, { content: newLines.join('\n') });
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><BarChart size={16} /> Stats Highlight</div>
                    <div className="flex flex-col gap-2">
                        {lines.map((line, idx) => {
                            const [val, ...descParts] = line.split('::');
                            const label = descParts.join('::');
                            return (
                                <div key={idx} className="flex gap-2 items-center bg-neutral-50 border rounded-lg p-2 group/stat">
                                    <input
                                        className="w-1/3 bg-transparent border-r text-lg font-bold font-space-grotesk focus:ring-0 px-2 py-1"
                                        value={val}
                                        onChange={(e) => updateLine(idx, `${e.target.value}::${label}`)}
                                        placeholder="Value"
                                    />
                                    <input
                                        className="flex-1 bg-transparent border-none text-sm text-neutral-500 font-medium focus:ring-0 px-2 py-1"
                                        value={label}
                                        onChange={(e) => updateLine(idx, `${val}::${e.target.value}`)}
                                        placeholder="Label Description"
                                    />
                                    <button onClick={() => removeLine(idx)} className="opacity-0 group-hover/stat:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                        <button onClick={addLine} className="mt-2 text-xs text-neutral-500 bg-neutral-50 hover:bg-neutral-100 border border-dashed rounded-lg py-2 flex items-center justify-center gap-2 transition-colors">
                            <Plus size={14} /> Add Stat Row
                        </button>
                    </div>
                </div>
            );
        }

        if (block.type === 'font') {
            return <FontBlockEditor block={block} updateBlock={updateBlock} />;
        }

        if (block.type === 'three') {
            const fenceAttrs = parseFenceAttributes(block.fenceInfo || '');
            const bodyAttrs = parseFenceAttributes((block.content || '').replace(/\r?\n/g, ' '));
            const pickValue = (key: string, fallback = '') => fenceAttrs[key] || bodyAttrs[key] || fallback;

            const values = {
                preset: pickValue('preset', 'city'),
                autoRotate: pickValue('autoRotate', 'true').toLowerCase() !== 'false',
                height: pickValue('height', '90vh'),
                model: pickValue('model', ''),
                scale: pickValue('scale', '1'),
                position: pickValue('position', '0, 0, 0'),
                rotation: pickValue('rotation', '0, 0, 0'),
            };

            const serializeThreeContent = (next: typeof values) => {
                return [
                    `preset="${next.preset}"`,
                    `autoRotate="${next.autoRotate ? 'true' : 'false'}"`,
                    `height="${next.height}"`,
                    `model="${next.model}"`,
                    `scale="${next.scale}"`,
                    `position="${next.position}"`,
                    `rotation="${next.rotation}"`,
                ].join('\n');
            };

            const updateThreeField = (key: keyof typeof values, value: string | boolean) => {
                const next = { ...values, [key]: value };
                updateBlock(block.id, {
                    fenceInfo: '```three',
                    content: serializeThreeContent(next)
                });
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><Monitor size={16} /> 3D Scene (three)</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Preset</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={values.preset}
                                onChange={(e) => updateThreeField('preset', e.target.value)}
                                placeholder="city"
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="inline-flex items-center gap-2 text-sm text-neutral-700 font-medium">
                                <input
                                    type="checkbox"
                                    className="rounded focus:ring-black text-black"
                                    checked={values.autoRotate}
                                    onChange={(e) => updateThreeField('autoRotate', e.target.checked)}
                                />
                                Auto Rotate
                            </label>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Height</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={values.height}
                                onChange={(e) => updateThreeField('height', e.target.value)}
                                placeholder="90vh"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Scale</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={values.scale}
                                onChange={(e) => updateThreeField('scale', e.target.value)}
                                placeholder="4 or 1, 1, 1"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-neutral-500 mb-1 block">Model Path (.glb/.gltf)</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={values.model}
                                onChange={(e) => updateThreeField('model', e.target.value)}
                                placeholder="assets/chair/Bubble Chair Model.glb"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Position (x, y, z)</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={values.position}
                                onChange={(e) => updateThreeField('position', e.target.value)}
                                placeholder="0, 0, 0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Rotation in Degrees (x, y, z)</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={values.rotation}
                                onChange={(e) => updateThreeField('rotation', e.target.value)}
                                placeholder="0, 45, 0"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (block.type === 'code') {
            const rawFenceInfo = block.fenceInfo || '```code type="text"';
            const fenceWithoutTicks = rawFenceInfo.replace(/^```+/, '').trim();
            const [rawFenceType = '', ...restParts] = fenceWithoutTicks.split(/\s+/);
            const fenceType = rawFenceType.toLowerCase();
            const parsedAttrs = { ...parseFenceAttributes(restParts.join(' ')), ...parseFenceAttributes(rawFenceInfo) };
            const language = fenceType === 'code'
                ? (parsedAttrs.type || parsedAttrs.language || 'text')
                : (rawFenceType || 'text');

            const buildCodeFenceInfo = (nextLanguage: string, nextAttrs: Record<string, string>) => {
                const { type, language: _legacyLanguage, ...rest } = nextAttrs;
                return serializeFenceAttributes('code', {
                    type: nextLanguage || type || 'text',
                    ...rest
                });
            };

            const updateCodeAttr = (key: string, value: string) => {
                const nextAttrs = { ...parsedAttrs, [key]: value };
                updateBlock(block.id, { fenceInfo: buildCodeFenceInfo(language, nextAttrs) });
            };

            const updateCodeLanguage = (nextLanguage: string) => {
                updateBlock(block.id, { fenceInfo: buildCodeFenceInfo(nextLanguage, parsedAttrs) });
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><Code size={16} /> Code</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Language</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm font-mono text-neutral-900 focus:ring-black focus:border-black transition-colors"
                                value={language}
                                onChange={(e) => updateCodeLanguage(e.target.value)}
                                placeholder="javascript / typescript / css ..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Title</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm text-neutral-900 focus:ring-black focus:border-black transition-colors"
                                value={parsedAttrs.title || ''}
                                onChange={(e) => updateCodeAttr('title', e.target.value)}
                                placeholder="After Effects Expression"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Filename</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm font-mono text-neutral-900 focus:ring-black focus:border-black transition-colors"
                                value={parsedAttrs.filename || ''}
                                onChange={(e) => updateCodeAttr('filename', e.target.value)}
                                placeholder="expression.jsx"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Description</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm text-neutral-900 focus:ring-black focus:border-black transition-colors"
                                value={parsedAttrs.description || ''}
                                onChange={(e) => updateCodeAttr('description', e.target.value)}
                                placeholder="Optional explainer text..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">GitHub URL</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm text-neutral-900 focus:ring-black focus:border-black transition-colors"
                                value={parsedAttrs.githubUrl || ''}
                                onChange={(e) => updateCodeAttr('githubUrl', e.target.value)}
                                placeholder="https://github.com/..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Live URL</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm text-neutral-900 focus:ring-black focus:border-black transition-colors"
                                value={parsedAttrs.liveUrl || ''}
                                onChange={(e) => updateCodeAttr('liveUrl', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <AutoResizeTextarea
                        className="w-full bg-neutral-50 border rounded p-2 text-sm font-mono text-neutral-900 focus:ring-black focus:border-black transition-colors"
                        value={block.content}
                        onChange={(val) => updateBlock(block.id, { content: val })}
                        placeholder="Content..."
                        rows={3}
                    />
                </div>
            );
        }

        if (block.type === 'animation-sequence') {
            return (
                <div className="bg-[#1D1D1F] border border-[#333336] rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-white uppercase tracking-wider"><Video size={16} /> animation-sequence</div>
                    <input
                        type="text"
                        className="w-full bg-black/50 border border-neutral-700 rounded p-2 text-sm font-mono text-neutral-300 focus:ring-white focus:border-white transition-colors"
                        value={block.fenceInfo || ''}
                        onChange={(e) => updateBlock(block.id, { fenceInfo: e.target.value })}
                        placeholder={'```animationsequence videoPath="..."'}
                    />
                    <AutoResizeTextarea
                        className="w-full bg-black/50 border border-neutral-700 text-white rounded p-2 text-sm font-mono focus:ring-white focus:border-white transition-colors"
                        value={block.content}
                        onChange={(val) => updateBlock(block.id, { content: val })}
                        placeholder="Content..."
                        rows={3}
                    />
                </div>
            );
        }

        if (block.type === 'callout') {
            const attrs = parseFenceAttributes(block.fenceInfo || '');
            const type = (block.fenceInfo || '').replace(/^```/, '').trim().split(' ')[0] || 'insight';

            return (
                <div className="bg-[#FFF4E8] border border-[#FFE1C2] rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#CC7000] uppercase tracking-wider"><LayoutTemplate size={16} /> Callout</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[#CC7000]/70 mb-1 block overflow-hidden">Style Type</label>
                            <select
                                className="w-full border border-[#FFE1C2] bg-white rounded p-2 text-sm focus:ring-[#CC7000] focus:border-[#CC7000] transition-colors text-neutral-800"
                                value={type}
                                onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes(e.target.value, attrs) })}
                            >
                                <option value="insight">Insight</option>
                                <option value="note">Note</option>
                                <option value="warning">Warning</option>
                                <option value="result">Result</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[#CC7000]/70 mb-1 block">Headline (Title)</label>
                            <input
                                type="text"
                                className="w-full border border-[#FFE1C2] bg-white rounded p-2 text-sm focus:ring-[#CC7000] focus:border-[#CC7000] transition-colors text-neutral-800"
                                value={attrs.title || ''}
                                placeholder="Optional title..."
                                onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes(type, { ...attrs, title: e.target.value }) })}
                            />
                        </div>
                    </div>
                    <AutoResizeTextarea
                        className="w-full border border-[#FFE1C2] bg-white rounded p-3 text-sm focus:ring-[#CC7000] focus:border-[#CC7000] transition-colors text-neutral-800"
                        value={block.content}
                        onChange={(val) => updateBlock(block.id, { content: val })}
                        placeholder="Callout content text..."
                        rows={2}
                    />
                </div>
            );
        }

        // Default fallback
        return (
            <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider">{block.type}</div>
                <AutoResizeTextarea
                    className="w-full border rounded p-2 text-sm font-mono bg-neutral-50 focus:bg-white focus:ring-black focus:border-black transition-colors"
                    value={block.content}
                    onChange={(val) => updateBlock(block.id, { content: val })}
                    placeholder="Content..."
                    rows={3}
                />
            </div>
        );
    };

    // Preview properties
    const previewProject = useMemo(() => {
        if (!initialProject) return null;

        // We only need the body content, not frontmatter, for Article renderer
        const bodyBlocks = blocks.filter(b => b.type !== 'frontmatter');
        const content = serializeBlocksToMarkdown(bodyBlocks);

        return {
            ...initialProject,
            content,
        };
    }, [initialProject, blocks]);

    // Send data to iframe when ready
    useEffect(() => {
        if (iframeReady && iframeRef.current && previewProject && viewMode === 'body') {
            iframeRef.current.contentWindow?.postMessage({
                type: 'UPDATE_PREVIEW',
                project: previewProject,
                allProjects: allProjects
            }, '*');
        } else if (iframeReady && iframeRef.current && previewProject && viewMode === 'header') {
            // Include frontmatter content when we're viewing the header, just to preview the absolute state if we want
            // but actually, just previewing the project is fine. The Article might reload or respond to heroImage changes!
            iframeRef.current.contentWindow?.postMessage({
                type: 'UPDATE_PREVIEW',
                project: { ...previewProject, ...parseFrontmatterFast(blocks.find(b => b.type === 'frontmatter')?.content || '') },
                allProjects: allProjects
            }, '*');
        }
    }, [previewProject, allProjects, iframeReady, viewMode, blocks]);

    // Simple hack to live preview the cover image or title changes while in frontmatter 
    const parseFrontmatterFast = (yaml: string) => {
        const titleMatch = yaml.match(/^title:\s*['"]?(.*?)['"]?$/m);
        const imgMatch = yaml.match(/^image:\s*['"]?(.*?)['"]?$/m);
        const heroMatch = yaml.match(/^heroImage:\s*['"]?(.*?)['"]?$/m);
        const colorMatch = yaml.match(/^bgColor:\s*['"]?(.*?)['"]?$/m);
        return {
            title: titleMatch ? titleMatch[1] : undefined,
            image: imgMatch ? imgMatch[1] : undefined,
            heroImage: heroMatch ? heroMatch[1] : undefined,
            bgColor: colorMatch ? colorMatch[1] : undefined,
        };
    };

    const previewFrame = useMemo(() => {
        if (previewViewport === 'full') {
            return {
                width: '100%',
                height: '100%',
                chrome: 'none' as const,
                label: 'Full View',
            };
        }

        if (previewViewport === 'desktop') {
            return {
                width: '1720px',
                height: '1080px',
                chrome: 'desktop' as const,
                label: 'Desktop',
            };
        }

        const portrait = previewOrientation === 'portrait';

        if (previewViewport === 'mobile') {
            return {
                width: portrait ? '414px' : '896px',
                height: portrait ? '896px' : '414px',
                chrome: 'device' as const,
                label: portrait ? 'Mobile Portrait' : 'Mobile Landscape',
            };
        }

        return {
            width: portrait ? '820px' : '1180px',
            height: portrait ? '1180px' : '820px',
            chrome: 'device' as const,
            label: portrait ? 'Tablet Portrait' : 'Tablet Landscape',
        };
    }, [previewOrientation, previewViewport]);

    const canRotatePreview = previewViewport === 'mobile' || previewViewport === 'tablet';
    const effectivePreviewZoom = previewViewport === 'desktop' ? 75 : previewZoom;
    const previewScale = effectivePreviewZoom / 100;

    const editorContentLayout = useMemo(() => {
        const minPageMargin = viewportWidth >= 1024 ? 32 : 16;
        const maxEditorWidth = viewportWidth >= 1536 ? 760 : 672;
        const baseWidth = Math.min(maxEditorWidth, Math.max(320, viewportWidth - minPageMargin * 2));

        const centeredInsetLimit = Math.max(0, viewportWidth - baseWidth - minPageMargin * 2);
        const reservedRightInset = previewVisible ? Math.min(previewPanelWidth, centeredInsetLimit) : 0;
        const visibleWidth = Math.max(0, viewportWidth - reservedRightInset);
        const left = Math.max(minPageMargin, (visibleWidth - baseWidth) / 2);

        return {
            width: baseWidth,
            left,
        };
    }, [previewPanelWidth, previewVisible, viewportWidth]);

    if (loading) return <div className="p-10 flex min-h-screen items-center justify-center font-sans">Loading editor interface...</div>;

    return (
        <div className="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#f4f8ff_0%,#edf1f7_45%,#e6ebf2_100%)] font-sans selection:bg-black selection:text-white">

            {/* LEFT COLUMN: EDITOR */}
            <div className="h-full w-full flex flex-col bg-[#f7f9fc] relative z-10 overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-white/90 border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm z-50 backdrop-blur">
                    <div className="flex items-center gap-2 lg:gap-4 flex-1">
                        <button onClick={() => router.push('/admin')} className="text-neutral-400 hover:text-black transition-colors shrink-0">
                            <ArrowLeft size={18} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 text-white px-4 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-medium flex items-center gap-2 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-sm disabled:hover:scale-100 disabled:opacity-70 shrink-0"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : <span className="hidden lg:inline">Save Changes</span>}
                        </button>
                        <h1 className="font-bold text-sm lg:text-base truncate">
                            {initialProject?.title || slug || 'Untitled'}
                            <span className="ml-2 text-xs uppercase tracking-wider text-neutral-400 font-medium">
                                {folder === 'archive' ? 'Archive' : 'Live'}
                            </span>
                        </h1>
                    </div>

                    <div className="flex-1 flex justify-end shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPreviewVisible((current) => !current)}
                            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                            {previewVisible ? 'Hide Preview' : 'Show Preview'}
                        </button>
                    </div>
                </div>

                <div className="absolute left-3 top-20 z-30 flex">
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.9)] backdrop-blur">
                        <button
                            type="button"
                            title="Body View"
                            onClick={() => setViewMode('body')}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${viewMode === 'body' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            aria-label="Switch to body view"
                        >
                            <FileText size={16} />
                        </button>
                        <button
                            type="button"
                            title="Header View"
                            onClick={() => setViewMode('header')}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${viewMode === 'header' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            aria-label="Switch to header view"
                        >
                            <LayoutTemplate size={16} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto layout-scrollbar pb-52 pt-4 md:pt-8">
                    <div
                        className="relative"
                        style={{
                            width: `${editorContentLayout.width}px`,
                            marginLeft: `${editorContentLayout.left}px`,
                        }}
                    >
                        {viewMode === 'header' && blocks.find(b => b.type === 'frontmatter') && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
                                <FrontmatterEditor
                                    block={blocks.find(b => b.type === 'frontmatter')!}
                                    updateBlock={updateBlock}
                                    recentImageAssets={recentImageAssets}
                                    recentVideoAssets={recentVideoAssets}
                                    onUploadImage={uploadImageAsset}
                                    folder={folder}
                                />
                            </div>
                        )}

                        {viewMode === 'body' && (
                            <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} layoutScroll className="flex flex-col gap-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {blocks.map((block, index) => {
                                    const isFrontmatter = block.type === 'frontmatter';
                                    const bodyIndex = blocks.slice(0, index + 1).filter((candidate) => candidate.type !== 'frontmatter').length - 1;
                                    const isActive = activeBlockId === block.id;

                                    return (
                                        <SortableBlockRow
                                            key={block.id}
                                            block={block}
                                            index={index}
                                            bodyIndex={bodyIndex}
                                            isFrontmatter={isFrontmatter}
                                            isActive={isActive}
                                            renderBlockEditor={renderBlockEditor}
                                            deleteBlock={deleteBlock}
                                            handleBlockAction={(action, block) => setCopiedBlock({ type: action, block })}
                                            copiedBlock={copiedBlock}
                                            addBlock={addBlock}
                                            focusBlockAndSyncPreview={focusBlockAndSyncPreview}
                                        />
                                    )
                                })}
                            </Reorder.Group>
                        )}

                        {viewMode === 'body' && (
                            <div className="mt-12 flex justify-center pb-24 relative z-20 animate-in fade-in duration-500 delay-150">
                                <AddMenu onAdd={(type) => addBlock(blocks.length - 1, type)} variant="footer" copiedBlock={copiedBlock} />
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {previewVisible && (
                <div
                    className="absolute right-0 top-0 z-40 h-full flex"
                    style={{ width: `${previewPanelWidth}px` }}
                >
                    <div
                        onPointerDown={handlePreviewResizeStart}
                        className="relative w-3 cursor-ew-resize bg-transparent"
                        aria-label="Resize preview panel"
                    >
                        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-slate-300/80 hover:bg-indigo-400" />
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="flex-1 overflow-hidden relative flex flex-col border-l border-slate-200 bg-[radial-gradient(circle_at_10%_0%,#f2f6ff_0%,#eaf0f8_42%,#e5ebf3_100%)] shadow-[-28px_0_42px_-36px_rgba(15,23,42,0.8)]">
                        {/* Preview Controls Bar */}
                        <div className="h-16 bg-white/90 border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20 text-xs text-slate-600 font-medium backdrop-blur">
                            <div className="flex gap-1 items-center bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setPreviewViewport('mobile')} className={`px-2.5 flex gap-1.5 items-center py-2 rounded-lg transition-colors ${previewViewport === 'mobile' ? 'bg-white shadow text-black' : 'hover:bg-slate-200'}`}>
                                    <Smartphone size={13} /> Mobile
                                </button>
                                <button onClick={() => setPreviewViewport('tablet')} className={`px-2.5 flex gap-1.5 items-center py-2 rounded-lg transition-colors ${previewViewport === 'tablet' ? 'bg-white shadow text-black' : 'hover:bg-slate-200'}`}>
                                    <Tablet size={13} /> Tablet
                                </button>
                                <button onClick={() => setPreviewViewport('desktop')} className={`px-2.5 flex gap-1.5 items-center py-2 rounded-lg transition-colors ${previewViewport === 'desktop' ? 'bg-white shadow text-black' : 'hover:bg-slate-200'}`}>
                                    <Monitor size={13} /> Desktop
                                </button>
                                <button onClick={() => { setPreviewViewport('full'); setPreviewZoom(100); }} className={`px-2.5 flex gap-1.5 items-center py-2 rounded-lg transition-colors ${previewViewport === 'full' ? 'bg-white shadow text-black' : 'hover:bg-slate-200'}`}>
                                    <Expand size={13} /> Full
                                </button>
                                <button onClick={() => setPreviewVisible(false)} className="px-2.5 py-2 rounded-lg transition-colors text-slate-500 hover:bg-slate-200 hover:text-slate-800">
                                    Off
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {canRotatePreview && (
                                    <button
                                        onClick={() => setPreviewOrientation((current) => current === 'portrait' ? 'landscape' : 'portrait')}
                                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-600 hover:bg-slate-100"
                                    >
                                        <RotateCw size={13} />
                                        Rotate
                                    </button>
                                )}

                                <div className="flex gap-1 items-center bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setPreviewZoom(Math.max(25, previewZoom - 25))}
                                        disabled={previewViewport === 'desktop'}
                                        className="px-2.5 py-2 hover:bg-slate-200 hover:text-black transition-colors rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center text-sm">{effectivePreviewZoom}%</span>
                                    <button
                                        onClick={() => setPreviewZoom(Math.min(200, previewZoom + 25))}
                                        disabled={previewViewport === 'desktop'}
                                        className="px-2.5 py-2 hover:bg-slate-200 hover:text-black transition-colors rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/60 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                            <span>Preview Mode</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{previewFrame.label}</span>
                        </div>

                        <div className={`flex-1 overflow-auto hide-scrollbar relative flex ${previewViewport === 'full' ? 'justify-stretch items-stretch p-0' : 'justify-center items-start pt-8 pb-32 px-4'}`}>
                            {previewProject && (
                                <div
                                    className={`bg-white shadow-2xl relative transition-all duration-300 ease-out origin-top ${previewFrame.chrome === 'device' ? 'rounded-[36px] border-[8px] border-slate-800 ring-1 ring-black/10 overflow-hidden' : ''} ${previewFrame.chrome === 'desktop' ? 'rounded-2xl border border-slate-200 overflow-hidden' : ''} ${previewViewport === 'full' ? 'origin-top-left' : ''}`}
                                    style={{
                                        width: previewFrame.width,
                                        height: previewFrame.height,
                                        transform: previewViewport === 'full' ? 'none' : `scale(${previewScale})`,
                                        overflow: previewViewport === 'full' ? 'hidden' : undefined,
                                    }}
                                >
                                    {!iframeReady && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white text-neutral-400 font-sans text-sm animate-pulse z-50">
                                            Loading Preview...
                                        </div>
                                    )}
                                    <iframe
                                        ref={iframeRef}
                                        src={`/admin/preview/${slug || ''}`}
                                        className="w-full h-full border-none"
                                        style={{
                                            display: 'block',
                                            pointerEvents: 'auto',
                                            width: previewViewport === 'full' ? `${100 / previewScale}%` : undefined,
                                            height: previewViewport === 'full' ? `${100 / previewScale}%` : undefined,
                                            maxWidth: previewViewport === 'full' ? 'none' : undefined,
                                            maxHeight: previewViewport === 'full' ? 'none' : undefined,
                                            transform: previewViewport === 'full' ? `scale(${previewScale})` : undefined,
                                            transformOrigin: previewViewport === 'full' ? 'top left' : undefined,
                                        }}
                                        title="Device Simulator"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return { notFound: true };
    }
    return { props: {} };
};
