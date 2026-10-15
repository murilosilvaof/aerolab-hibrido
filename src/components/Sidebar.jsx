import { useState } from 'react'

const easyQuestions = [
  {
    example:
      'F\u00f3rmula 1: um piloto faz uma curva em alta velocidade. As asas e o assoalho do carro interagem com o ar.',
    question:
      'Como a press\u00e3o aerodin\u00e2mica (downforce) ajuda esse carro na curva?',
    options: [
      'Levanta os pneus e diminui o contato com a pista',
      'Pressiona o carro contra a pista e aumenta a ader\u00eancia',
      'Substitui a frenagem feita pelos pneus',
    ],
    correctIndex: 1,
    reason:
      'O downforce \u00e9 uma for\u00e7a do ar para baixo. Ele aumenta a carga nos pneus e ajuda o carro a fazer curvas mais r\u00e1pidas. No avi\u00e3o, a sustenta\u00e7\u00e3o atua para cima.',
  },
  {
    example:
      'F\u00f3rmula 1: na reta, a equipe busca diminuir a resist\u00eancia que o ar faz ao movimento do carro.',
    question:
      'Com a mesma pot\u00eancia do motor, por que reduzir o arrasto ajuda na velocidade?',
    options: [
      'Porque o ar oferece menos resist\u00eancia ao avan\u00e7o',
      'Porque a resist\u00eancia do ar fica maior',
      'Porque o motor deixa de ser necess\u00e1rio',
    ],
    correctIndex: 0,
    reason:
      'Menos arrasto facilita atingir maior velocidade na reta. J\u00e1 nas curvas, o downforce ajuda na ader\u00eancia. As equipes equilibram os dois efeitos para cada pista.',
  },
  {
    example: 'Exemplo: cubo e esfera no mesmo fluxo de ar.',
    question:
      'Ao comparar o cubo e a esfera no tunel, qual deles tende a desviar o ar de forma mais suave?',
    options: ['O cubo', 'A esfera', 'Os dois desviam igual'],
    correctIndex: 1,
    reason:
      'Como ela nao tem faces planas, o ar consegue contornar melhor sua superficie.',
  },
  {
    example: 'Exemplo: uma regiao agitada aparece atras do objeto.',
    question:
      'Se o ar fica muito baguncado atras de um objeto, que efeito geralmente aumenta?',
    options: ['O arrasto', 'A transparencia', 'A temperatura do objeto'],
    correctIndex: 0,
    reason:
      'Uma esteira mais turbulenta indica maior resistencia ao movimento.',
  },
  {
    example: 'Exemplo: carros modernos costumam ter frente arredondada.',
    question:
      'Por que carros costumam ter formas mais arredondadas na frente?',
    options: [
      'Para reduzir a resistencia do ar',
      'Para pesar mais',
      'Para aumentar a area frontal',
    ],
    correctIndex: 0,
    reason:
      'Formas suaves ajudam o fluxo a se separar menos bruscamente.',
  },
  {
    example: 'Exemplo: o aviao 3D usa asas para interagir com o fluxo.',
    question:
      'O perfil de asa serve para mostrar principalmente qual ideia da aerodinamica?',
    options: ['Atrito no chao', 'Sustentacao', 'Som do motor'],
    correctIndex: 1,
    reason:
      'A asa altera o caminho do ar e pode gerar forca para cima.',
  },
]

function Sidebar({ objects, selectedObject, onSelectObject }) {
  const [selectedAnswers, setSelectedAnswers] = useState({})

  const metricLabels = {
    drag: 'Arrasto',
    lift: 'Sust.',
    flow: 'Fluxo',
  }
  const answeredCount = Object.keys(selectedAnswers).length
  const score = easyQuestions.reduce((total, question, index) => {
    return selectedAnswers[index] === question.correctIndex ? total + 1 : total
  }, 0)

  function handleAnswer(questionIndex, optionIndex) {
    setSelectedAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionIndex]: optionIndex,
    }))
  }

  function resetQuiz() {
    setSelectedAnswers({})
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
              Quiz estilo ENEM
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {answeredCount}/{easyQuestions.length} respondidas - {score}{' '}
              acertos
            </p>
          </div>
          <button
            type="button"
            onClick={resetQuiz}
            className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-purple-300/50 hover:bg-purple-300/10 focus:outline-none focus:ring-2 focus:ring-purple-300/70"
          >
            Reiniciar
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {easyQuestions.map((item, questionIndex) => {
            const selectedOption = selectedAnswers[questionIndex]
            const hasAnswered = selectedOption !== undefined

            return (
              <article
                key={item.question}
                className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Quest&atilde;o {questionIndex + 1}
                </p>
                <p className="mt-2 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400">
                  {item.example}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {item.question}
                </p>
                <div className="mt-3 grid gap-2">
                  {item.options.map((option, optionIndex) => {
                    const isSelected = selectedOption === optionIndex
                    const isCorrect = item.correctIndex === optionIndex
                    const shouldShowCorrect = hasAnswered && isCorrect
                    const shouldShowWrong = isSelected && !isCorrect

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleAnswer(questionIndex, optionIndex)}
                        className={[
                          'rounded-md border px-3 py-2 text-left text-sm font-semibold transition',
                          'focus:outline-none focus:ring-2 focus:ring-purple-300/70',
                          shouldShowCorrect
                            ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.16)]'
                            : '',
                          shouldShowWrong
                            ? 'border-rose-300/70 bg-rose-500/20 text-rose-100 shadow-[0_0_18px_rgba(244,63,94,0.14)]'
                            : '',
                          !shouldShowCorrect && !shouldShowWrong
                            ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-purple-300/50 hover:bg-purple-300/10'
                            : '',
                        ].join(' ')}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                {hasAnswered && (
                  <p role="status" aria-live="polite" className="mt-3 text-xs leading-5 text-slate-300">
                    {selectedOption === item.correctIndex
                      ? 'Correto. '
                      : 'Resposta incorreta. '}
                    {item.reason}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <div className="mt-auto border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
        <p>
          M&oacute;dulo inicial para aulas pr&aacute;ticas de mec&acirc;nica dos
          fluidos.
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-slate-400 focus-visible:outline focus-visible:outline-purple-300">
            Cr&eacute;ditos dos modelos 3D
          </summary>
          <p className="mt-2">
            Ferrari 458: <a className="text-purple-300 underline" href="https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6" target="_blank" rel="noreferrer">vicent091036</a>,{' '}
            <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Pintura e materiais adaptados.
          </p>
          <p className="mt-2">
            Boeing 787-9: <a className="text-purple-300 underline" href="https://github.com/Flightradar24/fr24-3d-models" target="_blank" rel="noreferrer">FlightGear / Flightradar24</a>, GPL v2. Formato e materiais adaptados.
          </p>
          <a className="mt-2 inline-block underline" href="/models/credits.txt" target="_blank" rel="noreferrer">Fontes e licen&ccedil;as</a>
        </details>
      </div>
    </aside>
  )
}

export default Sidebar
