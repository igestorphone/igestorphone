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
import { mapApiEventToEvent, buildResumoPedido, type CalendarSaleEvent, type CalendarEventItem, type TradeInDevice } from '@/lib/calendarStorage'
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

const PAYMENT_OPTIONS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'Cartão à vista', label: 'Cartão à vista' },
  { value: 'Cartão parcelado', label: 'Cartão parcelado' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Outro', label: 'Outro' },
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function ensureAtLeastOneTradeIn(devices: TradeInDevice[] | undefined): TradeInDevice[] {
  const list = Array.isArray(devices) && devices.length ? devices.map((d) => ({ ...d, obs: d.obs ?? '' })) : []
  return list.length ? list : [{ model: '', storage: '', condicao: undefined, obs: '' }]
}

function formatDateBr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

/** Garante YYYY-MM-DD para input type="date" (API pode vir como ISO ou Date). */
function normalizeDateForInput(date: string | undefined): string {
  if (!date) return ''
  const s = typeof date === 'string' ? date : (date as unknown as Date).toISOString?.() ?? String(date)
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})T/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  return ''
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
    <div className="max-w-6xl mx-auto p-4 md:p-6">
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

      {/* Calendário maior - ocupa toda a largura */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className={`relative bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-5 md:p-6 shadow-sm mb-6 ${loadingMonth ? 'opacity-70 pointer-events-none' : ''}`}
      >
        {loadingMonth && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50 dark:bg-black/30 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrevMonth}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/80 transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/80 transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-3 text-center text-sm font-medium text-gray-500 dark:text-white/50 mb-3">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 md:gap-3">
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
                  min-h-[52px] sm:min-h-[60px] md:min-h-[72px] lg:min-h-[80px] rounded-xl text-base font-medium transition-colors
                  ${!isCurrentMonth ? 'text-gray-400 dark:text-white/30' : 'text-gray-900 dark:text-white'}
                  ${isSelected ? 'ring-2 ring-amber-500 bg-amber-500/20 dark:bg-amber-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/10'}
                  ${isToday && !isSelected ? 'bg-amber-500/10 dark:bg-amber-500/10' : ''}
                `}
              >
                {day}
                {count > 0 && (
                  <span className="block w-2.5 h-2.5 rounded-full bg-green-500 mx-auto mt-1 shadow-sm" title={`${count} agendamento(s)`} />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Agendamentos do dia - em horizontal abaixo do calendário */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 md:p-5 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-500 shrink-0" />
          {selectedDate ? formatDateBr(selectedDate) : 'Selecione um dia'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-white/50 mb-4">
          Resumo do dia para quando o cliente chegar — arraste para ver mais
        </p>
        {!selectedDate ? (
          <p className="text-sm text-gray-500 dark:text-white/50 py-6 text-center">Clique em um dia no calendário.</p>
        ) : loadingDay ? (
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-white/50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : selectedDayEvents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-white/50 py-6 text-center">Nenhuma venda neste dia.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar" style={{ scrollSnapType: 'x proximity' }}>
            {[...selectedDayEvents]
              .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
              .map((ev) => (
                <div key={ev.id} className="shrink-0 w-[280px] min-w-[280px] md:w-[300px] md:min-w-[300px]" style={{ scrollSnapAlign: 'start' }}>
                  <EventCard
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
                </div>
              ))}
          </div>
        )}
      </motion.div>

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
  const statusStyle =
    event.status === 'comprou'
      ? 'border-green-500/30 bg-green-50/80 dark:bg-green-900/20 hover:bg-green-100/80 dark:hover:bg-green-900/30'
      : event.status === 'nao_comprou'
        ? 'border-red-500/30 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/30'
        : 'border-gray-200 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10'
  const statusBadgeStyle =
    event.status === 'comprou'
      ? 'bg-green-100 text-green-800 dark:bg-green-500/30 dark:text-green-300'
      : event.status === 'nao_comprou'
        ? 'bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-red-300'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl border transition-colors h-full flex flex-col ${statusStyle}`}
    >
      {event.time && (
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">{event.time}</p>
      )}
      <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusBadgeStyle}`}>
              {STATUS_LABELS[event.status] ?? event.status}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              iPhone {first?.iphoneModel ?? event.iphoneModel}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/50 shrink-0">{first?.storage ?? event.storage}</span>
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

const CONDICAO_OPTIONS = [
  { value: '', label: 'Condição' },
  { value: 'novo', label: 'Novo' },
  { value: 'seminovo', label: 'Seminovo' },
]

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
  tradeInDevices: [{ model: '', storage: '', condicao: undefined, obs: '' }],
  parcelas: null,
  valorSinal: null,
  condicao: null,
  origemProduto: 'estoque',
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
  type FormState = { date: string; time: string; clientName: string; status: CalendarSaleEvent['status']; notes: string; items: CalendarEventItem[] }
  const [form, setForm] = useState<FormState>(() => {
    if (initialEvent) {
      const dateValue = normalizeDateForInput(initialEvent.date) || selectedDate
      return {
        date: dateValue,
        time: initialEvent.time || '',
        clientName: initialEvent.clientName || '',
        status: initialEvent.status || 'agendado',
        notes: initialEvent.notes || '',
        items: initialEvent.items?.length
          ? initialEvent.items.map((it): CalendarEventItem => ({
              id: it.id ?? null,
              event_id: it.event_id,
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
              tradeInDevices: ensureAtLeastOneTradeIn(it.tradeInDevices ?? (it.tradeInModel || it.tradeInStorage ? [{ model: it.tradeInModel ?? '', storage: it.tradeInStorage ?? '' }] : [])),
              parcelas: it.parcelas ?? null,
              valorSinal: it.valorSinal ?? null,
              condicao: it.condicao ?? null,
              origemProduto: it.origemProduto ?? 'estoque',
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
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } as CalendarEventItem : it)),
    }))
  }
  const addTradeInDevice = (itemIdx: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === itemIdx
          ? { ...it, tradeInDevices: [...(it.tradeInDevices ?? []), { model: '', storage: '', condicao: undefined, obs: '' }] } as CalendarEventItem
          : it
      ),
    }))
  }
  const removeTradeInDevice = (itemIdx: number, trocaIdx: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => {
        if (i !== itemIdx) return it
        const list = [...(it.tradeInDevices ?? [])]
        if (list.length <= 1) return it
        return { ...it, tradeInDevices: list.filter((_, ti) => ti !== trocaIdx) } as CalendarEventItem
      }),
    }))
  }
  const updateTradeInDevice = (itemIdx: number, trocaIdx: number, patch: Partial<TradeInDevice>) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => {
        if (i !== itemIdx) return it
        const list = [...(it.tradeInDevices ?? [])]
        if (!list[trocaIdx]) return it
        list[trocaIdx] = { ...list[trocaIdx], ...patch }
        return { ...it, tradeInDevices: list } as CalendarEventItem
      }),
    }))
  }
  const togglePaymentOption = (itemIdx: number, option: string) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => {
        if (i !== itemIdx) return it
        const current = (it.formaPagamento || '').split(',').map((s) => s.trim()).filter(Boolean)
        const has = current.includes(option)
        const next = has ? current.filter((x) => x !== option) : [...current, option]
        return { ...it, formaPagamento: next.length ? next.join(', ') : 'PIX' } as CalendarEventItem
      }),
    }))
  }
  const hasPaymentOption = (item: CalendarEventItem, option: string) =>
    (item.formaPagamento || '').split(',').map((s) => s.trim()).includes(option)

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
        items: form.items.map((it) => {
          let formaPagamento = it.formaPagamento || 'PIX'
          if (it.valorSinal != null) {
            const parts = formaPagamento.split(',').map((s) => s.trim()).filter(Boolean)
            if (!parts.includes('Sinal')) parts.push('Sinal')
            formaPagamento = parts.join(', ')
          }
          return {
          iphoneModel: it.iphoneModel.trim(),
          storage: it.storage.trim(),
          color: it.color?.trim() || null,
          imeiEnd: it.imeiEnd.trim(),
          valorAVista: it.valorAVista,
          valorComJuros: it.valorComJuros,
          formaPagamento,
          valorTroca: it.valorTroca ?? null,
          manutencaoDescontada: it.manutencaoDescontada ?? null,
          tradeInModel: (it.tradeInDevices?.[0]?.model ?? it.tradeInModel)?.trim() || null,
          tradeInStorage: (it.tradeInDevices?.[0]?.storage ?? it.tradeInStorage)?.trim() || null,
          trocaAparelhos: it.tradeInDevices?.filter((d) => (d.model?.trim() || d.storage?.trim()))?.map((d) => ({ model: d.model?.trim() ?? '', storage: d.storage?.trim() ?? '', condicao: d.condicao ?? null, obs: d.obs?.trim() || null })) ?? null,
          parcelas: it.parcelas ?? null,
          valorSinal: it.valorSinal ?? null,
          condicao: (it.condicao === 'novo' || it.condicao === 'seminovo') ? it.condicao : null,
          origemProduto: (it.origemProduto === 'estoque' || it.origemProduto === 'fornecedor') ? it.origemProduto : null,
          notes: it.notes?.trim() || null,
        }
        }),
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
        tradeInDevices: it.tradeInDevices ?? [],
        parcelas: it.parcelas ?? null,
        valorSinal: it.valorSinal ?? null,
        origemProduto: it.origemProduto ?? null,
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
        className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/20"
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
                value={normalizeDateForInput(form.date) || form.date}
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
            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {form.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 space-y-2">
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
                  <div className="rounded-lg border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 p-2.5">
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-2">Origem do produto</label>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 cursor-pointer transition-colors has-[:checked]:border-amber-500 has-[:checked]:bg-gray-100 has-[:checked]:text-gray-900 dark:has-[:checked]:bg-amber-500/10 dark:has-[:checked]:text-white border-gray-200 dark:border-white/20 text-gray-600 dark:text-white/80">
                        <input
                          type="radio"
                          name={`origem-${idx}`}
                          checked={(item.origemProduto ?? 'estoque') === 'estoque'}
                          onChange={() => updateItem(idx, { origemProduto: 'estoque' })}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">Estoque</span>
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 cursor-pointer transition-colors has-[:checked]:border-amber-500 has-[:checked]:bg-gray-100 has-[:checked]:text-gray-900 dark:has-[:checked]:bg-amber-500/10 dark:has-[:checked]:text-white border-gray-200 dark:border-white/20 text-gray-600 dark:text-white/80">
                        <input
                          type="radio"
                          name={`origem-${idx}`}
                          checked={(item.origemProduto ?? 'estoque') === 'fornecedor'}
                          onChange={() => updateItem(idx, { origemProduto: 'fornecedor' })}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">Comprar no fornecedor</span>
                      </label>
                    </div>
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
                          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
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
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Cor (opcional)"
                      value={item.color ?? ''}
                      onChange={(e) => updateItem(idx, { color: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                    />
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-white/50 mb-0.5">Condição</label>
                      <select
                        value={item.condicao ?? ''}
                        onChange={(e) => updateItem(idx, { condicao: e.target.value === 'novo' || e.target.value === 'seminovo' ? e.target.value : null })}
                        className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                      >
                        {CONDICAO_OPTIONS.map((opt) => (
                          <option key={opt.value || 'vazio'} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Final do IMEI"
                      value={item.imeiEnd}
                      onChange={(e) => updateItem(idx, { imeiEnd: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
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
                      className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Parcelado R$"
                      value={item.valorComJuros || ''}
                      onChange={(e) => updateItem(idx, { valorComJuros: parseFloat(e.target.value) || 0 })}
                      className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 p-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-white/70 mb-2">Sinal?</p>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`sinal-${idx}`}
                          checked={item.valorSinal == null}
                          onChange={() => updateItem(idx, { valorSinal: null })}
                          className="border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm">Não</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`sinal-${idx}`}
                          checked={item.valorSinal != null}
                          onChange={() => updateItem(idx, { valorSinal: item.valorSinal ?? 0 })}
                          className="border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm">Sim</span>
                      </label>
                      {item.valorSinal != null && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-500 dark:text-white/50">R$</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.valorSinal ?? ''}
                            onChange={(e) => updateItem(idx, { valorSinal: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                            className="w-24 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-amber-500/20 bg-gray-50 dark:bg-amber-500/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Aparelhos na troca</p>
                      <button
                        type="button"
                        onClick={() => addTradeInDevice(idx)}
                        className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      >
                        + Adicionar aparelho
                      </button>
                    </div>
                    {ensureAtLeastOneTradeIn(item.tradeInDevices).map((troca, ti) => (
                      <div key={ti} className="rounded-lg bg-white dark:bg-black/20 p-4 space-y-3 border border-gray-200 dark:border-amber-500/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-500">
                            Aparelho na troca {ti + 1}
                          </span>
                          {(item.tradeInDevices?.length ?? 1) > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTradeInDevice(idx, ti)}
                              className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                              aria-label="Remover aparelho"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-white/50 mb-1">Modelo</label>
                            <select
                              value={IPHONE_MODEL_OPTIONS.includes(troca.model) ? troca.model : (troca.model ? 'Outro' : '')}
                              onChange={(e) => updateTradeInDevice(idx, ti, { model: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-2 text-sm text-gray-900 dark:text-white"
                            >
                              <option value="">Selecione</option>
                              {IPHONE_MODEL_OPTIONS.filter((o) => o !== 'Outro').map((opt) => (
                                <option key={opt} value={opt}>iPhone {opt}</option>
                              ))}
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-white/50 mb-1">Armazenamento</label>
                            <select
                              value={troca.storage}
                              onChange={(e) => updateTradeInDevice(idx, ti, { storage: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-2 text-sm text-gray-900 dark:text-white"
                            >
                              <option value="">—</option>
                              {STORAGE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-white/50 mb-1">Condição</label>
                            <select
                              value={troca.condicao ?? ''}
                              onChange={(e) => updateTradeInDevice(idx, ti, { condicao: e.target.value === 'novo' || e.target.value === 'seminovo' ? e.target.value : undefined })}
                              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-2 text-sm text-gray-900 dark:text-white"
                            >
                              <option value="">—</option>
                              <option value="novo">Novo</option>
                              <option value="seminovo">Seminovo</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-white/50 mb-1">Obs. sobre este aparelho (opcional)</label>
                          <input
                            type="text"
                            placeholder="Ex.: tela rachada, bateria 85%..."
                            value={troca.obs ?? ''}
                            onChange={(e) => updateTradeInDevice(idx, ti, { obs: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-2 text-sm text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-amber-500/20">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-white/50 mb-1">Valor da troca (R$)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0,00"
                          value={item.valorTroca ?? ''}
                          onChange={(e) => updateItem(idx, { valorTroca: e.target.value === '' ? null : parseFloat(e.target.value) })}
                          className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-2 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-white/50 mb-1">Manutenção descontada (R$)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0,00"
                          value={item.manutencaoDescontada ?? ''}
                          onChange={(e) => updateItem(idx, { manutencaoDescontada: e.target.value === '' ? null : parseFloat(e.target.value) })}
                          className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-2 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-white/70">Forma de pagamento</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const selected = hasPaymentOption(item, opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => togglePaymentOption(idx, opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/15'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    {hasPaymentOption(item, 'Cartão parcelado') && (
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-xs text-gray-500 dark:text-white/50">Parcelas</label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          placeholder="Nº"
                          value={item.parcelas ?? ''}
                          onChange={(e) => updateItem(idx, { parcelas: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                          className="w-16 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Obs. do item (opcional)"
                    value={item.notes ?? ''}
                    onChange={(e) => updateItem(idx, { notes: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
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
            <div className="p-3 rounded-xl border border-gray-200 dark:border-amber-500/30 bg-gray-50 dark:bg-amber-500/10">
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
                    className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-white/70 mb-0.5">Nova hora</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
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
