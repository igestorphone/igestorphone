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
  Sparkles,
  Filter,
  X,
  Wifi,
  Clock
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { produtosApi, fornecedoresApi, utilsApi } from '@/lib/api'
import { createWhatsAppUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

const colorMap: Record<string, string> = {
  black: 'Preto',
  white: 'Branco',
  blue: 'Azul',
  red: 'Vermelho',
  green: 'Verde',
  yellow: 'Amarelo',
  purple: 'Roxo',
  pink: 'Rosa',
  rose: 'Rosa',
  gold: 'Dourado',
  silver: 'Prata',
  gray: 'Cinza',
  grey: 'Cinza',
  orange: 'Laranja',
  midnight: 'Midnight',
  starlight: 'Starlight',
  natural: 'Natural',
  desert: 'Desert',
  lilac: 'Lilás',
  lilas: 'Lilás',
  titanium: 'Titânio',
  'titanium blue': 'Azul Titânio',
  'titanium black': 'Preto Titânio',
  'titanium white': 'Branco Titânio',
  'titanium natural': 'Natural Titânio',
  preto: 'Preto',
  branco: 'Branco',
  azul: 'Azul',
  vermelho: 'Vermelho',
  verde: 'Verde',
  amarelo: 'Amarelo',
  roxo: 'Roxo',
  rosa: 'Rosa',
  dourado: 'Dourado',
  prata: 'Prata',
  cinza: 'Cinza',
  laranja: 'Laranja'
}

const normalizeColor = (color: string): string => {
  if (!color) return 'N/A'
  const lower = color.toLowerCase().trim()
  const mapped = colorMap[lower] || colorMap[lower.split(' ')[0]]
  return mapped || lower.charAt(0).toUpperCase() + lower.slice(1)
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

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedConditionType, setSelectedConditionType] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
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

  const suppliersQuery = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => fornecedoresApi.getAll(),
    select: (response: any) => response?.data || []
  })

  const shouldFetchProducts =
    debouncedSearch.length >= 1 ||
    !!selectedDate ||
    !!selectedCategory ||
    !!selectedConditionType ||
    !!selectedStorage ||
    !!selectedColor ||
    !!selectedSupplier

  const productsQuery = useQuery({
    queryKey: [
      'produtos',
      debouncedSearch,
      selectedDate,
      selectedCategory,
      selectedConditionType,
      selectedStorage,
      selectedColor,
      selectedSupplier
    ],
    queryFn: () =>
      produtosApi.getAll({
        search: debouncedSearch,
        condition: selectedCategory,
        condition_type: selectedConditionType || undefined,
        storage: selectedStorage,
        color: selectedColor,
        supplier_id: selectedSupplier,
        date: selectedDate || undefined,
        sort_by: 'price',
        sort_order: 'asc',
        limit: 500
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
      if (product.color) colors.add(normalizeColor(product.color))
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
  const suppliers = suppliersQuery.data || []

  const clearFilters = () => {
    setSelectedDate('')
    setSelectedCategory('')
    setSelectedConditionType('')
    setSelectedStorage('')
    setSelectedColor('')
    setSelectedSupplier('')
  }

  const hasActiveFilters =
    !!selectedDate ||
    !!selectedCategory ||
    !!selectedConditionType ||
    !!selectedStorage ||
    !!selectedColor ||
    !!selectedSupplier

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Status bar */}
      <motion.div
          initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg p-2 md:p-2.5 border border-white/20 flex items-center justify-between flex-wrap gap-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-semibold">R$ {dollarRate.toFixed(2)}</span>
            {dollarChange === 0 ? null : (
              <span
                className={`flex items-center gap-0.5 text-xs ${
                  dollarChange < 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {dollarChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {Math.abs(parseFloat(dollarChangePercent))}%
              </span>
            )}
          </div>
          
          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-1.5">
            {serverStatusQuery.data?.status === 'OK' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-medium">ONLINE</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-medium">OFFLINE</span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white font-semibold">{formatTime(currentTime)}</span>
        </div>
      </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden border border-white/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Buscar iPhone Mais Barato</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Encontre os melhores preços e todos os fornecedores disponíveis
            </p>
          </div>
        </motion.div>

        {/* Statistics */}
        <AnimatePresence>
          {productsQuery.data && productsQuery.data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-green-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Preço Médio</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatPrice(stats.averagePrice)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-red-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Mais Barato</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatPrice(stats.minPrice)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-purple-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Fornecedores</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.suppliersCount}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-purple-400" />
          </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 md:p-6 border border-white/20"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              placeholder="Digite o modelo... Ex: iPhone 17 Pro Max"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg text-white placeholder-gray-300 transition-all"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 md:p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <h2 className="text-lg font-semibold text-white">Filtros</h2>
              </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20 rounded-lg transition-colors border border-red-400/30"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Data
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
              >
                <option value="">Hoje</option>
                {availableDates.slice(1).map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-9 w-4 h-4 text-gray-300 pointer-events-none" />
              </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
              >
                <option value="">Todas</option>
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
              <ChevronDown className="absolute right-2 top-9 w-4 h-4 text-gray-300 pointer-events-none" />
                </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-1" />
                Tipo de Condição
              </label>
              <select
                value={selectedConditionType}
                onChange={(e) => setSelectedConditionType(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
              >
                <option value="">Todos</option>
                <option value="lacrados_novos">Lacrados/Novos</option>
                <option value="seminovos">Seminovos (SWAP/VITRINE/SEMINOVO)</option>
              </select>
              <ChevronDown className="absolute right-2 top-9 w-4 h-4 text-gray-300 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                <Palette className="w-4 h-4 mr-1" />
                Cor
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
              >
                <option value="">Todas</option>
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
              <ChevronDown className="absolute right-2 top-9 w-4 h-4 text-gray-300 pointer-events-none" />
                </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-1" />
                Capacidade
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
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
              <ChevronDown className="absolute right-2 top-9 w-4 h-4 text-gray-300 pointer-events-none" />
                        </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                Fornecedor
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
              >
                <option value="">Todos</option>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="São Paulo">São Paulo</option>
                    <option value="Rio de Janeiro">Rio de Janeiro</option>
                    <option value="Belo Horizonte">Belo Horizonte</option>
                    <option value="Brasília">Brasília</option>
                    <option value="Salvador">Salvador</option>
                    <option value="Curitiba">Curitiba</option>
                    <option value="Fortaleza">Fortaleza</option>
                    <option value="Manaus">Manaus</option>
                    <option value="São Luís">São Luís</option>
                    <option value="Porto Alegre">Porto Alegre</option>
                    <option value="Recife">Recife</option>
                    <option value="Goiânia">Goiânia</option>
                    <option value="Campo Grande">Campo Grande</option>
                    <option value="Maceió">Maceió</option>
                    <option value="João Pessoa">João Pessoa</option>
                    <option value="Florianópolis">Florianópolis</option>
                    <option value="Cuiabá">Cuiabá</option>
                    <option value="Vitoria">Vitoria</option>
                    <option value="Belém">Belém</option>
                    <option value="Macapá">Macapá</option>
                    <option value="Boa Vista">Boa Vista</option>
                    <option value="Palmas">Palmas</option>
                    <option value="Aracaju">Aracaju</option>
                    <option value="São Gonçalo">São Gonçalo</option>
                    <option value="Duque de Caxias">Duque de Caxias</option>
                    <option value="Niterói">Niterói</option>
                    <option value="São José dos Campos">São José dos Campos</option>
                    <option value="Santo André">Santo André</option>
                    <option value="Ribeirão Preto">Ribeirão Preto</option>
                    <option value="Sorocaba">Sorocaba</option>
                    <option value="Jundiaí">Jundiaí</option>
                    <option value="São Bernardo do Campo">São Bernardo do Campo</option>
                    <option value="Santos">Santos</option>
                    <option value="Mauá">Mauá</option>
                    <option value="Diadema">Diadema</option>
                    <option value="São Caetano do Sul">São Caetano do Sul</option>
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-2 top-9 w-4 h-4 text-gray-300 pointer-events-none" />
            </div>
          </div>
        </motion.div>

      {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20"
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
                  className="ml-3 text-white text-lg"
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
                  <span className="text-red-400 text-2xl">⚠️</span>
                </div>
                <p className="text-xl font-semibold text-white mb-2">Erro ao buscar produtos</p>
                <p className="text-gray-300 mb-6">{(productsQuery.error as any)?.message || 'Erro desconhecido'}</p>
              </motion.div>
            ) : !productsQuery.data || productsQuery.data.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4 border border-white/20">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-xl font-semibold text-white mb-2">Nenhum produto encontrado</p>
                <p className="text-gray-300 mb-6">Digite um termo de busca ou ajuste os filtros</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 border-b border-white/20 bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {productsQuery.data.length} {productsQuery.data.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <ArrowUpDown className="w-4 h-4" />
                      <span>Ordenado por: Menor Preço</span>
                    </div>
                  </div>
                  {priceHistoryQuery.data && Array.isArray((priceHistoryQuery.data as any).prices) && (priceHistoryQuery.data as any).prices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Preços dos últimos 2 dias:</p>
                      <div className="flex gap-4 flex-wrap text-xs">
                        {(priceHistoryQuery.data as any).prices.slice(0, 2).map((day: any) => (
                          <div key={day.date} className="flex items-center gap-2">
                            <span className="text-gray-300 font-medium">{day.date}:</span>
                            <span className="text-white font-semibold">{formatPrice(day.average_price)}</span>
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

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-b-2 border-white/20">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
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
                    <tbody className="bg-white/5 divide-y divide-white/10">
                      <AnimatePresence>
                        {productsQuery.data.map((product: any, index: number) => (
                          <motion.tr
                            key={`${product.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="hover:bg-white/10 transition-colors group"
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
                                  <div className="text-sm font-semibold text-white">
                                    {product.name || product.model || 'N/A'}
                                  </div>
                                  {product.model && product.model !== product.name && (
                                    <div className="text-xs text-gray-300 mt-0.5">{product.model}</div>
                                  )}
                          </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-white/80">
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
                              {product.created_at && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(product.created_at).toLocaleDateString('pt-BR')}
                            </div>
                              )}
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
                                    <span className="hidden sm:inline">WhatsApp</span>
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
                                  className="p-2 text-gray-300 hover:bg-white/20 rounded-lg transition-colors"
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
          </div>
    </div>
  )
}