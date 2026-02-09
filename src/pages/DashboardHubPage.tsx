import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Smartphone, Smartphone as IphoneSemi, Smartphone as Android } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

export default function DashboardHubPage() {
  const { canAccessSearchCheapest } = usePermissions()

  const options = [
    {
      name: 'Buscar iPhone Novo',
      description: 'iPhone lacrado, novos. Compare preços entre fornecedores.',
      href: '/search-cheapest-iphone',
      icon: Smartphone,
      color: 'from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 border-blue-500/30 dark:border-blue-400/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      requirePermission: true,
    },
    {
      name: 'Buscar iPhone Seminovo',
      description: 'Em breve. iPhone recondicionado e seminovo.',
      href: '/search-iphone-seminovo',
      icon: IphoneSemi,
      color: 'from-gray-500/20 to-gray-600/20 dark:from-white/10 dark:to-white/5 border-gray-400/30 dark:border-white/20',
      iconColor: 'text-gray-600 dark:text-white/70',
      requirePermission: false,
    },
    {
      name: 'Buscar Android',
      description: 'Em breve. Pesquisa de aparelhos Android.',
      href: '/search-android',
      icon: Android,
      color: 'from-green-500/20 to-emerald-500/20 dark:from-green-500/10 dark:to-emerald-500/10 border-green-500/30 dark:border-green-400/20',
      iconColor: 'text-green-600 dark:text-green-400',
      requirePermission: false,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-white/70 mt-1">Escolha o tipo de busca</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((item, index) => {
          const show = item.requirePermission ? canAccessSearchCheapest() : true
          if (!show) return null

          const Icon = item.icon
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`h-full rounded-2xl border bg-gradient-to-br ${item.color} p-6 flex flex-col transition-all hover:shadow-lg dark:hover:shadow-none`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/50 dark:bg-white/10 mb-4 ${item.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {item.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-white/70 flex-1">
                {item.description}
              </p>
              {item.href === '/search-cheapest-iphone' ? (
                <NavLink
                  to={item.href}
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium text-sm transition-colors"
                >
                  Acessar
                </NavLink>
              ) : (
                <NavLink
                  to={item.href}
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 font-medium text-sm transition-colors hover:bg-gray-300 dark:hover:bg-white/15"
                >
                  Em desenvolvimento
                </NavLink>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
