import React, { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface SkillShapeConfig {
    object?: string;
    scale?: [number, number, number];
    position?: [number, number, number];
    rotation?: [number, number, number];
    hoverScale?: [number, number, number];
}

interface Skill {
    num: string;
    title: string;
    subtitle: string;
    description: string;
    shapeConfig?: SkillShapeConfig;
    skillPills: string[];
    deliverables: string[];
}

const skills: Skill[] = [
    {
        num: "01",
        title: "Motion &",
        subtitle: "Brand Design",
        description: "Crafting kinetic identities and motion systems that breathe life into digital brands, blending typography and animation seamlessly.",
        // shapeConfig: {
        //     object: "/assets/cursor-2.glb",
        //     scale: [1, 1, 1],
        //     position: [0, 0, 0],
        //     rotation: [0, 0, 0],
        //     hoverScale: [1.3, 1.3, 1.3]
        // },
        deliverables: [
            "Brand Identities & Guidelines",
            "Broadcast & Show Packages",
            "Promos & Campaign Trailers",
            "Motion Design Systems",
            "C-Level Pitch Decks",
            "Digital & Print Event Packages"
        ],
        skillPills: [
            "Motion Design",
            "Brand Design",
            "After Effects",
            "3D Modeling",
            "Animation",
            "Show Design",
            "Style Guides",
            "Brand Films",
            "Presentations",
            "Corporate Identity",
            "Visual Identity",
            "Typography"
        ]
    },
    {
        num: "02",
        title: "UX/UI",
        subtitle: "Architecture",
        description: "Designing intuitive, accessible, and pixel-perfect interfaces. Focused on human-centered experiences that look stunning and convert.",
        shapeConfig: {
            scale: [0.9, 0.9, 0.9],
            hoverScale: [1.3, 1.3, 1.3]
        },
        deliverables: [
            "Scalable Design Systems",
            "Web App Interfaces & SaaS",
            "High-Fidelity Prototypes",
            "User Personas & Conversion Flows",
            "iOS & Mobile Interfaces"
        ],
        skillPills: [
            "UX/UI Design",
            "User Research",
            "Scrum / Agile",
            "Wireframing",
            "Prototyping",
            "Design Systems",
            "Usability Testing",
            "Information Architecture",
            "Figma",
            "Interactive Prototypes",
            "User Flows",
            "Journey Mapping"
        ]
    },
    {
        num: "03",
        title: "Creative",
        subtitle: "Development",
        description: "Engineering robust, performant web applications. Turning high-end designs into reality using React, Next.js, and generative AI.",
        shapeConfig: {
            scale: [0.9, 0.9, 0.9],
            hoverScale: [1.3, 1.3, 1.3]
        },
        deliverables: [
            "High-Performance Web Apps",
            "Interactive 3D/WebGL Experiences",
            "Marketing Websites & Portfolios",
            "AI-Integrated Prototypes & Tools",
            "Custom Content Architecture"
        ],
        skillPills: [
            "Web Development",
            "React / Next.js",
            "Three.js / WebGL",
            "Generative AI",
            "Frontend Development",
            "TypeScript",
            "Tailwind CSS",
            "Creative Coding",
            "Framer Motion",
            "Web Animations",
            "API Integration",
            "CMS Options"
        ]
    }
]

const MotionShape = ({ isHovered, config }: { isHovered: boolean, config?: SkillShapeConfig }) => {
    const mesh = useRef<THREE.Mesh>(null)
    const baseScale = config?.scale?.[0] ?? 1.0
    const hoverScaleConst = config?.hoverScale?.[0] ?? 1.4

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * (isHovered ? 0.3 : 0.1)
            mesh.current.rotation.y += delta * (isHovered ? 0.3 : 0.1)

            // Lerp scale
            const targetScale = isHovered ? hoverScaleConst : baseScale
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })
    return (
        <Float speed={isHovered ? 1.5 : 0.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh}>
                <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={isHovered ? 0.4 : 0.25} />
            </mesh>
        </Float>
    )
}

const UXShape = ({ isHovered, config }: { isHovered: boolean, config?: SkillShapeConfig }) => {
    const mesh = useRef<THREE.Mesh>(null)
    const baseScale = config?.scale?.[0] ?? 0.9
    const hoverScaleConst = config?.hoverScale?.[0] ?? 1.3

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * (isHovered ? 0.2 : 0.08)
            mesh.current.rotation.y += delta * (isHovered ? 0.2 : 0.08)

            const targetScale = isHovered ? hoverScaleConst : baseScale
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })
    return (
        <Float speed={isHovered ? 1.2 : 0.4} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh}>
                <icosahedronGeometry args={[1.3, 0]} />
                <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={isHovered ? 0.4 : 0.25} />
            </mesh>
        </Float>
    )
}

const CustomModel = ({ config, isHovered }: { config: SkillShapeConfig, isHovered: boolean }) => {
    const { scene } = useGLTF(config.object!)
    const group = useRef<THREE.Group>(null)

    // Default configs if not provided
    const baseScale = config.scale || [1, 1, 1]
    const activeScale = config.hoverScale || [1.3, 1.3, 1.3]
    const pos = config.position || [0, 0, 0]
    const rot = config.rotation || [0, 0, 0]

    // Determine target scale based on hover state
    const targetScale = isHovered ? activeScale : baseScale

    const wireframeScene = React.useMemo(() => {
        const cloned = scene.clone()
        cloned.traverse((child) => {
            if ((child as any).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.material = new THREE.MeshStandardMaterial({
                    color: "#ffffff",
                    wireframe: true,
                    transparent: true,
                    opacity: isHovered ? 0.4 : 0.25
                })
            }
        })
        return cloned
    }, [scene, isHovered])

    useFrame((state, delta) => {
        if (group.current) {
            // Slowly rotate the model continuously
            group.current.rotation.x += delta * (isHovered ? 0.3 : 0.1)
            group.current.rotation.y += delta * (isHovered ? 0.3 : 0.1)

            // Lerp scale towards target
            group.current.scale.lerp(new THREE.Vector3(...targetScale), 0.1)
        }
    })

    return (
        <Float speed={isHovered ? 1.5 : 0.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={group} position={pos} rotation={rot}>
                <primitive object={wireframeScene} />
            </group>
        </Float>
    )
}

const DevShape = ({ isHovered, config }: { isHovered: boolean, config?: SkillShapeConfig }) => {
    const mesh = useRef<THREE.Mesh>(null)
    const baseScale = config?.scale?.[0] ?? 0.9
    const hoverScaleConst = config?.hoverScale?.[0] ?? 1.3

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x -= delta * (isHovered ? 0.25 : 0.08)
            mesh.current.rotation.z += delta * (isHovered ? 0.25 : 0.08)

            const targetScale = isHovered ? hoverScaleConst : baseScale
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })
    return (
        <Float speed={isHovered ? 2 : 0.6} rotationIntensity={0.8} floatIntensity={0.8}>
            <mesh ref={mesh}>
                <octahedronGeometry args={[1.3, 0]} />
                <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={isHovered ? 0.4 : 0.25} />
            </mesh>
        </Float>
    )
}

const ThreeDScene = ({ index, isHovered, config }: { index: number, isHovered: boolean, config?: SkillShapeConfig }) => {
    return (
        <div className="absolute inset-0 pointer-events-none rounded-[40px] overflow-hidden w-full h-full" style={{ opacity: isHovered ? 0.8 : 0.5, transition: 'opacity 0.7s ease', zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }} resize={{ debounce: 0, scroll: false }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 10, 5]} intensity={2} />
                <directionalLight position={[-10, -10, -5]} intensity={1} />
                {config?.object ? (
                    <CustomModel config={config} isHovered={isHovered} />
                ) : (
                    <>
                        {index === 0 && <MotionShape isHovered={isHovered} />}
                        {index === 1 && <UXShape isHovered={isHovered} config={config} />}
                        {index === 2 && <DevShape isHovered={isHovered} config={config} />}
                    </>
                )}
            </Canvas>
        </div>
    )
}

const Skills = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: "-10%" })

    // -1 signifies all drawers are closed
    const [expandedIndex, setExpandedIndex] = useState<number>(-1)

    const drawerRefs = useRef<(HTMLDivElement | null)[]>([])

    const scrollDrawerIntoViewUpward = (index: number) => {
        const element = drawerRefs.current[index]
        if (!element || typeof window === 'undefined') return

        const duration = 420
        const offset = 92
        let startTime: number | null = null

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

        const animateScroll = (currentTime: number) => {
            if (startTime === null) startTime = currentTime

            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutCubic(progress)

            const currentY = window.scrollY
            const targetY = element.getBoundingClientRect().top + window.scrollY - offset

            // Scroll only upward to keep the user's reading position stable.
            if (targetY < currentY - 1) {
                const lerpStrength = 0.18 + eased * 0.16
                const nextY = currentY + (targetY - currentY) * lerpStrength
                window.scrollTo({ top: nextY, behavior: 'auto' })
            }

            if (progress < 1) {
                requestAnimationFrame(animateScroll)
            } else {
                const finalTargetY = element.getBoundingClientRect().top + window.scrollY - offset
                if (finalTargetY < window.scrollY - 1) {
                    window.scrollTo({ top: finalTargetY, behavior: 'auto' })
                }
            }
        }

        requestAnimationFrame(animateScroll)
    }

    const openDrawer = (index: number) => {
        setExpandedIndex(index)
        requestAnimationFrame(() => scrollDrawerIntoViewUpward(index))
    }

    const closeDrawer = () => {
        setExpandedIndex(-1)
    }

    return (
        <section
            ref={containerRef}
            className="bg-[#1C1D20] py-20 md:py-32 px-4 sm:px-8 md:px-12 lg:px-[96px] xl:px-[128px] relative w-full overflow-hidden"
        >
            <div className="max-w-[1380px] mx-auto relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-12 md:mb-20 flex justify-between items-end"
                >
                    <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-space-grotesk font-bold tracking-tight">
                        Technical<br />Skills
                    </h2>
                </motion.div>

                <div className="flex flex-col gap-3 md:gap-4">
                    {skills.map((skill, index) => {
                        const isExpanded = expandedIndex === index

                        return (
                            <motion.div
                                key={skill.num}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{
                                    duration: 0.8,
                                    delay: index * 0.15,
                                    ease: [0.32, 0.72, 0, 1]
                                }}
                                ref={(el) => {
                                    drawerRefs.current[index] = el
                                }}
                                className={`relative rounded-2xl md:rounded-[32px] overflow-hidden transition-colors duration-300 ${isExpanded ? 'bg-[#2A2C31]' : 'bg-[#24262A] hover:bg-[#2A2C31]'}`}
                            >
                                {/* Collapsed Header Area (Always visible) */}
                                <div className="flex items-center justify-between gap-4 md:gap-6 px-5 md:px-9 lg:px-12 py-5 md:py-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isExpanded) openDrawer(index)
                                        }}
                                        aria-expanded={isExpanded}
                                        aria-controls={`skill-panel-${index}`}
                                        className={`flex-1 min-w-0 text-left ${isExpanded ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        <div className="flex items-center gap-3 md:gap-7">
                                            <div className="font-space-grotesk font-medium text-neutral-500 text-sm md:text-base">
                                                {skill.num}
                                            </div>
                                            <h3 className="font-space-grotesk font-semibold tracking-tight text-xl md:text-2xl lg:text-[2.25rem] text-white leading-[1.08]">
                                                {skill.title}
                                                <span className="block md:inline text-neutral-300 md:ml-2">{skill.subtitle}</span>
                                            </h3>
                                        </div>
                                    </button>

                                    <motion.button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            if (isExpanded) {
                                                closeDrawer()
                                            } else {
                                                openDrawer(index)
                                            }
                                        }}
                                        animate={{ rotate: isExpanded ? 45 : 0 }}
                                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#353941] hover:bg-[#3F4450] flex items-center justify-center shrink-0 transition-colors"
                                        aria-label={`${isExpanded ? 'Close' : 'Open'} ${skill.title} ${skill.subtitle}`}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                        </svg>
                                    </motion.button>
                                </div>

                                {/* Expandable Content Area */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            id={`skill-panel-${index}`}
                                            key={`content-${skill.num}`}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{
                                                height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                                                opacity: { duration: 0.2 }
                                            }}
                                            className="overflow-hidden"
                                        >
                                            <div className="relative grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start px-5 md:px-9 lg:px-12 pb-9 md:pb-11">
                                                <div className="relative xl:col-span-4 2xl:col-span-3 h-[230px] sm:h-[280px] xl:h-[360px] 2xl:h-[380px] rounded-2xl md:rounded-3xl overflow-hidden bg-[#1A1B1F]">
                                                    <ThreeDScene index={index} isHovered={true} config={skill.shapeConfig} />
                                                </div>

                                                <div className="relative z-10 xl:col-span-8 2xl:col-span-9 flex flex-col gap-6 md:gap-7 w-full min-w-0">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
                                                        <p className="lg:col-span-8 font-inter text-neutral-200 text-sm md:text-[15px] lg:text-base leading-relaxed max-w-[72ch]">
                                                            {skill.description}
                                                        </p>

                                                        <div className="lg:col-span-4 rounded-2xl bg-white/[0.04] px-4 py-4 md:px-5 md:py-5">
                                                            <p className="text-neutral-400 font-space-grotesk text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em]">
                                                                Snapshot
                                                            </p>
                                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <p className="font-space-grotesk text-lg md:text-xl text-white leading-none">
                                                                        {skill.skillPills.length}
                                                                    </p>
                                                                    <p className="mt-1 text-neutral-400 font-inter text-xs md:text-[13px]">
                                                                        Core Methods
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-space-grotesk text-lg md:text-xl text-white leading-none">
                                                                        {skill.deliverables.length}
                                                                    </p>
                                                                    <p className="mt-1 text-neutral-400 font-inter text-xs md:text-[13px]">
                                                                        Deliverables
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 w-full">
                                                        <div className="lg:col-span-8 flex flex-col gap-4 min-w-0 rounded-2xl bg-white/[0.03] p-4 md:p-5">
                                                            <h4 className="text-neutral-400 font-space-grotesk text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em]">
                                                                Core Methods
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {skill.skillPills.map((pill, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-3 md:px-3.5 py-1.5 rounded-full bg-white/[0.08] text-neutral-100 text-xs md:text-[13px] font-inter whitespace-nowrap"
                                                                    >
                                                                        {pill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-4 flex flex-col gap-4 rounded-2xl bg-white/[0.03] p-4 md:p-5">
                                                            <h4 className="text-neutral-400 font-space-grotesk text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em]">
                                                                What I Build
                                                            </h4>
                                                            <ul className="flex flex-col gap-2.5">
                                                                {skill.deliverables.map((item, i) => (
                                                                    <li key={i} className="grid grid-cols-[10px_minmax(0,1fr)] gap-2.5 items-start text-neutral-200 font-inter text-sm md:text-[15px] leading-snug">
                                                                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default Skills
