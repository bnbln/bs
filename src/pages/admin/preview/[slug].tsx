import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Article from '../../../components/Article';
import { Project } from '../../../lib/markdown';
import Head from 'next/head';

export default function PreviewPage() {
    const [project, setProject] = useState<Project | null>(null);
    const [allProjects, setAllProjects] = useState<Project[]>([]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'UPDATE_PREVIEW') {
                setProject(event.data.project);
                setAllProjects(event.data.allProjects);
            }
        };
        window.addEventListener('message', handleMessage);

        // Inform parent that iframe is ready to receive data
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center font-sans text-neutral-400 bg-white">
                Waiting for preview sync...
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <Head>
                <style>{`
                    /* Hide scrollbars for cleaner preview */
                    ::-webkit-scrollbar {
                        width: 0px;
                        background: transparent;
                    }
                `}</style>
            </Head>
            <Article project={project} allProjects={allProjects} heroPriority={false} />
        </div>
    );
}
