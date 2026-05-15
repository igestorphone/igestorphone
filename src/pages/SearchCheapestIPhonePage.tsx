import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Building2,
  BarChart3,
  Palette,
  ShoppingCart,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowUpDown,
  Loader2,
  MessageCircle,
  Copy,
  Package,
  Wifi,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Headphones,
  Watch,
  Tablet,
  Laptop,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { produtosApi, utilsApi } from '@/lib/api'
import { createWhatsAppUrl } from '@/lib/utils'
import {
  getProductCategoryCode,
  parseRamFromProduct,
  CATEGORY_CODE_LABELS,
  isLikelyNonAppleDevice,
  ANDROID_CATEGORY_ORDER,
  type CategorySearchMode,
} from '@/lib/productCategoryCodes'
import { matchesProductSearchMode } from '@/lib/productSearchCondition'
import toast from 'react-hot-toast'
import { IPHONE_PRICE_TABLE_ORDER, matchIphonePriceTableLabel } from '@/lib/iphoneAveragePriceCatalog'
import { normalizeColor } from './colorNormalizer'
import ProductColorSwatch from '@/components/ui/ProductColorSwatch'
import { isAccessoryProduct } from '@/lib/productColorSwatch'

// Cores oficiais disponíveis (para filtro - apenas iPhone 17 normal tem essas 5 cores)
const OFFICIAL_COLORS = ['Preto', 'Branco', 'Azul-névoa', 'Lavanda', 'Sálvia']

// Mantendo colorMap antigo para compatibilidade com código existente (será removido gradualmente)
const colorMap: Record<string, string> = {
  // Preto
  black: 'Preto',
  'space black': 'Preto',
  'jet black': 'Preto',
  preto: 'Preto',
  'titanium black': 'Preto',
  
  // Branco
  white: 'Branco',
  branco: 'Branco',
  starlight: 'Branco',
  'titanium white': 'Branco',
  silver: 'Branco',
  prata: 'Branco',
  
  // Azul-névoa (pode ser chamado de azul)
  blue: 'Azul-névoa',
  azul: 'Azul-névoa',
  'deep blue': 'Azul-névoa',
  'titanium blue': 'Azul-névoa',
  midnight: 'Azul-névoa',
  'azul-nevoa': 'Azul-névoa',
  'azul névoa': 'Azul-névoa',
  
  // Lavanda (pode ser chamada de roxo)
  purple: 'Lavanda',
  roxo: 'Lavanda',
  lavanda: 'Lavanda',
  lavender: 'Lavanda',
  lilac: 'Lavanda',
  lilas: 'Lavanda',
  'lilás': 'Lavanda',
  
  // Sálvia (pode ser chamada de verde)
  green: 'Sálvia',
  verde: 'Sálvia',
  sage: 'Sálvia',
  sálvia: 'Sálvia',
  salvia: 'Sálvia',
  
  // Remover outras cores não utilizadas
}

// normalizeColor agora vem de colorNormalizer.ts

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0)

/** Campo `model` que é só RAM/GB ou código minúsculo — não dá para usar como título da linha. */
function looksLikeSpecsOnlyFragment(s: string): boolean {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length < 2) return true
  if (/^\d+\s*gb\s*\d+\s*ram$/i.test(t)) return true
  if (/^\d+\s*gb\s+\d+\s*ram$/i.test(t)) return true
  if (/^\d+\s*\/\s*\d+\s*gb$/i.test(t)) return true
  if (/^\d+\s*gb\s*\/\s*\d+$/i.test(t)) return true
  if (/^\d+\s*gb$/i.test(t)) return true
  if (/^\d+\s*ram$/i.test(t)) return true
  if (/^\d+\s*tb$/i.test(t)) return true
  // Só números + separadores + GB/RAM/TB (sem palavra de produto)
  if (!/[a-zA-Z]{2,}/.test(t.replace(/\s/g, ''))) {
    if (/\d/.test(t)) return true
  }
  // Uma letra + dígitos tipo "A5" (código solto; o nome completo costuma estar em `name`)
  if (/^[a-z]\d+$/i.test(t) && t.length <= 6) return true
  return false
}

/** Uma linha: prioriza `model` só quando ele estende o nome (ex. iPhone 13 → 128GB), não fragmento de specs. */
function productListDisplayLine(product: { name?: string | null; model?: string | null }): string {
  const name = (product.name || '').trim()
  const model = (product.model || '').trim()
  if (!name && !model) return 'N/A'
  if (!model) return name
  if (!name) return model
  const nl = name.toLowerCase()
  const ml = model.toLowerCase()
  if (ml === nl) return name

  if (looksLikeSpecsOnlyFragment(model)) return name
  if (looksLikeSpecsOnlyFragment(name) && !looksLikeSpecsOnlyFragment(model)) return model

  if (nl.includes(ml) || ml.includes(nl)) {
    return name.length >= model.length ? name : model
  }
  if (ml.startsWith(nl) && model.length > name.length) return model

  return name.length >= model.length ? name : model
}

/** Remove capacidade no fim do título (já existe coluna Storage): ex. "IPHONE 13 PRO 256GB" → "IPHONE 13 PRO". */
function stripTrailingStorageFromTitle(title: string): string {
  let s = title.trim()
  s = s.replace(/\s+\d{1,3}\s*\/\s*\d{1,4}\s*(GB|TB)\s*$/i, '').trim()
  const re = /\s+\d{1,4}\s*(GB|TB)\s*$/i
  let prev = ''
  while (s !== prev) {
    prev = s
    s = s.replace(re, '').trim()
  }
  return s || title.trim()
}

/** Texto final da coluna PRODUTO (nome sem GB/TB redundante). */
function productListTitleShown(product: { name?: string | null; model?: string | null }): string {
  return stripTrailingStorageFromTitle(productListDisplayLine(product))
}

/** Ícone + cor ao lado do nome (referência mercado: celular / fone / relógio / tablet / notebook). */
function productListIconSpec(product: { name?: string | null; model?: string | null }) {
  const blob = `${product.name || ''} ${product.model || ''}`.toLowerCase()
  const ring = 'shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border sm:h-9 sm:w-9'
  if (/\bipad\b|\bxiaomi\s*pad\b|\bredmi\s*pad\b|\bpoco\s*pad\b|\bmi\s*pad\b|\btablet\b/i.test(blob)) {
    return {
      Icon: Tablet,
      wrap: `${ring} border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300`,
    }
  }
  if (/\bmacbook\b|\bimac\b|\bmac\s*mini\b|\bmac\s*studio\b/i.test(blob)) {
    return {
      Icon: Laptop,
      wrap: `${ring} border-slate-200 bg-slate-100 text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200`,
    }
  }
  if (/\bairpods\b|\bbeats\b|\bhomepod\b/i.test(blob)) {
    return {
      Icon: Headphones,
      wrap: `${ring} border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300`,
    }
  }
  if (/\bairtag\b|\bapple\s*pencil\b|\bpencil\s*(pro|usb)?\b/i.test(blob)) {
    return {
      Icon: Package,
      wrap: `${ring} border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300`,
    }
  }
  if (
    /\bapple watch\b|\bwatch\s*ultra\b|\bwatch\s*se\b|\bwatch\s*series\b|\bgalaxy watch\b|\bwatch\s*active\b/i.test(
      blob
    )
  ) {
    return {
      Icon: Watch,
      wrap: `${ring} border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300`,
    }
  }
  return {
    Icon: Smartphone,
    wrap: `${ring} border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300`,
  }
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })

function getSaoPauloDateParts(offsetDays: number) {
  const baseParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const y = Number(baseParts.find((p) => p.type === 'year')?.value || '1970')
  const m = Number(baseParts.find((p) => p.type === 'month')?.value || '01')
  const d = Number(baseParts.find((p) => p.type === 'day')?.value || '01')

  // Meio-dia UTC para evitar virar o dia ao somar/subtrair
  const baseUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  baseUtc.setUTCDate(baseUtc.getUTCDate() + offsetDays)

  const weekdayLong = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  }).format(baseUtc)

  // "quarta-feira" -> "Quarta-Feira"
  const weekday = weekdayLong.charAt(0).toUpperCase() + weekdayLong.slice(1).replace(/-feira/i, '-Feira')

  let monthShort = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    month: 'short',
  }).format(baseUtc)
  monthShort = monthShort.replace('.', '')

  const dayNumber = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
  }).format(baseUtc)

  const year = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(baseUtc)

  const dayNumberPlain = String(Number(dayNumber))

  return {
    weekday,
    dayNumber: dayNumberPlain,
    monthShort,
    year,
    subtitle: `${dayNumberPlain} de ${monthShort} • ${year}`,
  }
}

/** Capacidades de armazenamento Apple comuns (GB ou equivalente). */
const STORAGE_GB_WHITELIST = new Set([8, 16, 32, 64, 128, 256, 512, 1024, 2048])
/** Ordem do maior para o menor — sufixo em "sopa" de dígitos (ex.: modelo+128). */
const STORAGE_GB_SUFFIX_ORDER = [2048, 1024, 512, 256, 128, 64, 32, 16, 8] as const

function gbFromSuffixDigitSoup(digitsOnly: string): number | null {
  if (digitsOnly.length < 4) return null
  for (const n of STORAGE_GB_SUFFIX_ORDER) {
    if (digitsOnly.endsWith(String(n))) return n
  }
  return null
}

function formatStorageFromGb(n: number): string {
  if (n === 1024) return '1T'
  if (n === 2048) return '2T'
  return `${n}GB`
}

function normalizeStorage(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw || raw === 'N/A' || raw === '-') return ''

  const upper = raw.toUpperCase()

  // 1) Padrões explícitos (evita juntar dígitos do modelo, ex.: IPHONE15128GB → 15128)
  const explicitGb = upper.match(/\b(8|16|32|64|128|256|512)\s*G(?:B)?\b/)
  if (explicitGb) return `${parseInt(explicitGb[1], 10)}GB`

  const explicitTb = upper.match(/\b(1|2)\s*T(?:B)?\b/)
  if (explicitTb) return `${explicitTb[1]}T`

  const explicitLarge = upper.match(/\b(1024|2048)\s*G(?:B)?\b/)
  if (explicitLarge) {
    const n = parseInt(explicitLarge[1], 10)
    return formatStorageFromGb(n)
  }

  const digitsOnly = upper.replace(/\D/g, '')
  if (!digitsOnly) return ''

  const letters = upper.replace(/[^A-Z]/g, '')
  const hasTB = letters.includes('TB') || letters.endsWith('T')
  const hasGB = letters.includes('GB') || letters.endsWith('G')

  const parsed = Number.parseInt(digitsOnly, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return ''

  // Casos comuns de erro de OCR/digitação: "1288GB" -> 128GB
  if (!hasTB && parsed >= 1000 && digitsOnly.endsWith('8')) {
    const withoutLastDigit = Number.parseInt(digitsOnly.slice(0, -1), 10)
    if (STORAGE_GB_WHITELIST.has(withoutLastDigit)) {
      return formatStorageFromGb(withoutLastDigit)
    }
  }

  if (hasTB) {
    if (parsed === 1024 || parsed === 1) return '1T'
    if (parsed === 2048 || parsed === 2) return '2T'
    if (parsed >= 1 && parsed <= 2 && digitsOnly.length <= 2) return `${parsed}T`
  }

  if (STORAGE_GB_WHITELIST.has(parsed)) return formatStorageFromGb(parsed)

  if (!hasGB && !hasTB && parsed <= 2 && digitsOnly.length === 1) return `${parsed}T`

  const fromSuffix = gbFromSuffixDigitSoup(digitsOnly)
  if (fromSuffix != null) return formatStorageFromGb(fromSuffix)

  return ''
}

/** Busca "iPhone 17" (só o modelo base): sem Pro/Max/Plus/Air e sem pedir 17E. */
function isPlainIPhone17Search(query: string): boolean {
  const searchLower = query.toLowerCase().trim()
  const searchWords = searchLower.split(/\s+/).filter((w) => w.length > 0)
  if (!searchLower.includes('iphone')) return false
  if (!searchWords.includes('17')) return false
  if (searchLower.includes('17e') || searchLower.includes('17 e')) return false
  if (searchWords.includes('pro') || searchWords.includes('max') || searchWords.includes('plus') || searchWords.includes('air')) {
    return false
  }
  return true
}

// Origem do seminovo (qualidade): bandeira + label para exibir na busca
const SEMINOVO_ORIGIN: Record<string, { flag: string; label: string }> = {
  AMERICANO: { flag: '🇺🇸', label: 'Americano' },
  CHINÊS: { flag: '🇨🇳', label: 'Chinês' },
  CHINES: { flag: '🇨🇳', label: 'Chinês' },
  DUBAI: { flag: '🇦🇪', label: 'Dubai' }
}
function getSeminovoOriginBadge(variant: string | null | undefined) {
  if (!variant || typeof variant !== 'string') return null
  const key = variant.toUpperCase().trim()
  return SEMINOVO_ORIGIN[key] ?? null
}

// Sugestões para efeito de digitação por modo
const TYPING_SUGGESTIONS: Record<string, string[]> = {
  all: ['iPhone 17 Pro Max', 'Samsung Galaxy S24', 'Xiaomi 14', 'MacBook Air'],
  novo: ['iPhone 17 Pro Max', 'iPhone 16 Pro', 'MacBook Air', 'AirPods Pro'],
  seminovo: ['iPhone 15 Pro', 'iPhone 14 Pro Max', 'iPhone 13'],
  android: ['Samsung Galaxy', 'Xiaomi', 'Motorola Edge']
}

function iphoneGeneration(label: string): number | null {
  const m = label.match(/iphone\s*(\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

const IPHONE_LABEL_SORT_INDEX = new Map(
  IPHONE_PRICE_TABLE_ORDER.map((label, index) => [label.toLowerCase(), index])
)

/** Rótulo único por produto para autocomplete (só o que existe no estoque do dia). */
function autocompleteLabelForProduct(product: { name?: string | null; model?: string | null }): string {
  const raw = productListTitleShown(product).trim()
  if (!raw || raw === 'N/A') return ''
  const iphone = matchIphonePriceTableLabel(raw)
  return iphone || raw
}

function sortAutocompleteLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const ia = IPHONE_LABEL_SORT_INDEX.get(a.toLowerCase())
    const ib = IPHONE_LABEL_SORT_INDEX.get(b.toLowerCase())
    if (ia != null && ib != null) return ia - ib
    if (ia != null) return -1
    if (ib != null) return 1
    return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  })
}

/** Modelos distintos disponíveis hoje no modo selecionado (lacrado / semi-novo / Android). */
function buildStockAutocompletePool(
  products: any[],
  searchMode: 'novo' | 'seminovo' | 'android' | null
): string[] {
  if (!searchMode) return []
  let list = products
  if (searchMode === 'novo' || searchMode === 'seminovo') {
    list = list.filter((p: any) => !isLikelyNonAppleDevice(p))
    list = list.filter((p: any) => matchesProductSearchMode(p, searchMode))
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of list) {
    const label = autocompleteLabelForProduct(p)
    if (!label) continue
    const k = label.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(label)
  }
  return sortAutocompleteLabels(out)
}

function getAutocompleteSubtitle(label: string, mode: 'android' | 'lacrado' | 'seminovo'): string {
  if (mode === 'android') return 'Android'
  const kind = (() => {
    const s = label.toLowerCase()
    if (s.includes('iphone')) return 'iPhone'
    if (s.includes('macbook')) return 'Mac'
    if (s.includes('ipad')) return 'iPad'
    if (s.includes('airpods')) return 'Áudio'
    if (s.includes('watch')) return 'Watch'
    return 'Apple'
  })()
  if (mode === 'lacrado') return `Lacrado · ${kind}`
  if (mode === 'seminovo') return `Semi-novo · ${kind}`
  return kind
}

function autocompleteRank(label: string, q: string): number {
  const l = label.toLowerCase()
  const words = q
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return 99
  const joined = words.join(' ')
  if (l.startsWith(joined)) return 0
  if (l.includes(joined)) return 1

  const iphoneNum = q.toLowerCase().match(/iphone\s*(\d{1,2})/)?.[1]
  if (iphoneNum && l.includes('iphone')) {
    const gen = iphoneGeneration(label)
    const want = parseInt(iphoneNum, 10)
    if (gen === want) {
      if (l.startsWith(`iphone ${iphoneNum}`)) return 2
      return 3
    }
    return 40
  }

  if (l.startsWith(words[0])) return 4
  if (words.every((w) => l.includes(w))) return 5
  if (l.includes(joined)) return 6
  return 99
}

function normalizeProductsApiResponse(response: any): any[] {
  let products: any[] = []
  if (Array.isArray(response)) products = response
  else if (response?.products) products = response.products
  else if (response?.data?.products) products = response.data.products
  else if (response?.data && Array.isArray(response.data)) products = response.data

  const getVariantPriority = (variant?: string | null) =>
    variant && variant.toString().toUpperCase().includes('ANATEL') ? 1 : 0

  return products
    .map((product: any) => ({
      ...product,
      price: parseFloat(product.price) || 0,
      variant: product.variant ? product.variant.toString() : null,
    }))
    .sort((a: any, b: any) => {
      const priorityDiff = getVariantPriority(a.variant) - getVariantPriority(b.variant)
      if (priorityDiff !== 0) return priorityDiff
      return a.price - b.price
    })
}

function filterAutocompleteModels(query: string, pool: string[], limit = 10): string[] {
  const q = query.trim()
  if (!q || pool.length === 0) return []
  let ranked = pool
    .map((label) => ({ label, r: autocompleteRank(label, q) }))
    .filter((x) => x.r < 90)
    .sort((a, b) => a.r - b.r || a.label.localeCompare(b.label))

  const iphoneNum = q.match(/iphone\s*(\d{1,2})/i)?.[1]
  if (iphoneNum) {
    const want = parseInt(iphoneNum, 10)
    const sameGen = ranked.filter(({ label }) => iphoneGeneration(label) === want)
    if (sameGen.length > 0) ranked = sameGen
  }

  const seen = new Set<string>()
  const out: string[] = []
  for (const { label } of ranked) {
    const k = label.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(label)
    if (out.length >= limit) break
  }
  return out
}

// Input de busca com estado local + efeito de digitação quando vazio + autocomplete de modelos
function SearchInputDebounced({
  onDebouncedChange,
  onPick,
  placeholder = 'Buscar produtos...',
  typingSuggestions,
  searchMode = 'novo',
  suggestionPool = [],
  inventoryLoading = false,
}: {
  onDebouncedChange: (value: string) => void
  onPick?: (value: string) => void
  placeholder?: string
  typingSuggestions?: string[]
  searchMode?: string
  /** Modelos que existem no estoque do dia (modo atual). */
  suggestionPool?: string[]
  inventoryLoading?: boolean
}) {
  const acMode: 'android' | 'lacrado' | 'seminovo' =
    searchMode === 'android' ? 'android' : searchMode === 'seminovo' ? 'seminovo' : 'lacrado'
  const [localValue, setLocalValue] = useState('')
  const [typingText, setTypingText] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeIdxRef = useRef(-1)
  useEffect(() => {
    activeIdxRef.current = activeIdx
  }, [activeIdx])

  useEffect(() => {
    const timer = setTimeout(() => onDebouncedChange(localValue.trim() || ''), 400)
    return () => clearTimeout(timer)
  }, [localValue, onDebouncedChange])

  const matches = useMemo(
    () => (localValue.trim().length >= 1 ? filterAutocompleteModels(localValue, suggestionPool, 10) : []),
    [localValue, suggestionPool]
  )

  const queryTrimmed = localValue.trim()
  const canShowPanel = queryTrimmed.length >= 1
  const showPanel = panelOpen && canShowPanel
  const hasAutocompleteMatches = matches.length > 0
  const showTypingEffect = !localValue

  useEffect(() => {
    setActiveIdx(-1)
    if (canShowPanel) setPanelOpen(true)
  }, [localValue, matches.length, acMode, canShowPanel])

  useEffect(() => {
    if (!panelOpen || !canShowPanel) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      const listbox = document.getElementById('search-autocomplete-listbox')
      if (listbox?.contains(target)) return
      setPanelOpen(false)
      setActiveIdx(-1)
      setPanelPos(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [panelOpen, canShowPanel])

  useEffect(() => {
    if (!showPanel || !rootRef.current) {
      setPanelPos(null)
      return
    }
    const update = () => {
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vv = window.visualViewport
      const viewportTop = vv?.offsetTop ?? 0
      const viewportBottom = vv ? vv.offsetTop + vv.height : window.innerHeight
      const spaceBelow = viewportBottom - r.bottom - 10
      const spaceAbove = r.top - viewportTop - 10
      const maxHeight = Math.min(280, Math.max(120, Math.max(spaceBelow, spaceAbove) - 8))
      const placeAbove = spaceBelow < 140 && spaceAbove > spaceBelow
      const top = placeAbove
        ? Math.max(viewportTop + 4, r.top - maxHeight - 6)
        : r.bottom + 6
      setPanelPos({ top, left: r.left, width: r.width, maxHeight })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [showPanel, localValue, matches.length])

  // Lista estável — evita reiniciar o efeito a cada re-render (travava em "ip")
  const typingSuggestionsList = useMemo(() => {
    if (typingSuggestions?.length) return typingSuggestions
    if (suggestionPool.length > 0) return suggestionPool.slice(0, 6)
    return TYPING_SUGGESTIONS[searchMode] ?? TYPING_SUGGESTIONS.novo
  }, [typingSuggestions, suggestionPool, searchMode])

  useEffect(() => {
    if (localValue) {
      setTypingText('')
      return
    }

    if (!typingSuggestionsList.length) {
      setTypingText('')
      return
    }

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
      timeouts.push(id)
    }

    let index = 0
    let charIndex = 0
    let isDeleting = false
    setTypingText('')

    const type = () => {
      if (cancelled) return
      const list = typingSuggestionsList
      if (!list.length) return
      const current = list[index] || ''

      if (isDeleting) {
        if (charIndex > 0) {
          charIndex--
          setTypingText(current.slice(0, charIndex))
          schedule(type, 40)
        } else {
          isDeleting = false
          index = (index + 1) % list.length
          schedule(type, 500)
        }
        return
      }

      if (charIndex < current.length) {
        charIndex++
        setTypingText(current.slice(0, charIndex))
        schedule(type, 80)
        return
      }

      schedule(() => {
        isDeleting = true
        type()
      }, 2200)
    }

    schedule(type, 600)

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [localValue, typingSuggestionsList])

  const pickSuggestion = (value: string) => {
    const v = value.trim()
    setLocalValue(v)
    setActiveIdx(-1)
    setPanelOpen(false)
    setPanelPos(null)
    onDebouncedChange(v)
    inputRef.current?.blur()
    onPick?.(v)
  }

  const autocompletePanel =
    showPanel && panelPos ? (
      <motion.div
        id="search-autocomplete-listbox"
        role="listbox"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[200] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl shadow-black/15 dark:shadow-black/50 overflow-hidden max-h-[min(70vh,22rem)] overflow-y-auto"
        style={{
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
          maxHeight: panelPos.maxHeight,
        }}
      >
        {hasAutocompleteMatches ? (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Resultados
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-gray-400 dark:text-gray-500">
                {matches.length}
              </span>
            </div>
            <ul className="py-1">
              {matches.map((label, i) => (
                <li key={`${label}-${i}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIdx}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      i === activeIdx
                        ? 'bg-blue-50 dark:bg-blue-950/40'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      pickSuggestion(label)
                    }}
                  >
                    <Search className="w-4 h-4 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-sm text-gray-900 dark:text-white uppercase tracking-tight leading-snug">
                        {label}
                      </span>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {getAutocompleteSubtitle(label, acMode)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : inventoryLoading ? (
          <div className="px-4 py-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-2" aria-hidden />
            <p className="text-sm text-gray-500 dark:text-gray-400">Carregando estoque do dia…</p>
          </div>
        ) : suggestionPool.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" aria-hidden />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nenhum produto{' '}
              {acMode === 'lacrado' ? 'lacrado' : acMode === 'seminovo' ? 'semi-novo' : 'Android'} hoje
            </p>
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" aria-hidden />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nenhum resultado para &lsquo;{queryTrimmed}&rsquo;
            </p>
          </div>
        )}
      </motion.div>
    ) : null

  return (
    <>
    <div ref={rootRef} className="relative z-30">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="search-autocomplete-listbox"
        aria-autocomplete="list"
        placeholder={showTypingEffect ? ' ' : placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => {
          if (queryTrimmed.length >= 1) setPanelOpen(true)
          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && showPanel && !hasAutocompleteMatches && queryTrimmed.length >= 1) {
            e.preventDefault()
            setPanelOpen(false)
            setPanelPos(null)
            onDebouncedChange(queryTrimmed)
            return
          }
          if (e.key === 'ArrowDown' && showPanel && matches.length > 0) {
            e.preventDefault()
            setActiveIdx((i) => (i < 0 ? 0 : Math.min(matches.length - 1, i + 1)))
            return
          }
          if (e.key === 'ArrowUp' && showPanel && matches.length > 0) {
            e.preventDefault()
            setActiveIdx((i) => (i <= 0 ? 0 : i - 1))
            return
          }
          if (e.key === 'Enter' && showPanel && matches.length > 0) {
            e.preventDefault()
            const idx = activeIdxRef.current
            const pick = idx >= 0 && idx < matches.length ? matches[idx] : matches[0]
            pickSuggestion(pick)
            return
          }
          if (e.key === 'Escape' && (showPanel || canShowPanel)) {
            e.preventDefault()
            setActiveIdx(-1)
            setPanelOpen(false)
            setPanelPos(null)
          }
        }}
        className="w-full pl-12 pr-11 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all touch-manipulation min-h-[44px]"
      />
      {localValue ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-white/10"
          aria-label="Limpar busca"
          onClick={() => {
            setLocalValue('')
            setActiveIdx(-1)
            setPanelOpen(false)
            setPanelPos(null)
            onDebouncedChange('')
          }}
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
      {showTypingEffect && (
        <div
          className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500 select-none overflow-hidden max-w-[calc(100%-3rem)]"
          aria-hidden
        >
          <span>{typingText}</span>
          <span className="animate-pulse">|</span>
        </div>
      )}

    </div>
    {typeof document !== 'undefined' && autocompletePanel
      ? createPortal(autocompletePanel, document.body)
      : null}
    </>
  )
}

// Relógio isolado: no mobile atrasa o interval para não competir com o primeiro toque
function LiveClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date())
  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const delay = isTouch ? 1500 : 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null
    const start = () => {
      intervalId = setInterval(() => setCurrentTime(new Date()), 1000)
    }
    if (delay > 0) {
      timeoutId = setTimeout(start, delay)
    } else {
      start()
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])
  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(currentTime)}</span>
    </div>
  )
}

function AnimatedNumber({ value, durationMs = 700 }: { value: number; durationMs?: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const displayRef = useRef(value)

  useEffect(() => {
    const from = displayRef.current
    const to = value

    if (from === to) {
      setDisplayValue(to)
      return
    }

    const start = performance.now()
    let rafId: number | null = null

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(from + (to - from) * eased)
      displayRef.current = next
      setDisplayValue(next)
      if (progress < 1) rafId = window.requestAnimationFrame(step)
    }

    rafId = window.requestAnimationFrame(step)
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId)
    }
  }, [value, durationMs])

  return <>{displayValue.toLocaleString('pt-BR')}</>
}

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

type SearchMode = 'novo' | 'seminovo' | 'android'

function productSwatchProps(product: any, searchMode: SearchMode | null) {
  const mode: CategorySearchMode =
    searchMode === 'seminovo' ? 'seminovo' : searchMode === 'android' ? 'android' : 'novo'
  const categoryCode = getProductCategoryCode(product, mode)
  return {
    rawColor: product.color,
    normalizedLabel: normalizeColor(product.color, product.model || product.name),
    categoryCode,
    isAccessory: isAccessoryProduct(product) || categoryCode === 'ACSS',
  }
}

function getDefaultSearchForMode(mode: SearchMode | null): string {
  if (!mode) return ''
  if (mode === 'seminovo') return 'iphone '
  if (mode === 'android') return ''
  return ''
}

export default function SearchCheapestIPhonePage({ initialSearchMode }: { initialSearchMode?: SearchMode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const modeFromUrl = searchParams.get('mode') as SearchMode | null
  const urlModeValid = modeFromUrl === 'novo' || modeFromUrl === 'seminovo' || modeFromUrl === 'android'
  const [searchMode, setSearchModeState] = useState<SearchMode | null>(() =>
    initialSearchMode ?? (urlModeValid ? modeFromUrl! : 'novo')
  )

  useEffect(() => {
    if (!urlModeValid && !initialSearchMode && searchMode === 'novo') {
      setSearchParams({ mode: 'novo' }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- só na entrada

  const setSearchMode = (mode: SearchMode | null) => {
    const prev = debouncedSearch.trim()
    const prevDefault = getDefaultSearchForMode(searchMode).trim()
    setSearchModeState(mode)
    if (mode) setSearchParams({ mode }, { replace: true })
    else setSearchParams({}, { replace: true })
    if (!prev || prev === prevDefault) setDebouncedSearch(getDefaultSearchForMode(mode))
  }

  const [debouncedSearch, setDebouncedSearch] = useState(() => getDefaultSearchForMode(searchMode))
  type DateKey = 'today' | 'yesterday' | 'day_before'

  // Guarda só a "categoria" do dia (hoje/ontem/anteontem) e converte pra data real SP na hora de buscar.
  // Isso evita ficar "travado" se a página ficar aberta e passar a meia-noite.
  const [selectedDateKey, setSelectedDateKey] = useState<DateKey>('today')
  const selectedDateOffset: 0 | -1 | -2 =
    selectedDateKey === 'today' ? 0 : selectedDateKey === 'yesterday' ? -1 : -2
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerRect, setDatePickerRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const datePickerButtonRef = useRef<HTMLButtonElement>(null)

  // Medir botão ao abrir e fechar ao rolar/redimensionar (dropdown em portal para não ser cortado por overflow)
  useEffect(() => {
    if (!showDatePicker) {
      setDatePickerRect(null)
      return
    }
    const el = datePickerButtonRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      setDatePickerRect({ top: rect.bottom, left: rect.left, width: rect.width })
    }
    const close = () => setShowDatePicker(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [showDatePicker])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedRam, setSelectedRam] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showFiltersMobile, setShowFiltersMobile] = useState(true)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  // No mobile: atrasa a query para o shell ficar interativo antes da rede
  const [queryReady, setQueryReady] = useState(() => !isMobile())
  const supplierDropdownRef = useRef<HTMLDivElement>(null)
  const modeChipsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLDivElement>(null)
  const filtersPanelRef = useRef<HTMLDivElement>(null)
  const searchWorkspaceRef = useRef<HTMLDivElement>(null)
  const resultsSectionRef = useRef<HTMLDivElement>(null)
  const [activeSearchLabel, setActiveSearchLabel] = useState('')

  useEffect(() => {
    if (queryReady) return
    const t = setTimeout(() => setQueryReady(true), 200)
    return () => clearTimeout(t)
  }, [queryReady])

  // Observação: propositalmente não fechamos ao clicar fora para não interferir
  // com o clique no próprio botão (problema de layout em alguns browsers).

  useEffect(() => {
    setCurrentPage(1)
  }, [searchMode, debouncedSearch, selectedDateKey, selectedCategory, selectedStorage, selectedRam, selectedColor, selectedSupplier])

  useEffect(() => {
    setSelectedCategory('')
  }, [searchMode])

  useEffect(() => {
    if (!showSupplierDropdown) return

    const handleOutside = (event: MouseEvent) => {
      if (!supplierDropdownRef.current) return
      if (!supplierDropdownRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showSupplierDropdown])

  useEffect(() => {
    if (!searchMode) return

    const handleOutsideModeChips = (event: MouseEvent) => {
      const target = event.target as Node
      const el = event.target as Element
      const clickedAutocomplete = !!el?.closest?.('#search-autocomplete-listbox')
      const clickedModeChips = !!modeChipsRef.current?.contains(target)
      const clickedSearchInput = !!searchInputRef.current?.contains(target)
      const clickedFiltersPanel = !!filtersPanelRef.current?.contains(target)
      const clickedSearchWorkspace = !!searchWorkspaceRef.current?.contains(target)
      if (clickedAutocomplete) return
      if (!clickedModeChips && !clickedSearchInput && !clickedFiltersPanel && !clickedSearchWorkspace) {
        setSearchModeState(null)
        setSearchParams({}, { replace: true })
        setDebouncedSearch(getDefaultSearchForMode(null))
      }
    }

    document.addEventListener('mousedown', handleOutsideModeChips)
    return () => document.removeEventListener('mousedown', handleOutsideModeChips)
  }, [searchMode, setSearchParams])

  useEffect(() => {
    const handleFocus = () => queryClient.invalidateQueries({ queryKey: ['produtos'] })
    window.addEventListener('focus', handleFocus)
    const interval = setInterval(() => queryClient.invalidateQueries({ queryKey: ['produtos'] }), 30000)
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [queryClient])

  // Buscar produtos se houver busca com pelo menos 3 caracteres OU se houver algum filtro selecionado
  const shouldFetchProducts = true

  // 17 Pro e 16 Pro usam cores normalizadas (ex: Laranja Cósmico); o backend filtra pelo valor bruto (ex: Cosmic Orange) e não acha. Não enviar color à API e filtrar no front por cor normalizada.
  const searchLowerForColor = debouncedSearch.toLowerCase().trim()
  const filterColorClientSide =
    searchLowerForColor.includes('iphone') &&
    (searchLowerForColor.includes('17 pro') || searchLowerForColor.includes('16 pro'))

  const productsQuery = useQuery({
    queryKey: [
      'produtos',
      searchMode,
      debouncedSearch,
      selectedDateKey,
      selectedStorage,
      selectedRam,
      selectedColor
    ],
    queryFn: () => {
      const params: any = {
        search: debouncedSearch.length >= 2 ? debouncedSearch.trim() || undefined : undefined,
        storage: undefined, // filtro por storage é normalizado no front
        color: filterColorClientSide ? undefined : selectedColor || undefined,
        date_offset: selectedDateOffset,
        sort_by: 'price',
        sort_order: 'asc',
        limit: 5000
      }
      // Cada opção carrega APENAS o tipo selecionado (nunca misturar Apple novo com Android/Xiaomi)
      if (searchMode === 'novo') {
        params.condition_type = 'lacrados_novos'
        params.product_type = 'apple'
      } else if (searchMode === 'seminovo') {
        params.condition_type = 'seminovos'
        params.product_type = 'apple'
      } else if (searchMode === 'android') {
        params.product_type = 'android'
      }
      return produtosApi.getAll(params)
    },
    enabled: shouldFetchProducts && queryReady,
    staleTime: 10000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    select: normalizeProductsApiResponse,
  })

  // Estoque completo do dia (sem filtro de busca) — só isso alimenta o autocomplete
  const inventoryQuery = useQuery({
    queryKey: ['produtos-inventory', searchMode, selectedDateKey],
    queryFn: () => {
      const params: any = {
        date_offset: selectedDateOffset,
        sort_by: 'price',
        sort_order: 'asc',
        limit: 5000,
      }
      if (searchMode === 'novo') {
        params.condition_type = 'lacrados_novos'
        params.product_type = 'apple'
      } else if (searchMode === 'seminovo') {
        params.condition_type = 'seminovos'
        params.product_type = 'apple'
      } else if (searchMode === 'android') {
        params.product_type = 'android'
      }
      return produtosApi.getAll(params)
    },
    enabled: shouldFetchProducts && queryReady && !!searchMode,
    staleTime: 10000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    select: normalizeProductsApiResponse,
  })

  const stockAutocompletePool = useMemo(
    () => buildStockAutocompletePool(inventoryQuery.data || [], searchMode),
    [inventoryQuery.data, searchMode]
  )

  const dateOptions: Array<{ key: DateKey; offset: number; label: string }> = useMemo(
    () => [
      { key: 'today', offset: 0, label: 'Hoje' },
      { key: 'yesterday', offset: -1, label: 'Ontem' },
      { key: 'day_before', offset: -2, label: 'Anteontem' },
    ],
    []
  )

  const selectedDateLabel = dateOptions.find((d) => d.key === selectedDateKey)?.label ?? 'Hoje'

  const selectedDateParts = useMemo(() => {
    const opt = dateOptions.find((d) => d.key === selectedDateKey) || dateOptions[0]
    return getSaoPauloDateParts(opt.offset)
  }, [dateOptions, selectedDateKey])

  const dynamicFilters = useMemo(() => {
    let products = productsQuery.data || []
    if (searchMode === 'novo' || searchMode === 'seminovo') {
      products = products.filter((p: any) => !isLikelyNonAppleDevice(p))
    }
    if (searchMode === 'novo' || searchMode === 'seminovo') {
      products = products.filter((p: any) => matchesProductSearchMode(p, searchMode))
    }
    const colors = new Set<string>()
    const storages = new Set<string>()
    const rams = new Set<string>()
    const suppliers = new Set<string>()
    const categories = new Set<string>()

    // Detectar se a busca é "iPhone 17" (sem Pro, Max, Plus, Air)
    const searchLower = debouncedSearch.toLowerCase().trim()
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)
    const isIPhone17Exact = searchLower.includes('iphone') && 
                           searchWords.includes('17') && 
                           !searchWords.includes('pro') && 
                           !searchWords.includes('max') && 
                           !searchWords.includes('plus') && 
                           !searchWords.includes('air')

    // Cores oficiais do iPhone 17 (normal): Preto, Branco, Mist Blue, Lavanda, Sage
    const iPhone17OfficialColors = new Set(['Preto', 'Branco', 'Mist Blue', 'Lavanda', 'Sage'])
    // iPhone 16 Pro / 16 Pro Max: só Titânio Deserto, Natural, Branco, Preto
    const isIPhone16Pro = searchLower.includes('iphone') && (searchLower.includes('16 pro') || searchLower.includes('16 pro max'))
    const iPhone16ProOfficialColors = new Set(['Titânio Deserto', 'Titânio Natural', 'Titânio Branco', 'Titânio Preto'])
    // iPhone 17 Pro / 17 Pro Max: Azul Intenso, Laranja Cósmico, Prateado (Silver = Branco)
    const isIPhone17Pro = searchLower.includes('iphone') && (searchLower.includes('17 pro') || searchLower.includes('17 pro max'))
    const iPhone17ProOfficialColors = new Set(['Azul Intenso', 'Laranja Cósmico', 'Prateado'])
    const modelOrName = (p: any) => p.model || p.name || ''
    const modeForCategory: CategorySearchMode =
      searchMode === 'seminovo' ? 'seminovo' : searchMode === 'android' ? 'android' : 'novo'

    products.forEach((product: any) => {
      if (product.color) {
        const normalized = normalizeColor(product.color, modelOrName(product))
        if (normalized && normalized !== 'N/A') {
          if (isIPhone17Exact) {
            if (iPhone17OfficialColors.has(normalized)) colors.add(normalized)
          } else if (isIPhone17Pro) {
            if (iPhone17ProOfficialColors.has(normalized)) colors.add(normalized)
          } else if (isIPhone16Pro) {
            if (iPhone16ProOfficialColors.has(normalized)) colors.add(normalized)
          } else {
            colors.add(normalized)
          }
        }
      }
      const normalizedStorage = normalizeStorage(product.storage)
      if (normalizedStorage) storages.add(normalizedStorage)
      const ramParsed = parseRamFromProduct(product)
      if (ramParsed) rams.add(ramParsed)
      if (product.supplier_name) suppliers.add(product.supplier_name)
      const catCode = getProductCategoryCode(product, modeForCategory)
      if (catCode) categories.add(catCode)
    })

    // Ordenar cores alfabeticamente, mas manter ordem específica para iPhone 17 e 16 Pro
    let sortedColors: string[]
    if (isIPhone17Exact) {
      const order = ['Preto', 'Branco', 'Mist Blue', 'Lavanda', 'Sage']
      sortedColors = Array.from(colors).sort((a, b) => {
        const indexA = order.indexOf(a)
        const indexB = order.indexOf(b)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
      })
    } else if (isIPhone17Pro) {
      const order = ['Azul Intenso', 'Laranja Cósmico', 'Prateado']
      sortedColors = Array.from(colors).sort((a, b) => {
        const indexA = order.indexOf(a)
        const indexB = order.indexOf(b)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
      })
    } else if (isIPhone16Pro) {
      const order = ['Titânio Deserto', 'Titânio Natural', 'Titânio Branco', 'Titânio Preto']
      sortedColors = Array.from(colors).sort((a, b) => {
        const indexA = order.indexOf(a)
        const indexB = order.indexOf(b)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
      })
    } else {
      sortedColors = Array.from(colors).sort()
    }

    return {
      colors: sortedColors,
      storages: Array.from(storages).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, '')) || 0
        const bNum = parseInt(b.replace(/\D/g, '')) || 0
        return aNum - bNum
      }),
      rams: Array.from(rams).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, '')) || 0
        const bNum = parseInt(b.replace(/\D/g, '')) || 0
        return aNum - bNum
      }),
      suppliers: Array.from(suppliers).sort(),
      categories: (() => {
        const list = Array.from(categories)
        if (searchMode !== 'android') return list.sort()
        const order = ANDROID_CATEGORY_ORDER as readonly string[]
        return list.sort((a, b) => {
          const ia = order.indexOf(a)
          const ib = order.indexOf(b)
          if (ia === -1 && ib === -1) return a.localeCompare(b)
          if (ia === -1) return 1
          if (ib === -1) return -1
          return ia - ib
        })
      })(),
    }
  }, [productsQuery.data, debouncedSearch, searchMode])

  const handleSearchPick = (term: string) => {
    const v = term.trim()
    setDebouncedSearch(v)
    setActiveSearchLabel(v)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setShowFiltersMobile(false)
    }
    window.setTimeout(() => {
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  useEffect(() => {
    const t = debouncedSearch.trim()
    if (t.length >= 2) setActiveSearchLabel(t)
    else if (!t) setActiveSearchLabel('')
  }, [debouncedSearch])

  const filteredProducts = useMemo(() => {
    let all = productsQuery.data || []
    if (searchMode === 'novo' || searchMode === 'seminovo') {
      all = all.filter((p: any) => !isLikelyNonAppleDevice(p))
    }
    if (searchMode === 'novo' || searchMode === 'seminovo') {
      all = all.filter((p: any) => matchesProductSearchMode(p, searchMode))
    }
    const searchLower = debouncedSearch.toLowerCase().trim()
    const modeForCategory: CategorySearchMode =
      searchMode === 'seminovo' ? 'seminovo' : searchMode === 'android' ? 'android' : 'novo'

    if (isPlainIPhone17Search(debouncedSearch)) {
      all = all.filter((p: any) => {
        const blob = `${p.name || ''} ${p.model || ''}`.toLowerCase()
        if (blob.includes('17e')) return false
        if (blob.includes('17 e')) return false
        return true
      })
    }
    const is17Or16Pro = searchLower.includes('iphone') && (searchLower.includes('17 pro') || searchLower.includes('16 pro'))
    if (is17Or16Pro && selectedColor) {
      const colorNorm = (c: string, m: string) => (normalizeColor(c, m) || '').trim().replace(/\s+/g, ' ')
      const selectedNorm = selectedColor.trim().replace(/\s+/g, ' ')
      all = all.filter(
        (p: any) => colorNorm(p.color || '', p.model || p.name) === selectedNorm
      )
    }
    if (selectedStorage) {
      all = all.filter((p: any) => normalizeStorage(p.storage) === selectedStorage)
    }
    if (selectedSupplier) {
      all = all.filter((p: any) => (p.supplier_name || '').toLowerCase() === selectedSupplier.toLowerCase())
    }
    if (selectedCategory) {
      const legacyMap: Record<string, string> = {
        iPhone: 'IPH',
        iPad: 'IPAD',
        MacBook: 'MCB',
        AirPods: 'PODS',
        'Apple Watch': 'RLG',
      }
      const want = legacyMap[selectedCategory] || selectedCategory
      all = all.filter((p: any) => (getProductCategoryCode(p, modeForCategory) || '') === want)
    }
    if (!selectedRam) return all
    return all.filter((p: any) => parseRamFromProduct(p) === selectedRam)
  }, [
    productsQuery.data,
    selectedRam,
    selectedColor,
    selectedSupplier,
    selectedCategory,
    selectedStorage,
    debouncedSearch,
    searchMode,
  ])

  const visibleSuppliers = useMemo(() => {
    const term = supplierSearch.trim().toLowerCase()
    if (!term) return dynamicFilters.suppliers
    return dynamicFilters.suppliers.filter((supplier) => supplier.toLowerCase().includes(term))
  }, [dynamicFilters.suppliers, supplierSearch])

  const stats = useMemo(() => {
    const products = filteredProducts
    if (products.length === 0) {
      return { total: 0, averagePrice: 0, minPrice: 0, maxPrice: 0, suppliersCount: 0 }
    }

    const prices = products.map((p: any) => p.price).filter((p: number) => p > 0)
    const uniqueSuppliers = new Set(products.map((p: any) => p.supplier_name || p.supplier_id))

    return {
      total: products.length,
      averagePrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      suppliersCount: uniqueSuppliers.size
    }
  }, [filteredProducts])

  const pagination = useMemo(() => {
    const all = filteredProducts
    const total = all.length
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage))
    const start = (currentPage - 1) * itemsPerPage
    const paginated = all.slice(start, start + itemsPerPage)
    return { paginated, total, totalPages }
  }, [filteredProducts, currentPage, itemsPerPage])

  const handleWhatsApp = (whatsapp: string, product?: any) => {
    if (!whatsapp) {
      toast.error('WhatsApp do fornecedor não disponível')
      return
    }

    let message: string
    if (product) {
      const modelStr = productListTitleShown(product).replace(/^iPhone\s*/i, '').trim() || 'Produto'
      const parts = [modelStr]
      const normalizedStorage = normalizeStorage(product.storage)
      if (normalizedStorage) parts.push(normalizedStorage)
      if (product.color) parts.push(normalizeColor(product.color, product.model || product.name).toUpperCase())
      if (product.condition_detail) parts.push(product.condition_detail)
      else if (product.condition) parts.push(product.condition.toUpperCase())
      const productLine = parts.join(' ')
      const priceStr = formatPrice(product.price || 0)
      message = `Olá, tudo bem? Vim pelo iGestorPhone

${productLine}
${priceStr}

Ainda tem disponível?`
    } else {
      message = `Olá, tudo bem? Vim pelo iGestorPhone

Ainda tem disponível?`
    }
    const url = createWhatsAppUrl(whatsapp, message.trim())
    window.open(url, '_blank')
  }

  const priceHistoryQuery = useQuery({
    queryKey: ['price-history-by-model', debouncedSearch, selectedStorage, selectedColor],
    queryFn: () =>
      produtosApi.getPriceHistoryByModel({
        model: debouncedSearch,
        storage: selectedStorage || undefined,
        color: selectedColor || undefined
      }),
    enabled:
      debouncedSearch.length >= 1 &&
      productsQuery.data &&
      productsQuery.data.length > 0 &&
      !productsQuery.isFetching,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000
  })

  const serverStatusQuery = useQuery({
    queryKey: ['server-status'],
    queryFn: () => utilsApi.getServerStatus(),
    refetchInterval: 10000,
    staleTime: 5000
  })

  const todayStatsQuery = useQuery({
    queryKey: ['stats-dia', selectedDateOffset, searchMode ?? 'all'],
    queryFn: () => utilsApi.getGlobalStats(selectedDateOffset, searchMode),
    staleTime: 15000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true
  })

  const statsFromApi = todayStatsQuery.data
  const useDisplayStatsOverride = statsFromApi?.display_override === true
  const totalProductsToday = statsFromApi?.total_products ?? 0
  const totalSuppliersToday = statsFromApi?.total_suppliers ?? 0
  const totalWithoutListToday = statsFromApi?.total_without_list ?? 0
  const displayTopProducts = useDisplayStatsOverride
    ? totalProductsToday
    : searchMode
      ? stats.total
      : totalProductsToday
  const displayTopSuppliers = useDisplayStatsOverride
    ? totalSuppliersToday
    : searchMode
      ? stats.suppliersCount
      : totalSuppliersToday

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200 overflow-x-hidden">
      <div ref={searchWorkspaceRef} className="space-y-4 p-4 md:p-6 max-w-full">
        {/* Topo estilo concorrente: cards + busca + modos + banner */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="order-2 xl:order-1 xl:col-span-7 space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 auto-rows-min">
              <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-zinc-950 dark:to-black p-3 min-h-[84px] shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Produtos</p>
                  <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    <Package className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="mt-1 text-[22px] sm:text-[28px] leading-none font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={displayTopProducts} />
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-400/20 bg-gradient-to-br from-white to-emerald-50/60 dark:from-zinc-950 dark:to-emerald-950/20 p-3 min-h-[84px] shadow-[0_1px_0_rgba(16,185,129,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Fornec.</p>
                  <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="mt-1 text-[22px] sm:text-[28px] leading-none font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={displayTopSuppliers} />
                </p>
              </div>
              <div className="rounded-xl border border-amber-200/80 dark:border-amber-400/20 bg-gradient-to-br from-white to-amber-50/60 dark:from-zinc-950 dark:to-amber-950/20 p-3 min-h-[84px] shadow-[0_1px_0_rgba(245,158,11,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Sem lista</p>
                  <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="mt-1 text-[22px] sm:text-[28px] leading-none font-black text-amber-700 dark:text-amber-300">
                  <AnimatedNumber value={totalWithoutListToday} />
                </p>
              </div>
            </div>

            <motion.div ref={searchInputRef} className="relative z-30 bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10 overflow-visible">
              <SearchInputDebounced
                key={searchMode ?? 'all'}
                onDebouncedChange={setDebouncedSearch}
                onPick={handleSearchPick}
                searchMode={searchMode ?? 'all'}
                suggestionPool={stockAutocompletePool}
                inventoryLoading={inventoryQuery.isLoading || inventoryQuery.isFetching}
                placeholder={
                  searchMode === 'android'
                    ? 'Ex: Samsung, Xiaomi, Motorola...'
                    : searchMode === 'seminovo'
                      ? 'Ex: iPhone 15, iPhone 14...'
                      : searchMode === 'novo'
                        ? 'Ex: iPhone 16, MacBook, AirPods...'
                        : 'Ex: iPhone, Samsung, Xiaomi, MacBook...'
                }
              />
            </motion.div>

            <div ref={modeChipsRef} className="relative z-10 bg-white dark:bg-black rounded-xl shadow-sm p-3 border border-gray-200 dark:border-white/10">
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                {([
                  { mode: 'novo' as const, label: 'Lacrado', emoji: '🍎', activeClass: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' },
                  { mode: 'android' as const, label: 'Android', emoji: '🤖', activeClass: 'bg-green-600 text-white border-green-600' },
                  { mode: 'seminovo' as const, label: 'Semi-novo', emoji: '💚', activeClass: 'bg-emerald-600 text-white border-emerald-600' }
                ]).map(({ mode, label, emoji, activeClass }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (searchMode === mode) setSearchMode(null)
                      else setSearchMode(mode)
                    }}
                    className={`w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                      searchMode === mode
                        ? `${activeClass} shadow-sm`
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span aria-hidden>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeSearchLabel.length >= 2 ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/30 px-3 py-2.5"
              >
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                  {activeSearchLabel}
                </span>
                {searchMode ? (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      searchMode === 'novo'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : searchMode === 'seminovo'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-green-600 text-white'
                    }`}
                  >
                    {searchMode === 'novo' ? 'Lacrado' : searchMode === 'seminovo' ? 'Semi-novo' : 'Android'}
                  </span>
                ) : null}
              </motion.div>
            ) : null}
          </div>

          <div className="order-1 xl:order-2 xl:col-span-5 rounded-xl border border-emerald-200/70 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-50 via-white to-green-50 dark:from-emerald-950/30 dark:via-black dark:to-green-950/20 p-4 sm:p-5 min-h-[180px] sm:min-h-[210px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30">
                  <Users className="w-3.5 h-3.5" />
                  Programa de indicacao
                </div>
                <h3 className="mt-3 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Indique e ganhe R$ 50,00 de desconto na mensalidade
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  Traga um lojista para o iGestorPhone e receba desconto no proximo ciclo.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-400/30">
                <Users className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                Quero indicar
              </button>
            </div>
          </div>
        </div>

        {/* Update status and filters */}
        <div ref={filtersPanelRef} className="bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10">
          {/* Mobile: botão Mostrar/Ocultar filtros */}
          <button
            type="button"
            onClick={() => setShowFiltersMobile((s) => !s)}
            className="md:hidden w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors mb-3"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white">
              <SlidersHorizontal className="w-4 h-4" />
              {showFiltersMobile ? 'Ocultar filtros' : 'Mostrar filtros'}
            </span>
            {showFiltersMobile ? (
              <ChevronUp className="w-5 h-5 text-gray-500 dark:text-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500 dark:text-white/60" />
            )}
          </button>
          {/* Filters row - no mobile só quando expandido */}
          <div className={`${showFiltersMobile ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="relative min-w-0">
              <label className="block text-[10px] xl:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 xl:mb-2 flex items-center min-w-0">
                <CalendarDays className="w-3 h-3 xl:w-4 xl:h-4 mr-1 shrink-0" />
                <span className="truncate">Data</span>
              </label>

              <button
                ref={datePickerButtonRef}
                type="button"
                onClick={() => setShowDatePicker((s) => !s)}
                className="w-full h-10 xl:h-11 px-1.5 xl:px-3 py-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-semibold text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20 transition-colors flex items-center"
              >
                <div className="flex items-center justify-between gap-1 xl:gap-3 w-full min-w-0">
                  <div className="flex items-center gap-1 xl:gap-3 min-w-0">
                    <span className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg xl:rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs xl:text-base font-bold shrink-0">
                      {selectedDateParts.dayNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] xl:text-sm font-semibold truncate leading-tight">{selectedDateParts.weekday}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 xl:gap-2 shrink-0">
                    {(() => {
                      const opt = dateOptions.find((d) => d.key === selectedDateKey)
                      return (
                        <span className="px-1.5 py-0.5 xl:px-3 xl:py-1.5 rounded-full bg-gray-900 text-white text-[9px] xl:text-xs font-semibold">
                          {opt?.label ?? 'Hoje'}
                        </span>
                      )
                    })()}
                    {showDatePicker ? (
                      <ChevronUp className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    )}
                  </div>
                </div>
              </button>

              {/* Dropdown de data em portal para não ser cortado pelo overflow-x-auto da linha de filtros */}
              {showDatePicker && datePickerRect &&
                createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[55]"
                      aria-hidden
                      onClick={() => setShowDatePicker(false)}
                    />
                    <div
                      className="fixed z-[60] bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden"
                      style={{
                        top: datePickerRect.top + 8,
                        left: datePickerRect.left,
                        width: datePickerRect.width
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        3 dias disponíveis
                      </div>
                      <div className="p-2 space-y-2">
                        {dateOptions.map((opt) => {
                          const parts = getSaoPauloDateParts(opt.offset)
                          const isSelected = opt.key === selectedDateKey
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setSelectedDateKey(opt.key)
                                setShowDatePicker(false)
                              }}
                              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                                isSelected
                                  ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                                  : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                              }`}
                            >
                              <span
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                  isSelected ? 'bg-white/10 text-white dark:bg-gray-900 dark:text-white' : 'bg-gray-900/5 text-gray-900 dark:text-white/90'
                                }`}
                              >
                                {parts.dayNumber}
                              </span>
                              <div className="min-w-0 flex-1 text-left">
                                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>
                                  {parts.weekday}
                                </div>
                                <div className={`text-xs truncate ${isSelected ? 'text-white/70 dark:text-gray-900/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {parts.subtitle}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isSelected && (
                                  <span className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold hidden sm:inline-flex">
                                    {opt.label}
                                  </span>
                                )}
                                {isSelected && (
                                  <Check className="w-5 h-5 text-white" />
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>,
                  document.body
                )}
            </div>

            <div className="relative min-w-0">
              <label className="block text-[10px] xl:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 xl:mb-2 flex items-center min-w-0">
                <Building2 className="w-3 h-3 xl:w-4 xl:h-4 mr-1 shrink-0" />
                <span className="truncate">Categoria</span>
              </label>
              {searchMode === 'seminovo' ? (
                <div
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-xs xl:text-sm font-bold text-emerald-900 dark:text-emerald-100 tracking-wide min-h-[2.5rem] xl:min-h-0 flex items-center"
                  title="Seminovo: uma única categoria de listagem"
                >
                  SEMI
                </div>
              ) : (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-2 pr-7 xl:pl-3 xl:pr-8 py-2 xl:py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs xl:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white min-h-[2.5rem] xl:min-h-0"
                >
                  <option value="">Todas as Categorias</option>
                  {dynamicFilters.categories.length > 0 ? (
                    dynamicFilters.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CODE_LABELS[cat] || cat}
                      </option>
                    ))
                  ) : searchMode === 'android' ? (
                    <>
                      {ANDROID_CATEGORY_ORDER.map((code) => (
                        <option key={code} value={code}>
                          {CATEGORY_CODE_LABELS[code] || code}
                        </option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="IPH">{CATEGORY_CODE_LABELS.IPH}</option>
                      <option value="IPAD">{CATEGORY_CODE_LABELS.IPAD}</option>
                      <option value="MCB">{CATEGORY_CODE_LABELS.MCB}</option>
                      <option value="PODS">{CATEGORY_CODE_LABELS.PODS}</option>
                      <option value="RLG">{CATEGORY_CODE_LABELS.RLG}</option>
                      <option value="ACSS">{CATEGORY_CODE_LABELS.ACSS}</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              )}
            </div>

            <div className="relative min-w-0">
              <label
                className="block text-[10px] xl:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 xl:mb-2 flex items-center min-w-0 leading-tight"
                title="SSD / Armazenamento"
              >
                <Package className="w-3 h-3 xl:w-4 xl:h-4 mr-1 shrink-0" />
                <span className="xl:hidden">SSD / Armaz.</span>
                <span className="hidden xl:inline truncate">SSD / Armazenamento</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value)}
                  className="w-full pl-2 pr-7 xl:pl-3 xl:pr-8 py-2 xl:py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs xl:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white min-h-[2.5rem] xl:min-h-0"
                >
                  <option value="">Todas</option>
                  {dynamicFilters.storages.length > 0 ? (
                    dynamicFilters.storages.map((storage) => (
                      <option key={storage} value={storage}>
                        {storage}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="64GB">64GB</option>
                      <option value="128GB">128GB</option>
                      <option value="256GB">256GB</option>
                      <option value="512GB">512GB</option>
                      <option value="1TB">1TB</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="relative min-w-0">
              <label className="block text-[10px] xl:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 xl:mb-2 flex items-center min-w-0">
                <Building2 className="w-3 h-3 xl:w-4 xl:h-4 mr-1 shrink-0" />
                <span className="truncate">GB de RAM</span>
              </label>
              <div className="relative">
                <select
                  value={selectedRam}
                  onChange={(e) => setSelectedRam(e.target.value)}
                  className="w-full pl-2 pr-7 xl:pl-3 xl:pr-8 py-2 xl:py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs xl:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white min-h-[2.5rem] xl:min-h-0"
                >
                  <option value="">Todas</option>
                  {dynamicFilters.rams.length > 0 ? (
                    dynamicFilters.rams.map((ram) => (
                      <option key={ram} value={ram}>{ram}</option>
                    ))
                  ) : (
                    <>
                      <option value="8GB">8GB</option>
                      <option value="16GB">16GB</option>
                      <option value="24GB">24GB</option>
                    </>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="relative min-w-0">
              <label className="block text-[10px] xl:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 xl:mb-2 flex items-center min-w-0">
                <Palette className="w-3 h-3 xl:w-4 xl:h-4 mr-1 shrink-0" />
                <span className="truncate">Cores</span>
              </label>
              <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden max-h-[11rem] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedColor('')}
                  title="Todas as cores"
                  className={`w-full flex items-center justify-center py-2.5 border-b border-gray-100 dark:border-white/10 transition-colors ${
                    !selectedColor ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Todas
                  </span>
                </button>
                {(dynamicFilters.colors.length > 0 ? dynamicFilters.colors : OFFICIAL_COLORS).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    title={color}
                    className={`w-full flex items-center justify-center py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors ${
                      selectedColor === color
                        ? 'bg-blue-50 dark:bg-blue-950/40'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <ProductColorSwatch normalizedLabel={color} size="md" />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-w-0">
              <label className="block text-[10px] xl:text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 xl:mb-2 flex items-center min-w-0">
                <ShoppingCart className="w-3 h-3 xl:w-4 xl:h-4 mr-1 shrink-0" />
                <span className="truncate">Fornecedor</span>
              </label>
              <div className="relative" ref={supplierDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowSupplierDropdown((s) => !s)}
                  className="w-full px-2 xl:px-3 py-2 xl:py-2.5 min-h-[2.5rem] xl:min-h-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-xs xl:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 dark:text-white text-left flex items-center justify-between gap-1 xl:gap-2"
                >
                  <span className="truncate">{selectedSupplier || 'Todos os Fornecedores'}</span>
                  <ChevronDown className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                </button>

                {showSupplierDropdown && (
                  <div className="absolute z-30 mt-2 w-[320px] max-w-[90vw] right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-white/10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          placeholder="Buscar fornecedor..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSupplier('')
                          setShowSupplierDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !selectedSupplier
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        Todos os Fornecedores
                      </button>

                      {visibleSuppliers.length > 0 ? (
                        visibleSuppliers.map((supplier) => (
                          <button
                            key={supplier}
                            type="button"
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setShowSupplierDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedSupplier === supplier
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {supplier}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                          Nenhum fornecedor encontrado
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black">
                      <button
                        type="button"
                        onClick={() => {
                          setSupplierSearch('')
                          setSelectedSupplier('')
                        }}
                        className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSupplierDropdown(false)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <motion.div
          ref={resultsSectionRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-white/10"
        >
          <AnimatePresence mode="wait">
            {productsQuery.isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-16"
              >
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="ml-3 text-gray-900 dark:text-white text-lg"
                >
                  Buscando produtos...
                </motion.span>
              </motion.div>
            ) : productsQuery.isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 backdrop-blur-sm mb-4 border border-red-500/20">
                  <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao buscar produtos</p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{(productsQuery.error as any)?.message || 'Erro desconhecido'}</p>
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-white/10 backdrop-blur-sm mb-4 border border-gray-200 dark:border-white/20">
                  <Search className="w-10 h-10 text-gray-400 dark:text-gray-300" />
                </div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum produto encontrado</p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {debouncedSearch.trim().length >= 2
                    ? `Não há ofertas ${
                        searchMode === 'seminovo'
                          ? 'semi-novo'
                          : searchMode === 'android'
                            ? 'Android'
                            : 'lacrado'
                      } para "${debouncedSearch.trim()}" com os filtros atuais.`
                    : 'Digite um termo de busca ou ajuste os filtros.'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <ArrowUpDown className="w-4 h-4 inline mr-1" />
                      Ordenado por: Menor Preço
                    </span>
                  </div>
                  {priceHistoryQuery.data && Array.isArray((priceHistoryQuery.data as any).prices) && (priceHistoryQuery.data as any).prices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preços dos últimos 2 dias:</p>
                      <div className="flex gap-4 flex-wrap text-xs">
                        {(priceHistoryQuery.data as any).prices.slice(0, 2).map((day: any) => (
                          <div key={day.date} className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{day.date}:</span>
                            <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(day.average_price)}</span>
                            {day.variation !== undefined && day.variation !== 0 && (
                              <span className={`flex items-center gap-1 ${day.variation > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {day.variation > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(day.variation_percentage).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto max-w-full">
                  <table className="w-full min-w-max table-auto">
                    <thead className="sticky top-20 z-30 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
                      <tr>
                        <th className="px-2 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider min-w-[180px]">
                          <div className="flex items-center space-x-1">
                            <Package className="w-3 h-3" />
                            <span>Produto</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center space-x-1">
                            <ShoppingCart className="w-3 h-3" />
                            <span>Fornecedor</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-3 h-3" />
                            <span>Storage</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[80px]">
                          <span>RAM</span>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center space-x-1">
                            <Palette className="w-3 h-3" />
                            <span>Cor</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3" />
                            <span>Categoria</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">
                          <span>Preço</span>
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[140px]">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-white/10">
                      <AnimatePresence>
                        {pagination.paginated.map((product: any, index: number) => (
                          <motion.tr
                            key={`${product.id}-${(currentPage - 1) * itemsPerPage + index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group"
                          >
                            <td className="px-2 py-3 whitespace-normal">
                              <div className="flex items-center gap-2">
                                {currentPage === 1 && index === 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0"
                                  >
                                    1
                                  </motion.span>
                                )}
                                {(() => {
                                  const { Icon, wrap } = productListIconSpec(product)
                                  return (
                                    <div className={wrap} aria-hidden title="Categoria visual">
                                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
                                    </div>
                                  )
                                })()}
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate">
                                    {productListTitleShown(product).toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-normal text-xs text-gray-900 dark:text-white">
                              <div className="flex flex-col space-y-1">
                                <span className="truncate">{product.supplier_name || 'N/A'}</span>
                                {searchMode === 'seminovo' && getSeminovoOriginBadge(product.variant) ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold w-fit bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20">
                                    {getSeminovoOriginBadge(product.variant)!.flag} {getSeminovoOriginBadge(product.variant)!.label}
                                  </span>
                                ) : product.variant ? (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase w-fit ${
                                      product.variant.toUpperCase() === 'ANATEL'
                                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-400/40'
                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/30'
                                    }`}
                                  >
                                    {product.variant}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-400/30">
                                {normalizeStorage(product.storage) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                              {parseRamFromProduct(product) || '—'}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <ProductColorSwatch {...productSwatchProps(product, searchMode)} />
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-white/80 font-semibold tracking-wide">
                              {(() => {
                                const mode: CategorySearchMode =
                                  searchMode === 'seminovo' ? 'seminovo' : searchMode === 'android' ? 'android' : 'novo'
                                const code = getProductCategoryCode(product, mode)
                                return code || '—'
                              })()}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <div className="flex flex-col items-start space-y-1">
                                <span className="text-sm font-bold text-green-400">
                                  {formatPrice(product.price || 0)}
                                </span>
                                {currentPage === 1 && index === 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-400/30"
                                  >
                                    Mais Barato
                                  </motion.span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-1">
                                {product.whatsapp ? (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleWhatsApp(product.whatsapp, product)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all shadow-lg"
                                    title="Contatar no WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="hidden lg:inline">WhatsApp</span>
                                  </motion.button>
                                ) : (
                                  <div className="text-[10px] text-gray-400 px-1 py-0.5">Sem WhatsApp</div>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const text = `${productListTitleShown(product).toUpperCase()}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}\nCapacidade: ${normalizeStorage(product.storage) || 'N/A'}\nCor: ${normalizeColor(product.color || 'N/A', product.model || product.name)}\n${
                                      product.variant ? `Variante: ${product.variant}\n` : ''
                                    }`
                                    navigator.clipboard.writeText(text)
                                    toast.success('Copiado para a área de transferência!')
                                  }}
                                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 rounded-lg transition-colors"
                                  title="Copiar informações"
                                >
                                  <Copy className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                  ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  <AnimatePresence>
                    {pagination.paginated.map((product: any, index: number) => (
                      <motion.div
                        key={`${product.id}-${(currentPage - 1) * itemsPerPage + index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-gray-200 dark:border-white/20"
                      >
                        {/* Header with product name and badge */}
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              {currentPage === 1 && index === 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 200 }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 dark:bg-green-500 text-white text-xs font-bold shrink-0 mt-0.5"
                                >
                                  1
                                </motion.span>
                              )}
                              {(() => {
                                const { Icon, wrap } = productListIconSpec(product)
                                return (
                                  <div className={wrap} aria-hidden title="Categoria visual">
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                                  </div>
                                )
                              })()}
                              <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight leading-snug flex-1 min-w-0">
                                {productListTitleShown(product).toUpperCase()}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {formatPrice(product.price || 0)}
                            </div>
                            {currentPage === 1 && index === 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-400/30"
                              >
                                Mais Barato
                              </motion.span>
                            )}
                          </div>
                        </div>

                        {/* Info badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-400/30">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            {normalizeStorage(product.storage) || 'N/A'}
                          </span>
                          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/15">
                            <ProductColorSwatch size="sm" {...productSwatchProps(product, searchMode)} />
                          </span>
                          {searchMode === 'seminovo' && getSeminovoOriginBadge(product.variant) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20">
                              {getSeminovoOriginBadge(product.variant)!.flag} {getSeminovoOriginBadge(product.variant)!.label}
                            </span>
                          ) : product.variant ? (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                                product.variant.toUpperCase() === 'ANATEL'
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-400/40'
                                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/30'
                              }`}
                            >
                              {product.variant}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-slate-100 dark:bg-slate-500/25 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-400/30">
                            {getProductCategoryCode(
                              product,
                              searchMode === 'seminovo' ? 'seminovo' : searchMode === 'android' ? 'android' : 'novo'
                            ) || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-white/80">
                          <ShoppingCart className="w-4 h-4" />
                          <span>{product.supplier_name || 'N/A'}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
                          {product.whatsapp ? (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleWhatsApp(product.whatsapp, product)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span>WhatsApp</span>
                            </motion.button>
                          ) : (
                            <div className="flex-1 text-xs text-gray-400 px-4 py-3 text-center">Sem WhatsApp</div>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const text = `${productListTitleShown(product).toUpperCase()}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}\nCapacidade: ${normalizeStorage(product.storage) || 'N/A'}\nCor: ${normalizeColor(product.color || 'N/A', product.model || product.name)}\n${
                                product.variant ? `Variante: ${product.variant}\n` : ''
                              }`
                              navigator.clipboard.writeText(text)
                              toast.success('Copiado para a área de transferência!')
                            }}
                            className="p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 rounded-lg transition-colors"
                            title="Copiar informações"
                          >
                            <Copy className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Paginação no fim da página */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      <AnimatedNumber value={pagination.total} /> {pagination.total === 1 ? 'produto' : 'produtos'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span>Por página:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-white">
                      Página {currentPage} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 text-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                    >
                      Próx.
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

          </div>

    </div>
  )
}