import { motion } from 'framer-motion'
import { CreditCard, Package, Calendar, CheckCircle } from 'lucide-react'

export default function SubscriptionPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Plano & Assinatura
        </h1>
        <p className="text-gray-600 dark:text-white/70">
          Gerencie seu plano e assinatura
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-white/10 p-8 text-center"
      >
        <CreditCard className="w-16 h-16 text-blue-500 mx-auto mb-4" />
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

