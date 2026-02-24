import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

interface LottiePlayerProps {
    src: string
    loop?: boolean
    autoplay?: boolean
    className?: string
    style?: React.CSSProperties
}

export default function LottiePlayer({ src, loop = true, autoplay = true, className = '', style }: LottiePlayerProps) {
    const [animationData, setAnimationData] = useState<any>(null)
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        let active = true
        fetch(src)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch')
                return res.json()
            })
            .then(data => {
                if (active) setAnimationData(data)
            })
            .catch(err => {
                console.error('Failed to load Lottie animation:', err)
                if (active) setError(true)
            })
        return () => { active = false }
    }, [src])

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-red-50 text-red-500 rounded-2xl ${className}`} style={style}>
                Failed to load animation
            </div>
        )
    }

    if (!animationData) {
        return (
            <div className={`flex items-center justify-center bg-black/5 rounded-2xl animate-pulse ${className}`} style={style} />
        )
    }

    return (
        <div className={`flex items-center justify-center ${className}`} style={style}>
            <Lottie animationData={animationData} loop={loop} autoplay={autoplay} style={{ width: '100%', height: '100%' }} />
        </div>
    )
}
