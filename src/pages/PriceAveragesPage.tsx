import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BarChart3,
  Smartphone,
  DollarSign,
  Download,
  Palette,
  Loader2,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { produtosApi } from '@/lib/api'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)

export default function PriceAveragesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'model' | 'price-asc' | 'price-desc' | 'count'>('model')

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'price-averages'],
    queryFn: async () => {
      const res = await produtosApi.getPriceAverages()
      return res.data
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000
  })

  const averages = data?.averages ?? []

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return averages
    const term = searchTerm.toLowerCase().trim()
    return averages.filter(
      (r) =>
        (r.model || '').toLowerCase().includes(term) ||
        (r.color || '').toLowerCase().includes(term)
    )
  }, [averages, searchTerm])

  const sorted = useMemo(() => {
    const list = [...filtered]
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.avg_price - b.avg_price)
      case 'price-desc':
        return list.sort((a, b) => b.avg_price - a.avg_price)
      case 'count':
        return list.sort((a, b) => b.count - a.count)
      case 'model':
      default:
        return list.sort((a, b) =>
          (a.model || '').localeCompare(b.model || '', 'pt-BR')
        )
    }
  }, [filtered, sortBy])

  const exportCsv = () => {
    const headers = ['Modelo', 'Cor', 'Preço sugerido (média)', 'Qtd', 'Mín', 'Máx']
    const rows = sorted.map((r) => [
      r.model,
      r.color,
      r.avg_price,
      r.count,
      r.min_price ?? '',
      r.max_price ?? ''
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `media-precos-iphones-novos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden border border-white/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-yellow-200" />
            <h1 className="text-2xl md:text-3xl font-bold">Média de Preço</h1>
          </div>
          <p className="text-blue-100 text-sm md:text-base">
            Média de todos os iPhones novos por modelo e cor. Valores arredondados para o múltiplo de R$ 50 mais próximo para você montar sua tabela.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-white/10"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Filtrar por modelo ou cor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="model">Ordenar por modelo</option>
              <option value="price-asc">Preço: menor</option>
              <option value="price-desc">Preço: maior</option>
              <option value="count">Quantidade</option>
            </select>
            {sorted.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Carregando médias de preço...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-600 dark:text-red-400 text-center">
          Erro ao carregar médias. Tente novamente.
        </div>
      )}

      <AnimatePresence>
        {!isLoading && !error && (
          <>
            {sorted.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-gray-800/50 shadow-lg"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Modelo
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cor
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                          Preço sugerido
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                          Qtd
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right hidden sm:table-cell">
                          Mín
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right hidden sm:table-cell">
                          Máx
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {sorted.map((row, i) => (
                        <motion.tr
                          key={`${row.model}-${row.color}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {row.model || '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                            {row.color && row.color !== '—' ? (
                              <>
                                <Palette className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                {row.color}
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                            {formatPrice(row.avg_price)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {row.count}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {row.min_price != null ? formatPrice(row.min_price) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {row.max_price != null ? formatPrice(row.max_price) : '—'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 p-8 text-center"
              >
                <Smartphone className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nenhum resultado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm.trim()
                    ? 'Tente outro termo de busca.'
                    : 'Ainda não há iPhones novos cadastrados para calcular a média.'}
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/20 text-sm text-gray-700 dark:text-gray-300"
            >
              <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Como usar</p>
                <p>
                  Os valores já vêm arredondados para o múltiplo de R$ 50 mais próximo (ex.: 7225 → 7250, 7224 → 7200).
                  Use a coluna &quot;Preço sugerido&quot; como base para montar sua tabela de venda.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
