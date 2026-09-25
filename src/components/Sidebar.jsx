import PhotoObjectPanel from './PhotoObjectPanel'

function Sidebar({
  objects,
  selectedObject,
  onCreatePhotoObject,
  onSelectObject,
}) {
  const metricLabels = {
    drag: 'Arrasto',
    lift: 'Sust.',
    flow: 'Fluxo',
  }

  return (
    <aside className="flex h-[42vh] w-full shrink-0 flex-col overflow-y-auto border-b border-cyan-400/20 bg-slate-950 px-5 py-5 shadow-2xl shadow-black/50 lg:h-full lg:w-1/4 lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
      <div className="border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Simulador de t&uacute;nel de vento
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          AeroLab H&iacute;brido
        </h1>
        <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300" />
      </div>

      <nav className="mt-7 flex flex-col gap-3" aria-label="Objetos de teste">
        {objects.map((object) => {
          const isActive = object.id === selectedObject.id

          return (
            <button
              key={object.id}
              type="button"
              onClick={() => onSelectObject(object.id)}
              className={[
                'group rounded-md border px-4 py-3 text-left transition duration-200',
                'focus:outline-none focus:ring-2 focus:ring-cyan-300/80 focus:ring-offset-2 focus:ring-offset-slate-950',
                isActive
                  ? 'border-cyan-300/70 bg-cyan-300/15 text-white shadow-lg shadow-cyan-950/40'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-300/40 hover:bg-white/[0.06]',
              ].join(' ')}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold">{object.label}</span>
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]"
                  style={{ color: object.color, backgroundColor: object.color }}
                />
              </span>
              <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-slate-500 group-hover:text-slate-400">
                {object.tag}
              </span>
            </button>
          )
        })}
      </nav>

      <PhotoObjectPanel
        selectedObject={selectedObject}
        onCreatePhotoObject={onCreatePhotoObject}
      />

      <section className="mt-7 rounded-md border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Defini&ccedil;&atilde;o did&aacute;tica
        </p>
        <h2 className="mt-3 text-xl font-semibold leading-tight text-white">
          {selectedObject.definitionTitle}
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          {selectedObject.definition}
        </p>

        <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {Object.entries(selectedObject.metrics).map(([metric, value]) => (
            <div
              key={metric}
              className="flex items-center justify-between gap-4 py-3"
            >
              <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">
                {metricLabels[metric]}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-auto border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
        <p>
          M&oacute;dulo inicial para aulas pr&aacute;ticas de mec&acirc;nica dos
          fluidos.
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
