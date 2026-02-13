import { motion } from 'framer-motion'
import { BarChart3, Wrench } from 'lucide-react'

export default function PriceAveragesPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-12 shadow-sm text-center"
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-gray-500 dark:text-gray-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Média de Preço
            </h1>
          </div>
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Wrench className="w-8 h-8" />
            <p className="text-lg md:text-xl font-semibold">
              Página em manutenção
            </p>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
            Estamos realizando melhorias. Volte em breve.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
