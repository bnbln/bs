import React from 'react'
import { motion } from 'framer-motion'
import MagneticButton from './MagneticButton' // For a potential copy interaction

interface FontSpecimenProps {
    name: string
    styles?: string
    sample?: string
    bgColor?: string
    color?: string
}

export default function FontSpecimen({
    name,
    styles = "Regular, Medium, Bold",
    sample = "The quick brown fox jumps over the lazy dog.",
    bgColor = "#1D1D1F",
    color = "#FFFFFF"
}: FontSpecimenProps) {

    return (
        <div
            className="w-full relative flex flex-col p-8 sm:p-12 md:p-16 rounded-[2rem] overflow-hidden shadow-lg transition-colors duration-500"
            style={{ backgroundColor: bgColor, color: color }}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 lg:mb-24 gap-6">
                <div>
                    <h3 className="text-sm font-medium tracking-[0.2em] uppercase opacity-70 mb-2">Typography</h3>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter" style={{ fontFamily: name }}>
                        {name}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-sm font-inter opacity-70 mb-1">Available Weights</p>
                    <p className="text-lg font-medium">{styles}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-current/20 pt-12">
                <div className="md:col-span-8">
                    <p className="text-[2rem] sm:text-[3rem] md:text-[4rem] lg:text-[5rem] leading-[1.1] tracking-[-0.02em] font-medium" style={{ fontFamily: name }}>
                        {sample}
                    </p>
                </div>
                <div className="md:col-span-4 flex flex-col gap-8 text-lg md:text-2xl leading-relaxed opacity-80" style={{ fontFamily: name, wordBreak: 'break-all' }}>
                    <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p>abcdefghijklmnopqrstuvwxyz</p>
                    <p>0123456789</p>
                    <p>!@#$%^&*()_+{ }|:"&lt;&gt;?</p>
                </div>
            </div>
        </div>
    )
}
