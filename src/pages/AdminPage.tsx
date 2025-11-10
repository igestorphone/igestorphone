import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Database, 
  Settings, 
  BarChart3,
  Shield,
  Activity,
  Clock
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { usersApi, statisticsApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch admin data
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    select: (response) => response.data || []
  })

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['statistics', 'admin'],
    queryFn: () => statisticsApi.getGeneral(),
    select: (response) => response.data
  })

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'database', label: 'Banco de Dados', icon: Database },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  const adminStats = [
    {
      title: 'Total de Usuários',
      value: users?.length || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Usuários Ativos',
      value: users?.filter(u => u.isAtivo).length || 0,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Administradores',
      value: users?.filter(u => u.tipo === 'admin').length || 0,
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Produtos Cadastrados',
      value: stats?.totalProdutos || 0,
      icon: Database,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
        <p className="text-white/70 text-lg">
          Gerencie usuários, dados e configurações do sistema
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {adminStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            className="card text-center"
          >
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loadingUsers || loadingStats ? '...' : stat.value}
            </h3>
            <p className="text-white/70 text-sm">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="card"
      >
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Visão Geral do Sistema</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Atividade Recente</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-white/80">Sistema iniciado com sucesso</span>
                      <span className="text-white/60 ml-auto">Agora</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-white/80">Novo usuário cadastrado</span>
                      <span className="text-white/60 ml-auto">2h atrás</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-white/80">Lista processada com IA</span>
                      <span className="text-white/60 ml-auto">4h atrás</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Status do Sistema</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">API Status</span>
                      <span className="text-green-400 font-semibold">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Banco de Dados</span>
                      <span className="text-green-400 font-semibold">Conectado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">IA Service</span>
                      <span className="text-green-400 font-semibold">Ativo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Última Atualização</span>
                      <span className="text-white/60">2 min atrás</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Gerenciar Usuários</h3>
                <button className="btn-primary flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Novo Usuário</span>
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/70">Carregando usuários...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Usuário</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Tipo</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Último Login</th>
                        <th className="text-left py-3 px-4 text-white/70 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((user, index) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{user.nome}</p>
                                <p className="text-white/60 text-sm">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.tipo === 'admin' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {user.tipo === 'admin' ? 'Admin' : 'Usuário'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isAtivo 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {user.isAtivo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white/80 text-sm">
                            {formatDateTime(user.ultimoLogin)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                                <Settings className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                                <Shield className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Gerenciar Banco de Dados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Backup</h4>
                  <p className="text-white/70 text-sm mb-4">
                    Crie um backup completo do banco de dados
                  </p>
                  <button className="btn-primary w-full">
                    Criar Backup
                  </button>
                </div>
                
                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Limpeza</h4>
                  <p className="text-white/70 text-sm mb-4">
                    Remova dados antigos e otimize o banco
                  </p>
                  <button className="btn-warning w-full">
                    Otimizar Banco
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Configurações do Sistema</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Configurações de IA</h4>
                  <p className="text-white/70 text-sm mb-3">
                    Configure a chave da API OpenAI para processamento de listas
                  </p>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="input-primary w-full"
                  />
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Configurações de Email</h4>
                  <p className="text-white/70 text-sm mb-3">
                    Configure o servidor SMTP para notificações
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Servidor SMTP"
                      className="input-primary"
                    />
                    <input
                      type="number"
                      placeholder="Porta"
                      className="input-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
