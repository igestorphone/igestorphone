import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BarChart3,
  Smartphone,
  Download,
  Palette,
  Loader2,
  Package,
  Info
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { produtosApi } from '@/lib/api'
import { normalizeColor } from './colorNormalizer'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)

export default function PriceAveragesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [sortBy, setSortBy] = useState<'model' | 'price-asc' | 'price-desc' | 'count'>('model')

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'price-averages', searchTerm, selectedColor, selectedStorage],
    queryFn: async () => {
      const res = await produtosApi.getPriceAverages({
        search: searchTerm.trim() || undefined,
        color: selectedColor || undefined,
        storage: selectedStorage || undefined
      })
      // API retorna { averages: [...] }; apiClient já devolve o body
      return Array.isArray((res as any)?.averages) ? (res as any) : { averages: [] }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2
  })

  const averages = Array.isArray(data?.averages) ? data.averages : []

  const sorted = useMemo(() => {
    const list = [...averages]
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
  }, [averages, sortBy])

  const uniqueColors = useMemo(() => {
    const set = new Set<string>()
    averages.forEach((r) => {
      if (r.color && r.color !== '—') set.add(r.color)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [averages])

  const uniqueStorages = useMemo(() => {
    const set = new Set<string>()
    averages.forEach((r) => {
      if (r.storage && r.storage !== '—') set.add(r.storage)
    })
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0
      return numA - numB
    })
  }, [averages])

  const exportCsv = () => {
    const headers = ['Modelo', 'Cor', 'Capacidade', 'Preço sugerido (média)', 'Qtd', 'Mín', 'Máx']
    const rows = sorted.map((r) => [
      r.model,
      r.color,
      r.storage,
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
      {/* Título e descrição — preto e branco */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-7 h-7 text-gray-700 dark:text-gray-300" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Média de Preço
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Escolha o <strong>modelo</strong>, a <strong>cor</strong> e a <strong>capacidade</strong>. Você vê a <strong>média de preço</strong> para colocar seu lucro e montar sua tabela. Só iPhones novos (hoje/ontem). Valores em R$ 50.
        </p>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Ex.: iPhone 17 Pro Max"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <Palette className="w-4 h-4 inline mr-1" />
                Cor
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              >
                <option value="">Todas</option>
                {uniqueColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <Package className="w-4 h-4 inline mr-1" />
                Capacidade
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              >
                <option value="">Todas</option>
                {uniqueStorages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-white text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
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
          <p>Carregando médias...</p>
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
              <>
                {/* Um resultado: card único com a média (como Buscar iPhone) */}
                {sorted.length === 1 && (searchTerm.trim() || selectedColor || selectedStorage) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-black p-8 shadow-sm"
                  >
                    <div className="text-center">
                      <Smartphone className="w-14 h-14 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {sorted[0].model || '—'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                        {sorted[0].color && sorted[0].color !== '—'
                          ? normalizeColor(sorted[0].color, sorted[0].model || '')
                          : '—'}
                        {sorted[0].storage && sorted[0].storage !== '—' ? ` • ${sorted[0].storage}` : ''}
                      </p>
                      <div className="inline-flex flex-col items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/10 px-8 py-6 border border-gray-200 dark:border-white/10">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Média de preço (base para sua tabela)
                        </span>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(sorted[0].avg_price)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {sorted[0].count} oferta{sorted[0].count !== 1 ? 's' : ''} • arredondado para R$ 50
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-black shadow-sm"
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
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                              Capacidade
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                              Média
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
                              key={`${row.model}-${row.color}-${row.storage}-${i}`}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                {row.model || '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {row.color && row.color !== '—'
                                  ? normalizeColor(row.color, row.model || '')
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                                {row.storage && row.storage !== '—' ? row.storage : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
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
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-white/10 p-8 text-center"
              >
                <Smartphone className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nenhum resultado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {searchTerm || selectedColor || selectedStorage
                    ? 'Nenhum iPhone novo com esses filtros (hoje/ontem). Tente outro modelo, cor ou capacidade.'
                    : 'Nenhum iPhone novo hoje ou ontem. As médias aparecem após processar ou restaurar listas.'}
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300"
            >
              <Info className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Como usar</p>
                <p>
                  Digite o modelo (ex.: iPhone 17 Pro Max), escolha a cor e a capacidade. Você vê <strong>uma única média de preço</strong> para colocar seu lucro. Valores arredondados para R$ 50. Cores iguais ao Buscar iPhone lacrado.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
