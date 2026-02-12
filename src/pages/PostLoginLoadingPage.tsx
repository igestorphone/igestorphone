import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { produtosApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

const MIN_LOADING_MS = 3500
const PREFETCH_QUERY_KEY = ['produtos', '', '', '', '', '']

export default function PostLoginLoadingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canAccessOnlyCalendar } = usePermissions()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const targetPath = canAccessOnlyCalendar() ? '/calendar' : '/search-cheapest-iphone'
    const start = Date.now()

    const prefetch = async () => {
      if (canAccessOnlyCalendar()) return
      try {
        await queryClient.prefetchQuery({
          queryKey: PREFETCH_QUERY_KEY,
          queryFn: () =>
            produtosApi.getAll({
              sort_by: 'price',
              sort_order: 'asc',
              limit: 5000
            }),
          staleTime: 10000
        })
      } catch {
        // Ignora erro de prefetch; a página vai buscar de novo
      }
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(100, (elapsed / MIN_LOADING_MS) * 100))
    }, 100)

    const done = async () => {
      await prefetch()
      const elapsed = Date.now() - start
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      await new Promise((r) => setTimeout(r, remaining))
      clearInterval(interval)
      setProgress(100)
      navigate(targetPath, { replace: true })
    }

    done()
    return () => clearInterval(interval)
  }, [navigate, queryClient, canAccessOnlyCalendar])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="relative">
          <Loader2 className="w-14 h-14 text-blue-500 dark:text-blue-400 animate-spin" strokeWidth={2} />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-gray-200 dark:border-white/10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Carregando seu painel
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            Preparando os dados para você...
          </p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
