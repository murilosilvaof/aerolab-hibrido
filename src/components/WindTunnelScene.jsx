import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AdditiveBlending, MathUtils } from 'three'
import WindParticles from './WindParticles'

function WindTunnelScene({ selectedObject }) {
  return (
    <Canvas
      camera={{ position: [4.2, 2.6, 5.6], fov: 45 }}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#05000b', 7, 16]} />

      <GalaxyBackdrop />

      <ambientLight intensity={0.48} />
      <directionalLight
        castShadow
        color="#ddd6fe"
        intensity={1.4}
        position={[4, 6, 4]}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight color="#c084fc" intensity={1.55} position={[-4, 1.4, 2]} />
      <pointLight color="#67e8f9" intensity={0.8} position={[3, -0.6, -3]} />

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
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]} castShadow>
      {/* Substitua estas geometrias por modelos reais carregados com useGLTF/useLoader.
          Exemplo futuro: <primitive object={gltf.scene} scale={...} /> */}
      <ObjectGeometry selectedObject={selectedObject} />
    </group>
  )
}

function ObjectGeometry({ selectedObject }) {
  const { color, id: type } = selectedObject

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
    return <AirplaneModel color={color} />
  }

  if (type === 'car') {
    return (
      <group>
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
          <meshStandardMaterial color="#d946ef" roughness={0.34} />
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

function AirplaneModel({ color }) {
  return (
    <group rotation={[0, 0, -0.08]} scale={1.05}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.34, 3.05, 48]} />
        <meshStandardMaterial color={color} metalness={0.24} roughness={0.34} />
      </mesh>

      <mesh
        position={[-1.82, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[0.34, 0.72, 48]} />
        <meshStandardMaterial
          color="#f5d0fe"
          metalness={0.18}
          roughness={0.3}
        />
      </mesh>

      <mesh
        position={[1.72, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[0.25, 0.42, 40]} />
        <meshStandardMaterial
          color="#7c3aed"
          metalness={0.2}
          roughness={0.38}
        />
      </mesh>

      <mesh position={[-0.58, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.08, 0.5]} />
        <meshStandardMaterial
          color="#f5d0fe"
          metalness={0.06}
          roughness={0.24}
        />
      </mesh>

      <mesh position={[-0.15, -0.03, -1.08]} rotation={[0, -0.08, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.08, 1.75]} />
        <meshStandardMaterial
          color="#a78bfa"
          metalness={0.22}
          roughness={0.34}
        />
      </mesh>

      <mesh position={[-0.15, -0.03, 1.08]} rotation={[0, 0.08, -0.03]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.08, 1.75]} />
        <meshStandardMaterial
          color="#a78bfa"
          metalness={0.22}
          roughness={0.34}
        />
      </mesh>

      <mesh position={[1.28, 0.02, -0.48]} rotation={[0, -0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.06, 0.96]} />
        <meshStandardMaterial
          color="#c084fc"
          metalness={0.18}
          roughness={0.38}
        />
      </mesh>

      <mesh position={[1.28, 0.02, 0.48]} rotation={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.06, 0.96]} />
        <meshStandardMaterial
          color="#c084fc"
          metalness={0.18}
          roughness={0.38}
        />
      </mesh>

      <mesh position={[1.36, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.9, 0.08]} />
        <meshStandardMaterial
          color="#9333ea"
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>

      {[-0.68, 0.68].map((z) => (
        <mesh
          key={z}
          position={[-0.18, -0.23, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
          <meshStandardMaterial
            color="#6d28d9"
            metalness={0.22}
            roughness={0.42}
          />
        </mesh>
      ))}

      {[-0.32, -0.02, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.18, -0.26]} castShadow receiveShadow>
          <sphereGeometry args={[0.055, 16, 8]} />
          <meshStandardMaterial
            color="#bae6fd"
            emissive="#38bdf8"
            emissiveIntensity={0.4}
            metalness={0.05}
            roughness={0.22}
          />
        </mesh>
      ))}

      <mesh position={[-0.15, -0.06, -2]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.22]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.35} />
      </mesh>

      <mesh position={[-0.15, -0.06, 2]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.06, 0.22]} />
        <meshStandardMaterial color="#f0abfc" emissive="#c026d3" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

function TunnelFrame() {
  return (
    <group>
      <gridHelper args={[12, 12, '#7e22ce', '#14051f']} position={[0, -1.7, 0]} />
      {[-5.5, -2.75, 0, 2.75, 5.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.95, 0.012, 8, 96]} />
          <meshBasicMaterial color="#7e22ce" transparent opacity={0.5} />
        </mesh>
      ))}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.72, 0]}>
        <planeGeometry args={[14, 5]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </group>
  )
}

function randomUnit(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453

  return value - Math.floor(value)
}

function GalaxyBackdrop() {
  const galaxy = useMemo(() => {
    const starCount = 900
    const spiralCount = 620
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    const spiralPositions = new Float32Array(spiralCount * 3)
    const spiralColors = new Float32Array(spiralCount * 3)

    for (let index = 0; index < starCount; index += 1) {
      const radius = 8 + randomUnit(index + 1) * 7
      const theta = randomUnit(index + 2) * Math.PI * 2
      const phi = Math.acos(2 * randomUnit(index + 3) - 1)
      const cursor = index * 3
      const brightness = 0.55 + randomUnit(index + 4) * 0.45

      starPositions[cursor] = radius * Math.sin(phi) * Math.cos(theta)
      starPositions[cursor + 1] = radius * Math.cos(phi) * 0.58
      starPositions[cursor + 2] = radius * Math.sin(phi) * Math.sin(theta)
      starColors[cursor] = brightness
      starColors[cursor + 1] = brightness * (0.82 + randomUnit(index + 5) * 0.18)
      starColors[cursor + 2] = 1
    }

    for (let index = 0; index < spiralCount; index += 1) {
      const cursor = index * 3
      const arm = index % 3
      const radius = randomUnit(index + 11) ** 0.58 * 5.6
      const angle =
        radius * 1.15 +
        arm * ((Math.PI * 2) / 3) +
        (randomUnit(index + 12) - 0.5) * 0.7
      const haze = randomUnit(index + 13)

      spiralPositions[cursor] = Math.cos(angle) * radius
      spiralPositions[cursor + 1] = (randomUnit(index + 14) - 0.5) * 1.05
      spiralPositions[cursor + 2] = Math.sin(angle) * radius
      spiralColors[cursor] = 0.45 + haze * 0.35
      spiralColors[cursor + 1] = 0.22 + haze * 0.2
      spiralColors[cursor + 2] = 0.85 + haze * 0.15
    }

    return { spiralColors, spiralPositions, starColors, starPositions }
  }, [])

  return (
    <group renderOrder={-10}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[galaxy.starPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[galaxy.starColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={0.78}
          size={0.026}
          sizeAttenuation
          transparent
          vertexColors
        />
      </points>

      <points frustumCulled={false} position={[0, 0.1, -5.8]} rotation={[0.28, 0, 0.18]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[galaxy.spiralPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[galaxy.spiralColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={0.5}
          size={0.052}
          sizeAttenuation
          transparent
          vertexColors
        />
      </points>
    </group>
  )
}

export default WindTunnelScene
