import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'

type PointerPosition = { x: number; y: number }

function Artifact({ pointerRef, finePointer }: { pointerRef: RefObject<PointerPosition>; finePointer: boolean }) {
  const group = useRef<{ rotation: { x: number; y: number }; position: { y: number } } | null>(null)
  const lastFrame = useRef(0)
  useFrame(({ clock, invalidate }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    const pointer = pointerRef.current
    if (t - lastFrame.current < 1 / 30) { setTimeout(invalidate, 33); return }
    lastFrame.current = t
    group.current.rotation.y += ((pointer.x * .16 + t * .055) - group.current.rotation.y) * .025
    group.current.rotation.x += ((-.16 + pointer.y * .08) - group.current.rotation.x) * .025
    group.current.position.y = Math.sin(t * .45) * .055
    setTimeout(invalidate, 33)
  })
  return <group ref={group} rotation={[.12, -.3, -.12]} scale={finePointer ? 1 : .91}>
    <mesh rotation={[.32, 0, .68]}>
      <torusGeometry args={[1.13, .24, 32, 160]} />
      <meshPhysicalMaterial color="#d9dce0" roughness={.14} metalness={.92} clearcoat={1} clearcoatRoughness={.08} />
    </mesh>
    <mesh rotation={[1.14, .42, -.2]} scale={[.72, .72, .72]}>
      <torusGeometry args={[1.12, .19, 28, 128]} />
      <meshPhysicalMaterial color="#aeb4bb" metalness={.95} roughness={.17} clearcoat={1} clearcoatRoughness={.1} />
    </mesh>
    <mesh rotation={[.4, -.6, 1.13]} scale={[.39, .39, .39]}>
      <torusGeometry args={[1.1, .13, 24, 96]} />
      <meshStandardMaterial color="#7c838b" metalness={1} roughness={.2} />
    </mesh>
    <mesh position={[0, 0, .03]} scale={.27}>
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial color="#a9b0b8" metalness={.98} roughness={.13} />
    </mesh>
  </group>
}

export default function Scene({ pointerRef, finePointer, onReady }: { pointerRef: RefObject<PointerPosition>; finePointer: boolean; onReady: () => void }) {
  return <Canvas className="scene-canvas" onCreated={onReady} dpr={[1, finePointer ? 1.2 : 1]} camera={{ position: [0, 0, 5.4], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} frameloop="demand">
    <ambientLight intensity={.22} />
    <spotLight position={[4, 4, 5]} intensity={90} angle={.32} penumbra={1} color="#fff5e8" />
    <pointLight position={[-4, 1, -2]} intensity={38} color="#89a6c5" />
    <pointLight position={[0, -4, 2]} intensity={24} color="#ffffff" />
    <Artifact pointerRef={pointerRef} finePointer={finePointer} />
  </Canvas>
}
