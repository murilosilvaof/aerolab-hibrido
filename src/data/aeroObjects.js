export const aeroObjects = [
  {
    id: 'cube',
    label: 'Cubo',
    tag: 'Arrasto alto',
    color: '#38bdf8',
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
    color: '#34d399',
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
    tag: 'Sustenta\u00e7\u00e3o',
    color: '#f59e0b',
    definitionTitle: 'Sustenta\u00e7\u00e3o e \u00e2ngulo de ataque',
    definition:
      'Um perfil achatado pode direcionar o escoamento e criar diferen\u00e7a de press\u00e3o entre as faces. Esse efeito e a base da sustenta\u00e7\u00e3o aerodin\u00e2mica.',
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
    color: '#f43f5e',
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
