/** Modos da busca “mais barato” que afetam rótulo de categoria. */
export type CategorySearchMode = 'novo' | 'seminovo' | 'android' | null

/**
 * Código curto de categoria (referência mercado / lacrado).
 * Lacrado (novo): IPH, IPAD, MCB, PODS, RLG, ACSS; MNTR (monitor) => null (não exibir).
 * Seminovo: sempre SEMI.
 * Android: MI / NOTE / PAD / POCO / RDM / REAL (Xiaomi ecosystem); AND demais; Apple na mesma lista segue códigos Apple.
 */
export function getProductCategoryCode(
  product: { name?: string | null; model?: string | null },
  searchMode: CategorySearchMode
): string | null {
  if (searchMode === 'seminovo') return 'SEMI'

  const blob = `${product.name || ''} ${product.model || ''}`.toLowerCase()

  if (searchMode === 'android') {
    if (/\biphone\b|\bipad\b|\bmacbook\b|\bairpods\b|\bapple watch\b|\bwatch\b|\bairtag\b|apple\s+/i.test(blob)) {
      return lacradoAppleCodeFromBlob(blob)
    }
    return androidCategoryFromBlob(blob)
  }

  return lacradoAppleCodeFromBlob(blob)
}

/** Ordem exibida no filtro “Android” (referência mercado). */
export const ANDROID_CATEGORY_ORDER = [
  'MI',
  'NOTE',
  'PAD',
  'POCO',
  'RDM',
  'REAL',
  'AND',
  'IPH',
  'IPAD',
  'MCB',
  'PODS',
  'RLG',
  'ACSS',
] as const

function androidCategoryFromBlob(b: string): string {
  const s = b.trim()
  if (!s) return 'AND'

  // Realme antes de qualquer “note” (ex.: Realme Note → REAL, não NOTE).
  if (/\brealme\b/.test(s)) return 'REAL'

  if (/\bpoco\b/.test(s)) {
    if (/\bpoco\s*pad\b/.test(s)) return 'PAD'
    return 'POCO'
  }

  if (/\bredmi\s*note\b/.test(s)) return 'NOTE'

  if (/\bredmi\s*pad\b|\bxiaomi\s*pad\b|\bmi\s*pad\b/.test(s)) return 'PAD'

  if (/\bredmi\b/.test(s)) return 'RDM'

  if (/\bxiaomi\b/.test(s)) return 'MI'

  if (/\bmi\s+\d+/.test(s) || /\bmi\s+(mix|a\d|cc)\b/.test(s)) return 'MI'

  if (/\bblack\s*shark\b/.test(s)) return 'MI'

  return 'AND'
}

function lacradoAppleCodeFromBlob(blob: string): string | null {
  const b = blob.trim()
  if (!b) return null

  if (
    /\b(mntr|monitor)\b/i.test(b) ||
    /\bstudio\s*display\b/i.test(b) ||
    (/\bdisplay\b/i.test(b) && !/\bipad\b/i.test(b)) ||
    (/\bimac\b/i.test(b) && !/\biphone\b/i.test(b))
  ) {
    return null
  }

  if (/\bipad\b/.test(b)) return 'IPAD'
  if (/\biphone\b/.test(b)) return 'IPH'
  if (/\bmacbook\b/.test(b)) return 'MCB'
  if (/\bairpods\b|\bbeats\s*(studio|fit|solo|pill|pro)\b/i.test(b)) return 'PODS'
  if (/\bapple watch\b|\bwatch\s*ultra\b|\bwatch\s*se\b|\bwatch\s*series\b/i.test(b)) return 'RLG'

  if (
    /\bairtag\b/i.test(b) ||
    /\bapple\s*pencil\b|\bpencil\s*(pro|usb-c?|2|3)\b/i.test(b) ||
    /\bacess[oó]ri/i.test(b) ||
    /\bcapa\b|\bcase\b|\bcarregador|\bcabo\b|\bfonte\b|\bmagsafe\b|\blightning\b|\bpel[ií]cula\b|\bsuporte\b|\bhub\b/i.test(b) ||
    /\bapple\s*tv\b/i.test(b) ||
    /\bhomepod\b/i.test(b) ||
    /\badaptador\b/i.test(b)
  ) {
    return 'ACSS'
  }

  return null
}

/** RAM para exibição/filtro: ignora “região” que é chip/importação sem valor em GB. */
export function parseRamFromProduct(product: {
  model?: string | null
  specifications?: { ram?: string | null } | null
  region?: string | null
}): string | null {
  const spec = product?.specifications?.ram
  if (typeof spec === 'string' && spec.trim()) {
    const m = spec.match(/(\d+)\s*GB/i)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > 0 && n <= 96) return `${n}GB`
    }
  }

  const reg = product?.region
  if (typeof reg === 'string' && reg.trim()) {
    const lower = reg.toLowerCase()
    const looksLikeRegionNotRam =
      /chip|virtual|import|🇺🇸|🇨🇳|🇧🇷|🇦🇪|e-?sim|esim|anatel|li\b|r\/s|americano|chines|dubai/i.test(lower) &&
      !/\d+\s*gb/i.test(lower)
    if (!looksLikeRegionNotRam) {
      const m = reg.match(/(\d+)\s*GB/i)
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > 0 && n <= 96) return `${n}GB`
      }
    }
  }

  const model = (product?.model || '').toLowerCase()
  if (model.includes('macbook')) {
    const matches = [...(product.model || '').matchAll(/(\d+)\s*GB/gi)]
    const ramGb = matches.find((m) => {
      const gb = parseInt(m[1], 10)
      return gb <= 96
    })
    if (ramGb) return `${ramGb[1]}GB`
  }

  return null
}

/** Evita Tecno/Samsung/etc. na lista Apple quando `product_type` veio NULL no banco. */
const NON_APPLE_DEVICE_RE =
  /tecno|infinix|\bsamsung\b|\bgalaxy\b|\bxiaomi\b|\bredmi\b|\bpoco\b|\bmotorola\b|\bmoto[\s-]|\brealme\b|\boppo\b|\bvivo\b|\bhuawei\b|\bnothing\b|\boneplus\b|\bhonor\b|\bzte\b|zenfone|\bpixel\b|black\s*shark|nubia|meizu/i

export function isLikelyNonAppleDevice(product: { name?: string | null; model?: string | null }): boolean {
  const blob = `${product.name || ''} ${product.model || ''}`
  if (!blob.trim()) return false
  if (
    /\b(iphone|ipad|macbook|airpods|apple\s*watch|apple\s*pencil|airtag|homepod|apple\s*tv|imac|studio\s*display)\b/i.test(blob)
  ) {
    return false
  }
  return NON_APPLE_DEVICE_RE.test(blob)
}

/** Rótulos para filtro / UI (lacrado + Android + seminovo). */
export const CATEGORY_CODE_LABELS: Record<string, string> = {
  IPH: 'IPH — iPhone',
  IPAD: 'IPAD — iPad',
  MCB: 'MCB — MacBook',
  PODS: 'PODS — AirPods',
  RLG: 'RLG — Apple Watch',
  ACSS: 'ACSS — Acessórios',
  MI: 'MI — Xiaomi',
  NOTE: 'NOTE — Redmi Note',
  PAD: 'PAD — Tablet (Pad)',
  POCO: 'POCO — Poco',
  RDM: 'RDM — Redmi',
  REAL: 'REAL — Realme',
  AND: 'AND — Outros Android',
  SEMI: 'SEMI — Seminovo',
}
