import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Globe2, Search, X } from 'lucide-react'
import { REGION_OPTIONS, type RegionOptionId, regionOptionById } from '@/lib/productRegions'

type RegionFilterDropdownProps = {
  selected: RegionOptionId[]
  onChange: (next: RegionOptionId[]) => void
  /** Só mostra opções que existem no estoque atual (se vazio, mostra todas). */
  availableIds?: RegionOptionId[]
  className?: string
}

export default function RegionFilterDropdown({
  selected,
  onChange,
  availableIds,
  className = '',
}: RegionFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => {
    const base =
      availableIds && availableIds.length > 0
        ? REGION_OPTIONS.filter((o) => availableIds.includes(o.id))
        : REGION_OPTIONS
    const query = q.trim().toLowerCase()
    if (!query) return base
    return base.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.shortLabel.toLowerCase().includes(query) ||
        o.id.includes(query.replace(/\s+/g, '_'))
    )
  }, [availableIds, q])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const allIds = options.map((o) => o.id)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id))

  const toggle = (id: RegionOptionId) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id))
    else onChange([...selected, id])
  }

  const toggleAll = () => {
    if (allSelected) onChange(selected.filter((id) => !allIds.includes(id)))
    else {
      const set = new Set([...selected, ...allIds])
      onChange([...set] as RegionOptionId[])
    }
  }

  const buttonLabel = (() => {
    if (!selected.length) return 'Todas as regiões'
    if (selected.length === 1) return regionOptionById(selected[0])?.shortLabel || '1 região'
    return `${selected.length} regiões`
  })()

  return (
    <div className={`relative min-w-0 ${className}`} ref={rootRef}>
      <label className="mb-1.5 xl:mb-2 flex min-w-0 items-center text-[10px] font-medium text-gray-700 dark:text-gray-300 xl:text-xs">
        <Globe2 className="mr-1 h-3 w-3 shrink-0 xl:h-4 xl:w-4" />
        <span className="truncate">Regiões</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[2.5rem] w-full items-center justify-between gap-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-left text-xs font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-gray-900 dark:text-white xl:min-h-0 xl:gap-2 xl:px-3 xl:py-2.5 xl:text-sm"
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500 xl:h-4 xl:w-4" />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-white/10">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Regiões</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-gray-100 p-3 dark:border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-black dark:text-white"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded border ${
                  allSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 dark:border-white/25'
                }`}
              >
                {allSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              </span>
              Selecionar Tudo
            </button>
            <div className="mx-3 border-t border-gray-100 dark:border-white/10" />
            {options.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-500">Nenhuma região</p>
            ) : (
              options.map((opt) => {
                const on = selected.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 ${
                      on ? 'bg-gray-50 dark:bg-white/5' : ''
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        on
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 dark:border-white/25'
                      }`}
                    >
                      {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{opt.label}</span>
                  </button>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2.5 dark:border-white/10">
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
