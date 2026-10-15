import { Component, Suspense, useEffect, useMemo } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { Box3, Group, MeshPhysicalMaterial, Vector3 } from 'three'

const MODEL_CONFIG = {
  car: { url: '/models/sports-car.glb', length: 3.2 },
  wing: { url: '/models/airliner.glb', length: 3.55 },
}

function finishMaterial(original, type, color) {
  if (type === 'car' && original.name === 'Body_Color') {
    return new MeshPhysicalMaterial({
      name: original.name,
      color,
      metalness: 0.65,
      roughness: 0.26,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    })
  }

  if (type === 'car' && original.name === 'Glass_Gray') {
    return new MeshPhysicalMaterial({
      name: original.name,
      color: '#72849a',
      roughness: 0.08,
      metalness: 0.18,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      clearcoat: 1,
    })
  }

  const material = original.clone()

  if (type === 'wing') {
    // Preserve the aircraft's texture atlas, including windows and panel seams.
    material.roughness = 0.36
    material.metalness = 0.22

    if (/skin|chrome/i.test(material.name)) {
      material.color.set('#d8c5fa')
    }

    if (/glass/i.test(material.name) && !material.map) {
      material.color.set('#38495e')
      material.roughness = 0.12
      material.opacity = 0.9
      material.depthWrite = false
    }
  } else if (/metal|chrome/i.test(material.name)) {
    material.color.set('#cbd5e1')
    material.metalness = 0.85
    material.roughness = 0.24
  } else if (material.name === 'Projector_Glass') {
    material.emissive.set('#d8f3ff')
    material.emissiveIntensity = 0.35
    material.roughness = 0.12
  }

  return material
}

function LoadedModel({ type, color }) {
  const config = MODEL_CONFIG[type]
  const { scene } = useGLTF(config.url, '/draco/')
  const model = useMemo(() => {
    const copy = scene.clone(true)
    const materials = new Map()

    copy.traverse((object) => {
      if (!object.isMesh) return

      object.castShadow = true
      object.receiveShadow = true
      const adapt = (original) => {
        if (!materials.has(original)) {
          materials.set(original, finishMaterial(original, type, color))
        }
        return materials.get(original)
      }
      object.material = Array.isArray(object.material)
        ? object.material.map(adapt)
        : adapt(object.material)
    })

    // Both source models face -Z. The tunnel's incoming airflow travels along +X.
    const oriented = new Group()
    oriented.rotation.y = Math.PI / 2
    oriented.add(copy)
    const bounds = new Box3().setFromObject(oriented)
    oriented.position.sub(bounds.getCenter(new Vector3()))

    const root = new Group()
    root.scale.setScalar(config.length / bounds.getSize(new Vector3()).x)
    root.add(oriented)

    return { root, materials: [...materials.values()] }
  }, [scene, type, color, config.length])

  useEffect(() => () => {
    model.materials.forEach((material) => material.dispose())
  }, [model])

  // GLTF geometry/textures belong to the loader cache; only cloned materials are disposed.
  return <primitive object={model.root} dispose={null} />
}

class ModelErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <Html center>
          <div className="w-48 rounded-md border border-white/20 bg-black/90 p-3 text-center text-sm text-white">
            <p>O modelo n&atilde;o carregou.</p>
            <button
              type="button"
              className="mt-3 rounded border border-purple-300/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              onClick={() => {
                useGLTF.clear(this.props.url)
                this.setState({ failed: false })
              }}
            >
              Tentar novamente
            </button>
          </div>
        </Html>
      )
    }

    return this.props.children
  }
}

export default function DetailedModel({ type, color }) {
  return (
    <ModelErrorBoundary key={type} url={MODEL_CONFIG[type].url}>
      <Suspense fallback={
        <Html center>
          <p role="status" className="whitespace-nowrap rounded bg-black/80 px-3 py-2 text-sm text-purple-100">
            Carregando modelo 3D...
          </p>
        </Html>
      }>
        <LoadedModel type={type} color={color} />
      </Suspense>
    </ModelErrorBoundary>
  )
}
