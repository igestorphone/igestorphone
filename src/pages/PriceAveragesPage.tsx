import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BarChart3, TrendingUp, Smartphone, DollarSign, Download, Filter, X, Sparkles, Palette, Package, TrendingDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Product {
  id: number
  name: string
  model: string
  color: string | null
  storage: string | null
  price: number
  condition: string
  supplier_id: number
  supplier_name?: string
}

interface ProductGroup {
  key: string
  model: string
  color: string | null
  storage: string | null
  products: Product[]
  averagePrice: number
  minPrice: number
  maxPrice: number
  count: number
  priceOccurrences: { price: number; count: number }[]
}

export default function PriceAveragesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [sortBy, setSortBy] = useState('price-avg')

  // Buscar produtos do backend
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: {
          limit: 1000,
          is_active: true
        }
      })
      return response.data?.products || response.data || []
    },
    staleTime: 30000, // 30 segundos
    gcTime: 5 * 60 * 1000 // 5 minutos
  })

  const products: Product[] = productsData || []

  // Filtrar produtos por termo de busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return []
    
    const searchLower = searchTerm.toLowerCase().trim()
    return products.filter(product => {
      const modelMatch = product.model?.toLowerCase().includes(searchLower) || 
                        product.name?.toLowerCase().includes(searchLower)
      return modelMatch
    })
  }, [products, searchTerm])

  // Agrupar produtos por modelo + cor + armazenamento
  // Se todos os filtros estiverem aplicados, mostrar apenas UM resultado
  const productGroups = useMemo(() => {
    if (filteredProducts.length === 0) return []

    // Se há filtros de cor e armazenamento aplicados, criar um grupo único
    if (selectedColor && selectedStorage) {
      const matchingProducts = filteredProducts.filter(product => {
        const productColor = (product.color || '').toLowerCase().trim()
        const productStorage = (product.storage || '').toLowerCase().trim()
        const filterColor = selectedColor.toLowerCase().trim()
        const filterStorage = selectedStorage.toLowerCase().trim()
        
        return productColor === filterColor && productStorage.includes(filterStorage)
      })

      if (matchingProducts.length === 0) return []

      const prices = matchingProducts.map(p => parseFloat(String(p.price)) || 0).filter(p => p > 0)
      
      if (prices.length === 0) return []

      const sum = prices.reduce((a, b) => a + b, 0)
      const averagePrice = Math.round(sum / prices.length)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      // Contar ocorrências de cada preço
      const priceMap = new Map<number, number>()
      prices.forEach(price => {
        const roundedPrice = Math.round(price)
        priceMap.set(roundedPrice, (priceMap.get(roundedPrice) || 0) + 1)
      })
      
      const priceOccurrences = Array.from(priceMap.entries())
        .map(([price, count]) => ({ price, count }))
        .sort((a, b) => b.count - a.count)

      return [{
        key: `${filteredProducts[0].model || filteredProducts[0].name}|||${selectedColor}|||${selectedStorage}`,
        model: filteredProducts[0].model || filteredProducts[0].name,
        color: selectedColor,
        storage: selectedStorage,
        products: matchingProducts,
        averagePrice,
        minPrice,
        maxPrice,
        count: matchingProducts.length,
        priceOccurrences
      }]
    }

    // Se não há filtros aplicados ou apenas um, agrupar normalmente
    const groupsMap = new Map<string, ProductGroup>()

    filteredProducts.forEach(product => {
      // Criar chave única: modelo + cor + armazenamento
      const color = product.color || 'Sem cor'
      const storage = product.storage || 'Sem armazenamento'
      const key = `${product.model || product.name}|||${color}|||${storage}`

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          model: product.model || product.name,
          color: product.color,
          storage: product.storage,
          products: [],
          averagePrice: 0,
          minPrice: Infinity,
          maxPrice: 0,
          count: 0,
          priceOccurrences: []
        })
      }

      const group = groupsMap.get(key)!
      group.products.push(product)
      group.count++
    })

    // Calcular estatísticas para cada grupo
    groupsMap.forEach(group => {
      const prices = group.products.map(p => parseFloat(String(p.price)) || 0).filter(p => p > 0)
      
      if (prices.length > 0) {
        // Calcular média
        const sum = prices.reduce((a, b) => a + b, 0)
        group.averagePrice = Math.round(sum / prices.length)
        group.minPrice = Math.min(...prices)
        group.maxPrice = Math.max(...prices)

        // Contar ocorrências de cada preço
        const priceMap = new Map<number, number>()
        prices.forEach(price => {
          const roundedPrice = Math.round(price)
          priceMap.set(roundedPrice, (priceMap.get(roundedPrice) || 0) + 1)
        })
        
        group.priceOccurrences = Array.from(priceMap.entries())
          .map(([price, count]) => ({ price, count }))
          .sort((a, b) => b.count - a.count) // Ordenar por frequência
      }
    })

    // Filtrar por cor e armazenamento (se apenas um filtro estiver aplicado)
    let filtered = Array.from(groupsMap.values())
    
    if (selectedColor && !selectedStorage) {
      filtered = filtered.filter(g => 
        (g.color || 'Sem cor').toLowerCase() === selectedColor.toLowerCase()
      )
    }

    if (selectedStorage && !selectedColor) {
      filtered = filtered.filter(g => 
        (g.storage || 'Sem armazenamento').toLowerCase().includes(selectedStorage.toLowerCase())
      )
    }

    return filtered
  }, [filteredProducts, selectedColor, selectedStorage])

  // Ordenar grupos
  const sortedGroups = useMemo(() => {
    return [...productGroups].sort((a, b) => {
      switch (sortBy) {
        case 'price-avg':
          return a.averagePrice - b.averagePrice
        case 'price-avg-desc':
          return b.averagePrice - a.averagePrice
        case 'count':
          return b.count - a.count
        case 'name':
        default:
          return (a.model || '').localeCompare(b.model || '')
      }
    })
  }, [productGroups, sortBy])

  // Obter cores e armazenamentos disponíveis dos produtos filtrados
  const availableFilters = useMemo(() => {
    const colors = new Set<string>()
    const storages = new Set<string>()

    filteredProducts.forEach(product => {
      if (product.color) {
        colors.add(product.color)
      }
      if (product.storage) {
        storages.add(product.storage)
      }
    })

    return {
      colors: Array.from(colors).sort(),
      storages: Array.from(storages).sort((a, b) => {
        // Ordenar por número (ex: 64GB, 128GB, 256GB)
        const numA = parseInt(a.replace(/\D/g, '')) || 0
        const numB = parseInt(b.replace(/\D/g, '')) || 0
        return numA - numB
      })
    }
  }, [filteredProducts])

  const clearFilters = () => {
    setSelectedColor('')
    setSelectedStorage('')
  }

  const hasActiveFilters = selectedColor || selectedStorage

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden border border-white/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <h1 className="text-3xl md:text-4xl font-bold">Médias de Preço</h1>
          </div>
          <p className="text-blue-100 text-lg">Veja a média de preços calculada com base nas listas processadas</p>
        </div>
      </motion.div>

      {/* Search Bar */}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg text-white placeholder-gray-300 transition-all"
          />
        </div>
      </motion.div>

      {/* Filters Row */}
      {searchTerm.trim() && filteredProducts.length > 0 && (
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Filtro de Cor */}
            {availableFilters.colors.length > 0 && (
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
                  {availableFilters.colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro de Armazenamento */}
            {availableFilters.storages.length > 0 && (
              <div className="relative">
                <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  Armazenamento
                </label>
                <select
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
                >
                  <option value="">Todos</option>
                  {availableFilters.storages.map(storage => (
                    <option key={storage} value={storage}>{storage}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Ordenação */}
            {sortedGroups.length > 0 && (
              <div className="relative">
                <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Ordenar
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none font-medium text-white"
                >
                  <option value="name">Por Nome</option>
                  <option value="price-avg">Preço: Menor</option>
                  <option value="price-avg-desc">Preço: Maior</option>
                  <option value="count">Mais Produtos</option>
                </select>
              </div>
            )}

            {/* Exportação */}
            {sortedGroups.length > 0 && (
              <div className="relative">
                <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </label>
                <motion.button
                  onClick={() => {
                    const csvContent = [
                      ['Modelo', 'Cor', 'Armazenamento', 'Preço Médio', 'Menor Preço', 'Maior Preço', 'Quantidade de Produtos'],
                      ...sortedGroups.map(group => [
                        group.model || '',
                        group.color || 'Sem cor',
                        group.storage || 'Sem armazenamento',
                        `R$ ${group.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        `R$ ${group.minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        `R$ ${group.maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        group.count.toString()
                      ])
                    ].map(row => row.join(',')).join('\n')
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `medias-precos-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-3 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
                >
                  Exportar CSV
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Carregando produtos...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400">Erro ao carregar produtos. Tente novamente.</p>
        </div>
      )}

      {/* Estatísticas */}
      <AnimatePresence>
        {!isLoading && !error && sortedGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-blue-400"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Total</p>
                  <p className="text-xl font-bold text-white mt-1">{filteredProducts.length}</p>
                </div>
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-green-400"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Preço Médio</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {filteredProducts.length > 0 
                      ? formatPrice(filteredProducts.reduce((acc, p) => acc + (parseFloat(String(p.price)) || 0), 0) / filteredProducts.length)
                      : 'R$ 0'
                    }
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-red-400"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Mais Barato</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {filteredProducts.length > 0
                      ? formatPrice(Math.min(...filteredProducts.map(p => parseFloat(String(p.price)) || Infinity)))
                      : 'R$ 0'
                    }
                  </p>
                </div>
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 border-l-4 border-l-purple-400"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Grupos</p>
                  <p className="text-xl font-bold text-white mt-1">{sortedGroups.length}</p>
                </div>
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {!isLoading && !error && searchTerm.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {sortedGroups.length > 0 ? (
            // Quando todos os filtros estão aplicados, mostrar apenas UM resultado
            selectedColor && selectedStorage && sortedGroups.length === 1 ? (
              <motion.div
                key={sortedGroups[0].key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl shadow-lg p-6 md:p-8 border border-white/20"
              >
                <div className="text-center mb-6">
                  <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-white mb-2">{sortedGroups[0].model}</h2>
                  <div className="flex items-center justify-center space-x-3 mt-3">
                    {sortedGroups[0].storage && (
                      <span className="px-3 py-1.5 bg-purple-500/30 text-purple-200 rounded-lg text-sm font-medium">
                        {sortedGroups[0].storage}
                      </span>
                    )}
                    {sortedGroups[0].color && (
                      <span className="px-3 py-1.5 bg-blue-500/30 text-blue-200 rounded-lg text-sm font-medium">
                        {sortedGroups[0].color}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estatísticas principais - destaque */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-green-500/30 border-2 border-green-400/50 rounded-xl p-4 text-center shadow-lg"
                  >
                    <p className="text-lg font-bold text-white mb-1">{formatPrice(sortedGroups[0].minPrice)}</p>
                    <p className="text-green-200 text-xs font-medium">Menor Valor</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-blue-500/30 border-2 border-blue-400/50 rounded-xl p-4 text-center shadow-lg"
                  >
                    <p className="text-lg font-bold text-white mb-1">{formatPrice(sortedGroups[0].averagePrice)}</p>
                    <p className="text-blue-200 text-xs font-medium">Média Valor</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-red-500/30 border-2 border-red-400/50 rounded-xl p-4 text-center shadow-lg"
                  >
                    <p className="text-lg font-bold text-white mb-1">{formatPrice(sortedGroups[0].maxPrice)}</p>
                    <p className="text-red-200 text-xs font-medium">Maior Valor</p>
                  </motion.div>
                </div>

                {/* Informação adicional */}
                <div className="text-center">
                  <p className="text-white/70 text-sm">
                    Baseado em <span className="text-white font-semibold">{sortedGroups[0].count} produto{sortedGroups[0].count !== 1 ? 's' : ''}</span> encontrado{sortedGroups[0].count !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>
            ) : (
              // Se não há filtros completos, mostrar lista de grupos
              sortedGroups.map((group, index) => (
                <motion.div
                  key={group.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 md:p-6 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-6 h-6 text-blue-400" />
                      <div>
                        <h2 className="text-xl font-bold text-white">{group.model}</h2>
                        <div className="flex items-center space-x-2 mt-1">
                          {group.color && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {group.color}
                            </span>
                          )}
                          {group.storage && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {group.storage}
                            </span>
                          )}
                          <span className="text-white/70 text-xs">
                            {group.count} produto{group.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {formatPrice(group.averagePrice)}
                      </div>
                      <p className="text-white/70 text-xs">Preço Médio</p>
                    </div>
                  </div>

                  {/* Estatísticas compactas */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-white">{formatPrice(group.minPrice)}</p>
                      <p className="text-white/70 text-xs">Menor</p>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-white">{formatPrice(group.averagePrice)}</p>
                      <p className="text-white/70 text-xs">Média</p>
                    </div>
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-white">{formatPrice(group.maxPrice)}</p>
                      <p className="text-white/70 text-xs">Maior</p>
                    </div>
                  </div>

                  {/* Ocorrências de Preços */}
                  {group.priceOccurrences.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-white mb-2">Distribuição de Preços</h3>
                      <div className="space-y-1.5">
                        {group.priceOccurrences.slice(0, 5).map((occ, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-white/70 text-xs">
                              {formatPrice(occ.price)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-white/10 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${(occ.count / group.count) * 100}%` }}
                                />
                              </div>
                              <span className="text-white/70 text-xs w-8 text-right">
                                {occ.count}x
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/70 mb-2">Nenhum produto encontrado</h3>
              <p className="text-white/50">
                {selectedColor && selectedStorage 
                  ? `Não encontramos ${searchTerm} ${selectedStorage} ${selectedColor}`
                  : 'Tente buscar por outro modelo de iPhone ou aplicar os filtros'
                }
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!isLoading && !error && !searchTerm.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Como usar</h3>
            <p className="text-white/70 mb-4">
              Digite o modelo do iPhone que você quer pesquisar para ver a média de preços calculada com base nas listas processadas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/60">
              <div className="bg-white/5 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                <p>Veja preços médios</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Smartphone className="w-6 h-6 mx-auto mb-2" />
                <p>Filtre por cor e GB</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p>Calcule sua margem</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
