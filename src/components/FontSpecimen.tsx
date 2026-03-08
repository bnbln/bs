import React from 'react'
import { resolveAssetPath } from '../lib/assets'

interface FontSpecimenProps {
    name: string
    styles?: string
    sample?: string
    bgColor?: string
    color?: string
    svgAa?: string
    svgTitle?: string
}

export default function FontSpecimen({
    name,
    styles = "Regular, Medium, Bold",
    sample,
    bgColor = "#1D1D1F",
    color = "#FFFFFF",
    svgAa,
    svgTitle
}: FontSpecimenProps) {
    const resolveSvgReference = (svgRef?: string) => {
        if (!svgRef) return undefined
        const trimmed = svgRef.trim()
        if (!trimmed) return undefined
        if (trimmed.startsWith('<svg')) {
            return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
        }
        if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
            return trimmed
        }
        return resolveAssetPath(trimmed)
    }

    const aaSvgUrl = resolveSvgReference(svgAa)
    const titleSvgUrl = resolveSvgReference(svgTitle)

    return (
        <div
            className="w-full relative flex flex-col rounded-[2rem] overflow-hidden shadow-2xl transition-colors duration-500 ring-1 ring-black/5 mx-auto max-w-[1400px] text-[#1D1D1F]"
            style={{ backgroundColor: bgColor }}
        >
            {/* Top Section - Name & Meta grid */}
            <div className="flex flex-col md:flex-row border-b border-current/20">

                {/* Abstract typographic element (The "Aa") */}
                <div className="hidden md:flex items-center justify-center p-8 md:p-16 border-r border-current/20 w-1/4 flex-shrink-0">
                    {aaSvgUrl ? (
                        <div
                            className="w-32 h-32 lg:w-48 lg:h-48"
                            style={{
                                backgroundColor: color,
                                WebkitMaskImage: `url("${aaSvgUrl}")`,
                                WebkitMaskPosition: 'center',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskSize: 'contain',
                                maskImage: `url("${aaSvgUrl}")`,
                                maskPosition: 'center',
                                maskRepeat: 'no-repeat',
                                maskSize: 'contain'
                            }}
                        />
                    ) : (
                        <span
                            className="text-[8rem] lg:text-[10rem] leading-none font-bold tracking-tighter opacity-90 select-none pb-4"
                            style={{ fontFamily: name, color: color }}
                        >
                            Aa
                        </span>
                    )}
                </div>

                {/* Main Name & Meta */}
                <div className="flex flex-col w-full">
                    <div className="p-8 md:p-12 lg:p-16 border-b border-current/20 flex flex-col justify-end min-h-[12rem] md:min-h-[16rem]">
                        <h3 className="text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase opacity-60 mb-6 font-inter">
                            Typeface Specimen
                        </h3>
                        <h2
                            className="text-5xl sm:text-7xl md:text-[6rem] lg:text-[7rem] leading-[0.9] font-bold tracking-tighter"
                            style={{ fontFamily: name, color: color }}
                        >
                            {titleSvgUrl ? (
                                <div
                                    className="w-full h-20 sm:h-28 md:h-32 lg:h-40"
                                    style={{
                                        backgroundColor: color,
                                        WebkitMaskImage: `url("${titleSvgUrl}")`,
                                        WebkitMaskPosition: 'left center',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskSize: 'contain',
                                        maskImage: `url("${titleSvgUrl}")`,
                                        maskPosition: 'left center',
                                        maskRepeat: 'no-repeat',
                                        maskSize: 'contain'
                                    }}
                                />
                            ) : (
                                name
                            )}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2">
                        <div className="p-6 md:p-8 lg:p-10 border-r border-current/20 flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-widest opacity-60 font-inter font-bold">Weights</span>
                            <span className="text-sm md:text-base font-medium font-inter">{styles}</span>
                        </div>
                        <div className="p-6 md:p-8 lg:p-10 flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-widest opacity-60 font-inter font-bold">Design</span>
                            <span className="text-sm md:text-base font-medium font-inter flex items-center gap-2">
                                Premium Editorial
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {sample && (
                <div className="p-8 md:p-12 lg:p-16 overflow-hidden flex items-center justify-center py-16 md:py-24">
                    <p
                        className="text-4xl sm:text-5xl md:text-[5rem] lg:text-[7vw] leading-[1.05] tracking-tight font-medium text-center"
                        style={{ fontFamily: name }}
                    >
                        {sample}
                    </p>
                </div>
            )}
        </div>
    )
}
