/*
 * Federated and Distributed data Sharing Appliance (FDSA)
 * Copyright 2026 Alzheimer's Disease Data Initiative (ADDI)
 * Licensed under LICENSE at project root.
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Copy,
  Download,
  Banknote,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { produtosApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

// Catálogo canônico: iPhone 11 a 17 Pro Max (evita duplicatas por variações como "lac")
const CANONICAL_MODELS = [
  'iPhone 11',
  'iPhone 12',
  'iPhone 12 mini',
  'iPhone 13',
  'iPhone 13 mini',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 17',
  'iPhone 17 Plus',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
]

const STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB']

// Cores oficiais 17 Pro / 17 Pro Max
const IPHONE_17_PRO_COLORS = [
  { key: 'Laranja Cósmico', label: 'Laranja', short: 'Lar' },
  { key: 'Azul Intenso', label: 'Azul', short: 'Azul' },
  { key: 'Prateado', label: 'Prata', short: 'Prata' },
]

interface AvgRow {
  model: string
  color: string
  storage: string
  avg_price: number
  count: number
  min_price: number | null
  max_price: number | null
}

function buildLookup(averages: AvgRow[]): Map<string, AvgRow> {
  const map = new Map<string, AvgRow>()
  for (const r of averages) {
    const key = `${r.model}|${r.color}|${r.storage}`
    map.set(key, r)
  }
  return map
}

function getAvg(lookup: Map<string, AvgRow>, model: string, color: string, storage: string): AvgRow | null {
  return lookup.get(`${model}|${color}|${storage}`) || null
}

function getAvgAnyColor(averages: AvgRow[], model: string, storage: string): number | null {
  const rows = averages.filter((r) => r.model === model && r.storage === storage)
  if (rows.length === 0) return null
  const sum = rows.reduce((s, r) => s + r.avg_price * r.count, 0)
  const total = rows.reduce((s, r) => s + r.count, 0)
  return total > 0 ? sum / total : null
}

export default function PriceAveragesPage() {
  const [marginReais, setMarginReais] = useState(0)

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['price-averages'],
    queryFn: () => produtosApi.getPriceAverages(),
    staleTime: 60000,
  })

  const averages = useMemo(() => {
    const raw = (data as any)?.data ?? data
    return raw?.averages ?? []
  }, [data])
  const lookup = useMemo(() => buildLookup(averages), [averages])

  const applyMargin = (price: number) => {
    if (marginReais <= 0) return price
    return Math.round((price + marginReais) / 50) * 50
  }

  const buildRows = () => {
    const rows: { model: string; storage: string; cells: (AvgRow | null)[]; mediaGeral: number | null; is17Pro: boolean }[] = []
    for (const model of CANONICAL_MODELS) {
      const is17Pro = model === 'iPhone 17 Pro' || model === 'iPhone 17 Pro Max'
      for (const storage of STORAGES) {
        const cells = is17Pro
          ? IPHONE_17_PRO_COLORS.map((c) => getAvg(lookup, model, c.key, storage))
          : []
        const mediaGeral = getAvgAnyColor(averages, model, storage)
        const hasAny = cells.some(Boolean) || mediaGeral != null
        if (hasAny) {
          rows.push({ model, storage, cells, mediaGeral, is17Pro })
        }
      }
    }
    return rows
  }

  const displayRows = useMemo(() => buildRows(), [lookup, averages])
  const has17ProData = useMemo(() => displayRows.some((r) => r.is17Pro), [displayRows])

  const exportCsv = () => {
    const colorCols = has17ProData ? ['Laranja', 'Azul', 'Prata'] : []
    const header = ['Modelo', 'Armazenamento', ...colorCols, 'Média geral']
    const lines = [header.join(';')]
    for (const row of displayRows) {
      const cols = has17ProData && row.is17Pro
        ? row.cells.map((c) => (c ? formatPrice(applyMargin(c.avg_price)) : ''))
        : has17ProData && !row.is17Pro
          ? ['', '', '']
          : []
      const mediaVal = row.mediaGeral != null ? formatPrice(applyMargin(row.mediaGeral)) : ''
      lines.push([row.model, row.storage, ...cols, mediaVal].join(';'))
    }
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medias-iphone-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  const copyToClipboard = () => {
    const colorCols = has17ProData ? ['Laranja', 'Azul', 'Prata'] : []
    const header = ['Modelo', 'Armazenamento', ...colorCols, 'Média geral']
    const lines = [header.join('\t')]
    for (const row of displayRows) {
      const cols = has17ProData && row.is17Pro
        ? row.cells.map((c) => (c ? formatPrice(applyMargin(c.avg_price)) : '—'))
        : has17ProData && !row.is17Pro
          ? ['—', '—', '—']
          : []
      const mediaVal = row.mediaGeral != null ? formatPrice(applyMargin(row.mediaGeral)) : '—'
      lines.push([row.model, row.storage, ...cols, mediaVal].join('\t'))
    }
    const text = lines.join('\n')
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copiado! Cole no Excel ou Bloco de Notas.'),
      () => toast.error('Erro ao copiar.')
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-9 h-9 text-indigo-500 dark:text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Média de Preço
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                iPhone 11 a 17 Pro Max — Novos/Lacrados (listas processadas hoje)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                type="number"
                min={0}
                step={50}
                placeholder="0"
                value={marginReais}
                onChange={(e) => setMarginReais(Number(e.target.value) || 0)}
                className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">R$ margem</span>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300"
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Atualizar
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className={`w-full text-sm ${has17ProData ? 'min-w-[640px]' : 'min-w-[320px]'}`}>
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left py-3 px-3 font-semibold text-gray-900 dark:text-white">Modelo</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-900 dark:text-white">Armazenamento</th>
                {has17ProData && (
                  <>
                    <th className="text-left py-3 px-3 font-semibold text-orange-600 dark:text-orange-400">Laranja</th>
                    <th className="text-left py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">Azul</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-500 dark:text-gray-400">Prata</th>
                  </>
                )}
                <th className="text-left py-3 px-3 font-semibold text-gray-900 dark:text-white">Média geral</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 && !isFetching && (
                <tr>
                  <td colSpan={has17ProData ? 6 : 3} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma média disponível. Processe listas de fornecedores primeiro.
                  </td>
                </tr>
              )}
              {displayRows.map((row, i) => {
                const mediaGeral =
                  row.mediaGeral != null
                    ? applyMargin(row.mediaGeral)
                    : row.is17Pro && row.cells.some(Boolean)
                      ? Math.round(
                          row.cells
                            .filter(Boolean)
                            .reduce((s, c) => s + applyMargin(c!.avg_price), 0) /
                            row.cells.filter(Boolean).length /
                            50
                        ) * 50
                      : null
                return (
                  <tr
                    key={`${row.model}-${row.storage}-${i}`}
                    className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{row.model}</td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{row.storage}</td>
                    {has17ProData &&
                      IPHONE_17_PRO_COLORS.map((col, j) => {
                        const cell = row.is17Pro ? row.cells[j] : null
                        return (
                          <td key={col.key} className="py-3 px-3">
                            {cell ? (
                              <span className="font-medium">
                                {formatPrice(applyMargin(cell.avg_price))}
                                {cell.count > 1 && (
                                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                    (n={cell.count})
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                        )
                      })}
                    <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                      {mediaGeral != null ? formatPrice(mediaGeral) : '—'}
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
