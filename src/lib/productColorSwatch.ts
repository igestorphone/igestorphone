/** Cinza padrão: acessório ou sem cor informada. */
export const ACCESSORY_SWATCH_HEX = '#9ca3af'

/** Hex aproximado para bolinha de cor na listagem. */
const EXACT_HEX: Record<string, string> = {
  preto: '#1c1c1e',
  black: '#1c1c1e',
  branco: '#f5f5f7',
  white: '#f5f5f7',
  prata: '#c0c0c0',
  prateado: '#d4d4d8',
  silver: '#d4d4d8',
  dourado: '#d4af37',
  gold: '#d4af37',
  rose: '#e8b4b8',
  'rose gold': '#e8b4b8',
  vermelho: '#e53935',
  red: '#e53935',
  azul: '#2563eb',
  blue: '#2563eb',
  'azul-nevoa': '#a8c5da',
  'azul névoa': '#a8c5da',
  'mist blue': '#7eb6d7',
  'mistblue': '#7eb6d7',
  verde: '#22c55e',
  green: '#22c55e',
  sálvia: '#9caf88',
  salvia: '#9caf88',
  sage: '#9caf88',
  roxo: '#9333ea',
  purple: '#9333ea',
  lavanda: '#b794c4',
  lavender: '#b794c4',
  lilas: '#c084fc',
  'lilás': '#c084fc',
  amarelo: '#facc15',
  yellow: '#facc15',
  laranja: '#f97316',
  orange: '#f97316',
  'laranja cosmico': '#e85d04',
  'laranja cósmico': '#e85d04',
  'cosmic orange': '#e85d04',
  'cosmicorange': '#e85d04',
  'azul intenso': '#1e3a8a',
  'deep blue': '#1e40af',
  'azul pacífico': '#5b9bd5',
  'azul pacifico': '#5b9bd5',
  'pacific blue': '#5b9bd5',
  grafite: '#4b5563',
  graphite: '#4b5563',
  'cinza espacial': '#52525b',
  'space gray': '#52525b',
  'space grey': '#52525b',
  'spacegray': '#52525b',
  'verde meia noite': '#1e3d32',
  'midnight green': '#1e3d32',
  midnight: '#1e293b',
  starlight: '#f5f0e8',
  estelar: '#f5f0e8',
  'titânio deserto': '#c4a574',
  'titanio deserto': '#c4a574',
  'desert titanium': '#c4a574',
  'titânio natural': '#9a8f82',
  'titanio natural': '#9a8f82',
  natural: '#9a8f82',
  'titânio branco': '#e8e6e3',
  'titanio branco': '#e8e6e3',
  'titânio preto': '#2d2d2d',
  'titanio preto': '#2d2d2d',
  'black titanium': '#2d2d2d',
  'titânio azul': '#3d4f6f',
  'titanio azul': '#3d4f6f',
  'blue titanium': '#3d4f6f',
  coral: '#ff7f6e',
  pink: '#f9a8d4',
  rosa: '#f9a8d4',
  teal: '#0d9488',
  ultramarine: '#4169e1',
  'ultramarino': '#4169e1',
  cinza: '#6b7280',
  gray: '#6b7280',
  grey: '#6b7280',
}

function swatchKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function colorLabelToHex(label: string): string {
  const k = swatchKey(label)
  if (!k || k === 'n/a' || k === '-') return ACCESSORY_SWATCH_HEX
  if (EXACT_HEX[k]) return EXACT_HEX[k]
  if (k.includes('preto') || k.includes('black')) return '#1c1c1e'
  if (k.includes('branco') || k.includes('white') || k.includes('starlight') || k.includes('estelar'))
    return '#f5f5f7'
  if (k.includes('prata') || k.includes('silver')) return '#d4d4d8'
  if (k.includes('dourado') || k.includes('gold')) return '#d4af37'
  if (k.includes('azul') || k.includes('blue') || k.includes('ultramar')) return '#2563eb'
  if (k.includes('verde') || k.includes('green') || k.includes('sage') || k.includes('salvia'))
    return '#22c55e'
  if (k.includes('roxo') || k.includes('purple') || k.includes('lavanda')) return '#9333ea'
  if (k.includes('laranja') || k.includes('orange') || k.includes('cosmic')) return '#f97316'
  if (k.includes('vermelho') || k.includes('red')) return '#e53935'
  if (k.includes('rosa') || k.includes('pink') || k.includes('rose')) return '#f9a8d4'
  if (k.includes('amarelo') || k.includes('yellow')) return '#facc15'
  if (k.includes('grafite') || k.includes('graphite') || k.includes('cinza') || k.includes('gray'))
    return '#6b7280'
  if (k.includes('titânio') || k.includes('titanio') || k.includes('titanium')) return '#9a8f82'
  if (k.includes('teal')) return '#0d9488'
  if (k.includes('coral')) return '#ff7f6e'
  return ACCESSORY_SWATCH_HEX
}

export function isAccessoryCategory(categoryCode?: string | null): boolean {
  return categoryCode === 'ACSS'
}

export function isAccessoryProduct(product: { name?: string | null; model?: string | null }): boolean {
  const blob = `${product.name || ''} ${product.model || ''}`.toLowerCase()
  return (
    /\bacess[oó]ri/i.test(blob) ||
    /\bairtag\b/i.test(blob) ||
    /\bapple\s*pencil\b|\bpencil\s*(pro|usb)?\b/i.test(blob) ||
    /\bcapa\b|\bcase\b|\bcarregador|\bcabo\b|\bfonte\b|\bmagsafe\b|\bpel[ií]cula\b|\bsuporte\b|\bhub\b/i.test(blob) ||
    /\bhomepod\b/i.test(blob) ||
    /\badaptador\b/i.test(blob)
  )
}

export function resolveProductSwatch(opts: {
  rawColor?: string | null
  normalizedLabel?: string | null
  categoryCode?: string | null
  isAccessory?: boolean
}): { hex: string; title: string } {
  if (opts.isAccessory || isAccessoryCategory(opts.categoryCode)) {
    return { hex: ACCESSORY_SWATCH_HEX, title: 'Acessório' }
  }

  const raw = (opts.rawColor || '').trim()
  const norm = (opts.normalizedLabel || '').trim()
  const candidates = [norm, raw].filter((x) => x && x !== 'N/A' && x !== '—')

  for (const label of candidates) {
    return { hex: colorLabelToHex(label), title: label }
  }

  return { hex: ACCESSORY_SWATCH_HEX, title: 'Sem cor' }
}
