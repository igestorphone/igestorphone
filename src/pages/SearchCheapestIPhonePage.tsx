import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Calendar,
  Building2,
  BarChart3,
  Palette,
  ShoppingCart,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  MessageCircle,
  Copy,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Package,
  Wifi,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { produtosApi, utilsApi } from '@/lib/api'
import { createWhatsAppUrl } from '@/lib/utils'
import toast from 'react-hot-toast'
import SecurityAlertModal from '@/components/ui/SecurityAlertModal'

const colorMap: Record<string, string> = {
  // Preto
  black: 'Preto',
  'space black': 'Preto',
  'jet black': 'Preto',
  preto: 'Preto',
  
  // Branco
  white: 'Branco',
  branco: 'Branco',
  starlight: 'Branco',
  'titanium white': 'Branco',
  
  // Azul
  blue: 'Azul',
  azul: 'Azul',
  'deep blue': 'Azul',
  'titanium blue': 'Azul',
  midnight: 'Azul',
  
  // Laranja
  orange: 'Laranja',
  laranja: 'Laranja',
  'cosmic orange': 'Laranja',
  cosmic: 'Laranja',
  
  // Prata (para iPhone 17 Pro/Pro Max = Branco)
  silver: 'Branco',
  prata: 'Branco',
  
  // Outras cores
  red: 'Vermelho',
  vermelho: 'Vermelho',
  green: 'Verde',
  verde: 'Verde',
  yellow: 'Amarelo',
  amarelo: 'Amarelo',
  purple: 'Roxo',
  roxo: 'Roxo',
  pink: 'Rosa',
  rosa: 'Rosa',
  rose: 'Rosa',
  gold: 'Dourado',
  dourado: 'Dourado',
  gray: 'Cinza',
  grey: 'Cinza',
  cinza: 'Cinza',
  natural: 'Natural',
  desert: 'Desert',
  lilac: 'Lilás',
  lilas: 'Lilás',
  titanium: 'Titânio',
  'titanium black': 'Preto',
  'titanium natural': 'Natural'
}

const normalizeColor = (color: string, model?: string): string => {
  if (!color) return 'N/A'
  const lower = color.toLowerCase().trim()
  
  // Para iPhone 17 Pro/Pro Max, Prata = Branco
  if (model && (model.includes('17 Pro') || model.includes('17 Pro Max'))) {
    if (lower === 'prata' || lower === 'silver') {
      return 'Branco'
    }
  }
  
  // Tentar mapeamento completo primeiro
  if (colorMap[lower]) {
    return colorMap[lower]
  }
  
  // Tentar por palavras individuais
  const words = lower.split(/\s+/)
  for (const word of words) {
    if (colorMap[word]) {
      return colorMap[word]
    }
  }
  
  // Tentar primeira palavra
  if (words.length > 0 && colorMap[words[0]]) {
    return colorMap[words[0]]
  }
  
  // Se não encontrar, retornar capitalizado
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0)

const formatDateShort = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const buildAvailableDates = () => {
  const dates: { value: string; label: string }[] = []
  const today = new Date()
  dates.push({ value: today.toISOString().split('T')[0], label: 'Hoje' })
  for (let i = 1; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push({ value: date.toISOString().split('T')[0], label: formatDateShort(date.toISOString()) })
  }
  return dates
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })

export default function SearchCheapestIPhonePage() {
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('iPhone')
  const [debouncedSearch, setDebouncedSearch] = useState('iPhone')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSecurityAlert, setShowSecurityAlert] = useState(false)

  useEffect(() => {
    const trimmed = searchQuery.trim()
    const timer = setTimeout(() => setDebouncedSearch(trimmed || 'iPhone'), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleFocus = () => queryClient.invalidateQueries({ queryKey: ['produtos'] })
    window.addEventListener('focus', handleFocus)
    const interval = setInterval(() => queryClient.invalidateQueries({ queryKey: ['produtos'] }), 30000)
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [queryClient])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])



  const shouldFetchProducts =
    debouncedSearch.length >= 1 ||
    !!selectedDate ||
    !!selectedCategory ||
    !!selectedStorage ||
    !!selectedColor

  const productsQuery = useQuery({
    queryKey: [
      'produtos',
      debouncedSearch,
      selectedDate,
      selectedCategory,
      selectedStorage,
      selectedColor
    ],
    queryFn: () =>
      produtosApi.getAll({
        search: debouncedSearch,
        condition: selectedCategory,
        storage: selectedStorage,
        color: selectedColor,
        date: selectedDate || undefined,
        sort_by: 'price',
        sort_order: 'asc',
        limit: 5000
      }),
    enabled: shouldFetchProducts,
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
    const suppliers = new Set<string>()
    const categories = new Set<string>()

    products.forEach((product: any) => {
      if (product.color) colors.add(normalizeColor(product.color, product.model))
      if (product.storage) storages.add(product.storage)
      if (product.supplier_name) suppliers.add(product.supplier_name)
      if (product.model) {
        if (product.model.includes('iPhone')) categories.add('iPhone')
        else if (product.model.includes('iPad')) categories.add('iPad')
        else if (product.model.includes('MacBook')) categories.add('MacBook')
        else if (product.model.includes('AirPods')) categories.add('AirPods')
        else if (product.model.includes('Apple Watch')) categories.add('Apple Watch')
      }
    })

    return {
      colors: Array.from(colors).sort(),
      storages: Array.from(storages).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, '')) || 0
        const bNum = parseInt(b.replace(/\D/g, '')) || 0
        return aNum - bNum
      }),
      suppliers: Array.from(suppliers).sort(),
      categories: Array.from(categories).sort()
    }
  }, [productsQuery.data])

  const stats = useMemo(() => {
    const products = productsQuery.data || []
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
  }, [productsQuery.data])

  const handleWhatsApp = (whatsapp: string, product?: any) => {
    if (!whatsapp) {
      toast.error('WhatsApp do fornecedor não disponível')
      return
    }

    const productInfo = product
      ? `\n${product.name || product.model || 'Produto'}\n${
          product.model && product.model !== product.name ? `Modelo: ${product.model}\n` : ''
        }Preço: ${formatPrice(product.price || 0)}\n${product.storage ? `Capacidade: ${product.storage}\n` : ''}${
          product.color ? `Cor: ${normalizeColor(product.color)}\n` : ''
        }${product.variant ? `Variante: ${product.variant}\n` : ''}`
      : '\n'

    const message = `Olá! Tenho interesse no produto:${productInfo}\nPode me enviar mais informações?`
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

  const dollarRateQuery = useQuery({
    queryKey: ['dollar-rate'],
    queryFn: () => utilsApi.getDollarRate(),
    refetchInterval: 60000,
    staleTime: 30000
  })

  const serverStatusQuery = useQuery({
    queryKey: ['server-status'],
    queryFn: () => utilsApi.getServerStatus(),
    refetchInterval: 10000,
    staleTime: 5000
  })

  const dollarRate = dollarRateQuery.data?.rate || 5.38
  const previousRate = useMemo(() => {
    const cached = localStorage.getItem('dollar-rate-cache')
    if (!cached) return 5.5
    try {
      const data = JSON.parse(cached)
      return data.rate || 5.5
    } catch {
      return 5.5
    }
  }, [dollarRateQuery.data])

  useEffect(() => {
    if (dollarRateQuery.data?.rate) {
      localStorage.setItem(
        'dollar-rate-cache',
        JSON.stringify({ rate: dollarRateQuery.data.rate, timestamp: new Date().toISOString() })
      )
    }
  }, [dollarRateQuery.data])

  const dollarChange = dollarRate - previousRate
  const dollarChangePercent = previousRate > 0 ? ((dollarChange / previousRate) * 100).toFixed(2) : '0.00'

  const availableDates = buildAvailableDates()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200">
      <div className="space-y-4 p-4 md:p-6">
        {/* Status bar - Barra superior com informações */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4"
        >
          {/* Left side - Statistics */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {productsQuery.data?.length || 0} produtos
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.suppliersCount} fornecedores
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                R$ {dollarRate.toFixed(2)}
              </span>
              {dollarChange !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs ${
                    dollarChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {dollarChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {Math.abs(parseFloat(dollarChangePercent))}%
                </span>
              )}
            </div>
          </div>

          {/* Right side - Status and time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              {serverStatusQuery.data?.status === 'OK' ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">ONLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">OFFLINE</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTime(currentTime)}</span>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </motion.div>

        {/* Update status and filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-black rounded-lg shadow-sm p-4 border border-gray-200 dark:border-white/10"
        >
          {/* Update status row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Online</span>
              </div>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                Atualizar
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                Data
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
              >
                <option value="">Hoje</option>
                {availableDates.slice(1).map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>

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
                Capacidade / MM
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
              >
                <option value="">Todas as Capacida...</option>
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
                Região / GB-RAM
              </label>
              <select
                value=""
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-medium text-gray-900 dark:text-white"
              >
                <option value="">Todas as Regiões</option>
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
                  <>
                    <option value="Preto">Preto</option>
                    <option value="Branco">Branco</option>
                    <option value="Azul">Azul</option>
                    <option value="Vermelho">Vermelho</option>
                    <option value="Verde">Verde</option>
                    <option value="Amarelo">Amarelo</option>
                    <option value="Roxo">Roxo</option>
                    <option value="Rosa">Rosa</option>
                    <option value="Dourado">Dourado</option>
                    <option value="Prata">Prata</option>
                    <option value="Cinza">Cinza</option>
                    <option value="Laranja">Laranja</option>
                  </>
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {productsQuery.data.length} {productsQuery.data.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <ArrowUpDown className="w-4 h-4" />
                      <span>Ordenado por: Menor Preço</span>
                    </div>
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
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-white/10">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4" />
                            <span>Produto</span>
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <ShoppingCart className="w-4 h-4" />
                            <span>Fornecedor</span>
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>Capacidade</span>
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <Palette className="w-4 h-4" />
                            <span>Cor</span>
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>Categoria</span>
                          </div>
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Preço</span>
                          </div>
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-white/10">
                      <AnimatePresence>
                        {productsQuery.data.map((product: any, index: number) => (
                          <motion.tr
                            key={`${product.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index === 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold mr-2"
                                  >
                                    1
                                  </motion.span>
                                )}
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {product.name || product.model || 'N/A'}
                                  </div>
                                  {product.model && product.model !== product.name && (
                                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{product.model}</div>
                                  )}
                          </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex flex-col space-y-1">
                                <span>{product.supplier_name || 'N/A'}</span>
                                {product.variant && (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                                      product.variant.toUpperCase() === 'ANATEL'
                                        ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                                        : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                                    }`}
                                  >
                                    {product.variant}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-blue-200 border border-blue-400/30">
                                {product.storage || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                {normalizeColor(product.color)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white/80">
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
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg font-bold text-green-400">
                                  {formatPrice(product.price || 0)}
                                </span>
                                {index === 0 && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/30 text-green-200 border border-green-400/30"
                                  >
                                    Mais Barato
                                  </motion.span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-2">
                                {product.whatsapp ? (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleWhatsApp(product.whatsapp, product)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-lg"
                                    title="Contatar no WhatsApp"
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>WhatsApp</span>
                                  </motion.button>
                                ) : (
                                  <div className="text-xs text-gray-400 px-2 py-1">Sem WhatsApp</div>
                                )}
                          <motion.button
                                  whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const text = `${product.name || product.model}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}\nCapacidade: ${product.storage || 'N/A'}\nCor: ${normalizeColor(product.color || 'N/A')}\n${
                                      product.variant ? `Variante: ${product.variant}\n` : ''
                                    }`
                                    navigator.clipboard.writeText(text)
                                    toast.success('Copiado para a área de transferência!')
                                  }}
                                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 rounded-lg transition-colors"
                                  title="Copiar informações"
                                >
                                  <Copy className="w-5 h-5" />
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
                    {productsQuery.data.map((product: any, index: number) => (
                      <motion.div
                        key={`${product.id}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-gray-200 dark:border-white/20"
                      >
                        {/* Header with product name and badge */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {index === 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 200 }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold"
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
                            {index === 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/30 text-green-200 border border-green-400/30"
                              >
                                Mais Barato
                              </motion.span>
                            )}
                          </div>
                        </div>

                        {/* Info badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/30 text-blue-200 border border-blue-400/30">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            {product.storage || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/30 text-purple-200 border border-purple-400/30">
                            <Palette className="w-3 h-3 mr-1" />
                            {normalizeColor(product.color)}
                          </span>
                          {product.variant && (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                                product.variant.toUpperCase() === 'ANATEL'
                                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                                  : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
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
                              const text = `${product.name || product.model}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}\nCapacidade: ${product.storage || 'N/A'}\nCor: ${normalizeColor(product.color || 'N/A')}\n${
                                product.variant ? `Variante: ${product.variant}\n` : ''
                              }`
                              navigator.clipboard.writeText(text)
                              toast.success('Copiado para a área de transferência!')
                            }}
                            className="p-3 text-gray-300 hover:bg-white/20 rounded-lg transition-colors"
                            title="Copiar informações"
                          >
                            <Copy className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
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