import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  FileText, 
  Users, 
  BarChart3, 
  Search, 
  TrendingUp, 
  Smartphone,
  Brain,
  Zap,
  Sparkles,
  CheckCircle,
  Activity,
  RefreshCw,
  Store,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface DashboardStats {
  totalSuppliers: number
  totalProducts: number
  totalUsers: number
  aiStatus: boolean
}

export default function DashboardPage() {
  const { user, testLoadPermissions } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalSuppliers: 0,
    totalProducts: 0,
    totalUsers: 0,
    aiStatus: true
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      let totalSuppliers = 0
      let totalProducts = 0
      let totalUsers = 0
      
      // Buscar dados de fornecedores
      try {
        const suppliersResponse = await api.get('/suppliers')
        const suppliersData = suppliersResponse.data?.suppliers || suppliersResponse.data || []
        totalSuppliers = Array.isArray(suppliersData) ? suppliersData.length : 0
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error)
      }

      // Buscar dados de produtos
      try {
        const productsResponse = await api.get('/products', { params: { limit: 5000 } })
        
        console.log('📊 Dashboard - Resposta completa da API:', productsResponse.data)
        
        // A resposta pode vir como { products: [...], pagination: {...} } ou { data: { products: [...] } }
        
        // Priorizar pagination.total se existir (mais preciso)
        if (productsResponse.data?.pagination?.total !== undefined) {
          totalProducts = parseInt(productsResponse.data.pagination.total) || 0
          console.log('📊 Dashboard - Usando pagination.total:', totalProducts)
        } else {
          const productPayload = productsResponse.data?.products || productsResponse.data || []
          if (Array.isArray(productPayload)) {
            totalProducts = productPayload.length
            console.log('📊 Dashboard - Usando array length:', totalProducts)
          } else {
            totalProducts = 0
            console.log('📊 Dashboard - Payload não é array, totalProducts = 0')
          }
        }

        console.log('📊 Dashboard - Total de produtos final:', totalProducts)
      } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error)
        console.error('❌ Erro completo:', JSON.stringify(error, null, 2))
      }

      // Buscar dados de usuários
      try {
        const usersResponse = await api.get('/users')
        const usersData = usersResponse.data?.users || usersResponse.data || []
        totalUsers = Array.isArray(usersData) ? usersData.length : 0
      } catch (error) {
        console.error('Erro ao buscar usuários:', error)
      }

      setStats({
        totalSuppliers,
        totalProducts,
        totalUsers,
        aiStatus: true
      })
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statsCards = [
    {
      title: 'IA Ativa',
      value: stats.aiStatus ? '100%' : 'Offline',
      icon: Brain,
      gradient: 'from-purple-600/70 via-indigo-500/50 to-blue-500/40',
      glow: 'shadow-[0_20px_60px_rgba(129,140,248,0.35)]',
      description: 'Monitorando listas e preços em tempo real',
      badge: {
        text: stats.aiStatus ? 'ONLINE' : 'OFFLINE',
        bg: stats.aiStatus ? 'bg-emerald-500/15' : 'bg-red-500/15',
        color: stats.aiStatus ? 'text-emerald-200' : 'text-red-200'
      }
    },
    {
      title: 'Fornecedores Ativos',
      value: stats.totalSuppliers.toString(),
      icon: Store,
      gradient: 'from-blue-500/60 via-cyan-500/40 to-sky-500/30',
      glow: 'shadow-[0_20px_60px_rgba(56,189,248,0.25)]',
      description: 'Parceiros com listas processadas hoje'
    },
    {
      title: 'Produtos Cadastrados',
      value: stats.totalProducts.toLocaleString(),
      icon: Smartphone,
      gradient: 'from-green-500/60 via-emerald-500/40 to-lime-500/30',
      glow: 'shadow-[0_20px_60px_rgba(74,222,128,0.25)]',
      description: 'Base atualizada com os melhores preços'
    },
    {
      title: 'Usuários na Plataforma',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      gradient: 'from-pink-500/60 via-rose-500/40 to-purple-500/30',
      glow: 'shadow-[0_20px_60px_rgba(244,114,182,0.25)]',
      description: 'Equipe conectada e pronta para vender'
    }
  ]

  const quickSummary = [
    {
      label: 'Fornecedores ativos',
      value: stats.totalSuppliers.toLocaleString(),
      icon: Store,
      gradient: 'from-cyan-500/30 to-blue-500/30'
    },
    {
      label: 'Produtos cadastrados',
      value: stats.totalProducts.toLocaleString(),
      icon: Smartphone,
      gradient: 'from-green-500/30 to-emerald-500/30'
    },
    {
      label: 'Equipe conectada',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      gradient: 'from-pink-500/30 to-purple-500/30'
    }
  ]

  const insightHighlights = [
    {
      title: 'Processar lista do dia',
      description: 'Garanta que os novos preços estejam disponíveis na busca e na média automática.',
      icon: FileText,
      gradient: 'from-purple-500/30 to-indigo-500/20'
    },
    {
      title: 'Checar médias de preço',
      description: 'Valide as margens da loja analisando as curvas das últimas listas.',
      icon: BarChart3,
      gradient: 'from-blue-500/30 to-cyan-500/20'
    },
    {
      title: 'Acompanhar fornecedores',
      description: 'Veja quais parceiros já enviaram lista e mantenha o histórico atualizado.',
      icon: Store,
      gradient: 'from-green-500/30 to-emerald-500/20'
    }
  ]

  const quickActions = [
    {
      title: 'Processar Lista com IA',
      description: 'Validação automática de produtos com IA',
      icon: Brain,
      href: '/process-list',
      color: 'from-purple-500 to-purple-600',
      ai: true,
      adminOnly: true
    },
    {
      title: 'Buscar iPhone Mais Barato',
      description: 'Análise inteligente de preços com IA',
      icon: Search,
      href: '/search-cheapest-iphone',
      color: 'from-orange-500 to-orange-600',
      ai: true
    },
    {
      title: 'Médias de Preço',
      description: 'Tendências e previsões com IA',
      icon: BarChart3,
      href: '/price-averages',
      color: 'from-green-500 to-green-600',
      ai: true
    },
    {
      title: 'Consultar Listas',
      description: 'Visualize produtos dos fornecedores',
      icon: FileText,
      href: '/consult-lists',
      color: 'from-blue-500 to-blue-600'
    }
  ]

  // Filtrar ações baseado no tipo de usuário
  const filteredQuickActions = quickActions.filter(action => {
    if (action.adminOnly && user?.tipo !== 'admin') {
      return false
    }
    return true
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const formatLastUpdate = () => {
    const now = new Date()
    const diff = now.getTime() - lastUpdate.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora mesmo'
    if (minutes === 1) return '1 minuto atrás'
    return `${minutes} minutos atrás`
  }

  const getFirstName = () => {
    if (user?.nome) {
      return user.nome.split(' ')[0]
    }
    const userAsAny = user as any
    if (userAsAny?.name && typeof userAsAny.name === 'string') {
      return userAsAny.name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Usuário'
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-16 pt-8"
    >
      {/* Banner de Recesso */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 backdrop-blur-md p-8 shadow-2xl"
      >
        {/* Decoração de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-10 -left-10 text-6xl opacity-20"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            🎄
          </motion.div>
          <motion.div
            className="absolute top-0 right-10 text-5xl opacity-20"
            animate={{
              rotate: [360, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute bottom-0 left-1/4 text-5xl opacity-20"
            animate={{
              y: [0, -15, 0],
              rotate: [0, 15, -15, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🎁
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-1/4 text-4xl opacity-15"
            animate={{
              rotate: [0, -360],
              scale: [0.8, 1.1, 0.8]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🎅
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <motion.div
            className="text-6xl md:text-7xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🎉
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 bg-clip-text text-transparent"
            >
              Entramos em Recesso! 🎊
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg md:text-xl text-white/90 mb-3"
            >
              Estamos de férias aproveitando o final de ano!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 text-white/80"
            >
              <span className="font-semibold">Voltamos em:</span>
              <span className="px-4 py-2 rounded-full bg-white/20 border border-white/30 font-bold text-lg">
                05/01/2026
              </span>
            </motion.div>
          </div>

          <motion.div
            className="text-5xl md:text-6xl"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            🎄
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative z-10 mt-6 text-center"
        >
          <p className="text-white/90 text-lg font-medium">
            Desejamos a todos um feliz Natal e um próspero Ano Novo! 🎅✨
          </p>
          <p className="text-white/70 text-sm mt-2">
            Que 2026 seja repleto de sucessos e realizações! 🌟
          </p>
        </motion.div>
      </motion.div>

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-purple-900/60 to-slate-900/70 p-8 shadow-[0_40px_80px_rgba(99,102,241,0.25)]"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-20 h-48 w-48 bg-purple-500/30 blur-3xl"></div>
          <div className="absolute top-1/3 -right-28 h-56 w-56 bg-blue-500/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 h-32 w-32 bg-pink-500/10 blur-2xl"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-10">
          <div className="flex-1">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-[0.3em] text-white/70"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              IA Ativa & Monitorada
            </motion.span>

            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-4xl lg:text-5xl font-bold text-white tracking-tight"
            >
              {getGreeting()}, {getFirstName()}.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-4 text-lg text-white/80 max-w-2xl"
            >
              Continue tomando decisões com dados inteligentes. Acompanhe fornecedores, preços e metas em um só painel pensado para a rotina Apple.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-3 mt-6"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-100 text-sm border border-purple-500/40">
                <Zap className="w-4 h-4" />
                Automação diária com IA
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-100 text-sm border border-blue-500/30">
                <TrendingUp className="w-4 h-4" />
                Atualizado {formatLastUpdate()}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-4 mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={fetchDashboardData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar dados
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={testLoadPermissions}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 transition-colors border border-purple-500/30"
              >
                <Brain className="w-4 h-4" />
                Testar IA
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:w-80 xl:w-96"
          >
            <div className="grid gap-4">
              {quickSummary.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.4 }}
                  className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${item.gradient} backdrop-blur-xl p-5`}
                >
                  <div className="absolute -bottom-8 -right-6 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {loading ? (
                          <span className="inline-block w-16 h-6 bg-white/20 rounded animate-pulse"></span>
                        ) : (
                          item.value
                        )}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/15 border border-white/20">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Maintenance Notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-sm p-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-medium">Manutenção temporária:</span> O sistema está com limitações no banco de dados hoje. Estamos resolvendo e tudo voltará ao normal em breve.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16"
      >
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.6 + (index * 0.08),
              duration: 0.5,
              type: 'spring',
              stiffness: 120
            }}
            whileHover={{ 
              scale: 1.05,
              y: -6,
              transition: { duration: 0.2 }
            }}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${stat.gradient} ${stat.glow} p-6 backdrop-blur-lg`}
          >
            <div className="absolute -top-16 -right-6 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-start justify-between mb-6">
              <div className="p-3 rounded-xl bg-white/15 border border-white/20">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.badge && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stat.badge.bg} ${stat.badge.color}`}>
                  {stat.badge.text}
                </span>
              )}
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white tracking-tight mb-2">
                {loading ? (
                  <div className="w-20 h-8 bg-white/20 rounded animate-pulse"></div>
                ) : (
                  stat.value
                )}
              </h3>
              <p className="text-white/80 text-sm font-medium uppercase tracking-[0.2em] mb-2">
                {stat.title}
              </p>
              {stat.description && (
                <p className="text-white/70 text-sm leading-relaxed">
                  {stat.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="text-2xl font-bold text-white mb-6"
        >
          Ações Rápidas
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredQuickActions.map((action, index) => (
            <motion.a
              key={action.title}
              href={action.href}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: 1.2 + (index * 0.1),
                duration: 0.5,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05,
                y: -8,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 group-hover:border-white/20">
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-20 group-hover:opacity-35 transition-opacity`} />
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  {action.ai && (
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold border border-purple-500/30">
                      <Sparkles className="w-3 h-3" />
                      <span>IA</span>
                    </div>
                  )}
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:tracking-wide transition-all">
                    {action.title}
                  </h3>
                  <p className="text-white/75 text-sm leading-relaxed">{action.description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* AI Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="glass rounded-xl p-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Inteligência Artificial Ativa
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="text-white/80 text-lg mb-4"
          >
            Monitorando e analisando dados em tempo real
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="flex items-center justify-center space-x-6"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity
                }}
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
              </motion.div>
              <span className="text-green-400 font-medium">Processamento de Listas</span>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.5
                }}
              >
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </motion.div>
              <span className="text-blue-400 font-medium">Análise de Preços</span>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 1
                }}
              >
                <Activity className="w-5 h-5 text-purple-400" />
              </motion.div>
              <span className="text-purple-400 font-medium">Monitoramento Contínuo</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="pb-10"
      >
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.7 }}
          className="text-2xl font-bold text-white mb-6"
        >
          Próximos passos sugeridos
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {insightHighlights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 + index * 0.1, duration: 0.5, type: 'spring', stiffness: 120 }}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-6`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${insight.gradient} opacity-20`} />
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                  <insight.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}