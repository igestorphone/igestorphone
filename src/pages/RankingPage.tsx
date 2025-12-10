import { motion } from 'framer-motion'
import { Trophy, Award, TrendingUp } from 'lucide-react'

export default function RankingPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ranking
        </h1>
        <p className="text-gray-600 dark:text-white/70">
          Veja os rankings e estatísticas
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-white/10 p-8 text-center"
      >
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Em desenvolvimento
        </h2>
        <p className="text-gray-600 dark:text-white/70">
          Esta página está em desenvolvimento e estará disponível em breve.
        </p>
      </motion.div>
    </div>
  )
}

