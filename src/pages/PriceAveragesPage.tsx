import { useMemo, useState, useEffect, useRef, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BarChart3,
  Smartphone,
  Download,
  Palette,
  Loader2,
  Package,
  Info,
  RefreshCw,
  TrendingUp
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

const formatPriceExact = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)

const roundTo50 = (v: number) => Math.round(v / 50) * 50

/** Normaliza nome do modelo no frontend: remove LI, Pons, L I, etc. (igual backend) para exibição e agrupamento. */
function normalizeModelForDisplay(model: string): string {
  if (!model || !model.trim()) return model || '—'
  let s = model
    .replace(/\s+L\s*I\s*/gi, ' ')
    .replace(/\s+LI\s*/gi, ' ')
    .replace(/\s+Pons\s*/gi, ' ')
  return s.replace(/\s+/g, ' ').trim() || '—'
}

export default function PriceAveragesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [sortBy, setSortBy] = useState<'model' | 'price-asc' | 'price-desc' | 'count'>('model')
  const [lucroInput, setLucroInput] = useState<number>(0)
  /** Margem aplicada por modelo (rowKey -> valor em R$). Aplicar só atualiza os selecionados, mantém os demais. */
  const [appliedLucroPerRow, setAppliedLucroPerRow] = useState<Record<string, number>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const rowKey = (row: { model?: string; color?: string; storage?: string }) =>
    `${(row.model || '').trim()}|${normalizeColor(row.color || '', row.model || '')}|${(row.storage || '').trim()}`
  const selectAllRef = useRef<HTMLInputElement>(null)

  const isModelWithOfficialColors = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim()
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)
    return (
      (searchLower.includes('iphone') && searchWords.includes('17') && !searchWords.includes('pro') && !searchWords.includes('max') && !searchWords.includes('plus') && !searchWords.includes('air')) ||
      searchLower.includes('16 pro') || searchLower.includes('16 pro max') ||
      searchLower.includes('17 pro') || searchLower.includes('17 pro max')
    )
  }, [searchTerm])

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['products', 'price-averages', searchTerm, selectedColor, selectedStorage],
    queryFn: async () => {
      const filterColorClientSide = isModelWithOfficialColors && !!selectedColor
      const res = await produtosApi.getPriceAverages({
        search: searchTerm.trim() || undefined,
        color: filterColorClientSide ? undefined : (selectedColor || undefined),
        storage: selectedStorage || undefined
      })
      return Array.isArray((res as any)?.averages) ? (res as any) : { averages: [] }
    },
    staleTime: 45 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true
  })

  // Deduplica e normaliza modelo (remove LI, Pons, etc.) para que "iPhone 17 Pro Max LI" e "iPhone 17 Pro Max" virem um só
  const averages = useMemo(() => {
    const raw = Array.isArray(data?.averages) ? data.averages : []
    let list = raw
    if (isModelWithOfficialColors && selectedColor) {
      list = raw.filter((r) => normalizeColor(r.color, r.model || '') === selectedColor)
    }
    const key = (r: (typeof raw)[0]) => {
      const modelNorm = normalizeModelForDisplay(r.model || '')
      return `${modelNorm}|${normalizeColor(r.color, r.model || '')}|${(r.storage || '').trim()}`
    }
    const byKey = new Map<string, { model: string; color: string; storage: string; avg_price: number; count: number; min_price: number | null; max_price: number | null }>()
    for (const r of list) {
      const k = key(r)
      const existing = byKey.get(k)
      const count = Number(r.count) || 0
      const avg = Number(r.avg_price) || 0
      const minP = r.min_price != null ? Number(r.min_price) : null
      const maxP = r.max_price != null ? Number(r.max_price) : null
      const modelDisplay = normalizeModelForDisplay(r.model || '')
      if (!existing) {
        byKey.set(k, {
          model: modelDisplay,
          color: r.color || '—',
          storage: r.storage || '—',
          avg_price: avg,
          count,
          min_price: minP,
          max_price: maxP
        })
      } else {
        const totalCount = existing.count + count
        const weightedAvg = totalCount > 0 ? (existing.avg_price * existing.count + avg * count) / totalCount : existing.avg_price
        existing.avg_price = weightedAvg
        existing.count += count
        if (minP != null) existing.min_price = existing.min_price != null ? Math.min(existing.min_price, minP) : minP
        if (maxP != null) existing.max_price = existing.max_price != null ? Math.max(existing.max_price, maxP) : maxP
      }
    }
    return Array.from(byKey.values())
  }, [data?.averages, isModelWithOfficialColors, selectedColor])

  type Row = { model: string; color: string; storage: string; avg_price: number; count: number; min_price: number | null; max_price: number | null }
  const storageNum = (s: string) => parseInt((s || '').replace(/\D/g, ''), 10) || 0

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

  /** Ordem de cores por modelo (igual Buscar iPhone Novo): 17 Pro, 16 Pro, 17. */
  const colorOrderForModel = (model: string): string[] | null => {
    const m = (model || '').toLowerCase()
    if (m.includes('17 pro')) return ['Azul Intenso', 'Laranja Cósmico', 'Prateado']
    if (m.includes('16 pro')) return ['Titânio Deserto', 'Titânio Natural', 'Titânio Branco', 'Titânio Preto']
    if (m.includes('17') && !m.includes('pro') && !m.includes('max') && !m.includes('plus') && !m.includes('air'))
      return ['Preto', 'Branco', 'Mist Blue', 'Lavanda', 'Sage']
    return null
  }

  /** Agrupa por modelo + capacidade; ordena cores dentro do grupo como no Buscar iPhone Novo */
  const sortedGrouped = useMemo(() => {
    const list = [...averages].sort((a, b) => {
      const c = (a.model || '').localeCompare(b.model || '', 'pt-BR')
      if (c !== 0) return c
      const d = storageNum(a.storage) - storageNum(b.storage)
      if (d !== 0) return d
      const order = colorOrderForModel(a.model || '')
      const colorA = normalizeColor(a.color, a.model || '')
      const colorB = normalizeColor(b.color, b.model || '')
      if (order) {
        const iA = order.indexOf(colorA)
        const iB = order.indexOf(colorB)
        if (iA !== -1 && iB !== -1) return iA - iB
        if (iA !== -1) return -1
        if (iB !== -1) return 1
      }
      return colorA.localeCompare(colorB, 'pt-BR')
    })
    const groups: { groupLabel: string; rows: Row[] }[] = []
    let current: { groupLabel: string; rows: Row[] } | null = null
    for (const r of list) {
      const label = `${(r.model || '').trim()} ${(r.storage || '').trim()}`.trim() || '—'
      if (!current || current.groupLabel !== label) {
        current = { groupLabel: label, rows: [] }
        groups.push(current)
      }
      current.rows.push(r)
    }
    return groups
  }, [averages])

  useEffect(() => {
    const el = selectAllRef.current
    if (!el) return
    el.indeterminate = sorted.length > 0 && selectedKeys.size > 0 && selectedKeys.size < sorted.length
  }, [sorted.length, selectedKeys.size])

  const uniqueColors = useMemo(() => {
    const set = new Set<string>()
    averages.forEach((r) => {
      if (r.color && r.color !== '—') {
        const normalized = normalizeColor(r.color, r.model || '')
        if (normalized && normalized !== 'N/A') set.add(normalized)
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [averages])

  // Cores do modelo (igual Buscar iPhone lacrado): só as oficiais do modelo digitado
  const filterColors = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim()
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)
    const isIPhone17Exact = searchLower.includes('iphone') && searchWords.includes('17') && !searchWords.includes('pro') && !searchWords.includes('max') && !searchWords.includes('plus') && !searchWords.includes('air')
    const isIPhone16Pro = searchLower.includes('iphone') && (searchLower.includes('16 pro') || searchLower.includes('16 pro max'))
    const isIPhone17Pro = searchLower.includes('iphone') && (searchLower.includes('17 pro') || searchLower.includes('17 pro max'))

    const iPhone17Official = ['Preto', 'Branco', 'Mist Blue', 'Lavanda', 'Sage']
    const iPhone17ProOfficial = ['Azul Intenso', 'Laranja Cósmico', 'Prateado']
    const iPhone16ProOfficial = ['Titânio Deserto', 'Titânio Natural', 'Titânio Branco', 'Titânio Preto']

    let officialSet: string[] | null = null
    let order: string[] | null = null
    if (isIPhone17Pro) {
      officialSet = iPhone17ProOfficial
      order = iPhone17ProOfficial
    } else if (isIPhone16Pro) {
      officialSet = iPhone16ProOfficial
      order = iPhone16ProOfficial
    } else if (isIPhone17Exact) {
      officialSet = iPhone17Official
      order = iPhone17Official
    }

    if (officialSet && order) {
      const allowed = new Set(officialSet)
      const filtered = uniqueColors.filter((c) => allowed.has(c))
      return filtered.sort((a, b) => {
        const i = order!.indexOf(a)
        const j = order!.indexOf(b)
        if (i !== -1 && j !== -1) return i - j
        if (i !== -1) return -1
        if (j !== -1) return 1
        return a.localeCompare(b, 'pt-BR')
      })
    }
    return uniqueColors
  }, [searchTerm, uniqueColors])

  useEffect(() => {
    if (selectedColor && filterColors.length > 0 && !filterColors.includes(selectedColor)) {
      setSelectedColor('')
    }
  }, [filterColors, selectedColor])

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
    const headers = ['Modelo + Capacidade', 'Cor', 'Média', 'Preço sugerido (média + lucro)', 'Qtd', 'Mín', 'Máx']
    const rows: (string | number)[][] = []
    for (const g of sortedGrouped) {
      for (const r of g.rows) {
        const lucro = appliedLucroPerRow[rowKey(r)]
        rows.push([
          g.groupLabel,
          r.color && r.color !== '—' ? normalizeColor(r.color, r.model || '') : '—',
          r.avg_price.toFixed(2),
          lucro != null ? roundTo50(r.avg_price + lucro) : '',
          r.count,
          r.min_price ?? '',
          r.max_price ?? ''
        ])
      }
    }
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
          Escolha o <strong>modelo</strong>, a <strong>cor</strong> e a <strong>capacidade</strong>. A <strong>média</strong> é exata. Informe o <strong>Lucro (R$)</strong>, marque os modelos desejados (ou use &quot;Todos&quot;) e clique em <strong>Aplicar</strong> para ver o preço sugerido (média + lucro em R$ 50). Só iPhones novos (hoje/ontem).
        </p>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm"
      >
        <div className="flex flex-col gap-5">
          {/* Linha de filtros: mesmo alinhamento para todos os campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div className="lg:col-span-2 flex flex-col">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <Search className="w-4 h-4 inline mr-1 align-middle" />
                Modelo
              </label>
              <input
                type="text"
                placeholder="Ex.: iPhone 17 Pro Max"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <Palette className="w-4 h-4 inline mr-1 align-middle" />
                Cor
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              >
                <option value="">Todas</option>
                {filterColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                <Package className="w-4 h-4 inline mr-1 align-middle" />
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
          {/* Lucro (margem), seleção e ações */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <TrendingUp className="w-4 h-4 inline mr-1.5 align-middle text-emerald-500" />
                Lucro (R$)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={lucroInput || ''}
                onChange={(e) => setLucroInput(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-28 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            {sorted.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const keysToApply = sorted.length === 1 ? [rowKey(sorted[0])] : Array.from(selectedKeys)
                    setAppliedLucroPerRow((prev) => {
                      const next = { ...prev }
                      keysToApply.forEach((k) => (next[k] = lucroInput))
                      return next
                    })
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Aplicar
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedKeys.size} modelo{selectedKeys.size !== 1 ? 's' : ''} selecionado{selectedKeys.size !== 1 ? 's' : ''}
                </span>
              </>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 min-w-[180px]"
            >
              <option value="model">Ordenar por modelo</option>
              <option value="price-asc">Preço: menor</option>
              <option value="price-desc">Preço: maior</option>
              <option value="count">Quantidade</option>
            </select>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            {sorted.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 dark:bg-white text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
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
                          Média de preço (sem arredondamento)
                        </span>
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPriceExact(sorted[0].avg_price)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {sorted[0].count} oferta{sorted[0].count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <TrendingUp className="w-4 h-4 inline mr-1.5 align-middle text-emerald-500" />
                            Lucro (R$)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={50}
                            value={lucroInput || ''}
                            onChange={(e) => setLucroInput(Number(e.target.value) || 0)}
                            placeholder="0"
                            className="w-28 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const key = rowKey(sorted[0])
                            setAppliedLucroPerRow((prev) => ({ ...prev, [key]: lucroInput }))
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                        >
                          Aplicar
                        </button>
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-6 py-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Preço sugerido (média + lucro, R$ 50)</span>
                          <span className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(roundTo50(sorted[0].avg_price + (appliedLucroPerRow[rowKey(sorted[0])] ?? 0)))}
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Menor: <strong className="text-gray-900 dark:text-white">{sorted[0].min_price != null ? formatPrice(sorted[0].min_price) : '—'}</strong>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Maior: <strong className="text-gray-900 dark:text-white">{sorted[0].max_price != null ? formatPrice(sorted[0].max_price) : '—'}</strong>
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
                            <th className="pl-3 pr-2 py-3 w-10">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  ref={selectAllRef}
                                  checked={sorted.length > 0 && sorted.every((r) => selectedKeys.has(rowKey(r)))}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedKeys(new Set(sorted.map((r) => rowKey(r))))
                                    else setSelectedKeys(new Set())
                                  }}
                                  className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="hidden sm:inline">Todos</span>
                              </label>
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px]">
                              Modelo + Capacidade
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Cor
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                              Média
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
                          {sortedGrouped.map((group, gi) => (
                            <Fragment key={`group-${gi}`}>
                              <tr
                                className="bg-gray-100 dark:bg-gray-900/80 border-b border-gray-200 dark:border-white/10"
                              >
                                <td className="pl-3 pr-2 py-2 w-10 align-middle">
                                  <label className="cursor-pointer flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={group.rows.every((r) => selectedKeys.has(rowKey(r)))}
                                      onChange={(e) => {
                                        const keys = group.rows.map((r) => rowKey(r))
                                        setSelectedKeys((prev) => {
                                          const next = new Set(prev)
                                          if (e.target.checked) keys.forEach((k) => next.add(k))
                                          else keys.forEach((k) => next.delete(k))
                                          return next
                                        })
                                      }}
                                      className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                                    />
                                  </label>
                                </td>
                                <td colSpan={7} className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white align-middle">
                                  {group.groupLabel}
                                </td>
                              </tr>
                              {group.rows.map((row, i) => (
                                <motion.tr
                                  key={rowKey(row)}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: (gi * 10 + i) * 0.02 }}
                                  className="hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                  <td className="pl-3 pr-2 py-3 w-10">
                                    <label className="cursor-pointer flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedKeys.has(rowKey(row))}
                                        onChange={() => {
                                          const key = rowKey(row)
                                          setSelectedKeys((prev) => {
                                            const next = new Set(prev)
                                            if (next.has(key)) next.delete(key)
                                            else next.add(key)
                                            return next
                                          })
                                        }}
                                        className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                                      />
                                    </label>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm min-w-[160px]">
                                    <span className="invisible select-none">—</span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 min-w-[120px]">
                                    {row.color && row.color !== '—'
                                      ? normalizeColor(row.color, row.model || '')
                                      : '—'}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                    {formatPriceExact(row.avg_price)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                    {(() => {
                                      const lucro = appliedLucroPerRow[rowKey(row)]
                                      return lucro != null ? formatPrice(roundTo50(row.avg_price + lucro)) : '—'
                                    })()}
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
                            </Fragment>
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
                  Digite o modelo, cor e capacidade. A <strong>média</strong> é exata. Defina o <strong>Lucro (R$)</strong>, marque os modelos que deseja (ou &quot;Todos&quot;) e clique em <strong>Aplicar</strong> para ver o preço sugerido em R$ 50. Cores iguais ao Buscar iPhone lacrado.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
