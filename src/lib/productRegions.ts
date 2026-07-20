/**
 * Regiões / variantes de origem + chip (filtro Preços).
 * Só classifica quando há sinal explícito em variant/name/model.
 */

export type RegionOptionId =
  | 'anatel'
  | 'chip_fisico'
  | 'chip_fisico_china'
  | 'chip_fisico_dubai'
  | 'chip_virtual'
  | 'chip_virtual_japao'
  | 'chip_virtual_usa'
  | 'chip_dual_india'

export type RegionOption = {
  id: RegionOptionId
  label: string
  /** Texto curto no botão do filtro quando selecionado */
  shortLabel: string
}

/** Ordem igual ao estilo do concorrente + Anatel no topo. */
export const REGION_OPTIONS: RegionOption[] = [
  { id: 'anatel', label: 'Anatel 🇧🇷', shortLabel: 'Anatel' },
  { id: 'chip_dual_india', label: '(CHIP FISICO + CHIP VIRTUAL) 🇮🇳', shortLabel: 'Chip dual 🇮🇳' },
  { id: 'chip_fisico', label: '(CHIP FISICO)', shortLabel: 'Chip físico' },
  { id: 'chip_fisico_dubai', label: '(CHIP FISICO) 🇦🇪', shortLabel: 'Chip físico 🇦🇪' },
  { id: 'chip_fisico_china', label: '(CHIP FISICO) 🇨🇳', shortLabel: 'Chip físico 🇨🇳' },
  { id: 'chip_virtual', label: '(CHIP VIRTUAL)', shortLabel: 'Chip virtual' },
  { id: 'chip_virtual_japao', label: '(CHIP VIRTUAL) 🇯🇵', shortLabel: 'Chip virtual 🇯🇵' },
  { id: 'chip_virtual_usa', label: '(CHIP VIRTUAL) 🇺🇸', shortLabel: 'Chip virtual 🇺🇸' },
]

function blobOf(product: {
  variant?: string | null
  name?: string | null
  model?: string | null
  notes?: string | null
}): string {
  return [product.variant, product.name, product.model, product.notes]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAnatel(b: string) {
  return /\banatel\b/.test(b) || b.includes('🇧🇷')
}

function hasChina(b: string) {
  return (
    /\bchin/.test(b) ||
    b.includes('🇨🇳') ||
    /\bhn\b/.test(b) ||
    b.includes('chinese')
  )
}

function hasJapan(b: string) {
  return (
    /\bjap/.test(b) ||
    b.includes('🇯🇵') ||
    /\bjp\b/.test(b) ||
    b.includes('japones')
  )
}

function hasUsa(b: string) {
  return (
    /\bamerican/.test(b) ||
    b.includes('🇺🇸') ||
    /\busa\b/.test(b) ||
    /\beua\b/.test(b)
  )
}

function hasIndia(b: string) {
  return /\bindi/.test(b) || b.includes('🇮🇳') || b.includes('india')
}

function hasDubai(b: string) {
  return /\bdubai\b/.test(b) || b.includes('🇦🇪') || /\bae\b/.test(b) || b.includes('emirados')
}

function hasChipFisico(b: string) {
  return (
    b.includes('chip fisico') ||
    b.includes('chip fisco') ||
    b.includes('1 chip') ||
    b.includes('01 chip') ||
    b.includes('2 chip') ||
    b.includes('02 chip') ||
    /\bll\b/.test(b) ||
    b.includes('physical sim') ||
    b.includes('nano sim')
  )
}

function hasChipVirtual(b: string) {
  return (
    b.includes('chip virtual') ||
    b.includes('e-sim') ||
    b.includes('esim') ||
    b.includes('e sim') ||
    b.includes('e-sim') ||
    /\besim\b/.test(b)
  )
}

function hasDualChip(b: string) {
  return (
    (hasChipFisico(b) && hasChipVirtual(b)) ||
    b.includes('chip fisico + chip virtual') ||
    b.includes('fisico + virtual') ||
    b.includes('dual sim') ||
    b.includes('dualsim') ||
    b.includes('2 chips') ||
    b.includes('dois chips')
  )
}

/**
 * Retorna as regiões explícitas do produto (pode ser mais de uma em casos raros).
 * Sem sinal → [].
 */
export function detectProductRegionIds(product: {
  variant?: string | null
  name?: string | null
  model?: string | null
  notes?: string | null
}): RegionOptionId[] {
  const b = blobOf(product)
  if (!b.trim()) return []

  const ids = new Set<RegionOptionId>()
  const variant = (product.variant || '').toString().toUpperCase().trim()

  // Anatel nunca combina com chip
  if (hasAnatel(b) || variant === 'ANATEL') {
    ids.add('anatel')
    return ['anatel']
  }

  // Variant canônico sozinho
  if (variant === 'CHINÊS' || variant === 'CHINES') {
    ids.add(hasChipVirtual(b) && !hasChipFisico(b) ? 'chip_virtual' : 'chip_fisico_china')
  } else if (variant === 'JAPONÊS' || variant === 'JAPONES') {
    ids.add('chip_virtual_japao')
  } else if (variant === 'AMERICANO') {
    ids.add('chip_virtual_usa')
  } else if (variant === 'INDIANO') {
    ids.add('chip_dual_india')
  } else if (variant === 'DUBAI') {
    ids.add('chip_fisico_dubai')
  } else if (variant === 'CHIP FÍSICO' || variant === 'CHIP FISICO') {
    if (hasChina(b)) ids.add('chip_fisico_china')
    else if (hasDubai(b)) ids.add('chip_fisico_dubai')
    else ids.add('chip_fisico')
  } else if (variant === 'E-SIM' || variant === 'CHIP VIRTUAL' || variant === 'ESIM') {
    if (hasJapan(b)) ids.add('chip_virtual_japao')
    else if (hasUsa(b)) ids.add('chip_virtual_usa')
    else ids.add('chip_virtual')
  } else if (variant === 'CPO') {
    // CPO não é região
  } else {
    // Heurística por texto explícito
    if (hasDualChip(b) && hasIndia(b)) ids.add('chip_dual_india')
    else if (hasDualChip(b) && !hasChina(b) && !hasJapan(b) && !hasUsa(b) && !hasDubai(b)) {
      // dual genérico → dual índia só se Índia; senão ignora combo genérico sem país
      if (hasIndia(b)) ids.add('chip_dual_india')
    }

    if (hasChina(b) && (hasChipFisico(b) || !hasChipVirtual(b))) ids.add('chip_fisico_china')
    if (hasDubai(b)) ids.add('chip_fisico_dubai')
    if (hasJapan(b)) ids.add('chip_virtual_japao')
    if (hasUsa(b)) ids.add('chip_virtual_usa')
    if (hasIndia(b) && !ids.has('chip_dual_india')) ids.add('chip_dual_india')

    // Chip sem país (só se não tiver país já classificado)
    const hasCountry = [...ids].some((id) =>
      ['chip_fisico_china', 'chip_fisico_dubai', 'chip_virtual_japao', 'chip_virtual_usa', 'chip_dual_india'].includes(id)
    )
    if (!hasCountry) {
      if (hasDualChip(b)) {
        /* sem país: não força dual_india */
      } else if (hasChipFisico(b)) ids.add('chip_fisico')
      else if (hasChipVirtual(b)) ids.add('chip_virtual')
    }
  }

  return [...ids]
}

export function productMatchesRegions(
  product: {
    variant?: string | null
    name?: string | null
    model?: string | null
    notes?: string | null
  },
  selected: RegionOptionId[]
): boolean {
  if (!selected.length) return true
  const found = detectProductRegionIds(product)
  if (!found.length) return false
  return selected.some((id) => found.includes(id))
}

export function regionOptionById(id: string): RegionOption | undefined {
  return REGION_OPTIONS.find((o) => o.id === id)
}
