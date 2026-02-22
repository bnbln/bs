import React from 'react'
import Image from 'next/image'
import { resolveAssetPath } from '../lib/assets'
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer'

export type MockupType = 'iphone' | 'macbook' | 'tv'

interface MockupProps {
    type: MockupType
    mediaUrl?: string
    image?: string
    video?: string
    bgColor?: string
    accentColor?: string
}

export default function Mockup({ type, mediaUrl, image, video, bgColor, accentColor }: MockupProps) {
    const url = image || video || mediaUrl
    if (!url) return null

    const isVid = video || isVideoFile(url)
    const path = resolveAssetPath(url) || ''
    const containerBg = bgColor || '#F5F5F7'

    return (
        <div
            className="w-full relative flex items-center justify-center py-16 sm:py-24 rounded-3xl overflow-hidden shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: containerBg }}
        >
            {type === 'iphone' && (
                <div className="relative w-[85%] max-w-[320px] aspect-[9/19.5] rounded-[3rem] p-3 sm:p-4 bg-black shadow-2xl ring-1 ring-white/10">
                    <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20 pointer-events-none">
                        {/* Dynamic Island fake */}
                        <div className="w-1/3 h-6 bg-black rounded-b-3xl mt-2" />
                    </div>
                    <div className="w-full h-full rounded-[2.25rem] overflow-hidden bg-neutral-900 relative z-10">
                        {isVid ? (
                            <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor || '#000'} minimal loop muted />
                        ) : (
                            <img src={path} className="w-full h-full object-cover" loading="lazy" />
                        )}
                    </div>
                </div>
            )}

            {type === 'macbook' && (
                <div className="relative w-[90%] max-w-[900px] flex flex-col items-center">
                    {/* Screen Bezel */}
                    <div className="relative w-full aspect-[16/10] bg-black rounded-t-[1.5rem] rounded-b-sm p-2 sm:p-4 shadow-2xl ring-1 ring-white/10 z-10">
                        <div className="w-full h-full rounded-md overflow-hidden bg-neutral-900 relative">
                            {isVid ? (
                                <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor || '#000'} minimal loop muted />
                            ) : (
                                <img src={path} className="w-full h-full object-cover" loading="lazy" />
                            )}
                        </div>
                    </div>
                    {/* Base */}
                    <div className="relative w-[114%] h-4 sm:h-6 bg-gradient-to-b from-[#dfdfdf] to-[#bcbcbc] rounded-b-3xl shadow-xl flex justify-center pt-1 border-t border-white/40 z-20">
                        <div className="w-1/6 h-1 bg-[#a0a0a0] rounded-b-md" />
                    </div>
                </div>
            )}

            {type === 'tv' && (
                <div className="relative w-[95%] max-w-[1200px] flex flex-col items-center">
                    {/* TV Screen Thin Bezel */}
                    <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-lg p-1 shadow-2xl ring-1 ring-white/5 z-10">
                        <div className="w-full h-full overflow-hidden bg-black relative">
                            {isVid ? (
                                <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor || '#000'} minimal loop muted />
                            ) : (
                                <img src={path} className="w-full h-full object-cover" loading="lazy" />
                            )}
                        </div>
                    </div>
                    {/* TV Stand / Feet */}
                    <div className="relative w-[30%] h-8 flex justify-between z-0 -mt-2">
                        <div className="w-1.5 h-full bg-[#333] transform -skew-x-[20deg] rounded-b-sm shadow-md" />
                        <div className="w-1.5 h-full bg-[#333] transform skew-x-[20deg] rounded-b-sm shadow-md" />
                    </div>
                </div>
            )}
        </div>
    )
}

function isVideoFile(url: string): boolean {
    if (!url) return false
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp']
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext))
}
