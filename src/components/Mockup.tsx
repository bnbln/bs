import React from 'react'
import { resolveAssetPath } from '../lib/assets'
import AdaptiveVideoPlayer from './AdaptiveVideoPlayer'

export type MockupType = 'iphone' | 'macbook' | 'tv' | 'ipad' | 'android'

export interface MockupItem {
    type: MockupType
    mediaUrl?: string
    image?: string
    video?: string
    bgColor?: string
}

interface MockupProps {
    type?: MockupType
    mediaUrl?: string
    image?: string
    video?: string
    bgColor?: string
    accentColor?: string
    items?: MockupItem[]
}

export default function Mockup(props: MockupProps) {
    const items = props.items && props.items.length > 0
        ? props.items
        : [{ type: props.type || 'iphone', mediaUrl: props.mediaUrl, image: props.image, video: props.video, bgColor: props.bgColor }]

    const validItems = items.filter(i => i.image || i.video || i.mediaUrl)
    if (validItems.length === 0) return null

    // Use the first valid item's background as container background, or fallback
    const containerBg = validItems[0].bgColor || props.bgColor || '#F5F5F7'
    const accentColor = props.accentColor || '#000'

    // Check if we are mixing devices, to allow bottom alignment
    const isMixedGroup = validItems.length > 1 && validItems.some(i => i.type === 'ipad' || i.type === 'macbook')
    const isPhoneGroup = validItems.length > 1 && validItems.every(i => i.type === 'iphone' || i.type === 'android')

    const containerGap = isPhoneGroup ? 'gap-3 sm:gap-5 md:gap-16' : 'gap-8 md:gap-16'
    const containerPadding = isPhoneGroup ? 'px-2 sm:px-6 md:px-8' : 'px-4 sm:px-8'
    const phoneWidth = isPhoneGroup
        ? 'w-[46%] max-w-[210px] sm:max-w-[240px] md:w-[85%] md:max-w-[320px]'
        : 'w-[85%] max-w-[320px]'

    return (
        <div
            className={`w-full relative flex flex-wrap justify-center ${containerGap} ${containerPadding} rounded-3xl overflow-hidden shadow-sm ring-1 ring-black/5 ${isMixedGroup ? 'items-end' : 'items-center py-16 sm:py-24'}`}
            style={{ backgroundColor: containerBg }}
        >
            {isMixedGroup && <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.02) 100%)' }} />}
            {validItems.map((item, index) => {
                const url = item.image || item.video || item.mediaUrl
                const isVid = item.video || isVideoFile(url || '')
                const path = resolveAssetPath(url || '') || ''
                const type = item.type

                return (
                    <React.Fragment key={index}>
                        {type === 'iphone' && (
                            <div className={`relative ${phoneWidth} aspect-[9/19.5] rounded-[2.75rem] sm:rounded-[3rem] p-1.5 sm:p-2 bg-black shadow-2xl ring-1 ring-white/10 shrink-0 ${isMixedGroup ? 'mt-16 sm:mt-24 mb-16 sm:mb-24' : ''}`}>
                                <div className="absolute inset-x-0 top-[2.6%] flex justify-center z-20 pointer-events-none">
                                    {/* Dynamic Island fake */}
                                    <div className="w-[31.5%] min-w-[64px] max-w-[100px] aspect-[10/3] bg-black rounded-full" />
                                </div>
                                <div className="w-full h-full rounded-[2.5rem] sm:rounded-[2.75rem] overflow-hidden bg-neutral-900 relative z-10">
                                    {isVid ? (
                                        <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor} minimal loop muted />
                                    ) : (
                                        <img src={path} className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                </div>
                            </div>
                        )}

                        {type === 'macbook' && (
                            <div className={`relative w-[90%] max-w-[900px] flex flex-col items-center shrink-0 ${isMixedGroup ? 'mt-16 sm:mt-24 mb-16 sm:mb-24' : ''}`}>
                                {/* Screen Bezel */}
                                <div className="relative w-full aspect-[16/10] bg-black rounded-t-[1.25rem] rounded-b-sm p-3 sm:p-4 shadow-2xl ring-1 ring-white/10 z-10">
                                    <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-20 pointer-events-none">
                                        <div className="w-16 h-3 bg-black rounded-b-md" />
                                    </div>
                                    <div className="w-full h-full rounded-md overflow-hidden bg-neutral-900 relative">
                                        {isVid ? (
                                            <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor} minimal loop muted />
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
                            <div className="relative w-[95%] max-w-[1200px] flex flex-col items-center shrink-0">
                                {/* TV Screen Thin Bezel */}
                                <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-lg p-1 shadow-2xl ring-1 ring-white/5 z-10">
                                    <div className="w-full h-full overflow-hidden bg-black relative">
                                        {isVid ? (
                                            <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor} minimal loop muted />
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

                        {type === 'ipad' && (
                            <div className={`relative w-[120%] sm:w-[90%] max-w-[800px] md:max-w-[1000px] aspect-[4/3] rounded-[2rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 bg-black shadow-2xl ring-1 ring-white/10 shrink-0 ${isMixedGroup ? 'mt-16 sm:mt-24 mb-[-15%] sm:mb-[-20%] translate-y-[5%]' : ''}`}>
                                <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-neutral-900 relative z-10">
                                    {isVid ? (
                                        <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor} minimal loop muted />
                                    ) : (
                                        <img src={path} className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                </div>
                            </div>
                        )}

                        {type === 'android' && (
                            <div className={`relative ${isPhoneGroup ? 'w-[46%] max-w-[200px] sm:max-w-[220px] md:w-[85%] md:max-w-[300px]' : 'w-[85%] max-w-[300px]'} aspect-[9/20] rounded-[2.5rem] p-2 sm:p-2.5 bg-black shadow-2xl ring-1 ring-white/10 shrink-0 ${isMixedGroup ? 'mt-16 sm:mt-24 mb-16 sm:mb-24' : ''}`}>
                                <div className="w-full h-full rounded-[2rem] overflow-hidden bg-neutral-900 relative z-10">
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-20 pointer-events-none" />
                                    {isVid ? (
                                        <AdaptiveVideoPlayer videoUrl={path || ''} autoStart={true} color={accentColor} minimal loop muted />
                                    ) : (
                                        <img src={path} className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}

function isVideoFile(url: string): boolean {
    if (!url) return false
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp']
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext))
}
