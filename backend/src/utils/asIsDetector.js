/**
 * AS IS / ASIS = seminovo (Apple refurbished / as-is).
 * Às vezes vem misturado em lista de lacrados — nunca deve salvar como Novo/LACRADO.
 */

const AS_IS_RE =
  /\bas[\s._-]*is\+?\b|\basis\+?\b|\bas[\s._-]*is[\s._-]*plus\b/i

/**
 * @param {Record<string, unknown>} product
 * @returns {boolean}
 */
export function hasAsIsSignal(product = {}) {
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
  return parts.some((v) => typeof v === 'string' && AS_IS_RE.test(v))
}

/**
 * Força classificação de seminovo AS IS.
 * @param {Record<string, unknown>} product
 * @returns {Record<string, unknown>}
 */
export function forceAsIsSeminovo(product = {}) {
  const next = { ...product }
  next.condition = 'Seminovo'
  const blob = [
    next.condition_detail,
    next.variant,
    next.name,
    next.model,
    next.notes,
  ]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toUpperCase()

  if (/\bASIS\+/.test(blob) || /AS\s*IS\s*\+/.test(blob)) {
    next.condition_detail = 'ASIS+'
  } else if (/AS\s*IS\s*PLUS/.test(blob) || /\bASIS\s*PLUS\b/.test(blob)) {
    next.condition_detail = 'AS IS PLUS'
  } else {
    next.condition_detail = 'ASIS'
  }
  return next
}
