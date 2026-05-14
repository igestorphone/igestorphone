import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Copy, Download, Loader2, RefreshCw, Banknote, CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { produtosApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  IPHONE_PRICE_TABLE_ORDER,
  aggregateIphoneAveragesByTableRow,
  roundTo50,
} from '@/lib/iphoneAveragePriceCatalog'

type DateOffset = 0 | -1 | -2

function saleWithMargin(avg: number, marginReais: number): number {
  if (marginReais <= 0) return avg
  return roundTo50(avg + marginReais)
}

export default function PriceAveragesPage() {
  const [dateOffset, setDateOffset] = useState<DateOffset>(0)
  const [marginReais, setMarginReais] = useState(0)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['price-averages', dateOffset],
    queryFn: () => produtosApi.getPriceAverages({ date_offset: dateOffset }),
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })

  const raw = useMemo(() => (data as any)?.data ?? data, [data])
  const averages = useMemo(() => raw?.averages ?? [], [raw])
  const dateFilter = (raw?.dateFilter ?? 'day') as 'day' | 'rolling3' | 'all'

  const aggByLabel = useMemo(() => aggregateIphoneAveragesByTableRow(averages), [averages])

  const dateOffsetLabel =
    dateOffset === 0 ? 'Hoje' : dateOffset === -1 ? 'Ontem' : 'Anteontem'

  const dateFilterHint =
    dateFilter === 'rolling3'
      ? 'Poucos dados no dia selecionado: médias usam os últimos 3 dias até essa data.'
      : dateFilter === 'all'
        ? 'Sem dados no período: exibindo médias com todas as datas disponíveis (lacrado).'
        : null

  const toggleRow = (label: string) => {
    setSelectedLabel((prev) => (prev === label ? null : label))
  }

  const tableRows = useMemo(() => {
    return IPHONE_PRICE_TABLE_ORDER.map((label) => {
      const agg = aggByLabel.get(label)
      return { label, agg }
    })
  }, [aggByLabel])

  const exportCsv = () => {
    const header = ['Modelo', 'Preço médio', 'Menor valor', 'Maior valor', 'Preço de venda']
    const lines = [header.join(';')]
    for (const { label, agg } of tableRows) {
      const avg = agg ? Math.round(agg.weightedAvg) : ''
      const mn = agg?.min != null ? roundTo50(agg.min) : ''
      const mx = agg?.max != null ? roundTo50(agg.max) : ''
      const sale =
        selectedLabel === label && marginReais > 0 && agg
          ? saleWithMargin(agg.weightedAvg, marginReais)
          : ''
      lines.push(
        [
          label,
          avg !== '' ? formatPrice(avg) : '',
          mn !== '' ? formatPrice(mn) : '',
          mx !== '' ? formatPrice(mx) : '',
          sale !== '' ? formatPrice(sale) : '',
        ].join(';')
      )
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medias-iphone-lacrado-${dateOffsetLabel.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  const copyToClipboard = () => {
    const header = ['Modelo', 'Preço médio', 'Menor', 'Maior', 'Preço venda']
    const lines = [header.join('\t')]
    for (const { label, agg } of tableRows) {
      lines.push(
        [
          label,
          agg ? formatPrice(Math.round(agg.weightedAvg)) : '—',
          agg?.min != null ? formatPrice(roundTo50(agg.min)) : '—',
          agg?.max != null ? formatPrice(roundTo50(agg.max)) : '—',
          selectedLabel === label && marginReais > 0 && agg
            ? formatPrice(saleWithMargin(agg.weightedAvg, marginReais))
            : '—',
        ].join('\t')
      )
    }
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => toast.success('Copiado!'),
      () => toast.error('Erro ao copiar.')
    )
  }

  const hasAnyData = tableRows.some((r) => r.agg)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm"
      >
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-9 h-9 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Média de preço</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  iPhone lacrado: preço médio, mínimo e máximo por modelo (referência ao dia em São Paulo). Toque em
                  uma linha, informe o lucro em reais e veja o preço de venda sugerido (média + lucro, arredondado a
                  R$ 50).
                </p>
                {dateFilterHint && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">{dateFilterHint}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  step={50}
                  placeholder="Lucro R$"
                  value={marginReais || ''}
                  onChange={(e) => setMarginReais(Number(e.target.value) || 0)}
                  className="w-28 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Lucro (R$)</span>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300"
              >
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Atualizar
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>Lista do dia</span>
            </div>
            <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
              {(
                [
                  { o: 0 as const, l: 'Hoje' },
                  { o: -1 as const, l: 'Ontem' },
                  { o: -2 as const, l: 'Anteontem' },
                ] as const
              ).map(({ o, l }) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setDateOffset(o)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    dateOffset === o
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {marginReais > 0 && !selectedLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
                Selecione um modelo na tabela para ver o preço de venda.
              </p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left py-3 px-3 font-semibold text-gray-900 dark:text-white">Modelo</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white">Preço médio</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white">Menor valor</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-900 dark:text-white">Maior valor</th>
                <th className="text-right py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                  Preço de venda
                </th>
              </tr>
            </thead>
            <tbody>
              {!hasAnyData && !isFetching && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum dado para lacrado nesse período. Processe listas de fornecedores ou troque o dia acima.
                  </td>
                </tr>
              )}
              {tableRows.map(({ label, agg }) => {
                const isSel = selectedLabel === label
                const showSale = isSel && marginReais > 0 && agg
                return (
                  <tr
                    key={label}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRow(label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleRow(label)
                      }
                    }}
                    className={`border-b border-gray-100 dark:border-white/5 cursor-pointer transition-colors ${
                      isSel ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                      {label}
                      {agg && agg.unitCount > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                          (n={agg.unitCount})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-800 dark:text-gray-200">
                      {agg ? formatPrice(Math.round(agg.weightedAvg)) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                      {agg?.min != null ? formatPrice(roundTo50(agg.min)) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                      {agg?.max != null ? formatPrice(roundTo50(agg.max)) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-800 dark:text-emerald-300 min-w-[8rem]">
                      {showSale ? formatPrice(saleWithMargin(agg.weightedAvg, marginReais)) : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
