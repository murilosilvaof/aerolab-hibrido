import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const PARTICLE_COUNT = 96
const TUNNEL_LENGTH = 13
const STREAM_LENGTH = 0.48

function createStreams() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const row = index % 12
    const layer = Math.floor(index / 12) % 8
    const stagger = ((index * 37) % PARTICLE_COUNT) / PARTICLE_COUNT

    return {
      x: -TUNNEL_LENGTH / 2 + stagger * TUNNEL_LENGTH,
      y: (row - 5.5) * 0.28,
      z: (layer - 3.5) * 0.22,
      speed: 1.35 + (index % 5) * 0.08,
      phase: index * 0.71,
    }
  })
}

function WindParticles({ selectedObjectId }) {
  const geometryRef = useRef(null)
  const streams = useMemo(() => createStreams(), [])
  const positions = useMemo(
    () => new Float32Array(PARTICLE_COUNT * 2 * 3),
    [],
  )

  useFrame(({ clock }, delta) => {
    const geometry = geometryRef.current

    if (!geometry) {
      return
    }

    const elapsed = clock.getElapsedTime()
    const array = geometry.attributes.position.array
    const wakeStrength = selectedObjectId === 'cube' ? 0.14 : 0.04

    streams.forEach((stream, index) => {
      stream.x += stream.speed * delta

      if (stream.x > TUNNEL_LENGTH / 2) {
        stream.x = -TUNNEL_LENGTH / 2
      }

      const isBehindObject = stream.x > 0.25 && stream.x < 3
      const wake =
        isBehindObject && selectedObjectId !== 'wing'
          ? Math.sin(elapsed * 6 + stream.phase) * wakeStrength
          : 0
      const y = stream.y + wake
      const z = stream.z + wake * 0.35
      const cursor = index * 6

      array[cursor] = stream.x - STREAM_LENGTH
      array[cursor + 1] = y
      array[cursor + 2] = z
      array[cursor + 3] = stream.x
      array[cursor + 4] = y
      array[cursor + 5] = z
    })

    geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#7dd3fc"
        opacity={0.58}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  )
}

export default WindParticles
