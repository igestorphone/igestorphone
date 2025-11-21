import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bug, CheckCircle, XCircle, Clock, AlertCircle, AlertTriangle, Zap, User, Calendar, Filter } from 'lucide-react'
import { bugReportsApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function BugReportsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [showResolved, setShowResolved] = useState(false) // Toggle para mostrar/ocultar finalizados

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-white/70">Apenas administradores podem visualizar bugs reportados.</p>
        </div>
      </div>
    )
  }

  // Buscar bugs
  const { data, isLoading, error } = useQuery({
    queryKey: ['bug-reports', statusFilter, severityFilter, showResolved],
    queryFn: async () => {
      try {
        console.log('🐛 BugReports - Buscando bugs...')
        console.log('🐛 BugReports - User:', user)
        console.log('🐛 BugReports - User tipo:', user?.tipo)
        
        // Se showResolved estiver true, buscar apenas resolved
        // Se showResolved estiver false, buscar todos exceto resolved
        const status = showResolved 
          ? 'resolved' 
          : (statusFilter === 'all' ? undefined : statusFilter)
        
        const response = await bugReportsApi.getAll({
          status: status,
          severity: severityFilter === 'all' ? undefined : severityFilter,
          page: 1,
          limit: 100
        })
        
        console.log('🐛 BugReports - Response completa:', response)
        console.log('🐛 BugReports - Response.data:', response?.data)
        console.log('🐛 BugReports - Response.bug_reports:', response?.bug_reports)
        
        // O backend retorna { bug_reports: [...], pagination: {...} }
        // O apiClient.get pode retornar response.data ou response direto
        if (response?.data?.bug_reports) {
          return response.data
        } else if (response?.bug_reports) {
          return response
        } else if (Array.isArray(response?.data)) {
          return { bug_reports: response.data, pagination: response.pagination || {} }
        } else if (Array.isArray(response)) {
          return { bug_reports: response, pagination: {} }
        } else {
          console.warn('🐛 BugReports - Formato de resposta inesperado:', response)
          return { bug_reports: [], pagination: {} }
        }
      } catch (error: any) {
        console.error('🐛 BugReports - Erro ao buscar bugs:', error)
        console.error('🐛 BugReports - Erro completo:', JSON.stringify(error, null, 2))
        console.error('🐛 BugReports - Erro response:', error?.response)
        console.error('🐛 BugReports - Erro message:', error?.message)
        
        // O erro do axios vem em error.response, não em error diretamente
        const status = error?.response?.status || error?.status
        const errorData = error?.response?.data || error?.data
        
        console.error('🐛 BugReports - Status:', status)
        console.error('🐛 BugReports - Error Data:', errorData)
        
        // Se for erro 401 (não autenticado) ou 403 (não autorizado), mostrar mensagem específica
        if (status === 401) {
          throw new Error('Você precisa estar autenticado para visualizar bugs reportados.')
        } else if (status === 403) {
          throw new Error('Apenas administradores podem visualizar bugs reportados. Verifique se você está logado como admin.')
        }
        
        // Criar um erro mais descritivo
        const errorMessage = errorData?.message || error?.message || 'Erro desconhecido ao buscar bugs'
        throw new Error(errorMessage)
      }
    },
    retry: 1, // Tentar apenas 1 vez em caso de erro
    retryOnMount: false // Não tentar novamente ao montar o componente
  })

  // Mutação para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'in_progress' | 'resolved' | 'rejected' }) =>
      bugReportsApi.updateStatus(id, status),
    onSuccess: (_data: any, variables: { id: number; status: 'pending' | 'in_progress' | 'resolved' | 'rejected' }) => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] })
      
      if (variables.status === 'rejected') {
        toast.success('Bug rejeitado e removido do sistema')
      } else if (variables.status === 'resolved') {
        toast.success('Bug marcado como resolvido!')
      } else if (variables.status === 'in_progress') {
        toast.success('Bug aceito e movido para em progresso')
      } else {
        toast.success('Status atualizado com sucesso!')
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar status')
    }
  })

  const handleStatusChange = (id: number, status: 'in_progress' | 'resolved' | 'rejected') => {
    updateStatusMutation.mutate({ id, status })
  }

  // Separar bugs por status
  const allBugs = (data?.bug_reports || []).filter((b: any) => b !== null && b !== undefined)
  const activeBugs = allBugs.filter((b: any) => b.status !== 'resolved')
  const resolvedBugs = allBugs.filter((b: any) => b.status === 'resolved')
  
  // Bugs ativos (pendentes, em progresso) ou finalizados conforme o filtro
  const bugReports = showResolved ? resolvedBugs : activeBugs
  const pendingCount = activeBugs.filter((b: any) => b.status === 'pending').length
  const inProgressCount = activeBugs.filter((b: any) => b.status === 'in_progress').length
  const resolvedCount = resolvedBugs.length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-400" />
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Resolvido'
      case 'rejected':
        return 'Rejeitado'
      case 'in_progress':
        return 'Em Progresso'
      default:
        return 'Pendente'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-400/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-400/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Zap className="w-4 h-4 text-red-400" />
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-400" />
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-blue-400" />
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítica'
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Média'
      default:
        return 'Baixa'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-400/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-400/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden border border-white/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Bug className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Bugs Reportados</h1>
            </div>
            <p className="text-blue-100 text-lg">Gerencie os bugs reportados pelos usuários</p>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-300" />
              <h2 className="text-lg font-semibold text-white">Filtros</h2>
            </div>
            {/* Toggle para Finalizados */}
            <button
              onClick={() => {
                setShowResolved(!showResolved)
                setStatusFilter('all') // Resetar filtro de status ao alternar
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                showResolved
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {showResolved ? 'Ver Ativos' : 'Ver Finalizados'}
              {resolvedCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-500 rounded-full text-xs">
                  {resolvedCount}
                </span>
              )}
            </button>
          </div>
          {!showResolved && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Status:</span>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'pending', 'in_progress'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                        statusFilter === status
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendentes' : 'Em Progresso'}
                      {status === 'pending' && pendingCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-500 rounded-full text-xs">
                          {pendingCount}
                        </span>
                      )}
                      {status === 'in_progress' && inProgressCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                          {inProgressCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">Severidade:</span>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'low', 'medium', 'high', 'critical'] as const).map((severity) => (
                    <button
                      key={severity}
                      onClick={() => setSeverityFilter(severity)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                        severityFilter === severity
                          ? 'bg-orange-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {severity === 'all' ? 'Todas' : severity === 'low' ? 'Baixa' : severity === 'medium' ? 'Média' : severity === 'high' ? 'Alta' : 'Crítica'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Lista de Bugs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2">Erro ao carregar bugs</p>
              <p className="text-white/70 text-sm mb-4">
                {(error as any)?.message || 'Erro desconhecido'}
              </p>
              <p className="text-white/50 text-xs">
                Verifique se você está autenticado como administrador.
              </p>
            </div>
          ) : bugReports.length === 0 ? (
            <div className="text-center py-16">
              <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-white text-lg">
                {showResolved ? 'Nenhum bug finalizado encontrado' : 'Nenhum bug ativo encontrado'}
              </p>
              {showResolved && (
                <p className="text-white/70 text-sm mt-2">
                  Histórico de bugs corrigidos aparecerá aqui
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {bugReports.map((bug: any) => (
                <motion.div
                  key={bug.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{bug.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(bug.status)}`}>
                          {getStatusIcon(bug.status)}
                          {getStatusLabel(bug.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getSeverityColor(bug.severity)}`}>
                          {getSeverityIcon(bug.severity)}
                          {getSeverityLabel(bug.severity)}
                        </span>
                      </div>

                      {/* Informações do usuário */}
                      {bug.user_name && (
                        <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                          <User className="w-4 h-4" />
                          <span>{bug.user_name}</span>
                          {bug.user_email && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{bug.user_email}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Descrição */}
                      <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{bug.description}</p>
                      </div>

                      {/* Data */}
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reportado em {formatDate(bug.created_at)}</span>
                        {bug.resolved_at && (
                          <>
                            <span>•</span>
                            <span className="text-green-400 font-medium">Resolvido em {formatDate(bug.resolved_at)}</span>
                            {bug.resolver_name && (
                              <>
                                <span>por {bug.resolver_name}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Badge de Resolvido (apenas para finalizados) */}
                      {bug.status === 'resolved' && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-lg text-green-400 text-xs font-medium flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Bug Corrigido
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ações (apenas para bugs ativos, não finalizados) */}
                    {!showResolved && (bug.status === 'pending' || bug.status === 'in_progress') && (
                      <div className="flex gap-2">
                        {bug.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(bug.id, 'in_progress')}
                            disabled={updateStatusMutation.isPending}
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-400 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                          >
                            <Clock className="w-4 h-4" />
                            Aceitar
                          </button>
                        )}
                        {bug.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(bug.id, 'resolved')}
                            disabled={updateStatusMutation.isPending}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-400 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Finalizar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja rejeitar e excluir este bug?')) {
                              handleStatusChange(bug.id, 'rejected')
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
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

