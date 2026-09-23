import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'

const PARTICLE_COUNT = 168
const TUNNEL_LENGTH = 13
const STREAM_LENGTH = 0.5

const FLOW_PROFILES = {
  cube: {
    halfLength: 0.84,
    radiusY: 0.9,
    radiusZ: 0.9,
    influence: 1.45,
    wakeLength: 3.8,
    wakeStrength: 0.19,
    shape: 'box',
  },
  sphere: {
    halfLength: 0.98,
    radiusY: 1.02,
    radiusZ: 1.02,
    influence: 1.25,
    wakeLength: 3.1,
    wakeStrength: 0.1,
    shape: 'round',
  },
  wing: {
    halfLength: 1.72,
    radiusY: 0.34,
    radiusZ: 0.66,
    influence: 1.05,
    wakeLength: 2.5,
    wakeStrength: 0.035,
    shape: 'round',
    liftBias: 0.2,
  },
  car: {
    halfLength: 1.24,
    radiusY: 0.82,
    radiusZ: 0.64,
    centerY: 0.16,
    influence: 1.35,
    wakeLength: 3.4,
    wakeStrength: 0.12,
    shape: 'car',
  },
}

function createStreams() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const row = index % 14
    const layer = Math.floor(index / 14) % 12
    const stagger = ((index * 43) % PARTICLE_COUNT) / PARTICLE_COUNT

    return {
      x: -TUNNEL_LENGTH / 2 + stagger * TUNNEL_LENGTH,
      y: (row - 6.5) * 0.235,
      z: (layer - 5.5) * 0.18,
      speed: 1.35 + (index % 6) * 0.075,
      phase: index * 0.73,
    }
  })
}

function smoothstep(edge0, edge1, value) {
  const amount = MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function getSurfaceFactor(x, profile) {
  const normalizedX = Math.abs(x) / profile.halfLength

  if (profile.shape === 'box') {
    return 1 - smoothstep(0.78, 1.12, normalizedX)
  }

  if (profile.shape === 'car') {
    const roundedBody = Math.sqrt(Math.max(0, 1 - normalizedX ** 2))
    const noseTaper = x < 0 ? 0.86 + normalizedX * 0.14 : 1
    return roundedBody * noseTaper
  }

  return Math.sqrt(Math.max(0, 1 - normalizedX ** 2))
}

function sampleFlow(stream, x, profile, elapsed) {
  const centerY = profile.centerY ?? 0
  const relativeY = stream.y - centerY
  const normalizedRadius = Math.sqrt(
    (relativeY / profile.radiusY) ** 2 +
      (stream.z / profile.radiusZ) ** 2,
  )
  const affectedStream = normalizedRadius < profile.influence
  let y = stream.y
  let z = stream.z

  if (affectedStream) {
    const surface = getSurfaceFactor(x, profile)
    const upstream = smoothstep(-2.5, -profile.halfLength * 0.35, x)
    const downstream = 1 - smoothstep(profile.halfLength * 0.2, 2.25, x)
    const contourWeight = x < 0 ? upstream : downstream
    const targetRadius = surface * 1.08
    const displacement = Math.max(0, targetRadius - normalizedRadius)
    const centerLine = normalizedRadius < 0.055
    const directionY = centerLine
      ? Math.sin(stream.phase) >= 0
        ? 1
        : -1
      : relativeY / (normalizedRadius * profile.radiusY)
    const directionZ = centerLine
      ? Math.cos(stream.phase)
      : stream.z / (normalizedRadius * profile.radiusZ)
    const directionLength = Math.hypot(directionY, directionZ) || 1

    y +=
      (directionY / directionLength) *
      displacement *
      profile.radiusY *
      contourWeight
    z +=
      (directionZ / directionLength) *
      displacement *
      profile.radiusZ *
      contourWeight
  }

  const wakeStart = profile.halfLength * 0.72
  const wakeProgress = (x - wakeStart) / profile.wakeLength

  if (affectedStream && wakeProgress > 0 && wakeProgress < 1) {
    const fade = (1 - wakeProgress) ** 1.35
    const centerWeight = Math.max(0, 1 - normalizedRadius / profile.influence)
    const oscillation =
      Math.sin(elapsed * 7 + stream.phase + x * 2.4) *
      profile.wakeStrength *
      fade *
      centerWeight

    y += oscillation
    z += Math.cos(elapsed * 5.5 + stream.phase) * oscillation * 0.55
  }

  if (profile.liftBias) {
    const wingInfluence =
      smoothstep(-2.2, -0.4, x) * (1 - smoothstep(0.5, 2.8, x))
    y +=
      profile.liftBias *
      wingInfluence *
      Math.max(0, 1 - normalizedRadius / 1.8)
  }

  return { y, z }
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

    if (!geometry) return

    const elapsed = clock.getElapsedTime()
    const array = geometry.attributes.position.array
    const profile = FLOW_PROFILES[selectedObjectId] ?? FLOW_PROFILES.cube

    streams.forEach((stream, index) => {
      stream.x += stream.speed * delta

      if (stream.x > TUNNEL_LENGTH / 2) {
        stream.x = -TUNNEL_LENGTH / 2
      }

      const head = sampleFlow(stream, stream.x, profile, elapsed)
      const tailX = stream.x - STREAM_LENGTH
      const tail = sampleFlow(stream, tailX, profile, elapsed)
      const cursor = index * 6

      array[cursor] = tailX
      array[cursor + 1] = tail.y
      array[cursor + 2] = tail.z
      array[cursor + 3] = stream.x
      array[cursor + 4] = head.y
      array[cursor + 5] = head.z
    })

    geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments frustumCulled={false} renderOrder={2}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#7dd3fc"
        opacity={0.7}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  )
}

export default WindParticles
