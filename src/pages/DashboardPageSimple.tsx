import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { getGreeting } from '@/lib/utils'

export default function DashboardPageSimple() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            {getGreeting()}
          </h1>
          <p className="text-white/70 text-lg">
            Bem-vindo, <span className="text-blue-400 font-semibold">{user?.nome || 'Usuário'}</span>
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20"
          >
            <h3 className="text-3xl font-bold text-white mb-2">2</h3>
            <p className="text-white/70">Fornecedores</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20"
          >
            <h3 className="text-3xl font-bold text-white mb-2">8</h3>
            <p className="text-white/70">Produtos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20"
          >
            <h3 className="text-3xl font-bold text-white mb-2">R$ 3.587</h3>
            <p className="text-white/70">Preço Médio</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20"
          >
            <h3 className="text-3xl font-bold text-white mb-2">0</h3>
            <p className="text-white/70">Processamentos</p>
          </motion.div>
        </div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-green-500/20 border border-green-500/30 rounded-xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            ✅ Sistema iGestorPhone Funcionando!
          </h2>
          <p className="text-white/70 text-lg">
            Frontend 100% funcional com dados mock. Pronto para conectar com banco de dados.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
        >
          <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl p-6 text-left transition-colors">
            <h3 className="text-xl font-semibold text-white mb-2">Processar Lista</h3>
            <p className="text-white/70">Use IA para processar listas</p>
          </button>

          <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl p-6 text-left transition-colors">
            <h3 className="text-xl font-semibold text-white mb-2">Consultar Fornecedores</h3>
            <p className="text-white/70">Veja fornecedores e produtos</p>
          </button>

          <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl p-6 text-left transition-colors">
            <h3 className="text-xl font-semibold text-white mb-2">Estatísticas</h3>
            <p className="text-white/70">Analise dados e tendências</p>
          </button>
        </motion.div>
      </div>
    </div>
  )
}