import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, MathUtils } from 'three'

const RIBBON_ROWS = 9
const RIBBON_LAYERS = 5
const RIBBON_COUNT = RIBBON_ROWS * RIBBON_LAYERS
const SAMPLES_PER_RIBBON = 96
const SEGMENTS_PER_RIBBON = SAMPLES_PER_RIBBON - 1
const VERTICES_PER_SEGMENT = 6
const VERTEX_COUNT =
  RIBBON_COUNT * SEGMENTS_PER_RIBBON * VERTICES_PER_SEGMENT
const TUNNEL_HALF_LENGTH = 6.8
const TUNNEL_LENGTH = TUNNEL_HALF_LENGTH * 2
const SURFACE_CLEARANCE = 0.06
const NORMAL_EPSILON = 0.018

const SMOKE_VERTEX_SHADER = `
  attribute vec3 aColor;
  attribute float aOpacity;
  attribute float aSeed;
  attribute float aFlowSpeed;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSeed;
  varying float vFlowSpeed;

  void main() {
    vUv = uv;
    vColor = aColor;
    vOpacity = aOpacity;
    vSeed = aSeed;
    vFlowSpeed = aFlowSpeed;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SMOKE_FRAGMENT_SHADER = `
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSeed;
  varying float vFlowSpeed;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 curve = local * local * (3.0 - 2.0 * local);

    float a = hash(cell);
    float b = hash(cell + vec2(1.0, 0.0));
    float c = hash(cell + vec2(0.0, 1.0));
    float d = hash(cell + vec2(1.0, 1.0));

    return mix(mix(a, b, curve.x), mix(c, d, curve.x), curve.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.52;

    for (int i = 0; i < 4; i++) {
      value += noise(point) * amplitude;
      point *= 2.05;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    float edgeDistance = abs(vUv.y - 0.5);
    float softEdge = 1.0 - smoothstep(0.24, 0.5, edgeDistance);
    float endFade =
      smoothstep(0.0, 0.08, vUv.x) *
      (1.0 - smoothstep(0.91, 1.0, vUv.x));

    float flow = vUv.x * 8.2 - uTime * vFlowSpeed + vSeed * 12.7;
    float broadSmoke = fbm(vec2(flow, vUv.y * 2.6 + vSeed));
    float fineSmoke = fbm(vec2(flow * 2.8, vUv.y * 7.0 + vSeed * 4.0));
    float vapor = smoothstep(0.16, 0.82, broadSmoke * 0.72 + fineSmoke * 0.28);
    float body = 0.24 + vapor * 0.76;
    float alpha = softEdge * endFade * body * vOpacity;

    if (alpha < 0.012) {
      discard;
    }

    vec3 litSmoke = mix(vColor * 0.74, vec3(0.82, 0.97, 1.0), vapor * 0.34);

    gl_FragColor = vec4(litSmoke, alpha);
  }
`

const FLOW_PROFILES = {
  cube: {
    kind: 'cube',
    halfX: 0.78,
    halfY: 0.78,
    halfZ: 0.78,
    influence: 1.1,
    speed: 1.7,
    split: 1.34,
    deflection: 1.28,
    sideAcceleration: 0.44,
    wakeStart: 0.72,
    wakeLength: 4.7,
    wakeRadiusY: 1.02,
    wakeRadiusZ: 1.02,
    wakeDrag: 0.68,
    recirculation: 0.16,
    vortex: 0.48,
    shedding: 7.2,
    wakeExpansion: 0.74,
  },
  sphere: {
    kind: 'sphere',
    radius: 0.96,
    halfX: 0.96,
    influence: 1.34,
    speed: 1.8,
    split: 0.7,
    deflection: 0.76,
    sideAcceleration: 0.24,
    wakeStart: 0.82,
    wakeLength: 3.6,
    wakeRadiusY: 0.88,
    wakeRadiusZ: 0.88,
    wakeDrag: 0.36,
    recirculation: 0.04,
    vortex: 0.18,
    shedding: 5.4,
    wakeExpansion: 0.38,
    potentialRange: 2.55,
  },
  wing: {
    kind: 'wing',
    halfX: 1.58,
    halfY: 0.18,
    halfZ: 0.62,
    influence: 0.78,
    speed: 1.94,
    split: 0.2,
    deflection: 0.68,
    sideAcceleration: 0.5,
    camber: 0.08,
    angle: 0.12,
    upwash: 0.2,
    downwash: 0.36,
    wakeStart: 1.18,
    wakeLength: 3.25,
    wakeRadiusY: 0.58,
    wakeRadiusZ: 0.9,
    wakeDrag: 0.2,
    recirculation: 0.01,
    vortex: 0.08,
    shedding: 6,
    wakeExpansion: 0.26,
  },
  car: {
    kind: 'car',
    halfX: 1.22,
    influence: 1.02,
    speed: 1.72,
    split: 0.98,
    deflection: 1.08,
    sideAcceleration: 0.34,
    wakeStart: 1.05,
    wakeLength: 4.45,
    wakeRadiusY: 0.9,
    wakeRadiusZ: 0.92,
    wakeDrag: 0.56,
    recirculation: 0.1,
    vortex: 0.32,
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

function projectOutsideObstacle(point, profile) {
  const sdf = sdfAt(point.x, point.y, point.z, profile)

  if (sdf >= SURFACE_CLEARANCE) {
    return
  }

  const normal = sampleNormal(point.x, point.y, point.z, profile)
  const correction = SURFACE_CLEARANCE - sdf

  point.x += normal.x * correction
  point.y += normal.y * correction
  point.z += normal.z * correction
}

function applyPotentialSphereVelocity(point, profile, velocity) {
  const r = Math.hypot(point.x, point.y, point.z)

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
    (1 + coefficient - (3 * radius3 * point.x * point.x) / (2 * r5))
  const potentialY =
    velocity.x * (-(3 * radius3 * point.x * point.y) / (2 * r5))
  const potentialZ =
    velocity.x * (-(3 * radius3 * point.x * point.z) / (2 * r5))

  velocity.x = MathUtils.lerp(velocity.x, potentialX, blend)
  velocity.y = MathUtils.lerp(velocity.y, potentialY, blend)
  velocity.z = MathUtils.lerp(velocity.z, potentialZ, blend)
}

function applyObstacleDeflection(point, profile, velocity) {
  const sdf = sdfAt(point.x, point.y, point.z, profile)
  const influence = 1 - smoothstep(0.02, profile.influence, Math.max(sdf, 0))

  if (influence <= 0) {
    return
  }

  const normal = sampleNormal(point.x, point.y, point.z, profile)
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
        -profile.halfX * 0.12,
        point.x,
      )) *
    influence
  const coreDistance = Math.hypot(point.y * 1.15, point.z)
  const splitter = front * (1 - smoothstep(0.05, 0.74, coreDistance))

  velocity.y += point.splitY * profile.split * splitter
  velocity.z += point.splitZ * profile.split * splitter

  const surfaceSlip = influence * (1 - Math.abs(normal.x)) ** 0.76
  velocity.x += velocity.baseSpeed * profile.sideAcceleration * surfaceSlip
}

function applyWingDownwash(point, profile, velocity) {
  if (profile.kind !== 'wing') {
    return
  }

  const crossSection =
    (1 - smoothstep(0.2, 1.55, Math.abs(point.y))) *
    (1 - smoothstep(0.45, 1.35, Math.abs(point.z)))
  const upwash =
    smoothstep(-3.1, -profile.halfX, point.x) *
    (1 - smoothstep(-profile.halfX, -0.15, point.x))
  const downwash =
    smoothstep(-0.2, profile.halfX, point.x) *
    (1 - smoothstep(profile.halfX, profile.halfX + 3, point.x))

  velocity.y += profile.upwash * upwash * crossSection
  velocity.y -= profile.downwash * downwash * crossSection
}

function applyWake(point, profile, elapsed, velocity) {
  if (point.x <= profile.wakeStart) {
    return
  }

  const progress = (point.x - profile.wakeStart) / profile.wakeLength

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
  const radial = Math.hypot((point.y - wakeCenterY) / radiusY, point.z / radiusZ)
  const core = Math.exp(-radial * radial * 1.45)
  const fade = (1 - progress) ** 0.82
  const wake = core * fade
  const rollup = smoothstep(0.06, 0.34, progress)
  const phase = elapsed * profile.shedding - point.x * 2.75 + point.phase * 1.5

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

function sampleVelocity(point, profile, elapsed) {
  const baseSpeed = profile.speed * point.speedJitter
  const velocity = {
    x: baseSpeed,
    y: 0,
    z: 0,
    baseSpeed,
  }

  if (profile.kind === 'sphere') {
    applyPotentialSphereVelocity(point, profile, velocity)
  }

  applyObstacleDeflection(point, profile, velocity)
  applyWingDownwash(point, profile, velocity)
  applyWake(point, profile, elapsed, velocity)

  return velocity
}

function createRibbons() {
  return Array.from({ length: RIBBON_COUNT }, (_, index) => {
    const row = index % RIBBON_ROWS
    const layer = Math.floor(index / RIBBON_ROWS)
    const baseY = (row - (RIBBON_ROWS - 1) / 2) * 0.31
    const baseZ = (layer - (RIBBON_LAYERS - 1) / 2) * 0.38
    const radial = Math.hypot(baseY * 1.15, baseZ)
    const seed = hashFloat(index + 0.73)
    const phase = seed * Math.PI * 2 + index * 0.41
    const splitY = radial < 0.04 ? Math.sin(phase) : (baseY * 1.15) / radial
    const splitZ = radial < 0.04 ? Math.cos(phase) : baseZ / radial
    const widthAngle = seed * Math.PI * 2

    return {
      baseY,
      baseZ,
      splitY,
      splitZ,
      seed,
      phase,
      speedJitter: 0.93 + hashFloat(index + 7.2) * 0.16,
      width: 0.13 + hashFloat(index + 4.8) * 0.07,
      widthAngle,
      opacity: 0.2 + hashFloat(index + 12.3) * 0.1,
      flowSpeed: 0.68 + hashFloat(index + 18.1) * 0.2,
    }
  })
}

function writeVertex(simulation, vertexIndex, point, side, ribbon, profile) {
  const positionCursor = vertexIndex * 3
  const uvCursor = vertexIndex * 2
  const edgeOffset = side === 0 ? -1 : 1
  const wakeProgress = MathUtils.clamp(
    (point.x - profile.wakeStart) / profile.wakeLength,
    0,
    1,
  )
  const surfaceTint =
    1 -
    smoothstep(
      0.02,
      0.58,
      Math.max(sdfAt(point.x, point.y, point.z, profile), 0),
    )
  const wakeTint = wakeProgress > 0 ? (1 - wakeProgress) * 0.28 : 0
  const width =
    ribbon.width *
    (1 + surfaceTint * 0.42 + wakeTint * 1.5) *
    (0.92 + Math.sin(point.phase + point.x * 0.8) * 0.05)
  const angle =
    ribbon.widthAngle +
    Math.sin(point.x * 0.45 + ribbon.phase) * 0.16 +
    wakeProgress * Math.sin(point.phase) * 0.35
  const offsetY = Math.cos(angle) * width * edgeOffset
  const offsetZ = Math.sin(angle) * width * edgeOffset

  simulation.positions[positionCursor] = point.x
  simulation.positions[positionCursor + 1] = point.y + offsetY
  simulation.positions[positionCursor + 2] = point.z + offsetZ

  simulation.colors[positionCursor] = 0.45 + surfaceTint * 0.16 + wakeTint * 0.1
  simulation.colors[positionCursor + 1] = 0.76 + surfaceTint * 0.15
  simulation.colors[positionCursor + 2] = 0.9 + surfaceTint * 0.08

  simulation.opacities[vertexIndex] =
    ribbon.opacity * (1 + surfaceTint * 0.38 + wakeTint * 0.95)
  simulation.seeds[vertexIndex] = ribbon.seed
  simulation.flowSpeeds[vertexIndex] = ribbon.flowSpeed

  if (!simulation.staticAttributesReady) {
    simulation.uvs[uvCursor] = point.u
    simulation.uvs[uvCursor + 1] = side
  }
}

function advancePoint(point, profile, elapsed, dx) {
  const velocity = sampleVelocity(point, profile, elapsed)
  const safeXVelocity = Math.max(0.34, velocity.x)
  const timeStep = dx / safeXVelocity
  const wakeTurbulence =
    Math.max(0, point.x - profile.wakeStart) * 0.005 * profile.vortex

  point.x += dx
  point.y +=
    velocity.y * timeStep +
    Math.sin(elapsed * 1.7 + point.phase + point.x * 0.45) * wakeTurbulence
  point.z +=
    velocity.z * timeStep +
    Math.cos(elapsed * 1.5 + point.phase * 1.2 + point.x * 0.4) *
      wakeTurbulence

  projectOutsideObstacle(point, profile)
}

function writeSmokeGeometry(simulation, profile, elapsed) {
  const dx = TUNNEL_LENGTH / (SAMPLES_PER_RIBBON - 1)
  let vertexIndex = 0

  simulation.ribbons.forEach((ribbon) => {
    const point = {
      x: -TUNNEL_HALF_LENGTH,
      y: ribbon.baseY,
      z: ribbon.baseZ,
      splitY: ribbon.splitY,
      splitZ: ribbon.splitZ,
      phase: ribbon.phase,
      speedJitter: ribbon.speedJitter,
      u: 0,
    }
    const previous = { ...point }

    projectOutsideObstacle(previous, profile)

    for (let sampleIndex = 0; sampleIndex < SEGMENTS_PER_RIBBON; sampleIndex += 1) {
      point.x = previous.x
      point.y = previous.y
      point.z = previous.z
      point.u = sampleIndex / (SAMPLES_PER_RIBBON - 1)

      const next = { ...point }
      advancePoint(next, profile, elapsed + ribbon.seed * 1.7, dx)
      next.u = (sampleIndex + 1) / (SAMPLES_PER_RIBBON - 1)

      writeVertex(simulation, vertexIndex, point, 0, ribbon, profile)
      vertexIndex += 1
      writeVertex(simulation, vertexIndex, next, 0, ribbon, profile)
      vertexIndex += 1
      writeVertex(simulation, vertexIndex, next, 1, ribbon, profile)
      vertexIndex += 1
      writeVertex(simulation, vertexIndex, point, 0, ribbon, profile)
      vertexIndex += 1
      writeVertex(simulation, vertexIndex, next, 1, ribbon, profile)
      vertexIndex += 1
      writeVertex(simulation, vertexIndex, point, 1, ribbon, profile)
      vertexIndex += 1

      previous.x = next.x
      previous.y = next.y
      previous.z = next.z
      previous.u = next.u
    }
  })

  simulation.staticAttributesReady = true
}

function createSimulation() {
  const simulation = {
    ribbons: createRibbons(),
    positions: new Float32Array(VERTEX_COUNT * 3),
    uvs: new Float32Array(VERTEX_COUNT * 2),
    colors: new Float32Array(VERTEX_COUNT * 3),
    opacities: new Float32Array(VERTEX_COUNT),
    seeds: new Float32Array(VERTEX_COUNT),
    flowSpeeds: new Float32Array(VERTEX_COUNT),
    staticAttributesReady: false,
  }

  writeSmokeGeometry(simulation, FLOW_PROFILES.cube, 0)

  return simulation
}

function WindParticles({ selectedObjectId }) {
  const geometryRef = useRef(null)
  const materialRef = useRef(null)
  const simulation = useMemo(() => createSimulation(), [])

  useFrame(({ clock }) => {
    const geometry = geometryRef.current
    const material = materialRef.current

    if (!geometry || !material) {
      return
    }

    const elapsed = clock.getElapsedTime()
    const profile = FLOW_PROFILES[selectedObjectId] ?? FLOW_PROFILES.cube

    writeSmokeGeometry(simulation, profile, elapsed)
    material.uniforms.uTime.value = elapsed

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aColor.needsUpdate = true
    geometry.attributes.aOpacity.needsUpdate = true
    geometry.attributes.aSeed.needsUpdate = true
    geometry.attributes.aFlowSpeed.needsUpdate = true
  })

  return (
    <mesh frustumCulled={false} renderOrder={2}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[simulation.positions, 3]}
        />
        <bufferAttribute attach="attributes-uv" args={[simulation.uvs, 2]} />
        <bufferAttribute
          attach="attributes-aColor"
          args={[simulation.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aOpacity"
          args={[simulation.opacities, 1]}
        />
        <bufferAttribute
          attach="attributes-aSeed"
          args={[simulation.seeds, 1]}
        />
        <bufferAttribute
          attach="attributes-aFlowSpeed"
          args={[simulation.flowSpeeds, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        depthWrite={false}
        fragmentShader={SMOKE_FRAGMENT_SHADER}
        side={DoubleSide}
        transparent
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={SMOKE_VERTEX_SHADER}
      />
    </mesh>
  )
}

export default WindParticles
