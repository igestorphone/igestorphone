/**
 * AirTag = acessório Apple SEMPRE Novo/Lacrado.
 * Normaliza para AIRTAG 1 PACK ou AIRTAG 4 PACK (kits de 1 vs 4 unidades).
 */

const AIRTAG_RE = /\bair\s*-?\s*tags?\b/i

/** Sinais claros de kit com 4 unidades. */
const PACK4_RE =
  /\b(?:4\s*-?\s*pack|pack\s*-?\s*4|x\s*4|4\s*x|kit\s*-?\s*4|4\s*(?:un(?:idades?)?|pcs?|pe[cç]as?))\b/i

/** Sinais claros de unidade avulsa / 1 pack. */
const PACK1_RE =
  /\b(?:1\s*-?\s*pack|pack\s*-?\s*1|x\s*1|1\s*x|kit\s*-?\s*1|1\s*(?:un(?:idade)?|pcs?|pe[cç]a)|unit[aá]ri[oa]|single)\b/i

/**
 * @param {Record<string, unknown>} product
 * @returns {boolean}
 */
export function hasAirTagSignal(product = {}) {
  const parts = [product.name, product.model, product.notes, product.description]
  return parts.some((v) => typeof v === 'string' && AIRTAG_RE.test(v))
}

/**
 * @param {Record<string, unknown>} product
 * @returns {'AIRTAG 1 PACK' | 'AIRTAG 4 PACK' | null}
 */
export function detectAirTagPack(product = {}) {
  if (!hasAirTagSignal(product)) return null

  const blob = [product.name, product.model, product.notes, product.description, product.storage, product.variant]
    .filter((v) => typeof v === 'string')
    .join(' ')

  if (PACK4_RE.test(blob)) return 'AIRTAG 4 PACK'
  if (PACK1_RE.test(blob)) return 'AIRTAG 1 PACK'
  // Sem quantidade explícita → unidade avulsa (o mais comum nas listas)
  return 'AIRTAG 1 PACK'
}

/**
 * Força nome/modelo canônicos e condição Novo/LACRADO.
 * @param {Record<string, unknown>} product
 * @returns {Record<string, unknown>}
 */
export function normalizeAirTagProduct(product = {}) {
  const pack = detectAirTagPack(product)
  if (!pack) return product

  return {
    ...product,
    name: pack,
    model: pack,
    condition: 'Novo',
    condition_detail: 'LACRADO',
    // AirTag não tem storage/cor relevante para dedup
    storage: product.storage && /\d+\s*(GB|TB)/i.test(String(product.storage)) ? product.storage : null,
  }
}
