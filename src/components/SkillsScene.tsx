import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { type SkillShapeConfig } from '../lib/work-hubs'

// Three.js scene for the skills drawers. Kept in its own module so three/fiber/drei
// are only downloaded when a scene is actually rendered (see dynamic imports).
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

export default ThreeDScene
