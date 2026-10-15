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
    tag: 'Boeing 787-9',
    color: '#8b5cf6',
    definitionTitle: 'Sustenta\u00e7\u00e3o em um avi\u00e3o',
    definition:
      'As asas do Boeing 787-9 desviam o ar e geram sustenta\u00e7\u00e3o para cima. O formato, o \u00e2ngulo de ataque e a velocidade do escoamento influenciam essa for\u00e7a.',
    metrics: {
      drag: 'Baixo',
      lift: 'Alta',
      flow: 'Laminar',
    },
  },
  {
    id: 'car',
    label: 'Carro',
    tag: 'Esportivo 3D',
    color: '#d946ef',
    definitionTitle: 'Arrasto em ve\u00edculos',
    definition:
      'Neste esportivo, cap\u00f4, para-brisa, teto e traseira mudam o caminho do ar. Reduzir o arrasto ajuda na velocidade e no consumo. Na F\u00f3rmula 1, asas e assoalho tamb\u00e9m geram for\u00e7a para baixo para aumentar a ader\u00eancia nas curvas.',
    metrics: {
      drag: 'M\u00e9dio',
      lift: 'Controlada',
      flow: 'Misto',
    },
  },
]
