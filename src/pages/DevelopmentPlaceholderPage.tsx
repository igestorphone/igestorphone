import { useLocation } from 'react-router-dom'
import { Calendar, BarChart3, Smartphone } from 'lucide-react'

const routeTitles: Record<string, { title: string; subtitle: string; icon: 'calendar' | 'chart' | 'phone' }> = {
  '/calendar': { title: 'Calendário', subtitle: 'Personalize sua visualização do calendário', icon: 'calendar' },
  '/search-iphone-seminovo': { title: 'Buscar iPhone Seminovo', subtitle: 'Personalize suas preferências do sistema', icon: 'phone' },
  '/search-android': { title: 'Buscar Android', subtitle: 'Personalize suas preferências do sistema', icon: 'phone' },
}

export default function DevelopmentPlaceholderPage() {
  const { pathname } = useLocation()
  const { title, subtitle, icon } = routeTitles[pathname] || {
    title: 'Esta página',
    subtitle: 'Personalize suas preferências do sistema',
    icon: 'calendar' as const
  }
  const Icon = icon === 'calendar' ? Calendar : icon === 'chart' ? BarChart3 : Smartphone
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-white/70">{subtitle}</p>
      </div>
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-white/10 p-8 text-center">
        <Icon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Em desenvolvimento</h2>
        <p className="text-gray-600 dark:text-white/70">
          Esta página está em desenvolvimento e estará disponível em breve.
        </p>
      </div>
    </div>
  )
}
