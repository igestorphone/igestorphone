import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Smartphone, DollarSign, MapPin, Phone, Mail, Download, Filter, Send, Shield, Eye, EyeOff } from 'lucide-react'
import { mockFornecedores } from '@/data/mockData'

export default function OutsideSPPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true)
  const [showSupplierInfo, setShowSupplierInfo] = useState(false)

  // Buscar produtos que correspondem ao termo de busca
  const allProducts = useMemo(() => {
    return mockFornecedores.flatMap(fornecedor => 
      fornecedor.produtos.map(produto => ({
        ...produto,
        fornecedor: fornecedor.nome,
        fornecedorId: fornecedor.id,
        fornecedorAtivo: fornecedor.ativo,
        fornecedorWhatsapp: fornecedor.whatsapp,
        fornecedorEmail: fornecedor.email,
        fornecedorCidade: fornecedor.cidade,
        precoForaSP: produto.preco + 150 // Adiciona R$ 150 para fora de SP
      }))
    )
  }, [])

  const filteredProducts = useMemo(() => {
    return allProducts.filter(produto => {
      const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAvailable = !showOnlyAvailable || produto.disponivel
      return matchesSearch && matchesAvailable
    })
  }, [allProducts, searchTerm, showOnlyAvailable])

  // Agrupar por modelo e calcular preços para fora de SP
  const productsForOutsideSP = useMemo(() => {
    const groups = filteredProducts.reduce((acc, produto) => {
      const key = produto.modelo
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(produto)
      return acc
    }, {})

    return Object.entries(groups).map(([modelo, produtos]) => {
      const sortedProducts = [...produtos].sort((a, b) => a.precoForaSP - b.precoForaSP)
      
      return {
        modelo,
        produtos: sortedProducts,
        totalProdutos: produtos.length,
        precoMedioOriginal: produtos.reduce((acc, p) => acc + p.preco, 0) / produtos.length,
        precoMedioForaSP: produtos.reduce((acc, p) => acc + p.precoForaSP, 0) / produtos.length,
        menorPrecoForaSP: sortedProducts[0]?.precoForaSP || 0,
        economia: 150 * produtos.length // Economia total por modelo
      }
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.menorPrecoForaSP - b.menorPrecoForaSP
        case 'name':
          return a.modelo.localeCompare(b.modelo)
        case 'count':
          return b.totalProdutos - a.totalProdutos
        default:
          return a.menorPrecoForaSP - b.menorPrecoForaSP
      }
    })
  }, [filteredProducts, sortBy])

  const handleExportData = () => {
    const csvContent = [
      ['Modelo', 'Preço Original', 'Preço Fora SP (+R$150)', 'Economia', 'Disponível'],
      ...productsForOutsideSP.flatMap(group => 
        group.produtos.map(produto => [
          produto.modelo,
          `R$ ${produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${produto.precoForaSP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          'R$ 150,00',
          produto.disponivel ? 'Sim' : 'Não'
        ])
      )
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `precos-fora-sp-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleWhatsAppSend = (produto) => {
    const message = `📱 *${produto.nomeCompleto}*\n\n💰 *Preço para Fora de SP:* R$ ${produto.precoForaSP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n📦 *Inclui:*\n• Produto original\n• Frete para todo Brasil\n• Garantia\n\n🚚 *Entrega:* 3-5 dias úteis\n\nInteressado? Entre em contato!`
    const url = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}` // Número do seu WhatsApp
    window.open(url, '_blank')
  }

  const totalProducts = filteredProducts.length
  const totalModels = productsForOutsideSP.length
  const totalEconomy = productsForOutsideSP.reduce((acc, group) => acc + group.economia, 0)
  const averagePriceForaSP = totalProducts > 0 
    ? filteredProducts.reduce((acc, produto) => acc + produto.precoForaSP, 0) / totalProducts
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Envio pra Fora de SP</h1>
        <p className="text-white/70">Preços com frete incluído para todo Brasil</p>
        <div className="mt-4 inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">
            +R$ 150,00 de frete incluído
          </span>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Digite o modelo do iPhone (ex: iPhone 15, iPhone 14 Pro Max)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showOnlyAvailable"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="showOnlyAvailable" className="text-white/70 text-sm">
                Apenas produtos disponíveis
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showSupplierInfo"
                checked={showSupplierInfo}
                onChange={(e) => setShowSupplierInfo(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="showSupplierInfo" className="text-white/70 text-sm">
                Mostrar dados do fornecedor
              </label>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="price">Menor Preço</option>
              <option value="name">Nome do Modelo</option>
              <option value="count">Mais Produtos</option>
            </select>
            
            {productsForOutsideSP.length > 0 && (
              <motion.button
                onClick={handleExportData}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Dados</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {searchTerm && totalProducts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="glass rounded-xl p-4 text-center">
            <h3 className="text-2xl font-bold text-white">{totalProducts}</h3>
            <p className="text-white/70">Produtos Encontrados</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <h3 className="text-2xl font-bold text-white">{totalModels}</h3>
            <p className="text-white/70">Modelos Diferentes</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <h3 className="text-2xl font-bold text-white">
              R$ {averagePriceForaSP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-white/70">Preço Médio (Fora SP)</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <h3 className="text-2xl font-bold text-white">
              R$ {totalEconomy.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-white/70">Economia Total</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {productsForOutsideSP.length > 0 ? (
            productsForOutsideSP.map((group, index) => (
              <motion.div
                key={group.modelo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-8 h-8 text-blue-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{group.modelo}</h2>
                      <p className="text-white/70">
                        {group.totalProdutos} produtos com frete incluído
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">
                      R$ {group.menorPrecoForaSP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-white/70">Menor Preço (Fora SP)</p>
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-white">
                      R$ {group.precoMedioOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-white/70">Preço Médio Original</p>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-white">
                      R$ {group.precoMedioForaSP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-white/70">Preço Médio (Fora SP)</p>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-white">R$ 150,00</h3>
                    <p className="text-white/70">Frete Incluído</p>
                  </div>
                </div>

                {/* Products List */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                    Produtos para Fora de SP
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.produtos.map((produto, idx) => (
                      <motion.div
                        key={`${produto.id}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{produto.nomeCompleto}</h4>
                            {showSupplierInfo && (
                              <div className="mt-2 space-y-1 text-xs text-white/70">
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{produto.fornecedorWhatsapp}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{produto.fornecedorEmail}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{produto.fornecedorCidade}</span>
                                </div>
                              </div>
                            )}
                            {!showSupplierInfo && (
                              <div className="mt-2 flex items-center space-x-1 text-xs text-white/50">
                                <Shield className="w-3 h-3" />
                                <span>Dados do fornecedor ocultos</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{produto.precoFormatado}</div>
                            <div className="text-sm text-white/70">Original</div>
                          </div>
                          <div className="text-right mx-4">
                            <div className="text-2xl font-bold text-green-400">
                              R$ {produto.precoForaSP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-white/70">Fora SP</div>
                          </div>
                          <motion.button
                            onClick={() => handleWhatsAppSend(produto)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1 text-sm"
                          >
                            <Send className="w-3 h-3" />
                            <span>Enviar</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/70 mb-2">Nenhum produto encontrado</h3>
              <p className="text-white/50">Tente buscar por outro modelo de iPhone</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="text-center">
            <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Como usar</h3>
            <p className="text-white/70 mb-4">
              Digite o modelo do iPhone para ver os preços com frete incluído para todo Brasil
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/60">
              <div className="bg-white/5 rounded-lg p-3">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <p>Preços com frete</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p>Dados protegidos</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Send className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p>Envio direto</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}













