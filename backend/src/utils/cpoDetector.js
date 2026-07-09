/**
 * CPO (Certified Pre-Owned Apple) = NOVO / lacrado no iGestorPhone.
 * Nunca deve cair em seminovo (diferente de AS IS / SWAP / VITRINE).
 */

const CPO_RE = /\bcpo\b|certified\s*pre[-\s]*owned/i

/**
 * @param {Record<string, unknown>} product
 * @returns {boolean}
 */
export function hasCpoSignal(product = {}) {
  const parts = [
    product.name,
    product.model,
    product.color,
    product.storage,
    product.variant,
    product.condition_detail,
    product.condition,
    product.notes,
  ]
  return parts.some((v) => typeof v === 'string' && CPO_RE.test(v))
}

/**
 * Força classificação de CPO como Novo.
 * @param {Record<string, unknown>} product
 * @returns {Record<string, unknown>}
 */
export function forceCpoNovo(product = {}) {
  const next = { ...product }
  next.condition = 'Novo'
  next.condition_detail = 'CPO'
  if (!next.variant || !/\bcpo\b/i.test(String(next.variant))) {
    next.variant = 'CPO'
  }
  return next
}
