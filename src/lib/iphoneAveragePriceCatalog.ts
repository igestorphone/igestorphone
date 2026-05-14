/**
 * Linhas da tabela "Média de preço" (lacrado): casamento de modelo + normalização de armazenamento.
 * - Demais iPhones: uma linha por modelo + capacidade (cores agregadas).
 * - iPhone 17 Pro Max: uma linha por capacidade + cor oficial (Laranja / Azul / Prateado).
 */

import { normalizeColor } from '@/pages/colorNormalizer'

export const IPHONE_17_PRO_MAX_COLOR_KEYS = ['Laranja Cósmico', 'Azul Intenso', 'Prateado'] as const

export const IPHONE_PRICE_TABLE_ORDER: readonly string[] = [
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12 mini',
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13 mini',
  'iPhone 13',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16e',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 17e',
  'iPhone 17',
  'iPhone Air',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
] as const

export type AvgInput = {
  model: string
  color?: string | null
  storage?: string | null
  avg_price: number
  count: number
  min_price: number | null
  max_price: number | null
}

export type IphoneTableAgg = {
  weightedAvg: number
  min: number | null
  max: number | null
}

/** Menor exibido não fica muito abaixo da média ponderada (uma cor/fornecedor puxa outlier). */
const REF_MIN_FLOOR_VS_AVG = 0.92

const ORDERED_MATCHERS: { label: (typeof IPHONE_PRICE_TABLE_ORDER)[number]; test: (s: string) => boolean }[] = [
  { label: 'iPhone 17 Pro Max', test: (s) => /\biphone\s*17\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 17 Pro', test: (s) => /\biphone\s*17\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  { label: 'iPhone Air', test: (s) => /\biphone\s*air\b/i.test(s) },
  { label: 'iPhone 17e', test: (s) => /\biphone\s*17\s*e\b|\biphone\s*17e\b/i.test(s) },
  {
    label: 'iPhone 17',
    test: (s) =>
      /\biphone\s*17\b/i.test(s) &&
      !/\biphone\s*17\s*pro\b/i.test(s) &&
      !/\biphone\s*17\s*plus\b/i.test(s) &&
      !/\biphone\s*17\s*e\b/i.test(s) &&
      !/\biphone\s*17e\b/i.test(s) &&
      !/\biphone\s*air\b/i.test(s),
  },
  { label: 'iPhone 16 Pro Max', test: (s) => /\biphone\s*16\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 16 Pro', test: (s) => /\biphone\s*16\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  { label: 'iPhone 16 Plus', test: (s) => /\biphone\s*16\s*plus\b/i.test(s) },
  { label: 'iPhone 16e', test: (s) => /\biphone\s*16\s*e\b|\biphone\s*16e\b/i.test(s) },
  {
    label: 'iPhone 16',
    test: (s) =>
      /\biphone\s*16\b/i.test(s) &&
      !/\biphone\s*16\s*pro\b/i.test(s) &&
      !/\biphone\s*16\s*plus\b/i.test(s) &&
      !/\biphone\s*16\s*e\b/i.test(s) &&
      !/\biphone\s*16e\b/i.test(s),
  },
  { label: 'iPhone 15 Pro Max', test: (s) => /\biphone\s*15\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 15 Pro', test: (s) => /\biphone\s*15\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  { label: 'iPhone 15 Plus', test: (s) => /\biphone\s*15\s*plus\b/i.test(s) },
  {
    label: 'iPhone 15',
    test: (s) =>
      /\biphone\s*15\b/i.test(s) &&
      !/\biphone\s*15\s*pro\b/i.test(s) &&
      !/\biphone\s*15\s*plus\b/i.test(s),
  },
  { label: 'iPhone 14 Pro Max', test: (s) => /\biphone\s*14\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 14 Pro', test: (s) => /\biphone\s*14\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  { label: 'iPhone 14 Plus', test: (s) => /\biphone\s*14\s*plus\b/i.test(s) },
  {
    label: 'iPhone 14',
    test: (s) =>
      /\biphone\s*14\b/i.test(s) &&
      !/\biphone\s*14\s*pro\b/i.test(s) &&
      !/\biphone\s*14\s*plus\b/i.test(s),
  },
  { label: 'iPhone 13 Pro Max', test: (s) => /\biphone\s*13\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 13 Pro', test: (s) => /\biphone\s*13\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  { label: 'iPhone 13 mini', test: (s) => /\biphone\s*13\s*mini\b/i.test(s) },
  {
    label: 'iPhone 13',
    test: (s) =>
      /\biphone\s*13\b/i.test(s) &&
      !/\biphone\s*13\s*pro\b/i.test(s) &&
      !/\biphone\s*13\s*mini\b/i.test(s),
  },
  { label: 'iPhone 12 Pro Max', test: (s) => /\biphone\s*12\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 12 Pro', test: (s) => /\biphone\s*12\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  { label: 'iPhone 12 mini', test: (s) => /\biphone\s*12\s*mini\b/i.test(s) },
  {
    label: 'iPhone 12',
    test: (s) =>
      /\biphone\s*12\b/i.test(s) &&
      !/\biphone\s*12\s*pro\b/i.test(s) &&
      !/\biphone\s*12\s*mini\b/i.test(s),
  },
  { label: 'iPhone 11 Pro Max', test: (s) => /\biphone\s*11\s*pro\s*max\b/i.test(s) },
  { label: 'iPhone 11 Pro', test: (s) => /\biphone\s*11\s*pro\b/i.test(s) && !/\bmax\b/i.test(s) },
  {
    label: 'iPhone 11',
    test: (s) => /\biphone\s*11\b/i.test(s) && !/\biphone\s*11\s*pro\b/i.test(s),
  },
]

export const PM17_LABEL = 'iPhone 17 Pro Max' as const

export function matchIphonePriceTableLabel(rawModel: string): (typeof IPHONE_PRICE_TABLE_ORDER)[number] | null {
  const s = (rawModel || '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!s.includes('iphone')) return null
  for (const { label, test } of ORDERED_MATCHERS) {
    if (test(s)) return label
  }
  return null
}

/** Normaliza texto de armazenamento da API para chave estável (ex.: 256GB, 1T). */
export function normalizeStorageKey(raw: string | null | undefined): string {
  const s0 = String(raw ?? '').trim()
  if (!s0 || s0 === '—' || s0 === 'N/A' || s0 === '-') return ''
  const s = s0.replace(/\s+/g, ' ').trim()
  const upper = s.toUpperCase()
  if (/\b1\s*T(?:B)?\b/i.test(s)) return '1T'
  if (/\b2\s*T(?:B)?\b/i.test(s)) return '2T'
  const m = upper.match(/\b(8|16|32|64|128|256|512|1024|2048)\s*G(?:B)?\b/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (n === 1024) return '1T'
    if (n === 2048) return '2T'
    return `${n}GB`
  }
  return ''
}

function storageSortKey(st: string): number {
  const g = st.match(/^(\d+)GB$/i)
  if (g) return parseInt(g[1], 10)
  const t = st.match(/^(\d+)T$/i)
  if (t) return 100000 + parseInt(t[1], 10) * 1000
  return 999999
}

export function deviceAggKey(label: string, storage: string): string {
  return `${label}::${storage}`
}

export function pm17AggKey(storage: string, colorKey: string): string {
  return `${storage}::${colorKey}`
}

export function selectionKey17ProMax(storage: string, colorKey: string): string {
  return `${PM17_LABEL}::${storage}::${colorKey}`
}

function bucket17ProMaxColor(rawColor: string | null | undefined, model: string): string | null {
  if (matchIphonePriceTableLabel(model) !== PM17_LABEL) return null
  const nc = (normalizeColor(rawColor || '', model) || '').trim()
  if ((IPHONE_17_PRO_MAX_COLOR_KEYS as readonly string[]).includes(nc)) return nc
  return null
}

/** Média/min/max por capacidade + cor (somente iPhone 17 Pro Max). */
export function aggregateIphone17ProMaxByStorageAndColor(rows: AvgInput[]): Map<string, IphoneTableAgg> {
  const map = new Map<string, { sumW: number; n: number; min: number | null; max: number | null }>()
  for (const r of rows) {
    const colorKey = bucket17ProMaxColor(r.color ?? '', r.model)
    if (!colorKey) continue
    const st = normalizeStorageKey(r.storage)
    if (!st) continue
    const k = pm17AggKey(st, colorKey)
    const prev = map.get(k) || { sumW: 0, n: 0, min: null as number | null, max: null as number | null }
    prev.sumW += Number(r.avg_price) * Number(r.count || 0)
    prev.n += Number(r.count || 0)
    const mn = r.min_price != null ? Number(r.min_price) : null
    const mx = r.max_price != null ? Number(r.max_price) : null
    if (mn != null && !Number.isNaN(mn)) {
      prev.min = prev.min == null ? mn : Math.min(prev.min, mn)
    }
    if (mx != null && !Number.isNaN(mx)) {
      prev.max = prev.max == null ? mx : Math.max(prev.max, mx)
    }
    map.set(k, prev)
  }
  const out = new Map<string, IphoneTableAgg>()
  for (const [k, v] of map) {
    const wAvg = v.n > 0 ? v.sumW / v.n : 0
    const minOut =
      v.min != null && wAvg > 0 && Number.isFinite(v.min) && Number.isFinite(wAvg)
        ? Math.max(v.min, wAvg * REF_MIN_FLOOR_VS_AVG)
        : v.min
    out.set(k, {
      weightedAvg: wAvg,
      min: minOut,
      max: v.max,
    })
  }
  return out
}

/** Uma entrada por modelo + capacidade; cores agregadas. Exclui iPhone 17 Pro Max. */
export function aggregateIphoneAveragesByTableRow(rows: AvgInput[]): Map<string, IphoneTableAgg> {
  const map = new Map<string, { sumW: number; n: number; min: number | null; max: number | null }>()
  for (const r of rows) {
    const label = matchIphonePriceTableLabel(r.model)
    if (!label || label === PM17_LABEL) continue
    const st = normalizeStorageKey(r.storage)
    if (!st) continue
    const k = deviceAggKey(label, st)
    const prev = map.get(k) || { sumW: 0, n: 0, min: null as number | null, max: null as number | null }
    prev.sumW += Number(r.avg_price) * Number(r.count || 0)
    prev.n += Number(r.count || 0)
    const mn = r.min_price != null ? Number(r.min_price) : null
    const mx = r.max_price != null ? Number(r.max_price) : null
    if (mn != null && !Number.isNaN(mn)) {
      prev.min = prev.min == null ? mn : Math.min(prev.min, mn)
    }
    if (mx != null && !Number.isNaN(mx)) {
      prev.max = prev.max == null ? mx : Math.max(prev.max, mx)
    }
    map.set(k, prev)
  }
  const out = new Map<string, IphoneTableAgg>()
  for (const [k, v] of map) {
    const wAvg = v.n > 0 ? v.sumW / v.n : 0
    const minOut =
      v.min != null && wAvg > 0 && Number.isFinite(v.min) && Number.isFinite(wAvg)
        ? Math.max(v.min, wAvg * REF_MIN_FLOOR_VS_AVG)
        : v.min
    out.set(k, {
      weightedAvg: wAvg,
      min: minOut,
      max: v.max,
    })
  }
  return out
}

export function listStoragesForDeviceAgg(agg: Map<string, IphoneTableAgg>, label: string): string[] {
  const prefix = `${label}::`
  const found = new Set<string>()
  for (const key of agg.keys()) {
    if (key.startsWith(prefix)) found.add(key.slice(prefix.length))
  }
  return Array.from(found).sort((a, b) => storageSortKey(a) - storageSortKey(b))
}

export function listStoragesFor17PmAgg(agg: Map<string, IphoneTableAgg>): string[] {
  const found = new Set<string>()
  for (const key of agg.keys()) {
    const [st] = key.split('::')
    if (st) found.add(st)
  }
  return Array.from(found).sort((a, b) => storageSortKey(a) - storageSortKey(b))
}

export function roundTo50(n: number): number {
  return Math.round(n / 50) * 50
}
