/**
 * Linhas fixas da tabela "Média de preço" (lacrado) e casamento com o campo `model` da API.
 * Ordem: mais específico primeiro no array de matchers.
 *
 * iPhone 17 Pro Max: médias separadas por cor (demais modelos: uma linha por aparelho, todas as cores agregadas).
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
  unitCount: number
}

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

export function matchIphonePriceTableLabel(rawModel: string): (typeof IPHONE_PRICE_TABLE_ORDER)[number] | null {
  const s = (rawModel || '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!s.includes('iphone')) return null
  for (const { label, test } of ORDERED_MATCHERS) {
    if (test(s)) return label
  }
  return null
}

const PM17_LABEL = 'iPhone 17 Pro Max' as const

function bucket17ProMaxColor(rawColor: string | null | undefined, model: string): string | null {
  if (matchIphonePriceTableLabel(model) !== PM17_LABEL) return null
  const nc = (normalizeColor(rawColor || '', model) || '').trim()
  if ((IPHONE_17_PRO_MAX_COLOR_KEYS as readonly string[]).includes(nc)) return nc
  return null
}

/** Média/min/max por cor oficial (somente iPhone 17 Pro Max). */
export function aggregateIphone17ProMaxByColor(rows: AvgInput[]): Map<string, IphoneTableAgg> {
  const map = new Map<string, { sumW: number; n: number; min: number | null; max: number | null }>()
  for (const r of rows) {
    const colorKey = bucket17ProMaxColor(r.color ?? '', r.model)
    if (!colorKey) continue
    const prev = map.get(colorKey) || { sumW: 0, n: 0, min: null as number | null, max: null as number | null }
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
    map.set(colorKey, prev)
  }
  const out = new Map<string, IphoneTableAgg>()
  for (const [colorKey, v] of map) {
    out.set(colorKey, {
      weightedAvg: v.n > 0 ? v.sumW / v.n : 0,
      min: v.min,
      max: v.max,
      unitCount: v.n,
    })
  }
  return out
}

export function selectionKey17ProMax(colorKey: string): string {
  return `${PM17_LABEL}::${colorKey}`
}

/** Uma linha por aparelho; cores agregadas. iPhone 17 Pro Max fica de fora (usa aggregateIphone17ProMaxByColor). */
export function aggregateIphoneAveragesByTableRow(rows: AvgInput[]): Map<string, IphoneTableAgg> {
  const map = new Map<string, { sumW: number; n: number; min: number | null; max: number | null }>()
  for (const r of rows) {
    const label = matchIphonePriceTableLabel(r.model)
    if (!label || label === PM17_LABEL) continue
    const prev = map.get(label) || { sumW: 0, n: 0, min: null as number | null, max: null as number | null }
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
    map.set(label, prev)
  }
  const out = new Map<string, IphoneTableAgg>()
  for (const [label, v] of map) {
    out.set(label, {
      weightedAvg: v.n > 0 ? v.sumW / v.n : 0,
      min: v.min,
      max: v.max,
      unitCount: v.n,
    })
  }
  return out
}

export function roundTo50(n: number): number {
  return Math.round(n / 50) * 50
}
