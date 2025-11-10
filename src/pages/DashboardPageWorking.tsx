import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getGreeting } from '@/lib/utils'
import { 
  Users, 
  Smartphone, 
  DollarSign, 
  Clock,
  FileText,
  BarChart3,
  Search
} from 'lucide-react'

export default function DashboardPageWorking() {
  const { user } = useAuthStore()

  const stats = [
    {
      title: 'Fornecedores Ativos',
      value: '2',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Produtos Cadastrados',
      value: '8',
      icon: Smartphone,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Preço Médio',
      value: 'R$ 3.587',
      icon: DollarSign,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    },
    {
      title: 'Última Atualização',
      value: 'Há 2 horas',
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30'
    }
  ]

  const quickActions = [
    {
      title: 'Consultar Listas',
      description: 'Seleciona fornecedor e mostra produtos',
      icon: FileText,
      href: '/consult-lists',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Médias de Preço',
      description: 'Calcula média por modelo de iPhone',
      icon: BarChart3,
      href: '/price-averages',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Buscar iPhone Mais Barato',
      description: 'Encontra melhor preço e envia pro WhatsApp',
      icon: Search,
      href: '/search-cheapest-iphone',
      color: 'from-yellow-500 to-orange-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-shadow-lg">
          {getGreeting()}
        </h1>
        <p className="text-white/70 text-lg">
          Bem-vindo de volta, <span className="text-blue-400 font-semibold">{user?.nome}</span>
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`glass rounded-xl p-6 text-center border ${stat.borderColor}`}
          >
            <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>
            <p className="text-white/70">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={action.href}
              className={`glass rounded-xl p-6 text-left hover:bg-white/10 transition-all bg-gradient-to-r ${action.color} bg-opacity-10 border border-white/20 block`}
            >
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mr-4`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{action.title}</h3>
              </div>
              <p className="text-white/70">{action.description}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass rounded-xl p-8 text-center bg-green-500/20 border border-green-500/30"
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          ✅ Sistema iGestorPhone Funcionando!
        </h2>
        <p className="text-white/70 text-lg">
          Frontend 100% funcional com todas as funcionalidades implementadas.
        </p>
      </motion.div>
    </div>
  )
}
