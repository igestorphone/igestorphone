/** Lê env: vazio = defaultOn; "false" desliga; "true" liga. */
function envEnabled(name, defaultOn = false) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return defaultOn
  const v = String(raw).toLowerCase().trim()
  if (v === 'false' || v === '0' || v === 'no') return false
  return v === 'true' || v === '1' || v === 'yes'
}

/** Ban WPP: por padrão LIGADO até definir USE_YESTERDAY_AS_TODAY=false no servidor. */
export function useYesterdayAsToday() {
  return envEnabled('USE_YESTERDAY_AS_TODAY', true)
}

const TODAY_SP = `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`

/** Fragmento SQL: data de updated_at do produto = dia alvo (offset 0 = hoje SP). */
export function productUpdatedAtDayWhere(offsetInt = 0, alias = 'p') {
  const offset = Number.isFinite(offsetInt) ? Math.trunc(offsetInt) : 0
  const targetExpr = `(${TODAY_SP} + ${offset})`
  const dateCol = `(${alias}.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`
  if (useYesterdayAsToday() && offset === 0) {
    return `(${dateCol} = ${targetExpr} OR ${dateCol} = (${TODAY_SP} - 1))`
  }
  return `${dateCol} = ${targetExpr}`
}

/** Números 5287/98 no topo: por padrão LIGADO até STATS_DISPLAY_OVERRIDE=false. */
export function statsDisplayOverrideEnabled() {
  return envEnabled('STATS_DISPLAY_OVERRIDE', true)
}

export const STATS_DISPLAY_TOTALS = {
  total_products: 5287,
  total_suppliers: 98,
}

/** Mais lacrado, médio seminovo, menos android (soma = totais). */
export const STATS_DISPLAY_BY_MODE = {
  novo: { total_products: 3100, total_suppliers: 58 },
  lacrados_novos: { total_products: 3100, total_suppliers: 58 },
  seminovo: { total_products: 1550, total_suppliers: 27 },
  seminovos: { total_products: 1550, total_suppliers: 27 },
  android: { total_products: 637, total_suppliers: 13 },
}

export function resolveDisplayStats(searchMode) {
  if (!statsDisplayOverrideEnabled()) return null
  const key = (searchMode || '').toLowerCase().trim()
  if (key && STATS_DISPLAY_BY_MODE[key]) {
    return { ...STATS_DISPLAY_BY_MODE[key], display_override: true }
  }
  return { ...STATS_DISPLAY_TOTALS, display_override: true }
}
