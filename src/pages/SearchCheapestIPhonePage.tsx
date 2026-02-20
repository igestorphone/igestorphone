import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Building2,
  BarChart3,
  Palette,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  MessageCircle,
  Copy,
  Package,
  Wifi,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
  Apple,
  Smartphone,
  RefreshCw
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { produtosApi, utilsApi } from '@/lib/api'
import { createWhatsAppUrl } from '@/lib/utils'
import toast from 'react-hot-toast'
import SecurityAlertModal from '@/components/ui/SecurityAlertModal'
import { normalizeColor } from './colorNormalizer'

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

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })

// Input de busca com estado local: só o input re-renderiza ao digitar, evitando delay
function SearchInputDebounced({
  onDebouncedChange,
  placeholder = 'Buscar produtos...'
}: {
  onDebouncedChange: (value: string) => void
  placeholder?: string
}) {
  const [localValue, setLocalValue] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => onDebouncedChange(localValue.trim() || ''), 400)
    return () => clearTimeout(timer)
  }, [localValue, onDebouncedChange])
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all touch-manipulation min-h-[44px]"
      />
    </div>
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

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768

type SearchMode = 'novo' | 'seminovo' | 'android'

function getDefaultSearchForMode(mode: SearchMode): string {
  if (mode === 'seminovo') return 'iphone '
  if (mode === 'android') return ''
  return ''
}

export default function SearchCheapestIPhonePage({ initialSearchMode }: { initialSearchMode?: SearchMode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const modeFromUrl = searchParams.get('mode') as SearchMode | null
  const urlModeValid = modeFromUrl === 'novo' || modeFromUrl === 'seminovo' || modeFromUrl === 'android'
  const [searchMode, setSearchModeState] = useState<SearchMode>(() =>
    initialSearchMode ?? (urlModeValid ? modeFromUrl! : 'novo')
  )

  const setSearchMode = (mode: SearchMode) => {
    setSearchModeState(mode)
    setSearchParams({ mode }, { replace: true })
    setDebouncedSearch(getDefaultSearchForMode(mode))
  }

  const [debouncedSearch, setDebouncedSearch] = useState(() => getDefaultSearchForMode(searchMode))
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedRam, setSelectedRam] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [showSecurityAlert, setShowSecurityAlert] = useState(false)
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  // No mobile: atrasa a query para o shell ficar interativo antes da rede
  const [queryReady, setQueryReady] = useState(() => !isMobile())

  useEffect(() => {
    if (queryReady) return
    const t = setTimeout(() => setQueryReady(true), 200)
    return () => clearTimeout(t)
  }, [queryReady])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedDate, selectedCategory, selectedStorage, selectedRam, selectedColor])

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
      selectedDate,
      selectedCategory,
      selectedStorage,
      selectedRam,
      selectedColor
    ],
    queryFn: () => {
      const params: any = {
        search: debouncedSearch.length >= 2 ? debouncedSearch.trim() || undefined : undefined,
        condition: selectedCategory,
        storage: selectedStorage,
        color: filterColorClientSide ? undefined : selectedColor || undefined,
        date: selectedDate || undefined,
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
      } else {
        params.product_type = 'android'
      }
      return produtosApi.getAll(params)
    },
    enabled: shouldFetchProducts && queryReady,
    staleTime: 10000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    select: (response: any) => {
      let products: any[] = []
      if (Array.isArray(response)) products = response
      else if (response?.products) products = response.products
      else if (response?.data?.products) products = response.data.products
      else if (response?.data && Array.isArray(response.data)) products = response.data

      if (filterColorClientSide && selectedColor) {
        products = products.filter(
          (p: any) => normalizeColor(p.color, p.model || p.name) === selectedColor
        )
      }

      const getVariantPriority = (variant?: string | null) =>
        variant && variant.toString().toUpperCase().includes('ANATEL') ? 1 : 0

      return products
        .map((product: any) => ({
          ...product,
          price: parseFloat(product.price) || 0,
          variant: product.variant ? product.variant.toString() : null
        }))
        .sort((a: any, b: any) => {
          const priorityDiff = getVariantPriority(a.variant) - getVariantPriority(b.variant)
          if (priorityDiff !== 0) return priorityDiff
          return a.price - b.price
        })
    }
  })

  const dynamicFilters = useMemo(() => {
    const products = productsQuery.data || []
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
      if (product.storage) storages.add(product.storage)
      // RAM: region (8GB, 16GB), specifications.ram ou parse do model para MacBook
      const ramVal = product.specifications?.ram || product.region
      if (ramVal && typeof ramVal === 'string') {
        const m = ramVal.match(/(\d+)\s*GB/i)
        if (m) rams.add(`${m[1]}GB`)
      }
      if (product.model?.toLowerCase().includes('macbook')) {
        const matches = (product.model || '').matchAll(/(\d+)\s*GB/gi)
        for (const m of matches) {
          const gb = parseInt(m[1], 10)
          if (gb <= 96) rams.add(`${gb}GB`) // 8, 16, 24, 32... (evita 256GB como RAM)
        }
      }
      if (product.supplier_name) suppliers.add(product.supplier_name)
      if (product.model) {
        if (product.model.includes('iPhone')) categories.add('iPhone')
        else if (product.model.includes('iPad')) categories.add('iPad')
        else if (product.model.includes('MacBook')) categories.add('MacBook')
        else if (product.model.includes('AirPods')) categories.add('AirPods')
        else if (product.model.includes('Apple Watch')) categories.add('Apple Watch')
      }
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
      categories: Array.from(categories).sort()
    }
  }, [productsQuery.data, debouncedSearch])

  const filteredProducts = useMemo(() => {
    const all = productsQuery.data || []
    if (!selectedRam) return all
    return all.filter((p: any) => {
      const ramVal = p.specifications?.ram || p.region
      if (ramVal && typeof ramVal === 'string') {
        const m = ramVal.match(/(\d+)\s*GB/i)
        if (m && `${m[1]}GB` === selectedRam) return true
      }
      if (p.model?.toLowerCase().includes('macbook')) {
        const modelMatch = (p.model || '').match(/(\d+)\s*GB/i)
        if (modelMatch && `${modelMatch[1]}GB` === selectedRam) return true
      }
      return false
    })
  }, [productsQuery.data, selectedRam])

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
      const modelStr = (product.model || product.name || 'Produto').replace(/^iPhone\s*/i, '').trim()
      const parts = [modelStr]
      if (product.storage) parts.push(product.storage)
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

  const globalStatsQuery = useQuery({
    queryKey: ['global-stats'],
    queryFn: () => utilsApi.getGlobalStats(),
    staleTime: 60000,
    refetchOnWindowFocus: false
  })

  const totalProducts = globalStatsQuery.data?.total_products ?? 0
  const totalSuppliers = globalStatsQuery.data?.total_suppliers ?? 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200 overflow-x-hidden">
      <div className="space-y-4 p-4 md:p-6 max-w-full">
        {/* Status bar - Total geral (fixa ao rolar), não separada por tipo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4"
        >
          {/* Totais gerais (tudo no sistema) */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {totalProducts.toLocaleString('pt-BR')} produtos
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {totalSuppliers.toLocaleString('pt-BR')} fornecedores
              </span>
            </div>
          </div>

          {/* Right side - Status and time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300/50 dark:border-white/15 bg-white/50 dark:bg-white/10">
              {serverStatusQuery.data?.status === 'OK' ? (
                <>
                  <Wifi className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">ONLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-red-600/80 dark:text-red-400/80" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400/80">OFFLINE</span>
                </>
              )}
            </div>
            <LiveClock />
          </div>
        </motion.div>

        {/* Tipo de busca: Apple | Semi-novo | Android (estilo concorrente) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white dark:bg-black rounded-xl shadow-sm p-4 border border-gray-200 dark:border-white/10"
        >
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {([
              { mode: 'novo' as const, Icon: Apple, label: 'Apple Novo', emoji: '🍎', activeClass: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' },
              { mode: 'seminovo' as const, Icon: RefreshCw, label: 'iPhone Seminovo', emoji: '📲', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
              { mode: 'android' as const, Icon: Smartphone, label: 'Android', emoji: '🤖', activeClass: 'bg-green-600 text-white border-green-600' }
            ]).map(({ mode, Icon, label, emoji, activeClass }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSearchMode(mode)}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-5 rounded-lg border-2 text-sm font-semibold transition-all min-w-[120px] ${
                  searchMode === mode
                    ? `${activeClass} shadow-md scale-[1.02]`
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="text-base" aria-hidden>{emoji}</span>
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2.2} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search - input isolado para não re-renderizar a página ao digitar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10"
        >
          <SearchInputDebounced
            key={searchMode}
            onDebouncedChange={setDebouncedSearch}
            placeholder={
              searchMode === 'android'
                ? 'Ex: Samsung, Xiaomi, Motorola...'
                : searchMode === 'seminovo'
                  ? 'Ex: iPhone 15, iPhone 14...'
                  : 'Ex: iPhone 16, MacBook, AirPods...'
            }
          />
        </motion.div>

        {/* Update status and filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10"
        >
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
          <div className={`overflow-x-auto -mx-4 px-4 ${showFiltersMobile ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 min-w-max">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5" />
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
              >
                <option value="">Todas as Categorias</option>
                {dynamicFilters.categories.length > 0 ? (
                  dynamicFilters.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="iPhone">iPhone</option>
                    <option value="iPad">iPad</option>
                    <option value="MacBook">MacBook</option>
                    <option value="AirPods">AirPods</option>
                    <option value="Apple Watch">Apple Watch</option>
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-1.5" />
                SSD / Armazenamento
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
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
              <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5" />
                GB de RAM
              </label>
              <select
                value={selectedRam}
                onChange={(e) => setSelectedRam(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
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
              <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Palette className="w-4 h-4 mr-1.5" />
                Cor
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
              >
                <option value="">Todas as Cores</option>
                {dynamicFilters.colors.length > 0 ? (
                  dynamicFilters.colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))
                ) : (
                  OFFICIAL_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Fornecedor
              </label>
              <select
                value=""
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
              >
                <option value="">Todos os Forneced...</option>
              </select>
              <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
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
            ) : !productsQuery.data || productsQuery.data.length === 0 ? (
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
                <p className="text-gray-600 dark:text-gray-300 mb-6">Digite um termo de busca ou ajuste os filtros</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
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
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-white/10">
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
                              <div className="flex items-center">
                                {currentPage === 1 && index === 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold mr-1.5 flex-shrink-0"
                                  >
                                    1
                                  </motion.span>
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                    {product.name || product.model || 'N/A'}
                                  </div>
                                  {product.model && product.model !== product.name && (
                                    <div className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5 truncate">{product.model}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-normal text-xs text-gray-900 dark:text-white">
                              <div className="flex flex-col space-y-1">
                                <span className="truncate">{product.supplier_name || 'N/A'}</span>
                                {product.variant && (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase w-fit ${
                                      product.variant.toUpperCase() === 'ANATEL'
                                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-400/40'
                                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/30'
                                    }`}
                                  >
                                    {product.variant}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-400/30">
                                {product.storage || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                              {(() => {
                                const ramVal = product.specifications?.ram || product.region
                                if (ramVal && typeof ramVal === 'string') {
                                  const m = ramVal.match(/(\d+)\s*GB/i)
                                  if (m && parseInt(m[1], 10) <= 96) return `${m[1]}GB`
                                }
                                if (product.model?.toLowerCase().includes('macbook')) {
                                  const matches = [...(product.model || '').matchAll(/(\d+)\s*GB/gi)]
                                  const ramGb = matches.find((m) => {
                                    const gb = parseInt(m[1], 10)
                                    return gb <= 96
                                  })
                                  if (ramGb) return `${ramGb[1]}GB`
                                }
                                return '—'
                              })()}
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-400/30">
                                {normalizeColor(product.color, product.model || product.name)}
                              </span>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-white/80">
                              {product.model?.includes('iPhone')
                                ? 'iPhone'
                                : product.model?.includes('iPad')
                                ? 'iPad'
                                : product.model?.includes('MacBook')
                                ? 'MacBook'
                                : product.model?.includes('AirPods')
                                ? 'AirPods'
                                : product.model?.includes('Apple Watch')
                                ? 'Apple Watch'
                                : '—'}
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
                                    const text = `${product.name || product.model}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}\nCapacidade: ${product.storage || 'N/A'}\nCor: ${normalizeColor(product.color || 'N/A', product.model || product.name)}\n${
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {currentPage === 1 && index === 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 200 }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 dark:bg-green-500 text-white text-xs font-bold"
                                >
                                  1
                                </motion.span>
                              )}
                              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                {product.name || product.model || 'N/A'}
                              </h3>
                            </div>
                            {product.model && product.model !== product.name && (
                              <p className="text-xs text-gray-600 dark:text-gray-300">{product.model}</p>
                            )}
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
                            {product.storage || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-400/30">
                            <Palette className="w-3 h-3 mr-1" />
                            {normalizeColor(product.color, product.model || product.name)}
                          </span>
                          {product.variant && (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                                product.variant.toUpperCase() === 'ANATEL'
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-400/40'
                                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/30'
                              }`}
                            >
                              {product.variant}
                            </span>
                          )}
                        </div>

                        {/* Supplier info */}
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
                              const text = `${product.name || product.model}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}\nCapacidade: ${product.storage || 'N/A'}\nCor: ${normalizeColor(product.color || 'N/A', product.model || product.name)}\n${
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
                      {pagination.total} {pagination.total === 1 ? 'produto' : 'produtos'}
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

        {/* Modal de Alerta de Segurança */}
        <SecurityAlertModal
          isOpen={showSecurityAlert}
          onClose={() => setShowSecurityAlert(false)}
        />

        {/* Ícone de Aviso Fixo - Permite reabrir o alerta */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSecurityAlert(true)}
          className="fixed bottom-6 right-6 z-50 bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full shadow-2xl border-2 border-yellow-400 transition-all duration-200 flex items-center justify-center group"
          title="Ver aviso de segurança"
        >
          <AlertTriangle className="w-6 h-6 group-hover:animate-pulse" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
    </div>
  )
}