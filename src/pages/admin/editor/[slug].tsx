import React, { useEffect, useState, useMemo, useLayoutEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, Type, LayoutTemplate, Palette, Video, Code, List as ListIcon, Link as LinkIcon, Play, Monitor, Smartphone, Tablet, BarChart } from 'lucide-react';
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
}

const AutoResizeTextarea = ({ value, onChange, placeholder, className, rows = 1, onBlur, onFocus, autoFocus }: AutoResizeTextareaProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            className={`resize-none overflow-hidden ${className || ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            autoFocus={autoFocus}
            placeholder={placeholder}
            rows={rows}
        />
    );
};

// --- Block Editors ---

function HeaderBlockEditor({ block, updateBlock }: { block: Block, updateBlock: (id: string, updates: Partial<Block>) => void }) {
    const [focused, setFocused] = useState(block.content === '' || block.content === '# New Header');

    const hLevel = block.content.match(/^#+/)?.[0]?.length || 1;
    const textContent = block.content.replace(/^#+\s*/, '');
    const sizes = {
        1: "text-4xl md:text-5xl font-bold",
        2: "text-2xl md:text-3xl font-bold font-space-grotesk",
        3: "text-xl md:text-2xl font-bold font-space-grotesk"
    };
    // @ts-ignore
    const headerClass = sizes[hLevel] || sizes[1];

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
            className={`relative group/header cursor-text px-3 py-2 ${headerClass} hover:bg-neutral-50 rounded-lg transition-colors border border-transparent`}
            onClick={() => setFocused(true)}
        >
            {textContent || <span className="text-neutral-300"># Header (Empty)</span>}
            <div className="absolute -left-6 top-3 text-xs font-mono text-neutral-300 opacity-0 group-hover/header:opacity-100 transition-opacity select-none pointer-events-none">
                H{hLevel}
            </div>
        </div>
    );
}

function TextBlockEditor({ block, updateBlock }: { block: Block, updateBlock: (id: string, updates: Partial<Block>) => void }) {
    const [focused, setFocused] = useState(block.content === '');

    const parseMD = (text: string) => {
        if (!text) return '';
        let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline text-blue-600 cursor-pointer pointer-events-none" target="_blank" rel="noopener noreferrer">$1</a>');
        html = html.replace(/\n/g, '<br/>');
        return html;
    };

    if (focused) {
        return (
            <div className="group/text bg-white shadow-sm border rounded-xl p-3 -mx-3 -my-3 z-10 transition-all">
                <AutoResizeTextarea
                    className="w-full bg-transparent border-none focus:ring-0 font-sans text-lg md:text-xl text-neutral-800 placeholder-neutral-300 p-0"
                    value={block.content}
                    onChange={(val) => updateBlock(block.id, { content: val })}
                    onBlur={() => setFocused(false)}
                    autoFocus
                    placeholder="Write something... Use **bold**, *italic*, or [Links](url)"
                />
                <div className="text-xs text-neutral-400 flex gap-4 mt-3 pt-3 border-t">
                    <span>**bold**</span>
                    <span>*italic*</span>
                    <span>[link label](url)</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full font-sans text-lg md:text-xl text-neutral-800 p-3 hover:bg-neutral-50 rounded-lg cursor-text transition-colors border border-transparent min-h-[3rem]"
            onClick={() => setFocused(true)}
            dangerouslySetInnerHTML={{ __html: parseMD(block.content) || '<span class="text-neutral-400">Write something...</span>' }}
        />
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
                    if (!p) return <div key={s} className="text-xs text-red-500 p-2 border border-red-200 rounded">Project "{s}" not found. <button onClick={() => removeSlug(s)} className="underline font-bold">Remove</button></div>;

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

// Inline component for the Add Menu
function AddMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative flex items-center justify-center group/add">
            <div className="h-[2px] bg-neutral-200 w-32 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 -z-10 group-hover/add:w-48 transition-all" />
            <button
                onClick={() => setOpen(!open)}
                className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md"
            >
                <Plus size={16} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-1/2 -ml-[140px] top-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-2xl w-[280px] p-2 flex flex-col gap-1 font-sans max-h-96 overflow-y-auto"
                    >
                        <button onClick={() => { onAdd('text'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <Type size={16} className="text-neutral-400" /> Text Paragraph
                        </button>
                        <button onClick={() => { onAdd('header'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <span className="text-neutral-400 font-bold ml-1 text-xs">H1</span> Header
                        </button>
                        <button onClick={() => { onAdd('list'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <ListIcon size={16} className="text-neutral-400" /> Bullet List
                        </button>
                        <button onClick={() => { onAdd('mockup'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <ImageIcon size={16} className="text-neutral-400" /> Mockup (iPhone/Mac)
                        </button>
                        <button onClick={() => { onAdd('callout'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <LayoutTemplate size={16} className="text-neutral-400" /> Callout (Insight)
                        </button>
                        <button onClick={() => { onAdd('video'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <Play size={16} className="text-neutral-400" /> Inline Video
                        </button>
                        <button onClick={() => { onAdd('gallery'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <ImageIcon size={16} className="text-neutral-400" /> Image Gallery
                        </button>
                        <button onClick={() => { onAdd('palette'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <Palette size={16} className="text-neutral-400" /> Color Palette
                        </button>
                        <button onClick={() => { onAdd('stats'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <BarChart size={16} className="text-neutral-400" /> Stats List
                        </button>
                        <button onClick={() => { onAdd('font'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <Type size={16} className="text-neutral-400" /> Font Specimen
                        </button>
                        <button onClick={() => { onAdd('code'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <Code size={16} className="text-neutral-400" /> Code Block
                        </button>
                        <button onClick={() => { onAdd('project-ref'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <LinkIcon size={16} className="text-neutral-400" /> Project Reference
                        </button>
                        <button onClick={() => { onAdd('animation-sequence'); setOpen(false); }} className="text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors text-neutral-700">
                            <Video size={16} className="text-neutral-400" /> Video Sequence
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {open && <div className="fixed inset-0" style={{ zIndex: -10 }} onClick={() => setOpen(false)} />}
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
function FrontmatterEditor({ block, updateBlock }: { block: Block; updateBlock: (id: string, updates: Partial<Block>) => void }) {
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
        description = '',
        bgColor = '',
        image = '',
        video = '',
        hasAnimation = false,
        animationSequence = {},
        featured = false,
        type = [],
        id = 0,
        awards = []
    } = data;

    const toCommaStr = (arr: any) => Array.isArray(arr) ? arr.join(', ') : (typeof arr === 'string' ? arr : '');
    const fromCommaStr = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

    return (
        <div className="flex flex-col gap-6 text-neutral-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Project Title</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm font-semibold focus:bg-white focus:ring-black focus:border-black transition-colors" value={title} onChange={e => handleChange('title', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Project ID</label>
                    <input type="number" className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={id} onChange={e => handleChange('id', parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Subtitle</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={subtitle} onChange={e => handleChange('subtitle', e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">URL Slug</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={slug} onChange={e => handleChange('slug', e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Publish Date (YYYY-MM-DD)</label>
                    <input type="text" className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={published} onChange={e => handleChange('published', e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Excerpt (Hero Parallax Intro)</label>
                    <AutoResizeTextarea className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={excerpts} onChange={val => handleChange('excerpts', val)} rows={3} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">SEO Description</label>
                    <AutoResizeTextarea className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={description} onChange={val => handleChange('description', val)} rows={2} />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Cover / Hero Image Path</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={image} onChange={e => handleChange('image', e.target.value)} placeholder="assets/..." />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Cover Video Loop (Optional override)</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={video} onChange={e => handleChange('video', e.target.value)} placeholder="assets/..." />
                </div>
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Project Brand Color</label>
                    <div className="flex gap-2 items-center bg-neutral-50 border rounded-lg pr-2.5 overflow-hidden focus-within:ring-1 focus-within:ring-black">
                        <input type="color" className="w-10 h-10 border-r border-transparent p-0 bg-transparent object-cover cursor-pointer" value={bgColor} onChange={e => handleChange('bgColor', e.target.value)} />
                        <input className="flex-1 bg-transparent border-none p-2.5 text-sm font-mono focus:ring-0" value={bgColor} onChange={e => handleChange('bgColor', e.target.value)} placeholder="#007EFF" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Collaboration JSON</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm font-mono focus:bg-white focus:ring-black focus:border-black transition-colors" value={JSON.stringify(collaboration)} onChange={e => {
                        try { handleChange('collaboration', JSON.parse(e.target.value)); } catch (err) { /* ignore invalid json while typing */ }
                    }} placeholder='[{"Name": null}]' />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Awards List (Comma Seperated)</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={toCommaStr(awards)} onChange={e => handleChange('awards', fromCommaStr(e.target.value))} />
                </div>
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Category (Comma Seperated)</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={toCommaStr(category)} onChange={e => handleChange('category', fromCommaStr(e.target.value))} />
                </div>
                <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Type Tags (Comma Seperated)</label>
                    <input className="w-full bg-neutral-50 border rounded-lg p-2.5 text-sm focus:bg-white focus:ring-black focus:border-black transition-colors" value={toCommaStr(type)} onChange={e => handleChange('type', fromCommaStr(e.target.value))} />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border">
                        <input type="checkbox" id="featured" className="w-4 h-4 rounded border-neutral-300 focus:ring-black text-black" checked={featured} onChange={e => handleChange('featured', e.target.checked)} />
                        <label htmlFor="featured" className="text-sm font-bold text-neutral-700 select-none cursor-pointer">Featured Project (Large Grid Display)</label>
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border">
                        <input type="checkbox" id="hasAnimation" className="w-4 h-4 rounded border-neutral-300 focus:ring-black text-black" checked={hasAnimation} onChange={e => handleChange('hasAnimation', e.target.checked)} />
                        <label htmlFor="hasAnimation" className="text-sm font-bold text-neutral-700 select-none cursor-pointer">Use Hero Scroll Animation Sequence</label>
                    </div>
                </div>

                {hasAnimation && (
                    <div className="col-span-1 md:col-span-2 bg-neutral-50 border border-neutral-200 p-5 rounded-2xl flex flex-col gap-4 mt-2 shadow-sm">
                        <div className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-1 flex items-center gap-2"><Video size={16} /> Animation Paths (Video Scrubbing)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Desktop Video Path (.mp4)</label>
                                <input className="w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-black focus:border-black transition-colors" value={animationSequence.videoPath || ''} onChange={e => handleChange('animationSequence', { ...animationSequence, videoPath: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Safari Native Video Path</label>
                                <input className="w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-black focus:border-black transition-colors" value={animationSequence.safariVideoPath || ''} onChange={e => handleChange('animationSequence', { ...animationSequence, safariVideoPath: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Mobile Video Path</label>
                                <input className="w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-black focus:border-black transition-colors" value={animationSequence.mobileVideoPath || ''} onChange={e => handleChange('animationSequence', { ...animationSequence, mobileVideoPath: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Total Frame Count (Critical for scrubbing)</label>
                                <input type="number" className="w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-black focus:border-black transition-colors" value={animationSequence.frameCount || 0} onChange={e => handleChange('animationSequence', { ...animationSequence, frameCount: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Legacy Spritesheet Path (Optional)</label>
                                <input className="w-full bg-white border rounded-lg p-2.5 text-sm focus:ring-black focus:border-black transition-colors" value={animationSequence.spritesheetPath || ''} onChange={e => handleChange('animationSequence', { ...animationSequence, spritesheetPath: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t mt-4 pt-4">
                <button onClick={() => setRawMode(true)} className="text-xs font-medium text-neutral-400 hover:text-black transition-colors flex items-center gap-1.5">
                    <Code size={12} /> View Raw Context
                </button>
            </div>
        </div>
    );
}

// --- Main Editor Component ---
export default function EditorPage() {
    const router = useRouter();
    const { slug } = router.query;

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [initialProject, setInitialProject] = useState<Project | null>(null);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'body' | 'header'>('body');

    // Live Preview State
    const [previewWidth, setPreviewWidth] = useState<'100%' | '375px' | '768px'>('100%');
    const [previewZoom, setPreviewZoom] = useState<number>(100);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);

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
        if (!slug) return;

        // Fetch all projects for references and the current project data
        fetch('/api/admin/projects')
            .then(res => res.json())
            .then(data => {
                setAllProjects(data.projects || []);
                const proj = (data.projects || []).find((p: Project) => p.slug === slug);
                if (proj) setInitialProject(proj);
            });

        // Fetch raw markdown
        fetch(`/api/admin/project/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.content) {
                    setBlocks(parseMarkdownToBlocks(data.content));
                }
                setLoading(false);
            });
    }, [slug]);

    const handleSave = async () => {
        setSaving(true);
        const md = serializeBlocksToMarkdown(blocks);
        await fetch(`/api/admin/project/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: md })
        });
        setSaving(false);
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

        if (type === 'mockup') {
            newBlock.fenceInfo = '```mockup type="iphone" image="" bgColor="#F5F5F7"';
        } else if (type === 'callout') {
            newBlock.fenceInfo = '```insight';
        } else if (type === 'palette') {
            newBlock.fenceInfo = '```palette\nName #FFFFFF rgb(255,255,255) usage=Primary';
        } else if (type === 'gallery') {
            newBlock.content = '![image1.jpg|image2.jpg]';
        } else if (type === 'video') {
            newBlock.content = '[video](assets/video.mp4|assets/poster.jpg)';
        } else if (type === 'project-ref') {
            newBlock.content = '[project:some-slug]';
        } else if (type === 'header') {
            newBlock.content = '# New Header';
        } else if (type === 'list') {
            newBlock.content = '- Item 1\n- Item 2';
        } else if (type === 'code') {
            newBlock.fenceInfo = '```typescript';
            newBlock.content = '// Your code here';
        } else if (type === 'animation-sequence') {
            newBlock.fenceInfo = '```animationsequence videoPath=""';
        }

        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
    };

    const renderBlockEditor = (block: Block) => {
        if (block.type === 'frontmatter') {
            return (
                <div className="bg-neutral-100 p-4 border rounded font-mono text-xs text-neutral-500 overflow-hidden text-ellipsis whitespace-nowrap h-12 flex items-center">
                    Frontmatter details (Stored at Top)
                </div>
            );
        }

        if (block.type === 'header') return <HeaderBlockEditor block={block} updateBlock={updateBlock} />;
        if (block.type === 'text') return <TextBlockEditor block={block} updateBlock={updateBlock} />;
        if (block.type === 'project-ref') return <ProjectRefEditor block={block} updateBlock={updateBlock} allProjects={allProjects} />;

        if (block.type === 'list') {
            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><ListIcon size={16} /> List</div>
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
            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><ImageIcon size={16} /> Mockup Device</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                            <select
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={attrs.type || 'iphone'}
                                onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('mockup', { ...attrs, type: e.target.value }) })}
                            >
                                <option value="iphone">iPhone</option>
                                <option value="macbook">MacBook</option>
                                <option value="safari">Safari Tab</option>
                                <option value="tv">TV</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Background Color</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={attrs.bgColor || '#F5F5F7'}
                                onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('mockup', { ...attrs, bgColor: e.target.value }) })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-neutral-500 mb-1 block">Image Path</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={attrs.image || ''}
                                placeholder="assets/project/img.png"
                                onChange={(e) => updateBlock(block.id, { fenceInfo: serializeFenceAttributes('mockup', { ...attrs, image: e.target.value }) })}
                            />
                        </div>
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
                            <label className="text-xs text-neutral-500 mb-1 block">Video URL (.mp4)</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={videoUrl}
                                placeholder="assets/video.mp4"
                                onChange={(e) => updateBlock(block.id, { content: constructVideoStr(e.target.value, posterUrl, isLoop) })}
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
                            <label className="text-xs text-neutral-500 mb-1 block">Poster Image (Optional)</label>
                            <input
                                type="text"
                                className="w-full bg-neutral-50 border rounded p-2 text-sm focus:ring-black focus:border-black transition-colors"
                                value={posterUrl}
                                placeholder="assets/poster.jpg"
                                onChange={(e) => updateBlock(block.id, { content: constructVideoStr(videoUrl, e.target.value, isLoop) })}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (block.type === 'gallery') {
            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><ImageIcon size={16} /> Image Gallery</div>
                    <label className="text-xs text-neutral-500 mb-1 block">Format: ![img1.jpg|img2.jpg]</label>
                    <AutoResizeTextarea
                        className="w-full bg-neutral-50 border rounded p-2 text-sm font-mono focus:ring-black focus:border-black transition-colors"
                        value={block.content}
                        onChange={(val) => updateBlock(block.id, { content: val })}
                        placeholder="![image1.png|image2.png]"
                        rows={1}
                    />
                </div>
            );
        }

        if (block.type === 'palette') {
            const lines = block.content.split('\n').filter(l => l.trim() !== '');
            const updateLine = (idx: number, newLine: string) => {
                const newLines = [...lines];
                newLines[idx] = newLine;
                updateBlock(block.id, { content: newLines.join('\n') });
            };
            const addLine = () => {
                updateBlock(block.id, { content: [...lines, 'New-Color #CCCCCC rgb(200,200,200) usage=Custom'].join('\n') });
            };
            const removeLine = (idx: number) => {
                const newLines = lines.filter((_, i) => i !== idx);
                updateBlock(block.id, { content: newLines.join('\n') });
            };

            return (
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-neutral-800 uppercase tracking-wider"><Palette size={16} /> Color Palette</div>

                    <div className="flex flex-col gap-2">
                        {lines.map((line, idx) => {
                            const parts = line.split(' ');
                            const name = parts[0] || '';
                            const hexMatch = line.match(/#([0-9a-fA-F]{3,6})/);
                            const hex = hexMatch ? hexMatch[0] : '#ffffff';

                            return (
                                <div key={idx} className="flex gap-2 items-center bg-neutral-50 border rounded-lg p-2 group/swatch relative">
                                    <div className="w-8 h-8 rounded-md shrink-0 border border-black/10 shadow-inner" style={{ backgroundColor: hex }}></div>
                                    <input
                                        className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 px-1 py-1"
                                        value={line}
                                        onChange={(e) => updateLine(idx, e.target.value)}
                                        placeholder="Name #HEX rgb(r,g,b) usage=Tag"
                                    />
                                    <button
                                        onClick={() => removeLine(idx)}
                                        className="opacity-0 group-hover/swatch:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all shrink-0"
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

        if (block.type === 'code' || block.type === 'animation-sequence') {
            const icons = {
                'code': <Code size={16} />,
                'palette': <Palette size={16} />,
                'animation-sequence': <Video size={16} />,
            };
            return (
                <div className="bg-[#1D1D1F] border border-[#333336] rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-white uppercase tracking-wider">{icons[block.type as keyof typeof icons]} {block.type}</div>
                    <input
                        type="text"
                        className="w-full bg-black/50 border border-neutral-700 rounded p-2 text-sm font-mono text-neutral-300 focus:ring-white focus:border-white transition-colors"
                        value={block.fenceInfo || ''}
                        onChange={(e) => updateBlock(block.id, { fenceInfo: e.target.value })}
                        placeholder="```language"
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
        return {
            title: titleMatch ? titleMatch[1] : undefined,
            image: imgMatch ? imgMatch[1] : undefined,
            heroImage: heroMatch ? heroMatch[1] : undefined,
        };
    };

    if (loading) return <div className="p-10 flex min-h-screen items-center justify-center font-sans">Loading editor interface...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-100 font-sans selection:bg-black selection:text-white">

            {/* LEFT COLUMN: EDITOR */}
            <div className="w-1/2 flex flex-col border-r bg-[#F5F5F7] relative z-10 shadow-[8px_0_24px_rgba(0,0,0,0.02)] overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm z-20">
                    <div className="flex items-center gap-2 lg:gap-4 flex-1">
                        <button onClick={() => router.push('/admin')} className="text-neutral-400 hover:text-black transition-colors shrink-0">
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="font-bold text-sm lg:text-base truncate">{initialProject?.title || slug}</h1>
                    </div>

                    <div className="flex gap-1 bg-neutral-100 p-1 mx-2 lg:mx-4 rounded-lg shrink-0">
                        <button
                            onClick={() => setViewMode('body')}
                            className={`px-3 lg:px-4 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors ${viewMode === 'body' ? 'bg-white shadow pointer-events-none text-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50'}`}
                        >Body</button>
                        <button
                            onClick={() => setViewMode('header')}
                            className={`px-3 lg:px-4 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors ${viewMode === 'header' ? 'bg-white shadow pointer-events-none text-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50'}`}
                        >Header</button>
                    </div>

                    <div className="flex-1 flex justify-end shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-black text-white px-4 py-1.5 lg:px-5 lg:py-2 rounded-full text-xs lg:text-sm font-medium flex items-center gap-2 hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-sm"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : <span className="hidden lg:inline">Save Changes</span>}
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 layout-scrollbar pb-32">
                    <div className="max-w-2xl mx-auto">
                        {viewMode === 'header' && blocks.find(b => b.type === 'frontmatter') && (
                            <div className="bg-white p-6 md:p-8 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h2 className="font-bold text-xl font-sans tracking-tight text-neutral-800">Frontmatter Properties</h2>
                                    <p className="text-sm text-neutral-500 mt-1 mb-4 border-b pb-4">These properties control the cover routing, SEO tags, list thumbnails, and hero animations for the project page.</p>
                                </div>
                                <FrontmatterEditor
                                    block={blocks.find(b => b.type === 'frontmatter')!}
                                    updateBlock={updateBlock}
                                />
                            </div>
                        )}

                        {viewMode === 'body' && (
                            <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="flex flex-col gap-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {blocks.map((block, index) => {
                                    const isFrontmatter = block.type === 'frontmatter';

                                    return (
                                        <Reorder.Item
                                            key={block.id}
                                            value={block}
                                            dragListener={!isFrontmatter}
                                            className="relative group py-1"
                                        >
                                            <div className={`flex items-start gap-2 ${isFrontmatter ? 'opacity-60' : ''}`}>
                                                {/* Drag Handle */}
                                                <div className="w-8 flex flex-col justify-center items-center h-12 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity cursor-grab active:cursor-grabbing shrink-0 mt-1">
                                                    {!isFrontmatter && <GripVertical size={20} />}
                                                </div>

                                                {/* Block Content */}
                                                <div className={`flex-1 relative ${block.type === 'text' || block.type === 'header' ? 'py-1' : ''}`}>
                                                    {renderBlockEditor(block)}
                                                </div>

                                                {/* Delete */}
                                                <div className="w-8 flex flex-col items-center h-12 justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                                                    {!isFrontmatter && (
                                                        <button onClick={() => deleteBlock(block.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Add Menu (appears between blocks) */}
                                            {!isFrontmatter && (
                                                <div className="h-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity relative z-30">
                                                    <div className="absolute top-0 -translate-y-1/2 bg-[#F5F5F7] px-2 py-1">
                                                        <AddMenu onAdd={(type) => addBlock(index, type)} />
                                                    </div>
                                                </div>
                                            )}
                                        </Reorder.Item>
                                    )
                                })}
                            </Reorder.Group>
                        )}

                        {viewMode === 'body' && (
                            <div className="mt-12 flex justify-center pb-12 relative z-10 animate-in fade-in duration-500 delay-150">
                                <AddMenu onAdd={(type) => addBlock(blocks.length - 1, type)} />
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW */}
            <div className="w-1/2 bg-[#E5E5EA] overflow-hidden relative flex flex-col border-l border-neutral-200">
                {/* Preview Controls Bar */}
                <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-sm z-20 text-xs text-neutral-600 font-medium">
                    <div className="flex gap-2 items-center bg-neutral-100 p-1 rounded-lg">
                        <button onClick={() => setPreviewWidth('375px')} className={`px-3 flex gap-2 items-center py-2 rounded transition-colors ${previewWidth === '375px' ? 'bg-white shadow text-black' : 'hover:bg-neutral-200'}`}>
                            <Smartphone size={14} /> Mobile
                        </button>
                        <button onClick={() => setPreviewWidth('768px')} className={`px-3 flex gap-2 items-center py-2 rounded transition-colors ${previewWidth === '768px' ? 'bg-white shadow text-black' : 'hover:bg-neutral-200'}`}>
                            <Tablet size={14} /> Tablet
                        </button>
                        <button onClick={() => setPreviewWidth('100%')} className={`px-3 flex gap-2 items-center py-2 rounded transition-colors ${previewWidth === '100%' ? 'bg-white shadow text-black' : 'hover:bg-neutral-200'}`}>
                            <Monitor size={14} /> Desktop
                        </button>
                    </div>
                    <div className="flex gap-2 items-center bg-neutral-100 p-1 rounded-lg">
                        <button onClick={() => setPreviewZoom(Math.max(25, previewZoom - 25))} className="px-3 py-2 hover:bg-neutral-200 hover:text-black transition-colors rounded">-</button>
                        <span className="w-12 text-center text-sm">{previewZoom}%</span>
                        <button onClick={() => setPreviewZoom(Math.min(200, previewZoom + 25))} className="px-3 py-2 hover:bg-neutral-200 hover:text-black transition-colors rounded">+</button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto hide-scrollbar relative flex justify-center items-start pt-8 pb-32">
                    {previewProject && (
                        <div
                            className={`bg-white shadow-2xl relative transition-all duration-300 ease-out flex origin-top ${previewWidth === '100%' ? '' : 'rounded-[40px] border-[8px] border-neutral-800 ring-1 ring-black/5 overflow-hidden'}`}
                            style={{
                                width: previewWidth,
                                height: previewWidth === '100%' ? '100%' : (previewWidth === '375px' ? '812px' : '1024px'),
                                transform: `scale(${previewZoom / 100})`,
                            }}
                        >
                            {!iframeReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white text-neutral-400 font-sans text-sm animate-pulse z-50">
                                    Loading Preview...
                                </div>
                            )}
                            <iframe
                                ref={iframeRef}
                                src={`/admin/preview/${slug}`}
                                className="w-full h-full border-none pointer-events-none" // We don't interact with the iframe physically just yet, unless we want to, so we keep events passed or disabled. Let's make it interactive.
                                style={{ pointerEvents: 'auto' }}
                                title="Device Simulator"
                            />
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

export const getStaticPaths = async () => {
    return {
        paths: [],
        fallback: process.env.NODE_ENV === 'development' ? 'blocking' : false,
    };
};

export const getStaticProps = async () => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return { notFound: true };
    }
    return { props: {} };
};
