import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import WindTunnelScene from './components/WindTunnelScene'
import { aeroObjects } from './data/aeroObjects'

function App() {
  const [selectedObjectId, setSelectedObjectId] = useState('cube')

  const selectedObject = useMemo(
    () =>
      aeroObjects.find((object) => object.id === selectedObjectId) ??
      aeroObjects[0],
    [selectedObjectId],
  )

  return (
    <main className="flex h-screen h-dvh w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 lg:flex-row">
      <Sidebar
        objects={aeroObjects}
        selectedObject={selectedObject}
        onSelectObject={setSelectedObjectId}
      />

      <section className="relative h-[58vh] w-full flex-1 bg-slate-950 lg:h-full lg:w-3/4">
        <WindTunnelScene selectedObject={selectedObject} />
      </section>
    </main>
  )
}

export default App
