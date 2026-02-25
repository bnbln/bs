import React, { useRef, useState, useEffect } from 'react'
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

    // Store refs for each drawer to handle scroll toggling
    const drawerRefs = useRef<(HTMLDivElement | null)[]>([])

    const handleToggle = (index: number) => {
        const isCurrentlyExpanded = expandedIndex === index
        setExpandedIndex(isCurrentlyExpanded ? -1 : index)

        // If we are opening a drawer, smoothly scroll to it dynamically tracking its
        // position over the course of the exact 600ms layout animation.
        if (!isCurrentlyExpanded) {
            const element = drawerRefs.current[index]
            if (element) {
                const startY = window.scrollY;
                const duration = 600; // Matches framer-motion transition
                let startTime: number | null = null;

                const animateScroll = (currentTime: number) => {
                    if (startTime === null) startTime = currentTime;
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Smooth easeOut cubic curve
                    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
                    const easedProgress = easeOut(progress);

                    // Re-calculate target Y dynamically every frame as the layout above shrinks
                    const targetY = element.getBoundingClientRect().top + window.scrollY - 100;

                    // Interpolate between start and a moving target
                    const nextY = startY + (targetY - startY) * easedProgress;
                    window.scrollTo({ top: nextY, behavior: 'auto' });

                    if (progress < 1) {
                        requestAnimationFrame(animateScroll);
                    } else {
                        // Final precision snap
                        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 100, behavior: 'auto' });
                    }
                }

                requestAnimationFrame(animateScroll);
            }
        }
    }

    return (
        <section
            ref={containerRef}
            className="bg-[#1C1D20] py-24 md:py-40 px-4 sm:px-8 md:px-12 lg:px-[100px] xl:px-[140px] relative w-full overflow-hidden"
        >
            <div className="max-w-[1400px] mx-auto relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-16 md:mb-32 flex justify-between items-end"
                >
                    <h2 className="text-white text-4xl md:text-5xl lg:text-7xl font-space-grotesk font-bold tracking-tight">
                        Technical<br />Skills
                    </h2>
                </motion.div>

                <div className="flex flex-col gap-4 md:gap-6">
                    {skills.map((skill, index) => {
                        const isExpanded = expandedIndex === index;

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
                                ref={(el) => { drawerRefs.current[index] = el }}
                                className={`relative rounded-3xl md:rounded-[40px] border border-neutral-800/80 bg-[#1C1D20]/80 overflow-hidden group transition-colors duration-500 ${isExpanded ? 'hover:border-neutral-700' : 'hover:border-neutral-600 cursor-pointer'}`}
                                onClick={() => handleToggle(index)}
                            >
                                {/* Collapsed Header Area (Always visible) */}
                                <div className={`flex items-center justify-between px-6 md:px-12 lg:px-16 transition-all duration-500 ${isExpanded ? 'pt-10 md:pt-14 pb-4 md:pb-6' : 'py-6 md:py-8'}`}>
                                    <div className="flex items-center gap-6 md:gap-12">
                                        <div className={`font-space-grotesk font-medium transition-colors duration-300 ${isExpanded ? 'text-neutral-500 text-xl' : 'text-neutral-400 text-lg md:text-xl'}`}>
                                            {skill.num}
                                        </div>
                                        <h3 className={`font-space-grotesk font-bold tracking-tight transition-all duration-300 ${isExpanded ? 'text-3xl md:text-4xl lg:text-5xl text-white' : 'text-2xl md:text-3xl text-neutral-300 group-hover:text-white'}`}>
                                            {skill.title} {skill.subtitle}
                                        </h3>
                                    </div>

                                    {/* Expand/Collapse Icon */}
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 45 : 0 }}
                                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-neutral-700 flex items-center justify-center shrink-0"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </motion.div>
                                </div>

                                {/* Expandable Content Area */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                            className="overflow-hidden"
                                        >
                                            {/* We apply the bottom padding HERE inside the animated layout, so it collapses to 0 height gracefully */}
                                            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start px-6 md:px-12 lg:px-16 pb-10 md:pb-14 mt-4 md:mt-6">

                                                {/* 3D Canvas Background (Left Column) */}
                                                <div className="relative col-span-1 lg:col-span-5 h-[300px] sm:h-[400px] lg:h-full lg:min-h-[450px] rounded-3xl overflow-hidden bg-[#151618]">
                                                    <ThreeDScene index={index} isHovered={true} config={skill.shapeConfig} />
                                                </div>

                                                {/* Content Details (Right Column) */}
                                                <div className="relative z-10 col-span-1 lg:col-span-7 flex flex-col gap-10 lg:gap-12 w-full">
                                                    <p className="font-inter text-neutral-400 text-lg md:text-xl leading-relaxed max-w-[600px]">
                                                        {skill.description}
                                                    </p>

                                                    <div className="flex flex-col xl:flex-row gap-12 lg:gap-8 pt-8 border-t border-neutral-800/50 w-full">
                                                        {/* Core Skills (Pills) */}
                                                        <div className="flex flex-col gap-5 w-full xl:w-1/2">
                                                            <h4 className="text-white font-space-grotesk text-sm md:text-base font-semibold uppercase tracking-widest text-neutral-400">
                                                                Core Methods
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {skill.skillPills.map((pill, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-neutral-800 bg-[#2A2B2F]/40 backdrop-blur-sm text-neutral-300 text-xs md:text-sm font-inter whitespace-nowrap"
                                                                    >
                                                                        {pill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Deliverables */}
                                                        <div className="flex flex-col gap-5 w-full xl:w-1/2">
                                                            <h4 className="text-white font-space-grotesk text-sm md:text-base font-semibold uppercase tracking-widest text-neutral-400">
                                                                What I Build
                                                            </h4>
                                                            <ul className="flex flex-col gap-2.5">
                                                                {skill.deliverables.map((item, i) => (
                                                                    <li key={i} className="flex gap-3 items-start text-neutral-300 font-inter text-sm md:text-base leading-snug">
                                                                        <svg className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
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
