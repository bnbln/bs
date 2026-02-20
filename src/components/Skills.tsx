import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'

const skills = [
    {
        num: "01",
        title: "Motion &",
        subtitle: "Brand Design",
        description: "Crafting kinetic identities and motion systems that breathe life into digital brands, blending typography and animation seamlessly.",
    },
    {
        num: "02",
        title: "UX/UI",
        subtitle: "Architecture",
        description: "Designing intuitive, accessible, and pixel-perfect interfaces. Focused on human-centered experiences that look stunning and convert.",
    },
    {
        num: "03",
        title: "Creative",
        subtitle: "Development",
        description: "Engineering robust, performant web applications. Turning high-end designs into reality using React, Next.js, and generative AI.",
    }
]

const Skills = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: "-10%" })
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [isDesktop, setIsDesktop] = useState(true)

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Custom Cursor specific to this section
    const cursorRef = useRef<HTMLDivElement>(null)
    const cursorLabelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!cursorRef.current || !cursorLabelRef.current || !containerRef.current) return

        const xTo = gsap.quickTo(cursorRef.current, "x", { duration: 0.4, ease: "power3" })
        const yTo = gsap.quickTo(cursorRef.current, "y", { duration: 0.4, ease: "power3" })

        const onMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current!.getBoundingClientRect()
            // Make cursor relative to the container
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                xTo(e.clientX - rect.left)
                yTo(e.clientY - rect.top)
            }
        }

        window.addEventListener("mousemove", onMouseMove)
        return () => window.removeEventListener("mousemove", onMouseMove)
    }, [])

    useEffect(() => {
        if (hoveredIndex !== null) {
            gsap.to(cursorRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" })
            gsap.to(cursorLabelRef.current, { opacity: 1, scale: 1, duration: 0.2, delay: 0.1 })
        } else {
            gsap.to(cursorRef.current, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.inOut" })
            gsap.to(cursorLabelRef.current, { opacity: 0, scale: 0.8, duration: 0.2 })
        }
    }, [hoveredIndex])

    return (
        <section
            ref={containerRef}
            className="bg-[#1C1D20] py-24 md:py-40 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden"
        >
            {/* Custom Cursor */}
            <div
                ref={cursorRef}
                className="pointer-events-none absolute left-0 top-0 w-24 h-24 bg-white rounded-full z-50 flex items-center justify-center mix-blend-difference -translate-x-1/2 -translate-y-1/2 opacity-0 scale-0"
            >
                <div ref={cursorLabelRef} className="text-black font-space-grotesk font-bold text-xs tracking-widest uppercase opacity-0 scale-80">
                    Explore
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto relative z-10">

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-12 md:mb-20 flex justify-between items-end"
                >
                    <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-space-grotesk font-bold tracking-tight">
                        Specialized<br />Expertise
                    </h2>
                    <div className="hidden md:block text-neutral-400 font-inter text-sm uppercase tracking-widest">
                        Capabilities
                    </div>
                </motion.div>

                {/* 3-Column Interactive Layout */}
                <div
                    className="flex flex-col lg:flex-row gap-4 h-[auto] lg:h-[600px] w-full"
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {skills.map((skill, index) => {
                        const isHovered = hoveredIndex === index
                        const isAnyHovered = hoveredIndex !== null

                        return (
                            <motion.div
                                key={skill.num}
                                onMouseEnter={() => setHoveredIndex(index)}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                style={{
                                    flex: isDesktop
                                        ? (isHovered ? 2 : (isAnyHovered ? 0.8 : 1))
                                        : 'none'
                                }}
                                animate={isInView ? {
                                    opacity: 1,
                                    y: 0
                                } : {}}
                                transition={{
                                    duration: 0.6,
                                    ease: [0.32, 0.72, 0, 1],
                                    opacity: { duration: 0.8, delay: index * 0.1 },
                                    y: { duration: 0.8, delay: index * 0.1 }
                                }}
                                className={`
                  relative group overflow-hidden rounded-3xl cursor-none
                  flex flex-col justify-between p-8 md:p-10
                  border border-neutral-800 transition-colors duration-500
                  ${isHovered ? 'bg-[#2A2B2F]' : 'bg-[#1C1D20]'}
                  lg:h-full lg:min-w-[200px] h-[350px]
                `}
                            >
                                {/* Background Pattern / Hint */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                                />

                                {/* Top Section */}
                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="font-space-grotesk text-neutral-500 text-lg md:text-xl font-medium">
                                        {skill.num}
                                    </div>
                                </div>

                                {/* Bottom Section */}
                                <div className="relative z-10">
                                    <motion.div
                                        layout="position"
                                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                        className="mb-4"
                                    >
                                        <h3 className={`font-space-grotesk font-bold tracking-tight text-white transition-all duration-500 origin-left whitespace-nowrap ${isHovered
                                            ? 'text-4xl md:text-5xl lg:text-6xl scale-100'
                                            : 'text-3xl md:text-4xl scale-100 lg:scale-90 lg:text-neutral-300'
                                            }`}>
                                            {skill.title}<br />{skill.subtitle}
                                        </h3>
                                    </motion.div>

                                    {/* Description (Expands on Hover) */}
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{
                                            opacity: hoveredIndex === null || isHovered ? (isDesktop ? (isHovered ? 1 : 0) : 1) : 0,
                                            height: hoveredIndex === null || isHovered ? (isDesktop ? (isHovered ? 'auto' : 0) : 'auto') : 0
                                        }}
                                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <p className="font-inter text-neutral-400 text-base md:text-lg lg:text-xl max-w-md mt-4 lg:hidden group-hover:block min-w-[280px]">
                                            {skill.description}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Decorative Line that animates on hover */}
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-800">
                                    <motion.div
                                        className="h-full bg-white origin-left"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: isHovered ? 1 : 0 }}
                                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                    />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default Skills
