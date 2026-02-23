import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Preload, useGLTF } from '@react-three/drei'

interface ThreeSceneProps {
    modelPath?: string
    height?: string
    className?: string
    autoRotate?: boolean
    preset?: "apartment" | "city" | "dawn" | "forest" | "lobby" | "night" | "park" | "studio" | "sunset" | "warehouse"
}

// Subcomponent to load and display a real GLTF model
function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url)
    return <primitive object={scene} />
}

// Fallback demo shape when no model is provided
function DemoShape() {
    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <mesh>
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
    preset = 'city'
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
                        <Model url={modelPath} />
                    ) : (
                        <DemoShape />
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
