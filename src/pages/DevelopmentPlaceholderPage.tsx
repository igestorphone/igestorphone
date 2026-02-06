import { useLocation } from 'react-router-dom'
import { Calendar, BarChart3 } from 'lucide-react'

const routeTitles: Record<string, { title: string; icon: 'calendar' | 'chart' }> = {
  '/calendar': { title: 'Calendário', icon: 'calendar' },
}

export default function DevelopmentPlaceholderPage() {
  const { pathname } = useLocation()
  const { title, icon } = routeTitles[pathname] || { title: 'Esta página', icon: 'calendar' as const }
  const Icon = icon === 'calendar' ? Calendar : BarChart3
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 mb-4">
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-white/70">Página em desenvolvimento. Em breve você poderá usar esta funcionalidade.</p>
      </div>
    </div>
  )
}
