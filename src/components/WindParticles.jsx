import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, MathUtils } from 'three'

const PARTICLE_COUNT = 2600
const TUNNEL_HALF_LENGTH = 6.7
const TUNNEL_LIMIT_Y = 1.82
const TUNNEL_LIMIT_Z = 1.58
const SURFACE_CLEARANCE = 0.055
const NORMAL_EPSILON = 0.018

const SMOKE_VERTEX_SHADER = `
  attribute float aAlpha;
  attribute float aSize;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = aAlpha;
    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const SMOKE_FRAGMENT_SHADER = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float distanceFromCenter = length(uv);
    float softDisc = smoothstep(0.5, 0.08, distanceFromCenter);
    float denseCore = smoothstep(0.22, 0.0, distanceFromCenter);
    float smokeAlpha = softDisc * (0.55 + denseCore * 0.45);

    if (smokeAlpha < 0.015) {
      discard;
    }

    gl_FragColor = vec4(vColor, vAlpha * smokeAlpha);
  }
`

const FLOW_PROFILES = {
  cube: {
    kind: 'cube',
    halfX: 0.78,
    halfY: 0.78,
    halfZ: 0.78,
    influence: 1.08,
    speed: 1.68,
    split: 1.38,
    deflection: 1.25,
    sideAcceleration: 0.42,
    wakeStart: 0.72,
    wakeLength: 4.8,
    wakeRadiusY: 1.04,
    wakeRadiusZ: 1.04,
    wakeDrag: 0.72,
    recirculation: 0.18,
    vortex: 0.54,
    shedding: 7.4,
    wakeExpansion: 0.78,
  },
  sphere: {
    kind: 'sphere',
    radius: 0.96,
    halfX: 0.96,
    influence: 1.32,
    speed: 1.78,
    split: 0.72,
    deflection: 0.78,
    sideAcceleration: 0.25,
    wakeStart: 0.82,
    wakeLength: 3.6,
    wakeRadiusY: 0.86,
    wakeRadiusZ: 0.86,
    wakeDrag: 0.38,
    recirculation: 0.05,
    vortex: 0.2,
    shedding: 5.4,
    wakeExpansion: 0.42,
    potentialRange: 2.5,
  },
  wing: {
    kind: 'wing',
    halfX: 1.58,
    halfY: 0.18,
    halfZ: 0.62,
    influence: 0.78,
    speed: 1.92,
    split: 0.22,
    deflection: 0.7,
    sideAcceleration: 0.48,
    camber: 0.08,
    angle: 0.12,
    upwash: 0.2,
    downwash: 0.36,
    wakeStart: 1.18,
    wakeLength: 3.25,
    wakeRadiusY: 0.58,
    wakeRadiusZ: 0.9,
    wakeDrag: 0.22,
    recirculation: 0.01,
    vortex: 0.08,
    shedding: 6,
    wakeExpansion: 0.28,
  },
  car: {
    kind: 'car',
    halfX: 1.22,
    influence: 1,
    speed: 1.7,
    split: 0.98,
    deflection: 1.08,
    sideAcceleration: 0.34,
    wakeStart: 1.05,
    wakeLength: 4.45,
    wakeRadiusY: 0.9,
    wakeRadiusZ: 0.92,
    wakeDrag: 0.56,
    recirculation: 0.1,
    vortex: 0.34,
    shedding: 6.6,
    wakeExpansion: 0.62,
  },
}

function hashFloat(value) {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43758.5453

  return hashed - Math.floor(hashed)
}

function smoothstep(edge0, edge1, value) {
  const amount = MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)

  return amount * amount * (3 - 2 * amount)
}

function sdBox(x, y, z, halfX, halfY, halfZ) {
  const qx = Math.abs(x) - halfX
  const qy = Math.abs(y) - halfY
  const qz = Math.abs(z) - halfZ
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0))
  const inside = Math.min(Math.max(qx, qy, qz), 0)

  return outside + inside
}

function sdRoundBox(x, y, z, halfX, halfY, halfZ, radius) {
  return sdBox(x, y, z, halfX, halfY, halfZ) - radius
}

function sdEllipsoid(x, y, z, radiusX, radiusY, radiusZ) {
  const k0 = Math.hypot(x / radiusX, y / radiusY, z / radiusZ)
  const k1 = Math.hypot(
    x / (radiusX * radiusX),
    y / (radiusY * radiusY),
    z / (radiusZ * radiusZ),
  )

  if (k1 === 0) {
    return -Math.min(radiusX, radiusY, radiusZ)
  }

  return (k0 * (k0 - 1)) / k1
}

function sdCylinderZ(x, y, z, centerX, centerY, centerZ, radius, halfZ) {
  const dx = Math.hypot(x - centerX, y - centerY) - radius
  const dz = Math.abs(z - centerZ) - halfZ
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dz, 0))
  const inside = Math.min(Math.max(dx, dz), 0)

  return outside + inside
}

function sdfAt(x, y, z, profile) {
  if (profile.kind === 'sphere') {
    return Math.hypot(x, y, z) - profile.radius
  }

  if (profile.kind === 'wing') {
    const normalizedX = MathUtils.clamp(x / profile.halfX, -1, 1)
    const taper = Math.sqrt(Math.max(0.08, 1 - normalizedX * normalizedX))
    const centerY =
      profile.camber * (1 - normalizedX * normalizedX) - x * profile.angle

    return sdEllipsoid(
      x,
      y - centerY,
      z,
      profile.halfX,
      profile.halfY * (0.45 + taper * 0.65),
      profile.halfZ,
    )
  }

  if (profile.kind === 'car') {
    const body = sdRoundBox(x, y - 0.15, z, 1.18, 0.25, 0.53, 0.11)
    const cabin = sdRoundBox(x + 0.25, y - 0.58, z, 0.54, 0.26, 0.42, 0.09)
    const wheelA = sdCylinderZ(x, y, z, -0.72, -0.16, -0.56, 0.23, 0.1)
    const wheelB = sdCylinderZ(x, y, z, 0.72, -0.16, -0.56, 0.23, 0.1)
    const wheelC = sdCylinderZ(x, y, z, -0.72, -0.16, 0.56, 0.23, 0.1)
    const wheelD = sdCylinderZ(x, y, z, 0.72, -0.16, 0.56, 0.23, 0.1)

    return Math.min(body, cabin, wheelA, wheelB, wheelC, wheelD)
  }

  return sdBox(x, y, z, profile.halfX, profile.halfY, profile.halfZ)
}

function sampleNormal(x, y, z, profile) {
  const dx =
    sdfAt(x + NORMAL_EPSILON, y, z, profile) -
    sdfAt(x - NORMAL_EPSILON, y, z, profile)
  const dy =
    sdfAt(x, y + NORMAL_EPSILON, z, profile) -
    sdfAt(x, y - NORMAL_EPSILON, z, profile)
  const dz =
    sdfAt(x, y, z + NORMAL_EPSILON, profile) -
    sdfAt(x, y, z - NORMAL_EPSILON, profile)
  const length = Math.hypot(dx, dy, dz) || 1

  return {
    x: dx / length,
    y: dy / length,
    z: dz / length,
  }
}

function applyPotentialSphereVelocity(particle, profile, velocity) {
  const r = Math.hypot(particle.x, particle.y, particle.z)

  if (r <= profile.radius * 1.04 || r >= profile.potentialRange) {
    return
  }

  const radius3 = profile.radius ** 3
  const r3 = r ** 3
  const r5 = r ** 5
  const coefficient = radius3 / (2 * r3)
  const blend = 1 - smoothstep(profile.radius * 1.1, profile.potentialRange, r)
  const potentialX =
    velocity.x *
    (1 +
      coefficient -
      (3 * radius3 * particle.x * particle.x) / (2 * r5))
  const potentialY =
    velocity.x * (-(3 * radius3 * particle.x * particle.y) / (2 * r5))
  const potentialZ =
    velocity.x * (-(3 * radius3 * particle.x * particle.z) / (2 * r5))

  velocity.x = MathUtils.lerp(velocity.x, potentialX, blend)
  velocity.y = MathUtils.lerp(velocity.y, potentialY, blend)
  velocity.z = MathUtils.lerp(velocity.z, potentialZ, blend)
}

function applyObstacleDeflection(particle, profile, velocity) {
  const sdf = sdfAt(particle.x, particle.y, particle.z, profile)
  const influence = 1 - smoothstep(0.02, profile.influence, Math.max(sdf, 0))

  if (influence <= 0) {
    return
  }

  const normal = sampleNormal(particle.x, particle.y, particle.z, profile)
  const incoming =
    velocity.x * normal.x + velocity.y * normal.y + velocity.z * normal.z

  if (incoming < 0) {
    velocity.x -= normal.x * incoming * profile.deflection * influence
    velocity.y -= normal.y * incoming * profile.deflection * influence
    velocity.z -= normal.z * incoming * profile.deflection * influence
  }

  const front =
    (1 -
      smoothstep(
        -profile.halfX - profile.influence * 1.35,
        -profile.halfX * 0.14,
        particle.x,
      )) *
    influence
  const coreDistance = Math.hypot(particle.y * 1.15, particle.z)
  const splitter = front * (1 - smoothstep(0.05, 0.72, coreDistance))

  velocity.y += particle.splitY * profile.split * splitter
  velocity.z += particle.splitZ * profile.split * splitter

  const surfaceSlip = influence * (1 - Math.abs(normal.x)) ** 0.75
  velocity.x += velocity.baseSpeed * profile.sideAcceleration * surfaceSlip
}

function applyWingDownwash(particle, profile, velocity) {
  if (profile.kind !== 'wing') {
    return
  }

  const crossSection =
    (1 - smoothstep(0.2, 1.55, Math.abs(particle.y))) *
    (1 - smoothstep(0.45, 1.35, Math.abs(particle.z)))
  const upwash =
    smoothstep(-3.1, -profile.halfX, particle.x) *
    (1 - smoothstep(-profile.halfX, -0.15, particle.x))
  const downwash =
    smoothstep(-0.2, profile.halfX, particle.x) *
    (1 - smoothstep(profile.halfX, profile.halfX + 3, particle.x))

  velocity.y += profile.upwash * upwash * crossSection
  velocity.y -= profile.downwash * downwash * crossSection
}

function applyWake(particle, profile, elapsed, velocity) {
  if (particle.x <= profile.wakeStart) {
    return
  }

  const progress = (particle.x - profile.wakeStart) / profile.wakeLength

  if (progress <= 0 || progress >= 1) {
    return
  }

  const wakeCenterY =
    profile.kind === 'wing'
      ? -profile.downwash * smoothstep(0.08, 0.85, progress) * 1.1
      : profile.kind === 'car'
        ? 0.1
        : 0
  const radiusY = profile.wakeRadiusY + progress * profile.wakeExpansion
  const radiusZ = profile.wakeRadiusZ + progress * profile.wakeExpansion
  const radial = Math.hypot(
    (particle.y - wakeCenterY) / radiusY,
    particle.z / radiusZ,
  )
  const core = Math.exp(-radial * radial * 1.45)
  const fade = (1 - progress) ** 0.82
  const wake = core * fade
  const rollup = smoothstep(0.05, 0.34, progress)
  const phase =
    elapsed * profile.shedding - particle.x * 2.85 + particle.phase * 1.7

  velocity.x *= 1 - profile.wakeDrag * wake
  velocity.x -=
    velocity.baseSpeed *
    profile.recirculation *
    wake *
    rollup *
    (1 - smoothstep(0.34, 0.86, progress))
  velocity.y += Math.sin(phase) * profile.vortex * wake * rollup
  velocity.z += Math.cos(phase * 0.92) * profile.vortex * wake * rollup * 0.62
}

function sampleVelocity(particle, profile, elapsed) {
  const baseSpeed = profile.speed * particle.speedJitter
  const velocity = {
    x: baseSpeed,
    y: 0,
    z: 0,
    baseSpeed,
  }

  if (profile.kind === 'sphere') {
    applyPotentialSphereVelocity(particle, profile, velocity)
  }

  applyObstacleDeflection(particle, profile, velocity)
  applyWingDownwash(particle, profile, velocity)
  applyWake(particle, profile, elapsed, velocity)

  return velocity
}

function spawnParticle(particle, index, profile, entryOnly = false) {
  const laneIndex = index % 169
  const row = laneIndex % 13
  const layer = Math.floor(laneIndex / 13)
  const rowJitter = (hashFloat(index * 2.7 + particle.seed) - 0.5) * 0.08
  const layerJitter = (hashFloat(index * 3.1 + particle.seed) - 0.5) * 0.08
  const centralSmoke = index % 3 !== 0
  const laneScale = centralSmoke ? 0.22 : 0.255
  const y = (row - 6) * laneScale + rowJitter
  const z = (layer - 6) * laneScale + layerJitter
  const radial = Math.hypot(y * 1.15, z)
  const phase = particle.seed * Math.PI * 2 + index * 0.37

  particle.x = entryOnly
    ? -TUNNEL_HALF_LENGTH - hashFloat(index + particle.seed) * 0.4
    : -TUNNEL_HALF_LENGTH + hashFloat(index + particle.seed) * TUNNEL_HALF_LENGTH * 2
  particle.y = y
  particle.z = z
  particle.splitY = radial < 0.04 ? Math.sin(phase) : (y * 1.15) / radial
  particle.splitZ = radial < 0.04 ? Math.cos(phase) : z / radial
  particle.phase = phase
  particle.baseSize =
    (centralSmoke ? 0.15 : 0.1) * (0.78 + hashFloat(index + 9.8) * 0.5)
  particle.alpha = 0
  particle.age = entryOnly ? 0 : hashFloat(index + 17.4) * 3

  if (profile) {
    projectOutsideObstacle(particle, profile)
  }
}

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    x: 0,
    y: 0,
    z: 0,
    splitY: 0,
    splitZ: 0,
    phase: 0,
    seed: hashFloat(index + 0.37),
    speedJitter: 0.9 + hashFloat(index + 8.4) * 0.2,
    baseSize: 0.1,
    alpha: 0,
    age: 0,
  }))
}

function projectOutsideObstacle(particle, profile) {
  const sdf = sdfAt(particle.x, particle.y, particle.z, profile)

  if (sdf >= SURFACE_CLEARANCE) {
    return
  }

  const normal = sampleNormal(particle.x, particle.y, particle.z, profile)
  const correction = SURFACE_CLEARANCE - sdf

  particle.x += normal.x * correction
  particle.y += normal.y * correction
  particle.z += normal.z * correction
}

function particleDensity(particle, profile) {
  const sdf = sdfAt(particle.x, particle.y, particle.z, profile)
  const nearSurface = 1 - smoothstep(0.02, 0.62, Math.max(sdf, 0))
  const inletFade = smoothstep(-TUNNEL_HALF_LENGTH, -TUNNEL_HALF_LENGTH + 1, particle.x)
  const outletFade =
    1 - smoothstep(TUNNEL_HALF_LENGTH - 1.2, TUNNEL_HALF_LENGTH, particle.x)
  const wakeProgress = (particle.x - profile.wakeStart) / profile.wakeLength
  const wakeAmount =
    wakeProgress > 0 && wakeProgress < 1
      ? Math.exp(
          -(
            (particle.y / (profile.wakeRadiusY + wakeProgress * profile.wakeExpansion)) **
              2 +
            (particle.z / (profile.wakeRadiusZ + wakeProgress * profile.wakeExpansion)) **
              2
          ) *
            1.1,
        ) *
        (1 - wakeProgress) *
        0.38
      : 0

  return MathUtils.clamp(
    0.12 + nearSurface * 0.2 + wakeAmount + inletFade * outletFade * 0.56,
    0,
    0.86,
  )
}

function stepParticle(particle, index, profile, elapsed, delta) {
  const substeps = 3
  const stepDelta = Math.min(delta / substeps, 0.018)

  for (let step = 0; step < substeps; step += 1) {
    const velocity = sampleVelocity(particle, profile, elapsed)
    const microTurbulence =
      0.016 +
      Math.max(0, particle.x - profile.wakeStart) * 0.004 * profile.vortex

    particle.x += velocity.x * stepDelta
    particle.y +=
      (velocity.y +
        Math.sin(elapsed * 1.8 + particle.phase) * microTurbulence) *
      stepDelta
    particle.z +=
      (velocity.z +
        Math.cos(elapsed * 1.6 + particle.phase * 1.3) * microTurbulence) *
      stepDelta
    projectOutsideObstacle(particle, profile)
  }

  particle.age += delta

  if (
    particle.x > TUNNEL_HALF_LENGTH ||
    Math.abs(particle.y) > TUNNEL_LIMIT_Y ||
    Math.abs(particle.z) > TUNNEL_LIMIT_Z
  ) {
    spawnParticle(particle, index, profile, true)
  }
}

function writeBuffers(simulation, profile) {
  const { particles, positions, colors, alphas, sizes } = simulation

  particles.forEach((particle, index) => {
    const positionCursor = index * 3
    const density = particleDensity(particle, profile)
    const wakeTint = smoothstep(
      profile.wakeStart,
      profile.wakeStart + profile.wakeLength * 0.45,
      particle.x,
    )
    const surfaceTint =
      1 - smoothstep(0.02, 0.5, Math.max(sdfAt(particle.x, particle.y, particle.z, profile), 0))

    positions[positionCursor] = particle.x
    positions[positionCursor + 1] = particle.y
    positions[positionCursor + 2] = particle.z

    colors[positionCursor] = 0.48 + surfaceTint * 0.18 + wakeTint * 0.06
    colors[positionCursor + 1] = 0.8 + surfaceTint * 0.14
    colors[positionCursor + 2] = 0.95 + surfaceTint * 0.05

    alphas[index] = density * Math.min(1, particle.age * 1.8)
    sizes[index] =
      particle.baseSize *
      (1 + surfaceTint * 0.35 + wakeTint * 0.55) *
      (0.88 + Math.sin(particle.phase + particle.age * 2) * 0.08)
  })
}

function createSimulation(profile) {
  const particles = createParticles()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const alphas = new Float32Array(PARTICLE_COUNT)
  const sizes = new Float32Array(PARTICLE_COUNT)

  particles.forEach((particle, index) => {
    spawnParticle(particle, index, profile)
  })

  const simulation = { particles, positions, colors, alphas, sizes }

  writeBuffers(simulation, profile)

  return simulation
}

function WindParticles({ selectedObjectId }) {
  const geometryRef = useRef(null)
  const simulation = useMemo(() => createSimulation(FLOW_PROFILES.cube), [])

  useEffect(() => {
    const profile = FLOW_PROFILES[selectedObjectId] ?? FLOW_PROFILES.cube

    simulation.particles.forEach((particle, index) => {
      spawnParticle(particle, index, profile, index % 2 === 0)
    })
    writeBuffers(simulation, profile)

    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true
      geometryRef.current.attributes.color.needsUpdate = true
      geometryRef.current.attributes.aAlpha.needsUpdate = true
      geometryRef.current.attributes.aSize.needsUpdate = true
    }
  }, [selectedObjectId, simulation])

  useFrame(({ clock }, delta) => {
    const geometry = geometryRef.current

    if (!geometry) {
      return
    }

    const elapsed = clock.getElapsedTime()
    const profile = FLOW_PROFILES[selectedObjectId] ?? FLOW_PROFILES.cube

    simulation.particles.forEach((particle, index) => {
      stepParticle(particle, index, profile, elapsed, delta)
    })
    writeBuffers(simulation, profile)

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.aAlpha.needsUpdate = true
    geometry.attributes.aSize.needsUpdate = true
  })

  return (
    <points frustumCulled={false} renderOrder={2}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[simulation.positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[simulation.colors, 3]} />
        <bufferAttribute
          attach="attributes-aAlpha"
          args={[simulation.alphas, 1]}
        />
        <bufferAttribute attach="attributes-aSize" args={[simulation.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={SMOKE_FRAGMENT_SHADER}
        transparent
        vertexColors
        vertexShader={SMOKE_VERTEX_SHADER}
      />
    </points>
  )
}

export default WindParticles
