// Função para normalizar cores - unifica variações para nomes padrão
// Mapeia todas as variações para nomes padrão em português
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

/**
 * Normaliza uma cor para o nome padrão
 * @param {string} color - Cor a ser normalizada
 * @param {string} model - Modelo do produto (opcional, usado para casos especiais como iPhone 17 Pro)
 * @returns {string} Cor normalizada
 */
function normalizeColor(color, model = '') {
  if (!color) return null
  
  const lower = color.toLowerCase().trim()
  
  // Para iPhone 17 Pro/Pro Max: Prata = Branco
  if (model && (model.includes('17 Pro') || model.includes('17 Pro Max'))) {
    if (lower === 'prata' || lower === 'silver') {
      return 'Branco'
    }
  }
  
  // Tentar mapeamento completo primeiro (ex: "cosmic orange")
  if (colorMap[lower]) {
    return colorMap[lower]
  }
  
  // Tentar por palavras individuais
  const words = lower.split(/\s+/)
  for (const word of words) {
    if (colorMap[word]) {
      return colorMap[word]
    }
  }
  
  // Tentar primeira palavra
  if (words.length > 0 && colorMap[words[0]]) {
    return colorMap[words[0]]
  }
  
  // Se não encontrar, retornar a cor original capitalizada
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
  
  // Mapear de volta para variações possíveis
  const variations = {
    'laranja': ['laranja', 'orange', 'cosmic orange', 'cosmic'],
    'azul': ['azul', 'blue', 'deep blue', 'midnight'],
    'branco': ['branco', 'white', 'prata', 'silver', 'starlight'],
    'preto': ['preto', 'black', 'space black', 'jet black'],
    'rosa': ['rosa', 'pink', 'rose'],
    'vermelho': ['vermelho', 'red'],
    'verde': ['verde', 'green'],
    'amarelo': ['amarelo', 'yellow'],
    'roxo': ['roxo', 'purple'],
    'dourado': ['dourado', 'gold'],
    'cinza': ['cinza', 'gray', 'grey'],
    'natural': ['natural'],
    'desert': ['desert'],
    'lilás': ['lilás', 'lilac', 'lilas']
  }
  
  const variants = variations[lower] || [normalizedColor]
  
  // Retornar condição SQL que busca por qualquer variação
  return variants.map(v => `LOWER(p.color) LIKE '%${v}%'`).join(' OR ')
}

export { normalizeColor, getColorSearchConditions, colorMap }

