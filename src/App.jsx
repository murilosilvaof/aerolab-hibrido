import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import WindTunnelScene from './components/WindTunnelScene'
import { aeroObjects } from './data/aeroObjects'

const PHOTO_OBJECT_ID = 'photo-object'

function loadImageMeta(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }
    image.onerror = reject
    image.src = imageUrl
  })
}

function estimatePhotoObject(file, imageUrl, imageMeta) {
  const aspect = imageMeta.width / imageMeta.height
  const isWide = aspect >= 1.45
  const isTall = aspect <= 0.78
  const visualWidth = isWide ? 2 : Math.max(0.9, aspect * 1.45)
  const visualHeight = isWide ? Math.max(0.8, 2 / aspect) : 1.55
  const dimensions = {
    depth: isWide ? 0.34 : 0.48,
    height: MathUtilsLikeClamp(visualHeight, 0.82, 1.7),
    width: MathUtilsLikeClamp(visualWidth, 0.85, 2.1),
  }

  if (isWide) {
    return {
      id: PHOTO_OBJECT_ID,
      label: 'Objeto da foto',
      tag: 'Perfil alongado',
      color: '#22d3ee',
      custom: true,
      fileName: file.name || 'foto-importada.png',
      imageMeta: { ...imageMeta, aspect },
      imageUrl,
      dimensions,
      definitionTitle: 'Foto convertida em volume 3D',
      definition:
        'A imagem foi aplicada em um volume 3D simplificado. Pelo formato alongado, o sistema estima menor arrasto frontal e escoamento mais guiado.',
      metrics: {
        drag: 'Baixo/Medio',
        lift: 'Incerta',
        flow: 'Guiado',
      },
    }
  }

  if (isTall) {
    return {
      id: PHOTO_OBJECT_ID,
      label: 'Objeto da foto',
      tag: 'Area frontal alta',
      color: '#f97316',
      custom: true,
      fileName: file.name || 'foto-importada.png',
      imageMeta: { ...imageMeta, aspect },
      imageUrl,
      dimensions,
      definitionTitle: 'Foto convertida em volume 3D',
      definition:
        'A imagem foi aplicada em um volume 3D simplificado. Pelo formato vertical, o sistema estima maior area frontal e tendencia a mais arrasto.',
      metrics: {
        drag: 'Alto',
        lift: 'Baixa',
        flow: 'Separado',
      },
    }
  }

  return {
    id: PHOTO_OBJECT_ID,
    label: 'Objeto da foto',
    tag: 'Formato compacto',
    color: '#a7f3d0',
    custom: true,
    fileName: file.name || 'foto-importada.png',
    imageMeta: { ...imageMeta, aspect },
    imageUrl,
    dimensions,
    definitionTitle: 'Foto convertida em volume 3D',
    definition:
      'A imagem foi aplicada em um volume 3D simplificado. Pelo formato compacto, o sistema estima arrasto medio e separacao de fluxo atras do objeto.',
    metrics: {
      drag: 'Medio',
      lift: 'Baixa',
      flow: 'Misto',
    },
  }
}

function MathUtilsLikeClamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function App() {
  const [selectedObjectId, setSelectedObjectId] = useState('cube')
  const [photoObject, setPhotoObject] = useState(null)
  const photoUrlRef = useRef(null)

  useEffect(
    () => () => {
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current)
      }
    },
    [],
  )

  const objects = useMemo(
    () => (photoObject ? [...aeroObjects, photoObject] : aeroObjects),
    [photoObject],
  )

  const selectedObject = useMemo(
    () =>
      objects.find((object) => object.id === selectedObjectId) ?? objects[0],
    [objects, selectedObjectId],
  )

  const handleCreatePhotoObject = useCallback(
    async (file) => {
      if (!file?.type.startsWith('image/')) {
        return
      }

      const imageUrl = URL.createObjectURL(file)

      try {
        const imageMeta = await loadImageMeta(imageUrl)
        const nextPhotoObject = estimatePhotoObject(file, imageUrl, imageMeta)

        if (photoUrlRef.current) {
          URL.revokeObjectURL(photoUrlRef.current)
        }

        photoUrlRef.current = imageUrl
        setPhotoObject(nextPhotoObject)
        setSelectedObjectId(PHOTO_OBJECT_ID)
      } catch {
        URL.revokeObjectURL(imageUrl)
      }
    },
    [],
  )

  return (
    <main className="flex h-screen h-dvh w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 lg:flex-row">
      <Sidebar
        objects={objects}
        selectedObject={selectedObject}
        onCreatePhotoObject={handleCreatePhotoObject}
        onSelectObject={setSelectedObjectId}
      />

      <section className="relative h-[58vh] w-full flex-1 bg-slate-950 lg:h-full lg:w-3/4">
        <WindTunnelScene selectedObject={selectedObject} />
      </section>
    </main>
  )
}

export default App
