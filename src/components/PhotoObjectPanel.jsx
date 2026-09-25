import { useEffect, useRef, useState } from 'react'

function PhotoObjectPanel({ selectedObject, onCreatePhotoObject }) {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')

  useEffect(
    () => () => {
      stopCamera(false)
    },
    [],
  )

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [isCameraOpen])

  function stopCamera(updateState = true) {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (updateState) {
      setIsCameraOpen(false)
    }
  }

  async function startCamera() {
    setCameraError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      setIsCameraOpen(true)
    } catch {
      setCameraError('Nao foi possivel abrir a camera neste navegador.')
    }
  }

  function handleFileChange(event) {
    const [file] = event.target.files ?? []

    if (file) {
      onCreatePhotoObject(file)
    }

    event.target.value = ''
  }

  function captureFrame() {
    const video = videoRef.current

    if (!video) {
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const context = canvas.getContext('2d')

    if (!context) {
      setCameraError('Nao foi possivel capturar a imagem.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Nao foi possivel capturar a imagem.')
          return
        }

        const file = new File([blob], 'captura-aerolab.png', {
          type: 'image/png',
        })

        onCreatePhotoObject(file)
        stopCamera()
      },
      'image/png',
      0.92,
    )
  }

  return (
    <section className="mt-7 rounded-md border border-cyan-300/15 bg-cyan-950/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
        Objeto real
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={startCamera}
          className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
        >
          Camera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
        >
          Foto
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {isCameraOpen && (
        <div className="mt-4 overflow-hidden rounded-md border border-white/10 bg-black/40">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-2">
            <button
              type="button"
              onClick={captureFrame}
              className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Capturar
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <p className="mt-3 text-xs leading-5 text-amber-200">{cameraError}</p>
      )}

      {selectedObject.imageUrl && (
        <div className="mt-4 overflow-hidden rounded-md border border-white/10 bg-slate-950/50">
          <img
            src={selectedObject.imageUrl}
            alt={selectedObject.fileName}
            className="h-28 w-full object-cover"
          />
          <div className="border-t border-white/10 px-3 py-2">
            <p className="truncate text-xs font-semibold text-slate-200">
              {selectedObject.fileName}
            </p>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
              {selectedObject.imageMeta.width} x {selectedObject.imageMeta.height}px
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default PhotoObjectPanel
