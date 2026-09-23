import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MathUtils } from 'three'
import WindParticles from './WindParticles'

function WindTunnelScene({ selectedObject }) {
  return (
    <Canvas
      camera={{ position: [4.2, 2.6, 5.6], fov: 45 }}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 7, 15]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={1.35}
        position={[4, 6, 4]}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight color="#67e8f9" intensity={1.4} position={[-4, 1, 2]} />

      <TunnelFrame />
      <WindParticles selectedObjectId={selectedObject.id} />
      <AerodynamicObject selectedObject={selectedObject} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxDistance={9}
        minDistance={3.2}
      />
    </Canvas>
  )
}

function AerodynamicObject({ selectedObject }) {
  const groupRef = useRef(null)

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.setScalar(0.72)
    }
  }, [selectedObject.id])

  useFrame((_, delta) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    group.scale.setScalar(MathUtils.lerp(group.scale.x, 1, delta * 5))
    group.rotation.y += delta * 0.2
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]} castShadow>
      {/* Substitua estas geometrias por modelos reais carregados com useGLTF/useLoader.
          Exemplo futuro: <primitive object={gltf.scene} scale={...} /> */}
      <ObjectGeometry type={selectedObject.id} color={selectedObject.color} />
    </group>
  )
}

function ObjectGeometry({ type, color }) {
  if (type === 'sphere') {
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.95, 64, 64]} />
        <meshStandardMaterial
          color={color}
          metalness={0.15}
          roughness={0.38}
        />
      </mesh>
    )
  }

  if (type === 'wing') {
    return (
      <group rotation={[0, 0, -0.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.1, 0.22, 1.05]} />
          <meshStandardMaterial
            color={color}
            metalness={0.22}
            roughness={0.32}
          />
        </mesh>
        <mesh position={[-1.65, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.18, 32, 16]} />
          <meshStandardMaterial
            color="#fde68a"
            metalness={0.15}
            roughness={0.42}
          />
        </mesh>
      </group>
    )
  }

  if (type === 'car') {
    return (
      <group rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.35, 0.48, 1.05]} />
          <meshStandardMaterial
            color={color}
            metalness={0.18}
            roughness={0.36}
          />
        </mesh>
        <mesh position={[-0.25, 0.58, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.48, 0.82]} />
          <meshStandardMaterial color="#fb7185" roughness={0.34} />
        </mesh>
        {[-0.72, 0.72].map((x) =>
          [-0.56, 0.56].map((z) => (
            <mesh
              key={`${x}-${z}`}
              position={[x, -0.16, z]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.22, 0.22, 0.16, 32]} />
              <meshStandardMaterial color="#0f172a" roughness={0.55} />
            </mesh>
          )),
        )}
      </group>
    )
  }

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.55, 1.55, 1.55]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.45} />
    </mesh>
  )
}

function TunnelFrame() {
  return (
    <group>
      <gridHelper args={[12, 12, '#155e75', '#0f172a']} position={[0, -1.7, 0]} />
      {[-5.5, -2.75, 0, 2.75, 5.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.95, 0.012, 8, 96]} />
          <meshBasicMaterial color="#164e63" transparent opacity={0.55} />
        </mesh>
      ))}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.72, 0]}>
        <planeGeometry args={[14, 5]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </group>
  )
}

export default WindTunnelScene
