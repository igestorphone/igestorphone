import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { getGreeting } from '@/lib/utils'

export default function DashboardPageDebug() {
  const { user } = useAuthStore()

  console.log('DashboardPageDebug - User:', user)

  return (
    <div className="space-y-8">
      {/* Debug Info */}
      <div className="bg-red-500 text-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">DEBUG INFO</h2>
        <p>User: {user ? user.nome : 'No user'}</p>
        <p>Email: {user ? user.email : 'No email'}</p>
        <p>Type: {user ? user.tipo : 'No type'}</p>
      </div>

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

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-2">0</h3>
          <p className="text-white/70">Fornecedores</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-2">0</h3>
          <p className="text-white/70">Produtos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-2">0</h3>
          <p className="text-white/70">Processamentos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-xl p-6 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-2">0</h3>
          <p className="text-white/70">Usuários</p>
        </motion.div>
      </div>

      {/* Simple Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="glass rounded-xl p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          Sistema iGestorPhone Funcionando! 🎉
        </h2>
        <p className="text-white/70 text-lg">
          O login foi realizado com sucesso. O sistema está operacional.
        </p>
      </motion.div>
    </div>
  )
}













