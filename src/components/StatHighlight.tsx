import React from 'react'

interface Stat {
    label: string
    value: string
}

interface StatHighlightProps {
    stats: Stat[]
    accentColor?: string
}

export default function StatHighlight({ stats, accentColor = '#000' }: StatHighlightProps) {
    if (!stats || stats.length === 0) return null

    return (
        <div className="flex flex-col gap-6 w-full py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="group relative bg-white border border-neutral-200/80 rounded-[2rem] p-8 md:p-10 hover:bg-neutral-50 transition-all duration-500 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden"
                    >
                        <div className="text-5xl md:text-6xl font-bold font-space-grotesk text-black mb-3 tracking-tighter group-hover:text-[var(--stat-accent)] transition-colors duration-500" style={{ ['--stat-accent' as any]: accentColor }}>
                            {stat.value}
                        </div>
                        <div className="text-sm md:text-base text-neutral-500 font-inter font-medium tracking-wide">
                            {stat.label}
                        </div>
                        {/* Subtle hover gradient wash */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
    )
}
