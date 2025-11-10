import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Search, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Download
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { statisticsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

export default function StatisticsPage() {
  const [searchModel, setSearchModel] = useState('')
  const [selectedModel, setSelectedModel] = useState('')

  // Fetch general statistics
  const { data: generalStats, isLoading: loadingGeneral } = useQuery({
    queryKey: ['statistics', 'general'],
    queryFn: () => statisticsApi.getGeneral(),
    select: (response) => response.data
  })

  // Fetch model-specific statistics
  const { data: modelStats, isLoading: loadingModel } = useQuery({
    queryKey: ['statistics', 'modelo', selectedModel],
    queryFn: () => statisticsApi.getByModelo(selectedModel),
    select: (response) => response.data,
    enabled: !!selectedModel
  })

  const handleSearch = () => {
    if (!searchModel.trim()) {
      toast.error('Digite um modelo para buscar')
      return
    }
    setSelectedModel(searchModel.trim())
  }

  const handleExport = () => {
    if (!modelStats) return
    
    const csvContent = [
      ['Modelo', 'Total Produtos', 'Preço Médio', 'Preço Mínimo', 'Preço Máximo'],
      [selectedModel, modelStats.totalProdutos, modelStats.precoMedio, modelStats.precoMinimo, modelStats.precoMaximo]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estatisticas_${selectedModel}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Estatísticas exportadas!')
  }

  // Chart colors
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Estatísticas de Preços</h1>
        <p className="text-white/70 text-lg">
          Analise tendências e distribuição de preços por modelo
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Digite um modelo (ex: iPhone 14, iPhone 15 Pro)..."
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input-primary w-full pl-10 pr-4"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Buscar</span>
          </button>
        </div>
      </motion.div>

      {/* General Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-6"
      >
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {loadingGeneral ? '...' : generalStats?.totalProdutos || 0}
          </h3>
          <p className="text-white/70 text-sm">Total de Produtos</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {loadingGeneral ? '...' : formatPrice(generalStats?.precoMedio || 0)}
          </h3>
          <p className="text-white/70 text-sm">Preço Médio</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {loadingGeneral ? '...' : formatPrice(generalStats?.precoMaximo || 0)}
          </h3>
          <p className="text-white/70 text-sm">Preço Máximo</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingDown className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {loadingGeneral ? '...' : formatPrice(generalStats?.precoMinimo || 0)}
          </h3>
          <p className="text-white/70 text-sm">Preço Mínimo</p>
        </div>
      </motion.div>

      {/* Model Statistics */}
      {selectedModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8"
        >
          {/* Model Header */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Estatísticas: {selectedModel}
                </h2>
                <p className="text-white/70">
                  Análise detalhada dos preços para este modelo
                </p>
              </div>
              <button
                onClick={handleExport}
                className="btn-outline flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {loadingModel ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/70">Carregando estatísticas...</p>
            </div>
          ) : modelStats ? (
            <>
              {/* Model Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="card text-center">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {modelStats.totalProdutos}
                  </h3>
                  <p className="text-white/70">Produtos Encontrados</p>
                </div>
                
                <div className="card text-center">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {formatPrice(modelStats.precoMedio)}
                  </h3>
                  <p className="text-white/70">Preço Médio</p>
                </div>
                
                <div className="card text-center">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {formatPrice(modelStats.precoMaximo - modelStats.precoMinimo)}
                  </h3>
                  <p className="text-white/70">Amplitude de Preços</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Price Distribution */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-6">Distribuição de Preços</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelStats.distribuicaoPrecos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="preco" 
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => formatPrice(value)}
                        />
                        <YAxis tick={{ fill: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any) => [value, 'Frequência']}
                          labelFormatter={(label) => `Preço: ${formatPrice(label)}`}
                        />
                        <Bar dataKey="frequencia" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Suppliers Distribution */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-6">Fornecedores por Quantidade</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={modelStats.fornecedores}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="quantidade"
                        >
                          {modelStats.fornecedores.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any, name: string) => [value, name === 'quantidade' ? 'Quantidade' : 'Preço Médio']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Suppliers Table */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-6">Detalhes por Fornecedor</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Fornecedor</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Quantidade</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Preço Médio</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Preço Mínimo</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Preço Máximo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelStats.fornecedores.map((fornecedor: any, index: number) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{fornecedor.nome}</td>
                          <td className="py-3 px-4 text-white/80">{fornecedor.quantidade}</td>
                          <td className="py-3 px-4 text-green-400 font-semibold">
                            {formatPrice(fornecedor.precoMedio)}
                          </td>
                          <td className="py-3 px-4 text-yellow-400 font-semibold">
                            {formatPrice(fornecedor.precoMinimo || 0)}
                          </td>
                          <td className="py-3 px-4 text-red-400 font-semibold">
                            {formatPrice(fornecedor.precoMaximo || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum dado encontrado</h3>
              <p className="text-white/70">
                Não há estatísticas disponíveis para "{selectedModel}"
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Como usar:</h3>
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 font-semibold text-xs">1</span>
            </div>
            <p>Digite o modelo que deseja analisar (ex: "iPhone 14", "iPhone 15 Pro")</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 font-semibold text-xs">2</span>
            </div>
            <p>Clique em "Buscar" para ver as estatísticas detalhadas</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 font-semibold text-xs">3</span>
            </div>
            <p>Analise os gráficos e tabelas para entender a distribuição de preços</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 font-semibold text-xs">4</span>
            </div>
            <p>Use "Exportar" para baixar os dados em CSV</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
