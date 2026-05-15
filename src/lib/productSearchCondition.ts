/** Filtro client-side alinhado à média de preços / busca lacrado (evita CPO e texto de seminovo). */

const LACRADO_DETAILS = new Set(['LACRADO', 'NOVO'])

const SEMINOVO_DETAILS = new Set([
  'SWAP',
  'VITRINE',
  'SEMINOVO',
  'SEMINOVO PREMIUM',
  'SEMINOVO AMERICANO',
  'NON ACTIVE',
  'ASIS',
  'ASIS+',
  'AS IS PLUS',
  'CPO',
])

const SEMINOVO_LISTING_RE =
  /seminovo|semi[\s-]*novo|recondicionado|pré[\s-]*usado|vitrine|swap|open\s*box|mostru[aá]rio|\bdisplay\b|non\s*active|\bcpo\b|\b2nd\b|second\s*hand|\busad[oa]\b|\bused\b|(?:^|[^\d,.])(8\d|9\d)\s*%/i

const VARIANT_SEMINOVO_RE = /swap|vitrine|seminovo|cpo|asis|recondicionado|non\s*active/i

export type ProductSearchModeFilter = 'novo' | 'seminovo' | 'android' | null

export function productListingBlob(product: {
  name?: string | null
  model?: string | null
  color?: string | null
  storage?: string | null
}): string {
  return `${product.name || ''} ${product.model || ''} ${product.color || ''} ${product.storage || ''}`.trim()
}

export function hasSeminovoListingSignals(product: {
  name?: string | null
  model?: string | null
  color?: string | null
  storage?: string | null
  variant?: string | null
}): boolean {
  if (SEMINOVO_LISTING_RE.test(productListingBlob(product))) return true
  const variant = (product.variant || '').trim()
  return variant.length > 0 && VARIANT_SEMINOVO_RE.test(variant)
}

export function isLacradoProduct(product: {
  condition?: string | null
  condition_detail?: string | null
  name?: string | null
  model?: string | null
  color?: string | null
  storage?: string | null
  variant?: string | null
}): boolean {
  const detail = (product.condition_detail || '').trim().toUpperCase()
  if (detail && !LACRADO_DETAILS.has(detail)) return false
  if (hasSeminovoListingSignals(product)) return false
  if (detail && LACRADO_DETAILS.has(detail)) return true
  const cond = (product.condition || '').trim().toLowerCase()
  return cond === 'novo' && !detail
}

export function isSeminovoProduct(product: {
  condition?: string | null
  condition_detail?: string | null
  name?: string | null
  model?: string | null
  color?: string | null
  storage?: string | null
  variant?: string | null
}): boolean {
  const detail = (product.condition_detail || '').trim().toUpperCase()
  if (detail && LACRADO_DETAILS.has(detail)) return false
  if (detail && SEMINOVO_DETAILS.has(detail)) return true
  const cond = (product.condition || '').trim().toLowerCase()
  if (cond === 'seminovo' && !detail) return true
  if (hasSeminovoListingSignals(product)) return true
  return false
}

export function matchesProductSearchMode(
  product: Parameters<typeof isLacradoProduct>[0],
  mode: ProductSearchModeFilter
): boolean {
  if (!mode || mode === 'android') return true
  if (mode === 'novo') return isLacradoProduct(product)
  if (mode === 'seminovo') return isSeminovoProduct(product)
  return true
}
