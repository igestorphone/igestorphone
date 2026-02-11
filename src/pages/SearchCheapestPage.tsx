import { useState } from 'react'
import { 
  Search, 
  Calendar,
  Building2,
  BarChart3,
  Globe,
  Palette,
  ShoppingCart,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  MessageCircle,
  Copy
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { produtosApi } from '@/lib/api'
import { createWhatsAppUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SearchCheapestPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')

  // Buscar produtos automaticamente quando houver busca ou filtros
  const shouldSearch = searchQuery.length >= 3 || !!selectedDate || !!selectedCategory || !!selectedStorage || !!selectedRegion || !!selectedColor || !!selectedSupplier
  
  const productsQuery = useQuery({
    queryKey: ['produtos', 'search', searchQuery, selectedDate, selectedCategory, selectedStorage, selectedRegion, selectedColor, selectedSupplier],
    queryFn: () => produtosApi.getAll({
      search: searchQuery,
      condition: selectedCategory,
      storage: selectedStorage,
      color: selectedColor,
      supplier_id: selectedSupplier
    }),
    select: (response: any) => response?.data || [],
    enabled: shouldSearch
  })

  const handleWhatsApp = (whatsapp: string) => {
    const message = `Olá! Me envia a lista atualizada?`
    const url = createWhatsAppUrl(whatsapp, message)
    window.open(url, '_blank')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  // Obter datas disponíveis (últimos 7 dias)
  const getAvailableDates = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: formatDate(date.toISOString())
      })
    }
    return dates
  }

  const availableDates = getAvailableDates()

  // Categorias
  const categories = [
    { value: '', label: 'Todas as Categorias' },
    { value: 'iPhone', label: 'iPhone' },
    { value: 'iPad', label: 'iPad' },
    { value: 'MacBook', label: 'MacBook' },
    { value: 'AirPods', label: 'AirPods' },
    { value: 'Apple Watch', label: 'Apple Watch' },
    { value: 'ACSS', label: 'ACSS' },
  ]

  // Storage options
  const storageOptions = [
    { value: '', label: 'Todas as Capacidades' },
    { value: '64GB', label: '64GB' },
    { value: '128GB', label: '128GB' },
    { value: '256GB', label: '256GB' },
    { value: '512GB', label: '512GB' },
    { value: '1TB', label: '1TB' },
  ]

  // Regiões
  const regions = [
    { value: '', label: 'Todas as Regiões' },
    { value: '1ª LINHA', label: '1ª LINHA' },
    { value: 'COPY', label: 'COPY' },
    { value: 'ORIGINAL', label: 'ORIGINAL' },
    { value: 'CHIP VIRTUAL', label: 'CHIP VIRTUAL' },
  ]

  // Cores
  const colors = [
    { value: '', label: 'Todas as Cores' },
    { value: 'Preto', label: 'Preto' },
    { value: 'Branco', label: 'Branco' },
    { value: 'Azul', label: 'Azul' },
    { value: 'Rosa', label: 'Rosa' },
    { value: 'Verde', label: 'Verde' },
    { value: 'Amarelo', label: 'Amarelo' },
    { value: 'Roxo', label: 'Roxo' },
    { value: 'Vermelho', label: 'Vermelho' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Buscar iPhone Mais Barato</h1>
          <p className="text-gray-600">Encontre os melhores preços e top 3 fornecedores</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Data Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Data
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {availableDates.map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Categoria Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Capacidade / MM Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                Capacidade / MM
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {storageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Região / GB-RAM Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                Região / GB-RAM
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {regions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Cor Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <Palette className="w-4 h-4 mr-1" />
                Cor
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {colors.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Fornecedor Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Fornecedor
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todos os Fornecedores</option>
                {/* Fornecedores serão carregados dinamicamente */}
              </select>
              <ChevronDown className="absolute right-2 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {productsQuery.isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Buscando produtos...</span>
            </div>
          ) : (productsQuery.data && Array.isArray(productsQuery.data) && productsQuery.data.length > 0) ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Produto</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Fornecedor</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Storage</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Cor</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Categoria</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Região</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span>Preço</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(productsQuery.data as any[]).map((product: any, index: number) => (
                    <tr key={product.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name || product.model || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {product.supplier_name || 'N/A'}
                          </div>
                          {product.supplier_name && (
                            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {product.storage || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {product.color || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {product.model?.includes('iPhone') ? 'IPH' : product.category || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {product.region || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatPrice(product.price || 0)}
                        </div>
                        {product.created_at && (
                          <div className="text-xs text-gray-400">
                            {new Date(product.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {product.whatsapp && (
                            <button
                              onClick={() => handleWhatsApp(product.whatsapp)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Contatar no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const text = `${product.name}\nPreço: ${formatPrice(product.price || 0)}\nFornecedor: ${product.supplier_name}`
                              navigator.clipboard.writeText(text)
                              toast.success('Copiado!')
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copiar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Digite um termo de busca ou ajuste os filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
