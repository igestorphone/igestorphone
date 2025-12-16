// Mapeamento de cores por modelo específico de iPhone
const modelColorMappings = {
  // iPhone 11
  'iphone 11': {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'verde': 'Verde',
    'green': 'Verde',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  // iPhone 11 Pro e 11 Pro Max
  'iphone 11 pro': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'verde meia noite': 'Verde Meia Noite',
    'midnight green': 'Verde Meia Noite',
    'dourado': 'Dourado',
    'gold': 'Dourado',
  },
  'iphone 11 pro max': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'verde meia noite': 'Verde Meia Noite',
    'midnight green': 'Verde Meia Noite',
    'dourado': 'Dourado',
    'gold': 'Dourado',
  },
  // iPhone 12 e 12 mini
  'iphone 12': {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'azul': 'Azul',
    'blue': 'Azul',
    'verde': 'Verde',
    'green': 'Verde',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  'iphone 12 mini': {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'azul': 'Azul',
    'blue': 'Azul',
    'verde': 'Verde',
    'green': 'Verde',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  // iPhone 12 Pro e 12 Pro Max
  'iphone 12 pro': {
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'azul pacífico': 'Azul Pacífico',
    'pacific blue': 'Azul Pacífico',
    'dourado': 'Dourado',
    'gold': 'Dourado',
  },
  'iphone 12 pro max': {
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'azul pacífico': 'Azul Pacífico',
    'pacific blue': 'Azul Pacífico',
    'dourado': 'Dourado',
    'gold': 'Dourado',
  },
  // iPhone 13 e 13 mini
  'iphone 13': {
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'azul': 'Azul',
    'blue': 'Azul',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'verde': 'Verde',
    'green': 'Verde',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  'iphone 13 mini': {
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'azul': 'Azul',
    'blue': 'Azul',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'verde': 'Verde',
    'green': 'Verde',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  // iPhone 13 Pro e 13 Pro Max
  'iphone 13 pro': {
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'azul sierra': 'Azul Sierra',
    'sierra blue': 'Azul Sierra',
    'verde alpino': 'Verde Alpino',
    'alpine green': 'Verde Alpino',
  },
  'iphone 13 pro max': {
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'azul sierra': 'Azul Sierra',
    'sierra blue': 'Azul Sierra',
    'verde alpino': 'Verde Alpino',
    'alpine green': 'Verde Alpino',
  },
  // iPhone 14 e 14 Plus
  'iphone 14': {
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'azul': 'Azul',
    'blue': 'Azul',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  'iphone 14 plus': {
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'azul': 'Azul',
    'blue': 'Azul',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
  },
  // iPhone 14 Pro e 14 Pro Max
  'iphone 14 pro': {
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'dourado': 'Dourado',
    'gold': 'Dourado',
    'roxo profundo': 'Roxo Profundo',
    'deep purple': 'Roxo Profundo',
  },
  'iphone 14 pro max': {
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'dourado': 'Dourado',
    'gold': 'Dourado',
    'roxo profundo': 'Roxo Profundo',
    'deep purple': 'Roxo Profundo',
  },
  // iPhone 15 e 15 Plus
  'iphone 15': {
    'preto': 'Preto',
    'black': 'Preto',
    'azul': 'Azul',
    'blue': 'Azul',
    'verde': 'Verde',
    'green': 'Verde',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'rosa': 'Rosa',
    'pink': 'Rosa',
  },
  'iphone 15 plus': {
    'preto': 'Preto',
    'black': 'Preto',
    'azul': 'Azul',
    'blue': 'Azul',
    'verde': 'Verde',
    'green': 'Verde',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'rosa': 'Rosa',
    'pink': 'Rosa',
  },
  // iPhone 15 Pro e 15 Pro Max
  'iphone 15 pro': {
    'titânio natural': 'Titânio Natural',
    'natural titanium': 'Titânio Natural',
    'titanium natural': 'Titânio Natural',
    'titânio azul': 'Titânio Azul',
    'blue titanium': 'Titânio Azul',
    'titanium blue': 'Titânio Azul',
    'titânio branco': 'Titânio Branco',
    'white titanium': 'Titânio Branco',
    'titanium white': 'Titânio Branco',
    'titânio preto': 'Titânio Preto',
    'black titanium': 'Titânio Preto',
    'titanium black': 'Titânio Preto',
  },
  'iphone 15 pro max': {
    'titânio natural': 'Titânio Natural',
    'natural titanium': 'Titânio Natural',
    'titanium natural': 'Titânio Natural',
    'titânio azul': 'Titânio Azul',
    'blue titanium': 'Titânio Azul',
    'titanium blue': 'Titânio Azul',
    'titânio branco': 'Titânio Branco',
    'white titanium': 'Titânio Branco',
    'titanium white': 'Titânio Branco',
    'titânio preto': 'Titânio Preto',
    'black titanium': 'Titânio Preto',
    'titanium black': 'Titânio Preto',
  },
  // iPhone 16 e 16 Plus
  'iphone 16': {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'verde': 'Verde',
    'green': 'Verde',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'azul ultramarine': 'Azul Ultramarine',
    'ultramarine blue': 'Azul Ultramarine',
  },
  'iphone 16 plus': {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'verde': 'Verde',
    'green': 'Verde',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'azul ultramarine': 'Azul Ultramarine',
    'ultramarine blue': 'Azul Ultramarine',
  },
  // iPhone 16 Pro e 16 Pro Max
  'iphone 16 pro': {
    'titânio natural': 'Titânio Natural',
    'natural titanium': 'Titânio Natural',
    'titanium natural': 'Titânio Natural',
    'titânio branco': 'Titânio Branco',
    'white titanium': 'Titânio Branco',
    'titanium white': 'Titânio Branco',
    'titânio preto': 'Titânio Preto',
    'black titanium': 'Titânio Preto',
    'titanium black': 'Titânio Preto',
    'desert titanium': 'Desert Titanium',
    'titânio desert': 'Desert Titanium',
  },
  'iphone 16 pro max': {
    'titânio natural': 'Titânio Natural',
    'natural titanium': 'Titânio Natural',
    'titanium natural': 'Titânio Natural',
    'titânio branco': 'Titânio Branco',
    'white titanium': 'Titânio Branco',
    'titanium white': 'Titânio Branco',
    'titânio preto': 'Titânio Preto',
    'black titanium': 'Titânio Preto',
    'titanium black': 'Titânio Preto',
    'desert titanium': 'Desert Titanium',
    'titânio desert': 'Desert Titanium',
  },
  // iPhone 17 (normal)
  'iphone 17': {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'lavanda': 'Lavanda',
    'lavender': 'Lavanda',
    'mist blue': 'Mist Blue',
    'azul névoa': 'Mist Blue',
    'azul-nevoa': 'Mist Blue',
    'azul nevoa': 'Mist Blue',
    'sage': 'Sage',
    'sálvia': 'Sage',
    'salvia': 'Sage',
  },
  // iPhone 17 Pro e 17 Pro Max
  'iphone 17 pro': {
    'cosmic orange': 'Cosmic Orange',
    'laranja cósmico': 'Cosmic Orange',
    'deep blue': 'Deep Blue',
    'azul profundo': 'Deep Blue',
    'silver': 'Silver',
    'prata': 'Silver',
    'prateado': 'Silver',
  },
  'iphone 17 pro max': {
    'cosmic orange': 'Cosmic Orange',
    'laranja cósmico': 'Cosmic Orange',
    'deep blue': 'Deep Blue',
    'azul profundo': 'Deep Blue',
    'silver': 'Silver',
    'prata': 'Silver',
    'prateado': 'Silver',
  },
  // iPhone AIR
  'iphone air': {
    'sky blue': 'Sky Blue',
    'azul céu': 'Sky Blue',
    'light gold': 'Light Gold',
    'dourado claro': 'Light Gold',
    'cloud white': 'Cloud White',
    'branco nuvem': 'Cloud White',
    'space black': 'Space Black',
    'preto espacial': 'Space Black',
  },
  // iPad 10ª geração
  'ipad 10': {
    'azul': 'Azul',
    'blue': 'Azul',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  // iPad 11ª geração
  'ipad 11': {
    'azul': 'Azul',
    'blue': 'Azul',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'amarelo': 'Amarelo',
    'yellow': 'Amarelo',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  // iPad Air 5ª geração
  'ipad air 5': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'rosa': 'Rosa',
    'pink': 'Rosa',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'azul': 'Azul',
    'blue': 'Azul',
  },
  // iPad Air 6ª geração
  'ipad air 6': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'azul': 'Azul',
    'blue': 'Azul',
  },
  // iPad Pro 11" M2
  'ipad pro 11 m2': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  // iPad Pro 12.9" M2
  'ipad pro 12.9 m2': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  'ipad pro 12.9" m2': {
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  // iPad Pro 11" M4
  'ipad pro 11 m4': {
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  // iPad Pro 13" M4
  'ipad pro 13 m4': {
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  'ipad pro 13" m4': {
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
    'prata': 'Prata',
    'silver': 'Prata',
  },
  // MacBook Air M1, 2020
  'macbook air m1': {
    'dourado': 'Dourado',
    'gold': 'Dourado',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Air M2, 2022
  'macbook air m2': {
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Air M3, 2024
  'macbook air m3': {
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Air M4
  'macbook air m4': {
    'azul céu': 'Azul Céu',
    'sky blue': 'Azul Céu',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'meia noite': 'Meia Noite',
    'midnight': 'Meia Noite',
  },
  // MacBook Pro M1, 2020
  'macbook pro m1': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Pro M1 Pro/Max, 2021
  'macbook pro m1 pro': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  'macbook pro m1 max': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Pro M2, 2022
  'macbook pro m2': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Pro M2 Pro/Max, 2023
  'macbook pro m2 pro': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  'macbook pro m2 max': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
  },
  // MacBook Pro M3/M3 Pro/M3 Max, 2023
  'macbook pro m3': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
  },
  'macbook pro m3 pro': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
  },
  'macbook pro m3 max': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'cinza espacial': 'Cinza Espacial',
    'space gray': 'Cinza Espacial',
    'spacegrey': 'Cinza Espacial',
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
  },
  // MacBook Pro M4/M4 Pro/M4 Max, 2024
  'macbook pro m4': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
  },
  'macbook pro m4 pro': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
  },
  'macbook pro m4 max': {
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'preto espacial': 'Preto Espacial',
    'space black': 'Preto Espacial',
  },
  // Apple Watch SE 2ª geração
  'apple watch se 2': {
    'meia-noite': 'Meia-noite',
    'meia noite': 'Meia-noite',
    'midnight': 'Meia-noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'prateado': 'Prateado',
    'silver': 'Prateado',
  },
  // Apple Watch Series 9 - Alumínio
  'apple watch series 9': {
    'meia-noite': 'Meia-noite',
    'meia noite': 'Meia-noite',
    'midnight': 'Meia-noite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'product)red': 'Product Red',
    'product red': 'Product Red',
    'red': 'Product Red',
    'vermelho': 'Product Red',
    'verde': 'Verde',
    'green': 'Verde',
    'azul': 'Azul',
    'blue': 'Azul',
    // Aço inoxidável
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    'dourado': 'Dourado',
    'gold': 'Dourado',
  },
  // Apple Watch Series 10 - Alumínio e Titânio
  'apple watch series 10': {
    // Alumínio
    'jet black': 'Jet Black',
    'preto brilhante': 'Jet Black',
    'silver': 'Silver',
    'prata': 'Silver',
    'rose gold': 'Rose Gold',
    'ouro rosa': 'Rose Gold',
    // Titânio
    'natural': 'Natural',
    'titânio natural': 'Natural',
    'titanium natural': 'Natural',
    'gold': 'Gold',
    'dourado': 'Gold',
    'slate': 'Slate',
    'ardósia': 'Slate',
  },
  // Apple Watch Series 11 - Alumínio e Titânio
  'apple watch series 11': {
    // Alumínio
    'ouro rosa': 'Ouro Rosa',
    'rose gold': 'Ouro Rosa',
    'prateado': 'Prateado',
    'silver': 'Prateado',
    'preto brilhante': 'Preto Brilhante',
    'jet black': 'Preto Brilhante',
    'cinza-espacial': 'Cinza-Espacial',
    'cinza espacial': 'Cinza-Espacial',
    'space gray': 'Cinza-Espacial',
    'spacegrey': 'Cinza-Espacial',
    // Titânio
    'natural': 'Natural',
    'titânio natural': 'Natural',
    'titanium natural': 'Natural',
    'dourado': 'Dourado',
    'gold': 'Dourado',
    'ardósia': 'Ardósia',
    'slate': 'Ardósia',
  },
  // Apple Watch Ultra 2
  'apple watch ultra 2': {
    'titânio natural': 'Titânio Natural',
    'titanium natural': 'Titânio Natural',
    'natural titanium': 'Titânio Natural',
    'titânio preto': 'Titânio Preto',
    'titanium black': 'Titânio Preto',
    'black titanium': 'Titânio Preto',
  },
  // Apple Watch Ultra 3
  'apple watch ultra 3': {
    'titânio natural': 'Titânio Natural',
    'titanium natural': 'Titânio Natural',
    'natural titanium': 'Titânio Natural',
    'titânio preto': 'Titânio Preto',
    'titanium black': 'Titânio Preto',
    'black titanium': 'Titânio Preto',
  },
}

// Função para identificar o modelo do iPhone
function identifyIPhoneModel(model = '') {
  if (!model) return null
  
  const lowerModel = model.toLowerCase().trim()
  
  // Verificar modelos específicos primeiro (mais específicos primeiro)
  if (lowerModel.includes('iphone 17 pro max')) return 'iphone 17 pro max'
  if (lowerModel.includes('iphone 17 pro')) return 'iphone 17 pro'
  if (lowerModel.includes('iphone 17')) return 'iphone 17'
  
  if (lowerModel.includes('iphone 16 pro max')) return 'iphone 16 pro max'
  if (lowerModel.includes('iphone 16 pro')) return 'iphone 16 pro'
  if (lowerModel.includes('iphone 16 plus')) return 'iphone 16 plus'
  if (lowerModel.includes('iphone 16')) return 'iphone 16'
  
  if (lowerModel.includes('iphone 15 pro max')) return 'iphone 15 pro max'
  if (lowerModel.includes('iphone 15 pro')) return 'iphone 15 pro'
  if (lowerModel.includes('iphone 15 plus')) return 'iphone 15 plus'
  if (lowerModel.includes('iphone 15')) return 'iphone 15'
  
  if (lowerModel.includes('iphone 14 pro max')) return 'iphone 14 pro max'
  if (lowerModel.includes('iphone 14 pro')) return 'iphone 14 pro'
  if (lowerModel.includes('iphone 14 plus')) return 'iphone 14 plus'
  if (lowerModel.includes('iphone 14')) return 'iphone 14'
  
  if (lowerModel.includes('iphone 13 pro max')) return 'iphone 13 pro max'
  if (lowerModel.includes('iphone 13 pro')) return 'iphone 13 pro'
  if (lowerModel.includes('iphone 13 mini')) return 'iphone 13 mini'
  if (lowerModel.includes('iphone 13')) return 'iphone 13'
  
  if (lowerModel.includes('iphone 12 pro max')) return 'iphone 12 pro max'
  if (lowerModel.includes('iphone 12 pro')) return 'iphone 12 pro'
  if (lowerModel.includes('iphone 12 mini')) return 'iphone 12 mini'
  if (lowerModel.includes('iphone 12')) return 'iphone 12'
  
  if (lowerModel.includes('iphone 11 pro max')) return 'iphone 11 pro max'
  if (lowerModel.includes('iphone 11 pro')) return 'iphone 11 pro'
  if (lowerModel.includes('iphone 11')) return 'iphone 11'
  
  if (lowerModel.includes('iphone air')) return 'iphone air'
  
  // Verificar iPads
  if (lowerModel.includes('ipad pro 13') && (lowerModel.includes('m4') || lowerModel.includes('m 4'))) {
    return 'ipad pro 13 m4'
  }
  if (lowerModel.includes('ipad pro 11') && (lowerModel.includes('m4') || lowerModel.includes('m 4'))) {
    return 'ipad pro 11 m4'
  }
  if (lowerModel.includes('ipad pro 12.9') && (lowerModel.includes('m2') || lowerModel.includes('m 2'))) {
    return 'ipad pro 12.9 m2'
  }
  if (lowerModel.includes('ipad pro 11') && (lowerModel.includes('m2') || lowerModel.includes('m 2'))) {
    return 'ipad pro 11 m2'
  }
  if (lowerModel.includes('ipad air 6') || (lowerModel.includes('ipad air') && lowerModel.includes('6'))) {
    return 'ipad air 6'
  }
  if (lowerModel.includes('ipad air 5') || (lowerModel.includes('ipad air') && lowerModel.includes('5'))) {
    return 'ipad air 5'
  }
  if (lowerModel.includes('ipad 11') || (lowerModel.includes('ipad') && lowerModel.includes('11') && !lowerModel.includes('pro'))) {
    return 'ipad 11'
  }
  if (lowerModel.includes('ipad 10') || (lowerModel.includes('ipad') && lowerModel.includes('10') && !lowerModel.includes('pro'))) {
    return 'ipad 10'
  }
  // iPad genérico (fallback para outros modelos de iPad)
  if (lowerModel.includes('ipad')) {
    // Tentar identificar por características se possível
    return 'ipad' // Pode criar um mapeamento genérico se necessário
  }
  
  // Verificar MacBooks
  // MacBook Pro M4 (mais específicos primeiro)
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m4 max')) {
    return 'macbook pro m4 max'
  }
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m4 pro')) {
    return 'macbook pro m4 pro'
  }
  if (lowerModel.includes('macbook pro') && (lowerModel.includes('m4') || lowerModel.includes('m 4'))) {
    return 'macbook pro m4'
  }
  // MacBook Pro M3
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m3 max')) {
    return 'macbook pro m3 max'
  }
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m3 pro')) {
    return 'macbook pro m3 pro'
  }
  if (lowerModel.includes('macbook pro') && (lowerModel.includes('m3') || lowerModel.includes('m 3'))) {
    return 'macbook pro m3'
  }
  // MacBook Pro M2
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m2 max')) {
    return 'macbook pro m2 max'
  }
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m2 pro')) {
    return 'macbook pro m2 pro'
  }
  if (lowerModel.includes('macbook pro') && (lowerModel.includes('m2') || lowerModel.includes('m 2'))) {
    return 'macbook pro m2'
  }
  // MacBook Pro M1
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m1 max')) {
    return 'macbook pro m1 max'
  }
  if (lowerModel.includes('macbook pro') && lowerModel.includes('m1 pro')) {
    return 'macbook pro m1 pro'
  }
  if (lowerModel.includes('macbook pro') && (lowerModel.includes('m1') || lowerModel.includes('m 1'))) {
    return 'macbook pro m1'
  }
  // MacBook Air
  if (lowerModel.includes('macbook air') && (lowerModel.includes('m4') || lowerModel.includes('m 4'))) {
    return 'macbook air m4'
  }
  if (lowerModel.includes('macbook air') && (lowerModel.includes('m3') || lowerModel.includes('m 3'))) {
    return 'macbook air m3'
  }
  if (lowerModel.includes('macbook air') && (lowerModel.includes('m2') || lowerModel.includes('m 2'))) {
    return 'macbook air m2'
  }
  if (lowerModel.includes('macbook air') && (lowerModel.includes('m1') || lowerModel.includes('m 1'))) {
    return 'macbook air m1'
  }
  // MacBook genérico (fallback)
  if (lowerModel.includes('macbook')) {
    return 'macbook'
  }
  
  // Verificar Apple Watch
  if (lowerModel.includes('apple watch ultra 3') || (lowerModel.includes('apple watch ultra') && lowerModel.includes('3'))) {
    return 'apple watch ultra 3'
  }
  if (lowerModel.includes('apple watch ultra 2') || (lowerModel.includes('apple watch ultra') && lowerModel.includes('2'))) {
    return 'apple watch ultra 2'
  }
  if (lowerModel.includes('apple watch series 11') || (lowerModel.includes('apple watch') && lowerModel.includes('series 11'))) {
    return 'apple watch series 11'
  }
  if (lowerModel.includes('apple watch series 10') || (lowerModel.includes('apple watch') && lowerModel.includes('series 10'))) {
    return 'apple watch series 10'
  }
  if (lowerModel.includes('apple watch series 9') || (lowerModel.includes('apple watch') && lowerModel.includes('series 9'))) {
    return 'apple watch series 9'
  }
  if (lowerModel.includes('apple watch se 2') || (lowerModel.includes('apple watch se') && lowerModel.includes('2'))) {
    return 'apple watch se 2'
  }
  // Apple Watch genérico (fallback)
  if (lowerModel.includes('apple watch')) {
    return 'apple watch'
  }
  
  return null
}

/**
 * Normaliza uma cor para o nome padrão baseado no modelo
 * @param {string} color - Cor a ser normalizada
 * @param {string} model - Modelo do produto (opcional, usado para identificar qual mapeamento usar)
 * @returns {string} Cor normalizada
 */
function normalizeColor(color, model = '') {
  if (!color) return null
  
  const lower = color.toLowerCase().trim()
  const identifiedModel = identifyIPhoneModel(model)
  
  // Se encontrou o modelo, usar mapeamento específico
  if (identifiedModel && modelColorMappings[identifiedModel]) {
    const modelMapping = modelColorMappings[identifiedModel]
    
    // Tentar mapeamento completo primeiro
    if (modelMapping[lower]) {
      return modelMapping[lower]
    }
    
    // Tentar por palavras individuais (para cores compostas)
    const words = lower.split(/\s+/)
    for (const word of words) {
      if (modelMapping[word]) {
        return modelMapping[word]
      }
    }
    
    // Tentar combinações (ex: "titanium blue" -> "titânio azul")
    const fullPhrase = words.join(' ')
    if (modelMapping[fullPhrase]) {
      return modelMapping[fullPhrase]
    }
  }
  
  // Se não encontrou mapeamento específico, retornar cor original capitalizada
  return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()
}

/**
 * Gera condições SQL para buscar por cor normalizada
 * Quando buscar por "Laranja", deve encontrar "Laranja", "Cosmic orange", etc.
 * @param {string} normalizedColor - Cor normalizada para buscar
 * @returns {string} Condição SQL ILIKE
 */
function getColorSearchConditions(normalizedColor) {
  if (!normalizedColor) return null
  
  const lower = normalizedColor.toLowerCase()
  
  // Mapear de volta para variações possíveis baseado no modelo
  // Este mapeamento é mais genérico, usado para busca
  const variations = {
    'laranja': ['laranja', 'orange', 'cosmic orange', 'cosmic'],
    'azul': ['azul', 'blue', 'deep blue', 'midnight', 'pacific blue', 'sierra blue', 'ultramarine blue'],
    'branco': ['branco', 'white', 'prata', 'silver', 'starlight', 'titanium white', 'cloud white'],
    'preto': ['preto', 'black', 'space black', 'jet black', 'titanium black'],
    'rosa': ['rosa', 'pink', 'rose'],
    'vermelho': ['vermelho', 'red'],
    'verde': ['verde', 'green', 'midnight green', 'alpine green'],
    'amarelo': ['amarelo', 'yellow'],
    'roxo': ['roxo', 'purple', 'deep purple'],
    'dourado': ['dourado', 'gold', 'light gold'],
    'cinza': ['cinza', 'gray', 'grey', 'space gray', 'graphite'],
    'grafite': ['grafite', 'graphite'],
    'prateado': ['prateado', 'silver'],
    'titânio natural': ['titânio natural', 'natural titanium', 'titanium natural', 'natural'],
    'titânio azul': ['titânio azul', 'blue titanium', 'titanium blue'],
    'titânio branco': ['titânio branco', 'white titanium', 'titanium white'],
    'titânio preto': ['titânio preto', 'black titanium', 'titanium black'],
    'desert titanium': ['desert titanium', 'titânio desert'],
    'mist blue': ['mist blue', 'azul névoa', 'azul-nevoa', 'azul nevoa'],
    'lavanda': ['lavanda', 'lavender'],
    'sage': ['sage', 'sálvia', 'salvia'],
    'cosmic orange': ['cosmic orange', 'laranja cósmico'],
    'deep blue': ['deep blue', 'azul profundo'],
    'silver': ['silver', 'prata', 'prateado'],
    'sky blue': ['sky blue', 'azul céu'],
    'light gold': ['light gold', 'dourado claro'],
    'cloud white': ['cloud white', 'branco nuvem'],
    'space black': ['space black', 'preto espacial'],
  }
  
  const variants = variations[lower] || [normalizedColor]
  
  // Retornar condição SQL que busca por qualquer variação
  return variants.map(v => `LOWER(p.color) LIKE '%${v}%'`).join(' OR ')
}

// Mapeamento antigo para compatibilidade (será removido gradualmente)
const colorMap = {
  // Preto
  'black': 'Preto',
  'space black': 'Preto',
  'jet black': 'Preto',
  'preto': 'Preto',
  'titanium black': 'Preto',
  
  // Branco
  'white': 'Branco',
  'branco': 'Branco',
  'starlight': 'Branco',
  'titanium white': 'Branco',
  
  // Prata = Branco (para iPhone 17 Pro/Pro Max)
  'silver': 'Branco',
  'prata': 'Branco',
  
  // Azul
  'blue': 'Azul',
  'azul': 'Azul',
  'deep blue': 'Azul',
  'titanium blue': 'Azul',
  'midnight': 'Azul',
  
  // Laranja
  'orange': 'Laranja',
  'laranja': 'Laranja',
  'cosmic orange': 'Laranja',
  'cosmic': 'Laranja',
  
  // Outras cores
  'red': 'Vermelho',
  'vermelho': 'Vermelho',
  'green': 'Verde',
  'verde': 'Verde',
  'yellow': 'Amarelo',
  'amarelo': 'Amarelo',
  'purple': 'Roxo',
  'roxo': 'Roxo',
  'pink': 'Rosa',
  'rosa': 'Rosa',
  'rose': 'Rosa',
  'gold': 'Dourado',
  'dourado': 'Dourado',
  'gray': 'Cinza',
  'grey': 'Cinza',
  'cinza': 'Cinza',
  'natural': 'Natural',
  'desert': 'Desert',
  'lilac': 'Lilás',
  'lilas': 'Lilás',
  'titanium': 'Titânio',
  'titanium natural': 'Natural'
}

export { normalizeColor, getColorSearchConditions, colorMap }
