const easyQuestions = [
  {
    question:
      'Ao comparar o cubo e a esfera no tunel, qual deles tende a desviar o ar de forma mais suave?',
    answer: 'A esfera.',
    reason:
      'Como ela nao tem faces planas, o ar consegue contornar melhor sua superficie.',
  },
  {
    question:
      'Se o ar fica muito baguncado atras de um objeto, que efeito geralmente aumenta?',
    answer: 'O arrasto.',
    reason:
      'Uma esteira mais turbulenta indica maior resistencia ao movimento.',
  },
  {
    question:
      'Por que carros costumam ter formas mais arredondadas na frente?',
    answer: 'Para reduzir a resistencia do ar.',
    reason:
      'Formas suaves ajudam o fluxo a se separar menos bruscamente.',
  },
  {
    question:
      'O perfil de asa serve para mostrar principalmente qual ideia da aerodinamica?',
    answer: 'Sustentacao.',
    reason:
      'A asa altera o caminho do ar e pode gerar forca para cima.',
  },
]

function Sidebar({ objects, selectedObject, onSelectObject }) {
  const metricLabels = {
    drag: 'Arrasto',
    lift: 'Sust.',
    flow: 'Fluxo',
  }

  return (
    <aside className="flex h-[42vh] w-full shrink-0 flex-col overflow-y-auto border-b border-purple-400/25 bg-black px-5 py-5 shadow-2xl shadow-purple-950/40 lg:h-full lg:w-1/4 lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
      <div className="border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">
          Simulador de t&uacute;nel de vento
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          AeroLab H&iacute;brido
        </h1>
        <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300" />
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
                'focus:outline-none focus:ring-2 focus:ring-purple-300/80 focus:ring-offset-2 focus:ring-offset-black',
                isActive
                  ? 'border-purple-300/70 bg-purple-300/15 text-white shadow-lg shadow-purple-950/50'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-purple-300/40 hover:bg-white/[0.06]',
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

      <section className="mt-7 rounded-md border border-white/10 bg-zinc-950/85 p-5 shadow-xl shadow-purple-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
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

      <section className="mt-7 rounded-md border border-purple-300/15 bg-purple-950/20 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
          Quest&otilde;es estilo ENEM
        </p>
        <div className="mt-4 space-y-4">
          {easyQuestions.map((item, index) => (
            <article key={item.question} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Quest&atilde;o {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {item.question}
              </p>
              <p className="mt-3 text-sm font-semibold text-purple-200">
                Resposta: {item.answer}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {item.reason}
              </p>
            </article>
          ))}
        </div>
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
