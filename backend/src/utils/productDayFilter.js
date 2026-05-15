/** Ban WPP / sem lista nova: tratar ontem como hoje nas consultas por dia (SP). */
export function useYesterdayAsToday() {
  const v = String(process.env.USE_YESTERDAY_AS_TODAY || '').toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
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

/** Números exibidos no topo da busca (temporário — ban 24h WPP). */
export function statsDisplayOverrideEnabled() {
  const v = String(process.env.STATS_DISPLAY_OVERRIDE || '').toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
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
