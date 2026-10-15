import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { AdditiveBlending, MathUtils } from 'three'
import DetailedModel from './DetailedModel'
import WindParticles from './WindParticles'

function WindTunnelScene({ selectedObject }) {
  return (
    <Canvas
      camera={{ position: [-4.6, 2.5, 5.8], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#05000b', 7, 16]} />

      <GalaxyBackdrop />
      <ResponsiveCamera />

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

      {(selectedObject.id === 'car' || selectedObject.id === 'wing') && (
        <Environment resolution={128} environmentIntensity={0.7}>
          <Lightformer intensity={3} position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 4, 1]} />
          <Lightformer intensity={2} position={[0, 1, 5]} rotation={[0, Math.PI, 0]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} position={[0, 2, -5]} scale={[8, 2, 1]} />
        </Environment>
      )}

      <TunnelFrame />
      <WindParticles selectedObjectId={selectedObject.id} />
      <AerodynamicObject selectedObject={selectedObject} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxDistance={14}
        minDistance={3.2}
      />
    </Canvas>
  )
}

function ResponsiveCamera() {
  const camera = useThree((state) => state.camera)
  const { width, height } = useThree((state) => state.size)

  useEffect(() => {
    const distanceScale = Math.max(1, height / width)
    camera.position.set(-4.6 * distanceScale, 2.5 * distanceScale, 5.8 * distanceScale)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, width, height])

  return null
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

  if (type === 'wing' || type === 'car') {
    return <DetailedModel type={type} color={color} />
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
