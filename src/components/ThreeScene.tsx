import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Preload, useGLTF } from '@react-three/drei'

interface ThreeSceneProps {
    modelPath?: string
    height?: string
    className?: string
    autoRotate?: boolean
    preset?: "apartment" | "city" | "dawn" | "forest" | "lobby" | "night" | "park" | "studio" | "sunset" | "warehouse"
    scale?: number | [number, number, number]
    position?: [number, number, number]
    rotation?: [number, number, number]
}

// Subcomponent to load and display a real GLTF model
function Model({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }: { url: string, scale?: number | [number, number, number], position?: [number, number, number], rotation?: [number, number, number] }) {
    const { scene } = useGLTF(url)
    return <primitive object={scene} scale={scale} position={position} rotation={rotation} />
}

// Fallback demo shape when no model is provided
function DemoShape({ scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }: { scale?: number | [number, number, number], position?: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <mesh scale={scale} position={position} rotation={rotation}>
                <torusKnotGeometry args={[10, 3, 128, 32]} />
                <meshStandardMaterial
                    color="#00ECEB"
                    roughness={0.1}
                    metalness={0.8}
                    envMapIntensity={1}
                />
            </mesh>
        </Float>
    )
}

export default function ThreeScene({
    modelPath,
    height = '500px',
    className = '',
    autoRotate = true,
    preset = 'city',
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0]
}: ThreeSceneProps) {
    return (
        <div
            className={`w-full relative overflow-hidden bg-[#F5F5F7] shadow-xl shadow-black/10 ring-1 ring-black/5 rounded-2xl ${className}`}
            style={{ height }}
        >
            <Canvas
                shadows
                camera={{ position: [0, 0, 40], fov: 50 }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <Environment preset={preset} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

                    {modelPath ? (
                        <Model url={modelPath} scale={scale} position={position} rotation={rotation} />
                    ) : (
                        <DemoShape scale={scale} position={position} rotation={rotation} />
                    )}

                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        autoRotate={autoRotate}
                        autoRotateSpeed={1.5}
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                    <Preload all />
                </Suspense>
            </Canvas>

            {/* Optional watermark or interaction hint overlay */}
            <div className="absolute bottom-4 right-6 pointer-events-none opacity-40 font-mono text-xs text-black/50 tracking-widest">
                DRAG TO INTERACT
            </div>
        </div>
    )
}
