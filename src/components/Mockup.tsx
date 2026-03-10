import React from 'react'
import { resolveAssetPath } from '../lib/assets'

export type MockupType = 'iphone' | 'macbook' | 'tv' | 'ipad' | 'android' | 'safari' | 'safari-tab'
type NormalizedMockupType = 'iphone' | 'macbook' | 'tv' | 'ipad' | 'android' | 'safari-tab'

export interface MockupItem {
    type: MockupType | string
    mediaUrl?: string
    image?: string
    video?: string
    bgColor?: string
    url?: string
    alt?: string
}

interface MockupProps {
    type?: MockupType | string
    mediaUrl?: string
    image?: string
    video?: string
    bgColor?: string
    accentColor?: string
    items?: MockupItem[]
    alt?: string
}

const normalizeMockupType = (rawType?: string): NormalizedMockupType => {
    const type = (rawType || '').toLowerCase().trim()
    if (type === 'iphone') return 'iphone'
    if (type === 'macbook') return 'macbook'
    if (type === 'tv') return 'tv'
    if (type === 'ipad') return 'ipad'
    if (type === 'android') return 'android'
    if (type === 'safari' || type === 'safari-tab' || type === 'safaritab') return 'safari-tab'
    return 'iphone'
}

const getTypeLabel = (type: NormalizedMockupType): string => {
    if (type === 'iphone') return 'iPhone'
    if (type === 'android') return 'Android'
    if (type === 'ipad') return 'iPad'
    if (type === 'macbook') return 'MacBook'
    if (type === 'tv') return 'TV'
    return 'Browser'
}

const getRowSlotWidthClass = (type: NormalizedMockupType, count: number): string => {
    if (type === 'iphone' || type === 'android') {
        if (count >= 4) return 'w-[28vw] sm:w-[24vw] md:w-[21vw] lg:w-[18vw] xl:w-[16vw] min-w-[112px]'
        if (count === 3) return 'w-[34vw] sm:w-[30vw] md:w-[27vw] lg:w-[24vw] xl:w-[21vw] min-w-[132px]'
        return 'w-[42vw] sm:w-[38vw] md:w-[34vw] lg:w-[30vw] xl:w-[27vw] min-w-[150px]'
    }
    if (type === 'ipad' || type === 'safari-tab') {
        if (count >= 4) return 'w-[48vw] sm:w-[42vw] md:w-[30vw] lg:w-[26vw] xl:w-[22vw] min-w-[190px]'
        if (count === 3) return 'w-[60vw] sm:w-[52vw] md:w-[40vw] lg:w-[34vw] xl:w-[30vw] min-w-[220px]'
        return 'w-[74vw] sm:w-[66vw] md:w-[52vw] lg:w-[45vw] xl:w-[40vw] min-w-[240px]'
    }
    if (count >= 4) return 'w-[52vw] sm:w-[44vw] md:w-[33vw] lg:w-[27vw] xl:w-[22vw] min-w-[210px]'
    if (count === 3) return 'w-[64vw] sm:w-[56vw] md:w-[42vw] lg:w-[35vw] xl:w-[30vw] min-w-[230px]'
    return 'w-[82vw] sm:w-[72vw] md:w-[56vw] lg:w-[48vw] xl:w-[42vw] min-w-[280px]'
}

const getGroupedMaxWidthClass = (type: NormalizedMockupType, count: number): string => {
    if (type === 'iphone' || type === 'android') {
        if (count >= 4) return 'max-w-[260px] lg:max-w-[300px]'
        if (count === 3) return 'max-w-[300px] lg:max-w-[340px]'
        return 'max-w-[360px] lg:max-w-[420px]'
    }
    if (type === 'ipad') {
        if (count >= 4) return 'max-w-[360px] lg:max-w-[420px]'
        return 'max-w-[560px] lg:max-w-[680px]'
    }
    if (type === 'safari-tab') {
        if (count >= 4) return 'max-w-[380px] lg:max-w-[460px]'
        return 'max-w-[620px] lg:max-w-[760px]'
    }
    if (type === 'tv') {
        if (count >= 4) return 'max-w-[420px] lg:max-w-[520px]'
        if (count === 3) return 'max-w-[560px] lg:max-w-[700px]'
        return 'max-w-[780px] lg:max-w-[920px]'
    }
    // macbook
    if (count >= 4) return 'max-w-[400px] lg:max-w-[500px]'
    if (count === 3) return 'max-w-[540px] lg:max-w-[660px]'
    return 'max-w-[760px] lg:max-w-[900px]'
}

const getSafariAspectClass = (count: number): string => {
    if (count >= 4) return 'aspect-[16/9]'
    if (count === 3) return 'aspect-[16/10]'
    return 'aspect-[16/11]'
}

const getSingleMaxWidthClass = (type: NormalizedMockupType): string => {
    if (type === 'iphone' || type === 'android') return 'max-w-[320px]'
    if (type === 'ipad') return 'max-w-[980px]'
    if (type === 'safari-tab') return 'max-w-[1100px]'
    if (type === 'tv') return 'max-w-[1200px]'
    return 'max-w-[980px]'
}

const isVideoFile = (url: string): boolean => {
    if (!url) return false
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp']
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext))
}

const normalizeExternalUrl = (raw?: string): string | null => {
    const value = (raw || '').trim()
    if (!value) return null
    if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value
    return `https://${value.replace(/^\/+/, '')}`
}

const MockupMedia = ({
    isVideo,
    path,
    imageClassName = 'object-cover',
    alt,
}: {
    isVideo: boolean
    path: string
    imageClassName?: string
    alt: string
}) => {
    if (isVideo) {
        return (
            <video
                src={path}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
            />
        )
    }
    return <img src={path} alt={alt} className={`w-full h-full ${imageClassName}`} loading="lazy" />
}

const MockupDevice = ({
    type,
    path,
    isVideo,
    maxWidthClass,
    itemCount,
    displayUrl,
    alt,
}: {
    type: NormalizedMockupType
    path: string
    isVideo: boolean
    maxWidthClass: string
    itemCount: number
    displayUrl?: string
    alt: string
}) => {
    if (type === 'iphone') {
        return (
            <div className={`relative mx-auto w-full ${maxWidthClass} aspect-[9/19.5] rounded-[1.7rem] sm:rounded-[2.1rem] md:rounded-[2.6rem] lg:rounded-[3.15rem] xl:rounded-[3.7rem] p-[5px] sm:p-[6px] md:p-[7px] lg:p-[8px] xl:p-[9px] bg-black shadow-2xl ring-1 ring-white/10`}>
                <div className="absolute inset-x-0 top-[2.7%] flex justify-center z-20 pointer-events-none">
                    <div className="w-[31%] aspect-[10/3] bg-black rounded-full" />
                </div>
                <div className="w-full h-full rounded-[1.45rem] sm:rounded-[1.85rem] md:rounded-[2.25rem] lg:rounded-[2.75rem] xl:rounded-[3.2rem] overflow-hidden bg-neutral-900 relative z-10">
                    <MockupMedia isVideo={isVideo} path={path} alt={alt} />
                </div>
            </div>
        )
    }

    if (type === 'android') {
        return (
            <div className={`relative mx-auto w-full ${maxWidthClass} aspect-[9/20] rounded-[1.6rem] sm:rounded-[2rem] md:rounded-[2.45rem] lg:rounded-[2.95rem] xl:rounded-[3.4rem] p-[5px] sm:p-[6px] md:p-[7px] lg:p-[8px] xl:p-[9px] bg-black shadow-2xl ring-1 ring-white/10`}>
                <div className="w-full h-full rounded-[1.3rem] sm:rounded-[1.6rem] md:rounded-[1.95rem] lg:rounded-[2.35rem] xl:rounded-[2.8rem] overflow-hidden bg-neutral-900 relative z-10">
                    <div className="absolute top-[8px] sm:top-[10px] md:top-[11px] lg:top-[12px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] md:w-[11px] md:h-[11px] lg:w-[12px] lg:h-[12px] bg-black rounded-full z-20 pointer-events-none" />
                    <MockupMedia isVideo={isVideo} path={path} alt={alt} />
                </div>
            </div>
        )
    }

    if (type === 'ipad') {
        return (
            <div className={`relative mx-auto w-full ${maxWidthClass} aspect-[4/3] rounded-[clamp(1.7rem,2.8vw,2.3rem)] p-[clamp(6px,0.9vw,10px)] bg-black shadow-2xl ring-1 ring-white/10`}>
                <div className="w-full h-full rounded-[clamp(1.25rem,2.2vw,1.85rem)] overflow-hidden bg-neutral-900">
                    <MockupMedia isVideo={isVideo} path={path} alt={alt} />
                </div>
            </div>
        )
    }

    if (type === 'tv') {
        return (
            <div className={`relative mx-auto w-full ${maxWidthClass} flex flex-col items-center`}>
                <div className="relative w-full aspect-video bg-[#161616] rounded-[0.65rem] p-1 shadow-2xl ring-1 ring-white/5">
                    <div className="w-full h-full overflow-hidden bg-black rounded-[0.45rem]">
                        <MockupMedia isVideo={isVideo} path={path} alt={alt} />
                    </div>
                </div>
                <div className="relative w-[34%] h-5 md:h-7 flex justify-between -mt-1">
                    <div className="w-1.5 h-full bg-[#2f2f2f] transform -skew-x-[20deg] rounded-b-sm shadow-md" />
                    <div className="w-1.5 h-full bg-[#2f2f2f] transform skew-x-[20deg] rounded-b-sm shadow-md" />
                </div>
            </div>
        )
    }

    if (type === 'safari-tab') {
        const urlText = (displayUrl || '').trim()
        return (
            <div className={`relative mx-auto w-full ${maxWidthClass} ${getSafariAspectClass(itemCount)} rounded-[0.9rem] md:rounded-[1.15rem] bg-[#DCE1E9] shadow-2xl ring-1 ring-black/10 overflow-hidden`}>
                <div className="h-8 md:h-10 bg-[#EDF1F6] border-b border-black/10 flex items-center px-3 gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FEBB2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-2 h-4 md:h-5 flex-1 rounded-md bg-white/95 border border-black/10 px-2 flex items-center text-[9px] md:text-[10px] text-[#4B5563] truncate">
                        {urlText}
                    </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 top-8 md:top-10 overflow-hidden bg-white">
                    <MockupMedia
                        isVideo={isVideo}
                        path={path}
                        imageClassName="object-cover object-top"
                        alt={alt}
                    />
                </div>
            </div>
        )
    }

    // macbook
    return (
        <div className={`relative mx-auto w-full ${maxWidthClass} flex flex-col items-center`}>
            <div className="relative w-full aspect-[16/10] bg-black rounded-t-[1.1rem] rounded-b-sm p-2.5 md:p-3.5 shadow-2xl ring-1 ring-white/10 z-10">
                <div className="absolute top-0 inset-x-0 h-3.5 md:h-4 flex justify-center z-20 pointer-events-none">
                    <div className="w-14 md:w-16 h-2.5 md:h-3 bg-black rounded-b-md" />
                </div>
                <div className="w-full h-full rounded-md overflow-hidden bg-neutral-900 relative">
                    <MockupMedia isVideo={isVideo} path={path} alt={alt} />
                </div>
            </div>
            <div className="relative w-[114%] h-3 md:h-5 bg-gradient-to-b from-[#E2E2E2] to-[#BCBCBC] rounded-b-3xl shadow-xl flex justify-center pt-0.5 border-t border-white/40 z-20">
                <div className="w-1/6 h-1 bg-[#A3A3A3] rounded-b-md" />
            </div>
        </div>
    )
}

export default function Mockup(props: MockupProps) {
    const items = props.items && props.items.length > 0
        ? props.items
        : [{ type: props.type || 'iphone', mediaUrl: props.mediaUrl, image: props.image, video: props.video, bgColor: props.bgColor }]

    const validItems = items.filter(i => i.image || i.video || i.mediaUrl)
    if (validItems.length === 0) return null

    const containerBg = validItems[0].bgColor || props.bgColor || '#F5F5F7'
    const grouped = validItems.length > 1

    const renderGroupedItem = (item: MockupItem, index: number) => {
        const url = item.image || item.video || item.mediaUrl || ''
        const path = resolveAssetPath(url) || ''
        const type = normalizeMockupType(item.type)
        const isVid = Boolean(item.video) || isVideoFile(url)
        const maxWidthClass = getGroupedMaxWidthClass(type, validItems.length)
        const rawUrl = type === 'safari-tab' ? item.url : undefined
        const externalUrl = type === 'safari-tab' ? normalizeExternalUrl(rawUrl) : null
        const fallbackAlt = `${getTypeLabel(type)} mockup ${index + 1}`
        const altText = (item.alt || '').trim() || fallbackAlt

        const content = (
            <div
                key={`${type}-${index}`}
                className={`${getRowSlotWidthClass(type, validItems.length)} shrink-0 flex items-end justify-center`}
            >
                <MockupDevice
                    type={type}
                    path={path}
                    isVideo={isVid}
                    maxWidthClass={maxWidthClass}
                    itemCount={validItems.length}
                    displayUrl={rawUrl}
                    alt={altText}
                />
            </div>
        )
        if (!externalUrl) return content
        return (
            <a
                key={`${type}-${index}`}
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${getRowSlotWidthClass(type, validItems.length)} shrink-0 flex items-end justify-center transition-transform duration-200 hover:scale-[1.01]`}
            >
                <MockupDevice
                    type={type}
                    path={path}
                    isVideo={isVid}
                    maxWidthClass={maxWidthClass}
                    itemCount={validItems.length}
                    displayUrl={rawUrl}
                    alt={altText}
                />
            </a>
        )
    }

    if (!grouped) {
        const item = validItems[0]
        const url = item.image || item.video || item.mediaUrl || ''
        const path = resolveAssetPath(url) || ''
        const type = normalizeMockupType(item.type)
        const isVid = Boolean(item.video) || isVideoFile(url)
        const maxWidthClass = getSingleMaxWidthClass(type)
        const rawUrl = type === 'safari-tab' ? item.url : undefined
        const externalUrl = type === 'safari-tab' ? normalizeExternalUrl(rawUrl) : null
        const fallbackAlt = `${getTypeLabel(type)} mockup`
        const altText = (item.alt || props.alt || '').trim() || fallbackAlt

        return (
            <div
                className="w-full relative rounded-3xl overflow-hidden shadow-sm ring-1 ring-black/5 px-3 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20"
                style={{ backgroundColor: containerBg }}
            >
                <div className="flex justify-center">
                    {externalUrl ? (
                        <a
                            href={externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex justify-center transition-transform duration-200 hover:scale-[1.01]"
                        >
                            <MockupDevice
                                type={type}
                                path={path}
                                isVideo={isVid}
                                maxWidthClass={maxWidthClass}
                                itemCount={1}
                                displayUrl={rawUrl}
                                alt={altText}
                            />
                        </a>
                    ) : (
                        <MockupDevice
                            type={type}
                            path={path}
                            isVideo={isVid}
                            maxWidthClass={maxWidthClass}
                            itemCount={1}
                            displayUrl={rawUrl}
                            alt={altText}
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            className="w-full relative rounded-3xl overflow-hidden shadow-sm ring-1 ring-black/5 px-2 sm:px-3 md:px-5 py-8 sm:py-10 md:py-12"
            style={{ backgroundColor: containerBg }}
        >
            <div className="overflow-x-auto overflow-y-visible pb-1 [-webkit-overflow-scrolling:touch]">
                <div className="w-max min-w-full flex flex-nowrap items-end justify-center gap-3 sm:gap-4 md:gap-6 px-1 sm:px-2 md:px-3 py-1">
                    {validItems.map((item, index) => renderGroupedItem(item, index))}
                </div>
            </div>
        </div>
    )
}
