import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import Article from '../../../components/Article';
import { Project } from '../../../lib/markdown';
import Head from 'next/head';
import { parseFenceAttributes } from '../../../lib/editor-blocks';

interface PreviewScrollPayload {
    bodyIndex?: number;
    blockType?: string;
    snippet?: string;
    rawContent?: string;
    fenceInfo?: string;
}

const normalizeText = (input: string): string =>
    (input || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

const selectorByType = (blockType: string | undefined): string => {
    switch ((blockType || '').toLowerCase()) {
        case 'header':
            return 'h1, h2, h3, h4';
        case 'list':
            return 'li';
        case 'small-text':
        case 'text':
            return 'p';
        case 'code':
            return 'pre, code';
        case 'gallery':
        case 'mockup':
        case 'video':
            return 'figure, video, img';
        default:
            return 'h1, h2, h3, p, li, figure, pre, code, img';
    }
};

const extractAssetBasename = (value: string): string => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    const withoutQuery = trimmed.split('?')[0].split('#')[0];
    const parts = withoutQuery.split('/');
    return (parts[parts.length - 1] || '').toLowerCase();
};

const extractMediaHintFromPayload = (payload: PreviewScrollPayload): string => {
    const raw = payload.rawContent || '';
    const blockType = (payload.blockType || '').toLowerCase();

    if (['gallery'].includes(blockType)) {
        const match = raw.match(/^!\[([^\]]+)\]/);
        if (match?.[1]) {
            const first = match[1].split('|').map((item) => item.trim()).filter(Boolean)[0];
            return extractAssetBasename(first || '');
        }
    }

    if (['video'].includes(blockType)) {
        const match = raw.match(/\(([^)]+)\)/);
        if (match?.[1]) {
            const first = match[1].split('|').map((item) => item.trim()).filter(Boolean)[0];
            return extractAssetBasename(first || '');
        }
    }

    if (['mockup', 'animation-sequence'].includes(blockType)) {
        const attrs = parseFenceAttributes(payload.fenceInfo || '');
        const mediaCandidate = attrs.image || attrs.videoPath || attrs.spritesheetPath || attrs.poster || '';
        return extractAssetBasename(mediaCandidate);
    }

    return '';
};

export default function PreviewPage() {
    const [project, setProject] = useState<Project | null>(null);
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToPayload = useCallback((payload: PreviewScrollPayload) => {
        const root = containerRef.current;
        if (!root) return;

        const blockType = (payload.blockType || '').toLowerCase();
        const snippet = normalizeText(payload.snippet || '');
        const selectors = selectorByType(blockType);
        const candidates = Array.from(root.querySelectorAll<HTMLElement>(selectors));
        const mediaHint = extractMediaHintFromPayload(payload);

        let target: HTMLElement | null = null;

        if (blockType === 'header' && payload.rawContent) {
            const headingNeedle = normalizeText(payload.rawContent.replace(/^#{1,6}\s+/, ''));
            const headingNodes = Array.from(root.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main h4'));
            if (headingNeedle) {
                target = headingNodes.find((node) => normalizeText(node.textContent || '').includes(headingNeedle)) || null;
            }
        }

        if (!target && mediaHint && ['gallery', 'mockup', 'video', 'animation-sequence'].includes(blockType)) {
            const mediaNodes = Array.from(root.querySelectorAll<HTMLElement>('main img, main video, main source'));
            target = mediaNodes.find((node) => {
                const source =
                    (node as HTMLImageElement).currentSrc ||
                    (node as HTMLImageElement).src ||
                    node.getAttribute('src') ||
                    '';
                return extractAssetBasename(source).includes(mediaHint);
            }) || null;

            if (!target) {
                const figures = Array.from(root.querySelectorAll<HTMLElement>('main figure'));
                target = figures.find((node) => normalizeText(node.textContent || '').includes(mediaHint)) || null;
            }
        }

        if (!target && snippet && candidates.length) {
            target = candidates.find((node) => normalizeText(node.textContent || '').includes(snippet)) || null;

            if (!target && snippet.length > 24) {
                const shortSnippet = snippet.slice(0, 24);
                target = candidates.find((node) => normalizeText(node.textContent || '').includes(shortSnippet)) || null;
            }
        }

        if (!target && typeof payload.bodyIndex === 'number' && payload.bodyIndex >= 0) {
            const blocks = Array.from(root.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main h4, main p, main li, main figure, main pre, main video, main img'));
            target = blocks[Math.min(payload.bodyIndex, Math.max(blocks.length - 1, 0))] || null;
        }

        if (!target) {
            target = root.querySelector<HTMLElement>('main');
        }

        if (!target) return;

        if (['gallery', 'mockup', 'video', 'animation-sequence'].includes(blockType)) {
            const mediaContainer = target.closest('figure, section, [class*="media"], [class*="gallery"]');
            if (mediaContainer instanceof HTMLElement) {
                target = mediaContainer;
            }
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('preview-scroll-highlight');
        window.setTimeout(() => {
            target?.classList.remove('preview-scroll-highlight');
        }, 1200);
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'UPDATE_PREVIEW') {
                setProject(event.data.project);
                setAllProjects(event.data.allProjects);
                return;
            }

            if (event.data?.type === 'SCROLL_TO_BLOCK') {
                scrollToPayload(event.data.payload || {});
            }
        };
        window.addEventListener('message', handleMessage);

        // Inform parent that iframe is ready to receive data
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

        return () => window.removeEventListener('message', handleMessage);
    }, [scrollToPayload]);

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center font-sans text-neutral-400 bg-white">
                Waiting for preview sync...
            </div>
        );
    }

    return (
        <div ref={containerRef} className="bg-white min-h-screen">
            <Head>
                <style>{`
                    /* Hide scrollbars for cleaner preview */
                    ::-webkit-scrollbar {
                        width: 0px;
                        background: transparent;
                    }

                    .preview-scroll-highlight {
                        outline: 2px solid rgba(99, 102, 241, 0.65);
                        outline-offset: 6px;
                        border-radius: 10px;
                        transition: outline 0.2s ease;
                    }
                `}</style>
            </Head>
            <Article project={project} allProjects={allProjects} heroPriority={false} />
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
        return { notFound: true };
    }
    return { props: {} };
};
