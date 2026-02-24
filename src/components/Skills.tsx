import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
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
}

const skills: Skill[] = [
    {
        num: "01",
        title: "Motion &",
        subtitle: "Brand Design",
        description: "Crafting kinetic identities and motion systems that breathe life into digital brands, blending typography and animation seamlessly.",
        shapeConfig: {
            object: "/assets/cursor-2.glb",
            scale: [1, 1, 1],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            hoverScale: [1.3, 1.3, 1.3]
        }
    },
    {
        num: "02",
        title: "UX/UI",
        subtitle: "Architecture",
        description: "Designing intuitive, accessible, and pixel-perfect interfaces. Focused on human-centered experiences that look stunning and convert.",
        shapeConfig: {
            scale: [0.9, 0.9, 0.9],
            hoverScale: [1.3, 1.3, 1.3]
        }
    },
    {
        num: "03",
        title: "Creative",
        subtitle: "Development",
        description: "Engineering robust, performant web applications. Turning high-end designs into reality using React, Next.js, and generative AI.",
        shapeConfig: {
            scale: [0.9, 0.9, 0.9],
            hoverScale: [1.3, 1.3, 1.3]
        }
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
        <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden w-full h-full" style={{ opacity: isHovered ? 0.8 : 0.5, transition: 'opacity 0.7s ease', zIndex: 0 }}>
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
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [isDesktop, setIsDesktop] = useState(true)

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
                                initial={{ opacity: 0, y: 30 }}
                                style={{
                                    transition: 'background-color 0.5s'
                                }}
                                animate={isInView ? {
                                    opacity: 1,
                                    y: 0,
                                    flex: isDesktop
                                        ? (isHovered ? 2 : (isAnyHovered ? 0.8 : 1))
                                        : undefined
                                } : {}}
                                transition={{
                                    duration: 0.6,
                                    ease: [0.32, 0.72, 0, 1],
                                    opacity: { duration: 0.8, delay: index * 0.1 },
                                    y: { duration: 0.8, delay: index * 0.1 },
                                    flex: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }
                                }}
                                className={`
                  relative group overflow-hidden rounded-3xl
                  flex flex-col justify-between p-8 md:p-10
                  border border-neutral-800
                  ${isHovered ? 'bg-[#2A2B2F]' : 'bg-[#1C1D20]'}
                  lg:h-full lg:min-w-[200px] h-[350px]
                `}
                            >
                                {/* Background Pattern / Hint */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent transition-opacity duration-500 z-10 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                                />

                                {/* 3D Canvas Background */}
                                <ThreeDScene index={index} isHovered={isHovered} config={skill.shapeConfig} />

                                {/* Top Section */}
                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="font-space-grotesk text-neutral-500 text-lg md:text-xl font-medium">
                                        {skill.num}
                                    </div>
                                </div>

                                {/* Bottom Section */}
                                <div className="relative z-10 w-[260px] sm:w-[320px] md:w-[380px] lg:w-[420px] xl:w-[460px]">
                                    <div className="mb-2 md:mb-4">
                                        <h3 className={`font-space-grotesk font-bold tracking-tight transition-all duration-500 origin-left whitespace-nowrap leading-[1.1] ${isHovered
                                            ? 'text-4xl md:text-5xl lg:text-6xl text-white'
                                            : 'text-3xl md:text-4xl lg:text-5xl text-white lg:text-neutral-300'
                                            }`}>
                                            {skill.title}<br />{skill.subtitle}
                                        </h3>
                                    </div>

                                    {/* Description (Expands on Hover) */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            opacity: hoveredIndex === null || isHovered ? (isDesktop ? (isHovered ? 1 : 0) : 1) : 0,
                                            height: hoveredIndex === null || isHovered ? (isDesktop ? (isHovered ? 'auto' : 0) : 'auto') : 0
                                        }}
                                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-2 md:pt-4 pb-2">
                                            <p className="font-inter text-neutral-400 text-base md:text-lg lg:text-xl">
                                                {skill.description}
                                            </p>
                                        </div>
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
