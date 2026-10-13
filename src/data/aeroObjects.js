export const aeroObjects = [
  {
    id: 'cube',
    label: 'Cubo',
    tag: 'Arrasto alto',
    color: '#a855f7',
    definitionTitle: 'Arrasto e esteira turbulenta',
    definition:
      'O cubo tem faces planas que empurram o ar de forma abrupta. Isso aumenta o arrasto e cria uma esteira turbulenta logo depois do objeto.',
    metrics: {
      drag: 'Alto',
      lift: 'Baixa',
      flow: 'Separado',
    },
  },
  {
    id: 'sphere',
    label: 'Esfera',
    tag: 'Fluxo contornado',
    color: '#c084fc',
    definitionTitle: 'Redu\u00e7\u00e3o de arrasto por forma',
    definition:
      'A esfera permite que parte do fluxo acompanhe sua superf\u00edcie antes de se separar. Comparada ao cubo, ela tende a gerar menos arrasto.',
    metrics: {
      drag: 'M\u00e9dio',
      lift: 'Baixa',
      flow: 'Curvo',
    },
  },
  {
    id: 'wing',
    label: 'Perfil de Asa',
    tag: 'Aviao 3D',
    color: '#8b5cf6',
    definitionTitle: 'Sustentacao em um aviao',
    definition:
      'O aviao mostra como asas podem direcionar o escoamento do ar e gerar sustentacao. O formato das asas ajuda a explicar por que uma aeronave consegue se manter no ar.',
    metrics: {
      drag: 'Baixo',
      lift: 'Alta',
      flow: 'Laminar',
    },
  },
  {
    id: 'car',
    label: 'Carro',
    tag: 'Aerodin\u00e2mica aplicada',
    color: '#d946ef',
    definitionTitle: 'Arrasto em ve\u00edculos',
    definition:
      'No carro, para-brisa, teto e traseira alteram a separa\u00e7\u00e3o do fluxo. Linhas mais suaves reduzem consumo de energia e melhoram estabilidade.',
    metrics: {
      drag: 'M\u00e9dio',
      lift: 'Controlada',
      flow: 'Misto',
    },
  },
]
