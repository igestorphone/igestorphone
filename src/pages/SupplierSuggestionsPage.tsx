import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, CheckCircle, XCircle, Clock, Mail, Phone, MessageSquare, User, Calendar } from 'lucide-react'
import { supplierSuggestionsApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function SupplierSuggestionsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-white/70">Apenas administradores podem visualizar indicações.</p>
        </div>
      </div>
    )
  }

  // Buscar indicações
  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier-suggestions', statusFilter],
    queryFn: () => supplierSuggestionsApi.getAll({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: 1,
      limit: 100
    }),
    select: (response: any) => response?.data || response
  })

  // Mutação para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'approved' | 'rejected' }) =>
      supplierSuggestionsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-suggestions'] })
      toast.success('Status atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar status')
    }
  })

  const handleStatusChange = (id: number, status: 'approved' | 'rejected') => {
    updateStatusMutation.mutate({ id, status })
  }

  const suggestions = data?.suggestions || []
  const pendingCount = suggestions.filter((s: any) => s.status === 'pending').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado'
      case 'rejected':
        return 'Rejeitado'
      default:
        return 'Pendente'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-400/30'
      case 'rejected':
        return 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-400/30'
      default:
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-400/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden border border-white/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Indicações de Fornecedores</h1>
            </div>
            <p className="text-blue-100 text-lg">Gerencie as indicações de fornecedores recebidas</p>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-gray-200 dark:border-white/20"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-white font-medium">Filtrar por status:</span>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-purple-600 dark:bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/20'
                    }`}
                  >
                    {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendentes' : status === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
                    {status === 'pending' && pendingCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-500 rounded-full text-xs">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de Indicações */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-white text-lg">Erro ao carregar indicações</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-white text-lg">Nenhuma indicação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {suggestions.map((suggestion: any) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{suggestion.supplier_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(suggestion.status)}`}>
                          {getStatusIcon(suggestion.status)}
                          {getStatusLabel(suggestion.status)}
                        </span>
                      </div>

                      {/* Informações do usuário */}
                      {suggestion.user_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70 mb-2">
                          <User className="w-4 h-4" />
                          <span>{suggestion.user_name}</span>
                          {suggestion.user_email && (
                            <>
                              <span className="mx-1">•</span>
                              <Mail className="w-4 h-4" />
                              <span>{suggestion.user_email}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Contato */}
                      {suggestion.contact && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70 mb-2">
                          <Phone className="w-4 h-4" />
                          <span>{suggestion.contact}</span>
                        </div>
                      )}

                      {/* Comentário */}
                      {suggestion.comment && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 dark:text-white/50 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 dark:text-white/80">{suggestion.comment}</p>
                          </div>
                        </div>
                      )}

                      {/* Data */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50 mt-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Enviado em {formatDate(suggestion.created_at)}</span>
                        {suggestion.reviewed_at && (
                          <>
                            <span>•</span>
                            <span>Revisado em {formatDate(suggestion.reviewed_at)}</span>
                            {suggestion.reviewer_name && (
                              <>
                                <span>por {suggestion.reviewer_name}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Ações (apenas para pendentes) */}
                    {suggestion.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(suggestion.id, 'approved')}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-400 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleStatusChange(suggestion.id, 'rejected')}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}





