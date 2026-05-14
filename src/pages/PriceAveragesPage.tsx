import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Copy, Download, Loader2, RefreshCw, Banknote, CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { produtosApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  IPHONE_17_PRO_MAX_COLOR_KEYS,
  IPHONE_PRICE_TABLE_ORDER,
  PM17_LABEL,
  aggregateIphone17ProMaxByStorageAndColor,
  aggregateIphoneAveragesByTableRow,
  deviceAggKey,
  listStoragesFor17PmAgg,
  listStoragesForDeviceAgg,
  pm17AggKey,
  roundTo50,
  selectionKey17ProMax,
  type IphoneTableAgg,
} from '@/lib/iphoneAveragePriceCatalog'

type DateOffset = 0 | -1 | -2

type TableLine =
  | { kind: 'device'; key: string; title: string; agg: IphoneTableAgg | undefined }
  | { kind: '17pm'; key: string; title: string; colorPart: string; agg: IphoneTableAgg | undefined }

function saleWithMargin(avg: number, marginReais: number): number {
  if (marginReais <= 0) return avg
  return roundTo50(avg + marginReais)
}

function buildTableLines(
  aggByLabelStorage: Map<string, IphoneTableAgg>,
  agg17: Map<string, IphoneTableAgg>
): TableLine[] {
  const lines: TableLine[] = []
  for (const label of IPHONE_PRICE_TABLE_ORDER) {
    if (label === PM17_LABEL) {
      const storages17 = listStoragesFor17PmAgg(agg17)
      for (const st of storages17) {
        for (const colorKey of IPHONE_17_PRO_MAX_COLOR_KEYS) {
          const k = pm17AggKey(st, colorKey)
          lines.push({
            kind: '17pm',
            key: selectionKey17ProMax(st, colorKey),
            title: `${PM17_LABEL} ${st}`,
            colorPart: colorKey,
            agg: agg17.get(k),
          })
        }
      }
    } else {
      const storages = listStoragesForDeviceAgg(aggByLabelStorage, label)
      for (const st of storages) {
        const dk = deviceAggKey(label, st)
        lines.push({
          kind: 'device',
          key: dk,
          title: `${label} ${st}`,
          agg: aggByLabelStorage.get(dk),
        })
      }
    }
  }
  return lines
}

export default function PriceAveragesPage() {
  const [dateOffset, setDateOffset] = useState<DateOffset>(0)
  const [marginReais, setMarginReais] = useState(0)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['price-averages', dateOffset],
    queryFn: () => produtosApi.getPriceAverages({ date_offset: dateOffset }),
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })

  const raw = useMemo(() => (data as any)?.data ?? data, [data])
  const averages = useMemo(() => raw?.averages ?? [], [raw])
  const dateFilter = (raw?.dateFilter ?? 'day') as 'day' | 'rolling3' | 'all'

  const aggByLabelStorage = useMemo(() => aggregateIphoneAveragesByTableRow(averages), [averages])
  const agg17 = useMemo(() => aggregateIphone17ProMaxByStorageAndColor(averages), [averages])

  const tableLines = useMemo(() => buildTableLines(aggByLabelStorage, agg17), [aggByLabelStorage, agg17])

  const dateOffsetLabel =
    dateOffset === 0 ? 'Hoje' : dateOffset === -1 ? 'Ontem' : 'Anteontem'

  const dateFilterHint =
    dateFilter === 'rolling3'
      ? 'Poucos dados no dia selecionado: médias usam os últimos 3 dias até essa data.'
      : dateFilter === 'all'
        ? 'Sem dados no período: exibindo médias com todas as datas disponíveis (lacrado).'
        : null

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const clearSelection = () => setSelectedKeys(new Set())

  const exportCsv = () => {
    const header = ['Modelo', 'Preço médio', 'Menor valor', 'Maior valor', 'Preço de venda']
    const lines = [header.join(';')]
    for (const line of tableLines) {
      const labelCol =
        line.kind === '17pm' ? `${line.title} — ${line.colorPart}` : line.title
      const agg = line.agg
      const avg = agg ? Math.round(agg.weightedAvg) : ''
      const mn = agg?.min != null ? roundTo50(agg.min) : ''
      const mx = agg?.max != null ? roundTo50(agg.max) : ''
      const sale =
        selectedKeys.has(line.key) && marginReais > 0 && agg
          ? saleWithMargin(agg.weightedAvg, marginReais)
          : ''
      lines.push(
        [
          labelCol,
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
    for (const line of tableLines) {
      const labelCol =
        line.kind === '17pm' ? `${line.title} — ${line.colorPart}` : line.title
      const agg = line.agg
      lines.push(
        [
          labelCol,
          agg ? formatPrice(Math.round(agg.weightedAvg)) : '—',
          agg?.min != null ? formatPrice(roundTo50(agg.min)) : '—',
          agg?.max != null ? formatPrice(roundTo50(agg.max)) : '—',
          selectedKeys.has(line.key) && marginReais > 0 && agg
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

  const hasAnyData = tableLines.some((r) => r.agg)

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
                  iPhone lacrado: cada linha é uma capacidade (GB/TB) com média, mínimo e máximo — cores unidas na
                  média, exceto no <strong className="text-gray-700 dark:text-gray-300">iPhone 17 Pro Max</strong>, em
                  que cada GB aparece com as três cores oficiais (Laranja Cósmico, Azul Intenso, Prateado). Marque as
                  linhas na caixa à esquerda, informe o <strong className="text-gray-700 dark:text-gray-300">Lucro
                  (R$)</strong> e o preço de venda aparece em cada linha selecionada (média + lucro, arredondado a R$
                  50). Você pode marcar várias linhas com o mesmo lucro.
                </p>
                {dateFilterHint && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">{dateFilterHint}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Banknote className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Lucro (R$)</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    placeholder="0"
                    inputMode="numeric"
                    value={marginReais === 0 ? '' : marginReais}
                    onChange={(e) => {
                      const v = e.target.value
                      setMarginReais(v === '' ? 0 : Number(v) || 0)
                    }}
                    className="w-28 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </label>
                {selectedKeys.size > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Limpar seleção ({selectedKeys.size})
                  </button>
                )}
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
            {marginReais > 0 && selectedKeys.size === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
                Marque uma ou mais linhas na tabela para ver o preço de venda.
              </p>
            )}
            {selectedKeys.size > 0 && marginReais <= 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 sm:ml-2">
                Informe o lucro em R$ acima para calcular o preço de venda nas linhas marcadas.
              </p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="w-10 py-3 px-2 text-center font-semibold text-gray-900 dark:text-white" title="Selecionar">
                  <span className="sr-only">Selecionar</span>
                </th>
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
                  <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum dado para lacrado nesse período. Processe listas de fornecedores ou troque o dia acima.
                  </td>
                </tr>
              )}
              {tableLines.map((line) => {
                const isSel = selectedKeys.has(line.key)
                const agg = line.agg
                const canSelect = Boolean(agg)
                const showSale = isSel && marginReais > 0 && agg
                const modelCell =
                  line.kind === '17pm' ? (
                    <span>
                      <span className="font-medium text-gray-900 dark:text-white">{line.title}</span>
                      <span className="text-gray-500 dark:text-gray-400"> · </span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-medium">{line.colorPart}</span>
                    </span>
                  ) : (
                    <span className="font-medium text-gray-900 dark:text-white">{line.title}</span>
                  )
                return (
                  <tr
                    key={line.key}
                    className={`border-b border-gray-100 dark:border-white/5 transition-colors ${
                      canSelect ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : 'opacity-75'
                    } ${isSel ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return
                      if (!canSelect) return
                      toggleKey(line.key)
                    }}
                    onKeyDown={(e) => {
                      if (!canSelect) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleKey(line.key)
                      }
                    }}
                    tabIndex={canSelect ? 0 : -1}
                    role={canSelect ? 'button' : undefined}
                  >
                    <td className="py-3 px-2 text-center align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-white/30 dark:bg-gray-900"
                        checked={isSel}
                        disabled={!canSelect}
                        title={canSelect ? 'Incluir no cálculo de preço de venda' : 'Sem dados nesta linha'}
                        onChange={() => {
                          if (canSelect) toggleKey(line.key)
                        }}
                      />
                    </td>
                    <td className="py-3 px-3">{modelCell}</td>
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
                      {showSale ? formatPrice(saleWithMargin(agg.weightedAvg, marginReais)) : '—'}
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
