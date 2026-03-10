import React, { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, useGLTF } from '@react-three/drei'
import Link from 'next/link'
import * as THREE from 'three'
import { type WorkHubContent } from '../lib/work-hub-content'
import { type SkillShapeConfig, WORK_HUB_SLUGS } from '../lib/work-hubs'

interface Skill {
    slug: 'design' | 'ux-ui' | 'development'
    num: string
    title: string
    subtitle: string
    description: string
    navLabel: string
    shapeConfig?: SkillShapeConfig
    skillPills: string[]
    deliverables: string[]
    canvasSpeed: number
}

const MotionShape = ({
    isHovered,
    config,
    color,
    speedMultiplier
}: {
    isHovered: boolean
    config?: SkillShapeConfig
    color: string
    speedMultiplier: number
}) => {
    const mesh = useRef<THREE.Mesh>(null)
    const baseScale = config?.scale?.[0] ?? 1.0
    const hoverScaleConst = config?.hoverScale?.[0] ?? 1.4

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * (isHovered ? 0.3 : 0.1) * speedMultiplier
            mesh.current.rotation.y += delta * (isHovered ? 0.3 : 0.1) * speedMultiplier

            // Lerp scale
            const targetScale = isHovered ? hoverScaleConst : baseScale
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })
    return (
        <Float speed={(isHovered ? 1.5 : 0.5) * speedMultiplier} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh}>
                <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                <meshStandardMaterial color={color} wireframe={true} transparent opacity={isHovered ? 0.4 : 0.25} />
            </mesh>
        </Float>
    )
}

const UXShape = ({
    isHovered,
    config,
    color,
    speedMultiplier
}: {
    isHovered: boolean
    config?: SkillShapeConfig
    color: string
    speedMultiplier: number
}) => {
    const mesh = useRef<THREE.Mesh>(null)
    const baseScale = config?.scale?.[0] ?? 0.9
    const hoverScaleConst = config?.hoverScale?.[0] ?? 1.3

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * (isHovered ? 0.2 : 0.08) * speedMultiplier
            mesh.current.rotation.y += delta * (isHovered ? 0.2 : 0.08) * speedMultiplier

            const targetScale = isHovered ? hoverScaleConst : baseScale
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })
    return (
        <Float speed={(isHovered ? 1.2 : 0.4) * speedMultiplier} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh}>
                <icosahedronGeometry args={[1.3, 0]} />
                <meshStandardMaterial color={color} wireframe={true} transparent opacity={isHovered ? 0.4 : 0.25} />
            </mesh>
        </Float>
    )
}

const CustomModel = ({
    config,
    isHovered,
    color,
    speedMultiplier,
    onReady
}: {
    config: SkillShapeConfig
    isHovered: boolean
    color: string
    speedMultiplier: number
    onReady?: () => void
}) => {
    const { scene } = useGLTF(config.object!)
    const group = useRef<THREE.Group>(null)
    const hasSignaledReady = useRef(false)

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
                    color,
                    wireframe: true,
                    transparent: true,
                    opacity: isHovered ? 0.4 : 0.25
                })
            }
        })
        return cloned
    }, [scene, isHovered, color])

    React.useEffect(() => {
        if (hasSignaledReady.current) return
        hasSignaledReady.current = true
        onReady?.()
    }, [wireframeScene, onReady])

    useFrame((state, delta) => {
        if (group.current) {
            // Slowly rotate the model continuously
            group.current.rotation.x += delta * (isHovered ? 0.3 : 0.1) * speedMultiplier
            group.current.rotation.y += delta * (isHovered ? 0.3 : 0.1) * speedMultiplier

            // Lerp scale towards target
            group.current.scale.lerp(new THREE.Vector3(...targetScale), 0.1)
        }
    })

    return (
        <Float speed={(isHovered ? 1.5 : 0.5) * speedMultiplier} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={group} position={pos} rotation={rot}>
                <primitive object={wireframeScene} />
            </group>
        </Float>
    )
}

const DevShape = ({
    isHovered,
    config,
    color,
    speedMultiplier
}: {
    isHovered: boolean
    config?: SkillShapeConfig
    color: string
    speedMultiplier: number
}) => {
    const mesh = useRef<THREE.Mesh>(null)
    const baseScale = config?.scale?.[0] ?? 0.9
    const hoverScaleConst = config?.hoverScale?.[0] ?? 1.3

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x -= delta * (isHovered ? 0.25 : 0.08) * speedMultiplier
            mesh.current.rotation.z += delta * (isHovered ? 0.25 : 0.08) * speedMultiplier

            const targetScale = isHovered ? hoverScaleConst : baseScale
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })
    return (
        <Float speed={(isHovered ? 2 : 0.6) * speedMultiplier} rotationIntensity={0.8} floatIntensity={0.8}>
            <mesh ref={mesh}>
                <octahedronGeometry args={[1.3, 0]} />
                <meshStandardMaterial color={color} wireframe={true} transparent opacity={isHovered ? 0.4 : 0.25} />
            </mesh>
        </Float>
    )
}

interface ThreeDSceneProps {
    index: number
    isHovered: boolean
    config?: SkillShapeConfig
    color?: string
    overscan?: number
    allowOverflow?: boolean
    opacity?: number
    speedMultiplier?: number
    interactive?: boolean
}

export const ThreeDScene = ({
    index,
    isHovered,
    config,
    color = '#ffffff',
    overscan = 0,
    allowOverflow = false,
    opacity,
    speedMultiplier = 1,
    interactive = true
}: ThreeDSceneProps) => {
    const expandedSize = `${100 + overscan * 2}%`
    const expandedOffset = `${-overscan}%`
    const sceneOpacity = opacity ?? (isHovered ? 0.8 : 0.5)
    const normalizedSpeed = Math.max(speedMultiplier, 0.05)
    const [isSceneReady, setIsSceneReady] = React.useState(false)

    React.useEffect(() => {
        setIsSceneReady(false)
    }, [config?.object, index, color])

    React.useEffect(() => {
        if (config?.object) return
        const rafId = requestAnimationFrame(() => setIsSceneReady(true))
        return () => cancelAnimationFrame(rafId)
    }, [config?.object, index])

    React.useEffect(() => {
        if (!config?.object) return
        const fallbackTimer = window.setTimeout(() => setIsSceneReady(true), 1400)
        return () => window.clearTimeout(fallbackTimer)
    }, [config?.object])

    const handleModelReady = React.useCallback(() => {
        setIsSceneReady(true)
    }, [])
    const interactiveClass = interactive && isSceneReady ? 'pointer-events-auto' : 'pointer-events-none'
    const revealedOpacity = isSceneReady ? sceneOpacity : 0
    const revealedScale = isSceneReady ? 1 : 0.985

    return (
        <div
            className={`absolute inset-0 w-full h-full ${interactiveClass} ${
                allowOverflow ? 'overflow-visible rounded-none' : 'rounded-[40px] overflow-hidden'
            }`}
            style={{
                opacity: revealedOpacity,
                transform: `scale(${revealedScale})`,
                transition: 'opacity 520ms ease, transform 620ms cubic-bezier(0.22, 1, 0.36, 1)',
                zIndex: 0
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                style={{ width: expandedSize, height: expandedSize, display: 'block', position: 'absolute', top: expandedOffset, left: expandedOffset }}
                resize={{ debounce: 0, scroll: false }}
                gl={{ alpha: true, antialias: true }}
                onCreated={({ gl }) => gl.setClearColor(new THREE.Color('#000000'), 0)}
            >
                <ambientLight intensity={1} />
                <directionalLight position={[10, 10, 5]} intensity={2} />
                <directionalLight position={[-10, -10, -5]} intensity={1} />
                <React.Suspense fallback={null}>
                    {config?.object ? (
                        <CustomModel
                            config={config}
                            isHovered={isHovered}
                            color={color}
                            speedMultiplier={normalizedSpeed}
                            onReady={handleModelReady}
                        />
                    ) : (
                        <>
                            {index === 0 && <MotionShape isHovered={isHovered} config={config} color={color} speedMultiplier={normalizedSpeed} />}
                            {index === 1 && <UXShape isHovered={isHovered} config={config} color={color} speedMultiplier={normalizedSpeed} />}
                            {index === 2 && <DevShape isHovered={isHovered} config={config} color={color} speedMultiplier={normalizedSpeed} />}
                        </>
                    )}
                </React.Suspense>
                {interactive && (
                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        enableDamping={true}
                        dampingFactor={0.1}
                        rotateSpeed={0.8}
                    />
                )}
            </Canvas>
        </div>
    )
}

interface SkillsProps {
    hubContent: WorkHubContent[]
}

const Skills = ({ hubContent }: SkillsProps) => {
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

    const skills = React.useMemo<Skill[]>(() => {
        const contentBySlug = Object.fromEntries(hubContent.map((hub) => [hub.slug, hub])) as Record<Skill['slug'], WorkHubContent>

        return WORK_HUB_SLUGS.reduce<Skill[]>((acc, slug, index) => {
                const hub = contentBySlug[slug]
                if (!hub) return acc

                acc.push({
                    slug,
                    num: String(index + 1).padStart(2, '0'),
                    title: hub.skillsTitle,
                    subtitle: hub.skillsSubtitle,
                    description: hub.description,
                    navLabel: hub.navLabel,
                    shapeConfig: hub.shapeConfig,
                    skillPills: hub.coreMethods,
                    deliverables: hub.deliverables,
                    canvasSpeed: hub.canvasSpeed,
                })

                return acc
            }, [])
    }, [hubContent])

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
                                            <div className="font-space-grotesk font-medium text-[#939393] text-sm md:text-base">
                                                {skill.num}
                                            </div>
                                            <h3 className="font-space-grotesk font-semibold tracking-tight text-xl md:text-2xl lg:text-[2.25rem] text-white leading-[1.08]">
                                                {skill.title}
                                                {skill.subtitle && (
                                                    <span className="block md:inline text-neutral-300 md:ml-2">{skill.subtitle}</span>
                                                )}
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
                                                    <ThreeDScene
                                                        index={index}
                                                        isHovered={true}
                                                        config={skill.shapeConfig}
                                                        speedMultiplier={skill.canvasSpeed}
                                                    />
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
                                                            <Link
                                                                href={`/work/${skill.slug}`}
                                                                className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10"
                                                            >
                                                                Explore {skill.navLabel} Hub
                                                                <span aria-hidden="true">↗</span>
                                                            </Link>
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
