import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '../../lib/markdown';

export default function AdminDashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/admin/projects')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load projects. Ensure NEXT_PUBLIC_ADMIN=true');
                return res.json();
            })
            .then((data) => setProjects(data.projects || []))
            .catch((err) => setError(err.message));
    }, []);

    if (error) {
        return (
            <div className="p-10 font-sans min-h-screen bg-neutral-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p>{error}</p>
                    <p className="mt-4 text-sm text-neutral-500 bg-neutral-100 p-2 rounded">
                        npm run backend
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 font-sans max-w-4xl mx-auto min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-neutral-900">Local Content Editor</h1>
            <div className="grid gap-4 md:grid-cols-2">
                {projects.map((p) => (
                    <Link href={`/admin/editor/${p.slug}`} key={p.slug}>
                        <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-black transition-all cursor-pointer group">
                            <h2 className="text-xl font-bold group-hover:text-black">{p.title}</h2>
                            <p className="text-neutral-500 mt-1">{p.slug}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
