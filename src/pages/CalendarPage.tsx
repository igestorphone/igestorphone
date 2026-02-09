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
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { calendarApi } from '@/lib/api'
import { mapApiEventToEvent, type CalendarSaleEvent } from '@/lib/calendarStorage'
import toast from 'react-hot-toast'

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
                <EventCard key={ev.id} event={ev} onEdit={() => openEdit(ev)} />
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
}: {
  event: CalendarSaleEvent
  onEdit: () => void
}) {
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
            <span className="font-semibold text-gray-900 dark:text-white">
              iPhone {event.iphoneModel}
            </span>
            <span className="text-xs text-gray-500 dark:text-white/50">{event.storage}</span>
          </div>
          {event.clientName && (
            <p className="text-xs text-gray-600 dark:text-white/70 mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3" />
              {event.clientName}
            </p>
          )}
          <p className="text-xs text-gray-600 dark:text-white/70 mt-1">
            IMEI ...{event.imeiEnd}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
            {formatCurrency(event.valorAVista)} à vista · {formatCurrency(event.valorComJuros)} parcelado
          </p>
          <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
            {event.formaPagamento}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-white/60 transition-colors"
          aria-label="Editar"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

const defaultForm = {
  date: '',
  time: '',
  clientName: '',
  iphoneModel: '',
  storage: '',
  imeiEnd: '',
  valorAVista: 0,
  valorComJuros: 0,
  formaPagamento: 'PIX',
  notes: '',
}

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
  const [form, setForm] = useState(() => {
    if (initialEvent) {
      return {
        date: initialEvent.date,
        time: initialEvent.time || '',
        clientName: initialEvent.clientName || '',
        iphoneModel: initialEvent.iphoneModel,
        storage: initialEvent.storage,
        imeiEnd: initialEvent.imeiEnd,
        valorAVista: initialEvent.valorAVista,
        valorComJuros: initialEvent.valorComJuros,
        formaPagamento: initialEvent.formaPagamento,
        notes: initialEvent.notes || '',
      }
    }
    return { ...defaultForm, date: selectedDate }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.iphoneModel.trim() || !form.storage.trim() || !form.imeiEnd.trim()) {
      toast.error('Preencha data, modelo, armazenamento e final do IMEI.')
      return
    }
    if (form.valorAVista < 0 || form.valorComJuros < 0) {
      toast.error('Valores não podem ser negativos.')
      return
    }
    setSaving(true)
    try {
      if (isEdit && initialEvent) {
        await calendarApi.update(Number(initialEvent.id), {
          date: form.date,
          time: form.time || undefined,
          clientName: form.clientName || undefined,
          iphoneModel: form.iphoneModel.trim(),
          storage: form.storage.trim(),
          imeiEnd: form.imeiEnd.trim(),
          valorAVista: form.valorAVista,
          valorComJuros: form.valorComJuros,
          formaPagamento: form.formaPagamento,
          notes: form.notes || undefined,
        })
        toast.success('Venda atualizada.')
      } else {
        await calendarApi.create({
          date: form.date,
          time: form.time || undefined,
          clientName: form.clientName || undefined,
          iphoneModel: form.iphoneModel.trim(),
          storage: form.storage.trim(),
          imeiEnd: form.imeiEnd.trim(),
          valorAVista: form.valorAVista,
          valorComJuros: form.valorComJuros,
          formaPagamento: form.formaPagamento,
          notes: form.notes || undefined,
        })
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">iPhone (modelo)</label>
              <input
                type="text"
                required
                placeholder="Ex.: 15 Pro, 16"
                value={form.iphoneModel}
                onChange={(e) => setForm((f) => ({ ...f, iphoneModel: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Armazenamento</label>
              <input
                type="text"
                required
                placeholder="Ex.: 128GB, 256GB"
                value={form.storage}
                onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Final do IMEI</label>
            <input
              type="text"
              required
              placeholder="Ex.: 123456"
              value={form.imeiEnd}
              onChange={(e) => setForm((f) => ({ ...f, imeiEnd: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Valor à vista (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.valorAVista || ''}
                onChange={(e) => setForm((f) => ({ ...f, valorAVista: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Valor com juros (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.valorComJuros || ''}
                onChange={(e) => setForm((f) => ({ ...f, valorComJuros: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Forma de pagamento</label>
            <select
              value={form.formaPagamento}
              onChange={(e) => setForm((f) => ({ ...f, formaPagamento: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="PIX">PIX</option>
              <option value="Cartão à vista">Cartão à vista</option>
              <option value="Cartão parcelado">Cartão parcelado</option>
              <option value="Boleto">Boleto</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Observações (opcional)</label>
            <textarea
              rows={2}
              placeholder="Algo que o atendente precise saber"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
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
