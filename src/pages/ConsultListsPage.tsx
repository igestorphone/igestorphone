import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Loader2, AlertCircle, Calendar, Construction } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fornecedoresApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export default function ConsultListsPage() {
  const { user } = useAuthStore()
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')

  // Buscar fornecedores
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => {
      const response = await fornecedoresApi.getAll()
      // A API retorna { suppliers: [...], pagination: {...} }
      return response.data?.suppliers || response.suppliers || response.data || []
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000
  })

  const suppliers = suppliersData || []

  // Buscar lista bruta do fornecedor selecionado
  const { data: rawListData, isLoading: isLoadingRawList, error: rawListError } = useQuery({
    queryKey: ['supplier-raw-list', selectedSupplierId],
    queryFn: async () => {
      if (!selectedSupplierId) return null
      const response = await fornecedoresApi.getRawList(parseInt(selectedSupplierId))
      return response.data || response
    },
    enabled: !!selectedSupplierId,
    staleTime: 10000,
    gcTime: 2 * 60 * 1000
  })

  const selectedSupplier = suppliers.find(s => s.id.toString() === selectedSupplierId)

  return (
    <div className="space-y-6 relative">
      {/* Banner de Página em Desenvolvimento */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-lg rounded-xl shadow-2xl p-6 md:p-8 border-2 border-yellow-400/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10 flex items-center justify-center gap-4 flex-col md:flex-row">
          <div className="flex items-center justify-center w-16 h-16 bg-yellow-500/30 rounded-full border-2 border-yellow-400/50">
            <Construction className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Página em Desenvolvimento
            </h2>
            <p className="text-white/90 text-base md:text-lg">
              Esta funcionalidade está sendo aprimorada. Em breve estará disponível!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg p-6 md:p-8 text-center opacity-50 pointer-events-none"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Consultar Listas</h1>
        <p className="text-white/90 text-sm md:text-base">
          Selecione um fornecedor para ver a lista bruta do dia
        </p>
      </motion.div>

      {/* Seletor de Fornecedor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 opacity-50 pointer-events-none"
      >
        <label className="block text-white font-semibold mb-3">
          Selecione um Fornecedor
        </label>
        
        {isLoadingSuppliers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="ml-2 text-white/70">Carregando fornecedores...</span>
          </div>
        ) : (
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Selecione um fornecedor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id.toString()}>
                {supplier.name}
              </option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Mensagem quando nenhum fornecedor selecionado */}
      {!selectedSupplierId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 md:p-12 text-center border border-white/20 opacity-50 pointer-events-none"
        >
          <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/70 mb-2">Selecione um Fornecedor</h3>
          <p className="text-white/50">Escolha um fornecedor acima para visualizar sua lista do dia</p>
        </motion.div>
      )}

      {/* Lista Bruta do Fornecedor */}
      {selectedSupplierId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 opacity-50 pointer-events-none"
        >
          {isLoadingRawList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <span className="ml-2 text-white/70">Carregando lista...</span>
            </div>
          ) : rawListError || !rawListData?.has_list ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white/70 mb-2">
                Lista não disponível
              </h3>
              <p className="text-white/50">
                {selectedSupplier?.name || 'Este fornecedor'} ainda não mandou a lista do dia
              </p>
            </div>
          ) : (
            <div>
              {/* Header da Lista */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {selectedSupplier?.name || 'Fornecedor'}
                  </h2>
                  <div className="flex items-center space-x-2 text-white/70 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Lista do dia {new Date(rawListData.processed_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista Bruta */}
              <div className="bg-black/20 rounded-lg p-4 md:p-6 border border-white/10">
                <pre className="text-white/90 text-sm md:text-base whitespace-pre-wrap font-mono overflow-x-auto">
                  {rawListData.raw_list_text}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
