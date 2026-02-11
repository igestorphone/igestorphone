import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar as CalendarIcon,
  User,
  FileText,
  Loader2,
  Copy,
  CalendarClock,
  Trash2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { calendarApi } from '@/lib/api'
import { mapApiEventToEvent, buildResumoPedido, type CalendarSaleEvent, type CalendarEventItem } from '@/lib/calendarStorage'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  comprou: 'Comprou',
  nao_comprou: 'Não comprou',
  reagendado: 'Reagendado',
}

const IPHONE_MODEL_OPTIONS = [
  '11', '11 Pro', '11 Pro Max', '12', '12 mini', '12 Pro', '12 Pro Max',
  '13', '13 mini', '13 Pro', '13 Pro Max', '14', '14 Plus', '14 Pro', '14 Pro Max',
  '15', '15 Plus', '15 Pro', '15 Pro Max', '16', '16 Plus', '16 Pro', '16 Pro Max', '16e',
  '17', '17 Plus', '17 Air', '17 Pro', '17 Pro Max', 'Outro',
]

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB']

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function formatDateBr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const userId = user?.id ?? ''

  const today = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(today)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarSaleEvent | null>(null)
  const [monthEvents, setMonthEvents] = useState<CalendarSaleEvent[]>([])
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarSaleEvent[]>([])
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [loadingDay, setLoadingDay] = useState(false)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const fetchMonth = useCallback(async () => {
    if (!userId) return
    setLoadingMonth(true)
    try {
      const res = await calendarApi.getByMonth(year, month + 1) as { events?: any[] }
      setMonthEvents((res.events ?? []).map(mapApiEventToEvent))
    } catch {
      toast.error('Erro ao carregar eventos do mês.')
      setMonthEvents([])
    } finally {
      setLoadingMonth(false)
    }
  }, [userId, year, month])

  const fetchDay = useCallback(async () => {
    if (!selectedDate) return
    setLoadingDay(true)
    try {
      const res = await calendarApi.getByDate(selectedDate) as { events?: any[] }
      setSelectedDayEvents((res.events ?? []).map(mapApiEventToEvent))
    } catch {
      toast.error('Erro ao carregar eventos do dia.')
      setSelectedDayEvents([])
    } finally {
      setLoadingDay(false)
    }
  }, [selectedDate])

  useEffect(() => { fetchMonth() }, [fetchMonth])
  useEffect(() => { fetchDay() }, [fetchDay])

  // Notificação única de atualização do calendário (novos recursos)
  useEffect(() => {
    const key = 'calendar_update_v1_seen'
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      toast.success('Calendário atualizado: vários produtos por pedido, cor, status, troca, reagendar e resumo para copiar no grupo novo pedido.', { duration: 5000 })
    }
  }, [])

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startPad = first.getDay()
    const daysInMonth = last.getDate()
    const total = startPad + daysInMonth
    const rows = Math.ceil(total / 7)
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - startPad + 1
      if (dayNum < 1) {
        const prev = new Date(year, month, dayNum)
        const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
        days.push({ date: dateStr, day: prev.getDate(), isCurrentMonth: false })
      } else if (dayNum > daysInMonth) {
        const next = new Date(year, month + 1, dayNum - daysInMonth)
        const dateStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
        days.push({ date: dateStr, day: next.getDate(), isCurrentMonth: false })
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        days.push({ date: dateStr, day: dayNum, isCurrentMonth: true })
      }
    }
    return days
  }, [year, month])

  const goPrevMonth = () => setViewDate(new Date(year, month - 1))
  const goNextMonth = () => setViewDate(new Date(year, month + 1))
  const goToday = () => {
    const t = new Date()
    setViewDate(t)
    setSelectedDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`)
  }

  const openNew = () => {
    setEditingEvent(null)
    setModalOpen(true)
  }

  const openEdit = (ev: CalendarSaleEvent) => {
    setEditingEvent(ev)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingEvent(null)
  }

  const refreshAfterChange = useCallback(() => {
    fetchMonth()
    fetchDay()
  }, [fetchMonth, fetchDay])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este evento de venda?')) return
    try {
      await calendarApi.delete(Number(id))
      toast.success('Evento excluído.')
      closeModal()
      refreshAfterChange()
    } catch {
      toast.error('Erro ao excluir evento.')
    }
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-600 dark:text-white/70">Faça login para usar o calendário.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h1>
          <p className="text-sm text-gray-600 dark:text-white/70 mt-0.5">
            Suas vendas agendadas — cada usuário vê e gerencia apenas seus próprios eventos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-white/90 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/15 transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova venda
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário mês */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 md:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/80 transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/80 transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-white/50 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, day, isCurrentMonth }) => {
              const count = monthEvents.filter((e) => e.date === date).length
              const isSelected = selectedDate === date
              const isToday = date === today
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`
                    min-h-[44px] md:min-h-[52px] rounded-xl text-sm font-medium transition-colors
                    ${!isCurrentMonth ? 'text-gray-400 dark:text-white/30' : 'text-gray-900 dark:text-white'}
                    ${isSelected ? 'ring-2 ring-amber-500 bg-amber-500/20 dark:bg-amber-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/10'}
                    ${isToday && !isSelected ? 'bg-amber-500/10 dark:bg-amber-500/10' : ''}
                  `}
                >
                  {day}
                  {count > 0 && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Lista do dia selecionado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 md:p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
            {selectedDate ? formatDateBr(selectedDate) : 'Selecione um dia'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-white/50 mb-4">
            Resumo do dia para quando o cliente chegar
          </p>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {!selectedDate ? (
              <p className="text-sm text-gray-500 dark:text-white/50">Clique em um dia no calendário.</p>
            ) : loadingDay ? (
              <div className="flex items-center justify-center py-8 text-gray-500 dark:text-white/50">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-white/50">Nenhuma venda neste dia.</p>
            ) : (
              selectedDayEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onEdit={() => openEdit(ev)}
                  onCopyResumo={() => {
                    const text = buildResumoPedido(ev)
                    navigator.clipboard.writeText(text).then(
                      () => toast.success('Resumo copiado para o grupo novo pedido'),
                      () => toast.error('Não foi possível copiar')
                    )
                  }}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <EventModal
            initialEvent={editingEvent}
            selectedDate={selectedDate || today}
            onClose={closeModal}
            onSaved={refreshAfterChange}
            onDelete={editingEvent ? () => handleDelete(editingEvent.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EventCard({
  event,
  onEdit,
  onCopyResumo,
}: {
  event: CalendarSaleEvent
  onEdit: () => void
  onCopyResumo: () => void
}) {
  const first = event.items[0]
  const hasMultiple = event.items.length > 1
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
              {STATUS_LABELS[event.status] ?? event.status}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              iPhone {first?.iphoneModel ?? event.iphoneModel}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/50">{first?.storage ?? event.storage}</span>
            {(first?.color ?? '').trim() && (
              <span className="text-xs text-gray-600 dark:text-white/60">• {first?.color}</span>
            )}
            {hasMultiple && (
              <span className="text-xs text-gray-500 dark:text-white/50">+ {event.items.length - 1} item(ns)</span>
            )}
          </div>
          {event.clientName && (
            <p className="text-xs text-gray-600 dark:text-white/70 mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3" />
              {event.clientName}
            </p>
          )}
          <p className="text-xs text-gray-600 dark:text-white/70 mt-1">
            IMEI ...{first?.imeiEnd ?? event.imeiEnd}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
            {formatCurrency(first?.valorAVista ?? event.valorAVista)} à vista · {formatCurrency(first?.valorComJuros ?? event.valorComJuros)} parcelado
          </p>
          <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
            {first?.formaPagamento ?? event.formaPagamento}
          </p>
        </div>
        <div className="shrink-0 flex flex-col gap-1">
          <button
            type="button"
            onClick={onCopyResumo}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-white/60 transition-colors"
            aria-label="Copiar resumo"
            title="Copiar resumo para grupo novo pedido"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-white/60 transition-colors"
            aria-label="Editar"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const defaultItem = (): CalendarEventItem => ({
  id: null,
  iphoneModel: '',
  storage: '',
  color: '',
  imeiEnd: '',
  valorAVista: 0,
  valorComJuros: 0,
  formaPagamento: 'PIX',
  valorTroca: null,
  manutencaoDescontada: null,
  tradeInModel: null,
  tradeInStorage: null,
  notes: '',
})

function EventModal({
  initialEvent,
  selectedDate,
  onClose,
  onSaved,
  onDelete,
}: {
  initialEvent: CalendarSaleEvent | null
  selectedDate: string
  onClose: () => void
  onSaved: () => void
  onDelete?: () => void
}) {
  const isEdit = !!initialEvent
  const [saving, setSaving] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [form, setForm] = useState(() => {
    if (initialEvent) {
      return {
        date: initialEvent.date,
        time: initialEvent.time || '',
        clientName: initialEvent.clientName || '',
        status: initialEvent.status || 'agendado',
        notes: initialEvent.notes || '',
        items: initialEvent.items?.length
          ? initialEvent.items.map((it) => ({
              iphoneModel: it.iphoneModel,
              storage: it.storage,
              color: it.color ?? '',
              imeiEnd: it.imeiEnd,
              valorAVista: it.valorAVista,
              valorComJuros: it.valorComJuros,
              formaPagamento: it.formaPagamento,
              valorTroca: it.valorTroca ?? null,
              manutencaoDescontada: it.manutencaoDescontada ?? null,
              tradeInModel: it.tradeInModel ?? null,
              tradeInStorage: it.tradeInStorage ?? null,
              notes: it.notes ?? '',
            }))
          : [defaultItem()],
      }
    }
    return {
      date: selectedDate,
      time: '',
      clientName: '',
      status: 'agendado' as const,
      notes: '',
      items: [{ ...defaultItem(), iphoneModel: '', storage: '', imeiEnd: '' }],
    }
  })
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, defaultItem()] }))
  }
  const removeItem = (index: number) => {
    if (form.items.length <= 1) return
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }
  const updateItem = (index: number, patch: Partial<CalendarEventItem>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = form.items.every(
      (it) => it.iphoneModel?.trim() && it.storage?.trim() && it.imeiEnd?.trim()
    )
    if (!form.date || !valid) {
      toast.error('Preencha data e, em cada item: modelo, armazenamento e final do IMEI.')
      return
    }
    if (form.items.some((it) => it.valorAVista < 0 || it.valorComJuros < 0)) {
      toast.error('Valores não podem ser negativos.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        time: form.time || undefined,
        clientName: form.clientName || undefined,
        status: form.status,
        notes: form.notes || undefined,
        items: form.items.map((it) => ({
          iphoneModel: it.iphoneModel.trim(),
          storage: it.storage.trim(),
          color: it.color?.trim() || null,
          imeiEnd: it.imeiEnd.trim(),
          valorAVista: it.valorAVista,
          valorComJuros: it.valorComJuros,
          formaPagamento: it.formaPagamento,
          valorTroca: it.valorTroca ?? null,
          manutencaoDescontada: it.manutencaoDescontada ?? null,
          tradeInModel: it.tradeInModel?.trim() || null,
          tradeInStorage: it.tradeInStorage?.trim() || null,
          notes: it.notes?.trim() || null,
        })),
      }
      if (isEdit && initialEvent) {
        await calendarApi.update(Number(initialEvent.id), payload)
        toast.success('Venda atualizada.')
      } else {
        await calendarApi.create(payload)
        toast.success('Venda registrada no calendário.')
      }
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao salvar. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const handleReschedule = async () => {
    if (!initialEvent || !rescheduleDate.trim()) {
      toast.error('Informe a nova data.')
      return
    }
    setRescheduling(true)
    try {
      await calendarApi.reschedule(Number(initialEvent.id), {
        date: rescheduleDate,
        time: rescheduleTime.trim() || undefined,
        setStatusReagendado: true,
      })
      toast.success('Evento reagendado.')
      setRescheduleDate('')
      setRescheduleTime('')
      setRescheduling(false)
      onSaved()
      setForm((f) => ({ ...f, date: rescheduleDate, time: rescheduleTime || f.time, status: 'reagendado' }))
    } catch {
      toast.error('Erro ao reagendar.')
    } finally {
      setRescheduling(false)
    }
  }

  const copyResumoFromModal = () => {
    const ev: CalendarSaleEvent = {
      id: initialEvent?.id ?? '0',
      date: form.date,
      time: form.time || undefined,
      clientName: form.clientName || undefined,
      status: form.status as CalendarSaleEvent['status'],
      notes: form.notes || undefined,
      createdAt: initialEvent?.createdAt ?? new Date().toISOString(),
      items: form.items.map((it) => ({
        id: null,
        iphoneModel: it.iphoneModel,
        storage: it.storage,
        color: it.color || null,
        imeiEnd: it.imeiEnd,
        valorAVista: it.valorAVista,
        valorComJuros: it.valorComJuros,
        formaPagamento: it.formaPagamento,
        valorTroca: it.valorTroca,
        manutencaoDescontada: it.manutencaoDescontada,
        tradeInModel: it.tradeInModel ?? null,
        tradeInStorage: it.tradeInStorage ?? null,
        notes: it.notes || undefined,
      })),
      iphoneModel: form.items[0]?.iphoneModel ?? '',
      storage: form.items[0]?.storage ?? '',
      imeiEnd: form.items[0]?.imeiEnd ?? '',
      valorAVista: form.items[0]?.valorAVista ?? 0,
      valorComJuros: form.items[0]?.valorComJuros ?? 0,
      formaPagamento: form.items[0]?.formaPagamento ?? 'PIX',
    }
    const text = buildResumoPedido(ev)
    navigator.clipboard.writeText(text).then(
      () => toast.success('Resumo copiado'),
      () => toast.error('Não foi possível copiar')
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/20"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/20 px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Editar venda' : 'Nova venda'}
          </h3>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/80"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Data</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Hora (opcional)</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Nome do cliente (opcional)</label>
            <input
              type="text"
              placeholder="Ex.: João Silva"
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CalendarSaleEvent['status'] }))}
              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Itens do pedido (produtos) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80">Produtos</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                + Adicionar produto
              </button>
            </div>
            <div className="space-y-4 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
              {form.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-white/50">Item {idx + 1}</span>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-white/50 mb-0.5">Modelo</label>
                      <select
                        value={IPHONE_MODEL_OPTIONS.includes(item.iphoneModel) ? item.iphoneModel : 'Outro'}
                        onChange={(e) => updateItem(idx, { iphoneModel: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                      >
                        {IPHONE_MODEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt === 'Outro' ? 'Outro (escrever)' : `iPhone ${opt}`}</option>
                        ))}
                      </select>
                      {(!IPHONE_MODEL_OPTIONS.includes(item.iphoneModel) || item.iphoneModel === 'Outro') && (
                        <input
                          type="text"
                          placeholder="Digite o modelo"
                          value={item.iphoneModel && item.iphoneModel !== 'Outro' ? item.iphoneModel : ''}
                          onChange={(e) => updateItem(idx, { iphoneModel: e.target.value.trim() || 'Outro' })}
                          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-white/50 mb-0.5">Armazenamento</label>
                      <select
                        value={STORAGE_OPTIONS.includes(item.storage) ? item.storage : (item.storage || '')}
                        onChange={(e) => updateItem(idx, { storage: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione</option>
                        {STORAGE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Cor (opcional)"
                      value={item.color ?? ''}
                      onChange={(e) => updateItem(idx, { color: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Final do IMEI"
                      value={item.imeiEnd}
                      onChange={(e) => updateItem(idx, { imeiEnd: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="À vista R$"
                      value={item.valorAVista || ''}
                      onChange={(e) => updateItem(idx, { valorAVista: parseFloat(e.target.value) || 0 })}
                      className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Parcelado R$"
                      value={item.valorComJuros || ''}
                      onChange={(e) => updateItem(idx, { valorComJuros: parseFloat(e.target.value) || 0 })}
                      className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="rounded-lg border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 p-2 space-y-2">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400">iPhone na troca (opcional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={IPHONE_MODEL_OPTIONS.includes(item.tradeInModel ?? '') ? (item.tradeInModel ?? '') : (item.tradeInModel ? 'Outro' : '')}
                        onChange={(e) => updateItem(idx, { tradeInModel: e.target.value || null })}
                        className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        {IPHONE_MODEL_OPTIONS.filter((o) => o !== 'Outro').map((opt) => (
                          <option key={opt} value={opt}>iPhone {opt}</option>
                        ))}
                        <option value="Outro">Outro</option>
                      </select>
                      <select
                        value={item.tradeInStorage ?? ''}
                        onChange={(e) => updateItem(idx, { tradeInStorage: e.target.value || null })}
                        className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        {STORAGE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    {(item.tradeInModel === 'Outro' || (item.tradeInModel && !IPHONE_MODEL_OPTIONS.includes(item.tradeInModel))) && (
                      <input
                        type="text"
                        placeholder="Modelo na troca (digite)"
                        value={item.tradeInModel && item.tradeInModel !== 'Outro' ? item.tradeInModel : ''}
                        onChange={(e) => updateItem(idx, { tradeInModel: e.target.value.trim() || null })}
                        className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                      />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="Valor troca R$"
                        value={item.valorTroca ?? ''}
                        onChange={(e) => updateItem(idx, { valorTroca: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="Manutenção descont. R$"
                        value={item.manutencaoDescontada ?? ''}
                        onChange={(e) => updateItem(idx, { manutencaoDescontada: e.target.value === '' ? null : parseFloat(e.target.value) })}
                        className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={item.formaPagamento}
                      onChange={(e) => updateItem(idx, { formaPagamento: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão à vista">Cartão à vista</option>
                      <option value="Cartão parcelado">Cartão parcelado</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Obs. do item (opcional)"
                    value={item.notes ?? ''}
                    onChange={(e) => updateItem(idx, { notes: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Observações gerais (opcional)</label>
            <textarea
              rows={2}
              placeholder="Algo que o atendente precise saber"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          {/* Reagendar (só ao editar) */}
          {isEdit && initialEvent && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                <CalendarClock className="w-4 h-4 text-amber-600" />
                Reagendar
              </h4>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-white/70 mb-0.5">Nova data</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-white/70 mb-0.5">Nova hora</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={rescheduling || !rescheduleDate.trim()}
                  className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {rescheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Reagendar
                </button>
              </div>
            </div>
          )}

          {/* Copiar resumo (grupo novo pedido) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyResumoFromModal}
              className="inline-flex items-center gap-2 py-2 px-3 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copiar resumo (grupo novo pedido)
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/80 font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Salvar' : 'Registrar venda'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
