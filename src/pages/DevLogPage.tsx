import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Code2,
  Plus,
  Edit,
  Trash2,
  X,
  Tag,
  StickyNote,
  ListTodo,
  CircleDot,
  XCircle,
  ChevronRight,
  Calendar,
  Filter,
  Copy,
  Megaphone
} from 'lucide-react'
import { devlogApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

type TabId = 'backlog' | 'releases' | 'notes'
type TaskStatus = 'todo' | 'doing' | 'done'
type Priority = 'low' | 'medium' | 'high'

interface DevTask {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  target_version: string | null
  created_at: string
  completed_at: string | null
}

interface DevRelease {
  id: number
  version: string
  title: string | null
  description: string | null
  released_at: string
  is_public: boolean
}

interface DevNote {
  id: number
  title: string
  content: string | null
  updated_at: string
}

const STATUS_META: Record<TaskStatus, { label: string; dot: string; badge: string }> = {
  todo: {
    label: 'A Fazer',
    dot: 'text-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300'
  },
  doing: {
    label: 'Fazendo',
    dot: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
  },
  done: {
    label: 'Feito',
    dot: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
  }
}

const PRIORITY_META: Record<Priority, { label: string; badge: string }> = {
  low: { label: 'Baixa', badge: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70' },
  medium: { label: 'Média', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  high: { label: 'Alta', badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' }
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'done']

function formatDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toLocalDay(value: string | Date | null): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inDateRange(value: string | null, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!value) return false
  const day = toLocalDay(value)
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

const dateInputCls =
  'rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white'

function buildReleaseSummary(rel: DevRelease): string {
  const lines: string[] = []
  lines.push(`🚀 *iGestorPhone ${rel.version}* já está disponível! 🎉`)
  if (rel.title) lines.push(`_${rel.title}_`)
  lines.push('')
  lines.push('✨ *Novidades desta versão:*')
  if (rel.description) lines.push(rel.description.trim())
  lines.push('')
  lines.push('💬 Dúvidas ou sugestões? É só chamar o suporte. Bom uso! 🙌')
  return lines.join('\n')
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fallback abaixo */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:border dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white'
const labelCls = 'block text-sm font-semibold text-gray-800 dark:text-white/90 mb-1.5'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-white/90'

export default function DevLogPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabId>('backlog')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [taskModal, setTaskModal] = useState<{ open: boolean; edit?: DevTask }>({ open: false })
  const [releaseModal, setReleaseModal] = useState<{ open: boolean; edit?: DevRelease }>({ open: false })
  const [noteModal, setNoteModal] = useState<{ open: boolean; edit?: DevNote }>({ open: false })

  if (user?.tipo !== 'admin') {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-white/70">Apenas administradores podem acessar o Dev Log.</p>
        </div>
      </div>
    )
  }

  const tasksQuery = useQuery({
    queryKey: ['devlog', 'tasks'],
    queryFn: () => devlogApi.tasks.getAll(),
    select: (r: any) => (r?.tasks || []) as DevTask[]
  })
  const releasesQuery = useQuery({
    queryKey: ['devlog', 'releases'],
    queryFn: () => devlogApi.releases.getAll(),
    select: (r: any) => (r?.releases || []) as DevRelease[]
  })
  const notesQuery = useQuery({
    queryKey: ['devlog', 'notes'],
    queryFn: () => devlogApi.notes.getAll(),
    select: (r: any) => (r?.notes || []) as DevNote[]
  })

  const invalidate = (key: string) => queryClient.invalidateQueries({ queryKey: ['devlog', key] })

  const saveTask = useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) =>
      id ? devlogApi.tasks.update(id, data) : devlogApi.tasks.create(data),
    onSuccess: () => {
      toast.success('Tarefa salva!')
      invalidate('tasks')
      setTaskModal({ open: false })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar tarefa')
  })
  const deleteTask = useMutation({
    mutationFn: (id: number) => devlogApi.tasks.delete(id),
    onSuccess: () => { toast.success('Tarefa removida'); invalidate('tasks') },
    onError: () => toast.error('Erro ao remover tarefa')
  })
  const setTaskStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => devlogApi.tasks.update(id, { status }),
    onSuccess: () => invalidate('tasks'),
    onError: () => toast.error('Erro ao mudar status')
  })

  const saveRelease = useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) =>
      id ? devlogApi.releases.update(id, data) : devlogApi.releases.create(data),
    onSuccess: () => {
      toast.success('Versão salva!')
      invalidate('releases')
      setReleaseModal({ open: false })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar versão')
  })
  const deleteRelease = useMutation({
    mutationFn: (id: number) => devlogApi.releases.delete(id),
    onSuccess: () => { toast.success('Versão removida'); invalidate('releases') },
    onError: () => toast.error('Erro ao remover versão')
  })

  const saveNote = useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) =>
      id ? devlogApi.notes.update(id, data) : devlogApi.notes.create(data),
    onSuccess: () => {
      toast.success('Anotação salva!')
      invalidate('notes')
      setNoteModal({ open: false })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar anotação')
  })
  const deleteNote = useMutation({
    mutationFn: (id: number) => devlogApi.notes.delete(id),
    onSuccess: () => { toast.success('Anotação removida'); invalidate('notes') },
    onError: () => toast.error('Erro ao remover anotação')
  })

  const allTasks = tasksQuery.data || []
  const allReleases = releasesQuery.data || []
  const allNotes = notesQuery.data || []

  const dateActive = Boolean(dateFrom || dateTo)
  const todayStr = toLocalDay(new Date())
  const tasks = allTasks.filter((t) =>
    inDateRange(t.status === 'done' ? t.completed_at || t.created_at : t.created_at, dateFrom, dateTo)
  )
  const releases = allReleases.filter((r) => inDateRange(r.released_at, dateFrom, dateTo))
  const notes = allNotes.filter((n) => inDateRange(n.updated_at, dateFrom, dateTo))

  const tabs: { id: TabId; label: string; icon: typeof ListTodo; count: number }[] = [
    { id: 'backlog', label: 'Backlog', icon: ListTodo, count: tasks.filter((t) => t.status !== 'done').length },
    { id: 'releases', label: 'Versões', icon: Tag, count: releases.length },
    { id: 'notes', label: 'Anotações', icon: StickyNote, count: notes.length }
  ]

  return (
    <div className="mx-auto max-w-6xl px-1 py-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <Code2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de TI</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Backlog, versões entregues e anotações de desenvolvimento
            </p>
          </div>
        </div>
        <button
          className={primaryBtn}
          onClick={() => {
            if (tab === 'backlog') setTaskModal({ open: true })
            else if (tab === 'releases') setReleaseModal({ open: true })
            else setNoteModal({ open: true })
          }}
        >
          <Plus className="h-4 w-4" />
          {tab === 'backlog' ? 'Nova tarefa' : tab === 'releases' ? 'Nova versão' : 'Nova anotação'}
        </button>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              <span className="rounded-full bg-gray-200 px-1.5 text-xs text-gray-600 dark:bg-white/10 dark:text-white/70">
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/50">
          <Filter className="h-3.5 w-3.5" />
          Período:
        </span>
        <input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => setDateFrom(e.target.value)}
          className={dateInputCls}
          aria-label="Data inicial"
        />
        <span className="text-xs text-gray-400">até</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => setDateTo(e.target.value)}
          className={dateInputCls}
          aria-label="Data final"
        />
        {dateActive && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
        {dateActive && (
          <span className="text-xs text-gray-400 dark:text-white/40">
            {tab === 'backlog'
              ? `${tasks.length} tarefa(s)`
              : tab === 'releases'
                ? `${releases.length} versão(ões)`
                : `${notes.length} anotação(ões)`}
          </span>
        )}
      </div>

      {tab === 'backlog' && (
        <div className="grid gap-4 md:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status]
            const doneTodayOnly = status === 'done' && !dateActive
            const list = tasks.filter(
              (t) =>
                t.status === status &&
                (!doneTodayOnly || toLocalDay(t.completed_at || t.created_at) === todayStr)
            )
            return (
              <div key={status} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <CircleDot className={`h-4 w-4 ${meta.dot}`} />
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white/90">{meta.label}</h2>
                  {doneTodayOnly && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      hoje
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">{list.length}</span>
                </div>
                <div className="space-y-2">
                  {list.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-gray-400">
                      {doneTodayOnly ? 'Nada concluído hoje' : 'Vazio'}
                    </p>
                  )}
                  {list.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900"
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold text-gray-900 dark:text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => setTaskModal({ open: true, edit: task })}
                            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                            aria-label="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Remover esta tarefa?')) deleteTask.mutate(task.id) }}
                            className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="mb-2 text-xs text-gray-500 dark:text-white/60 whitespace-pre-wrap">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_META[task.priority].badge}`}>
                          {PRIORITY_META[task.priority].label}
                        </span>
                        {task.target_version && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                            <Tag className="h-3 w-3" />
                            {task.target_version}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/40">
                        <Calendar className="h-3 w-3" />
                        {task.status === 'done' && task.completed_at
                          ? `Concluída em ${formatDate(task.completed_at)}`
                          : `Criada em ${formatDate(task.created_at)}`}
                      </p>
                      <div className="mt-2 flex gap-1 border-t border-gray-100 pt-2 dark:border-white/5">
                        {STATUS_ORDER.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            onClick={() => setTaskStatus.mutate({ id: task.id, status: s })}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'releases' && (
        <div className="space-y-3">
          {releases.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 py-14 text-center text-sm text-gray-400 dark:border-white/10">
              Nenhuma versão registrada ainda.
            </div>
          )}
          {releases.map((rel) => (
            <div
              key={rel.id}
              className="group flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="flex flex-col items-center">
                <span className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
                  <Tag className="h-3.5 w-3.5" />
                  {rel.version}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {rel.title && <p className="font-semibold text-gray-900 dark:text-white">{rel.title}</p>}
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-gray-400">{formatDate(rel.released_at)}</p>
                      {rel.is_public ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          <Megaphone className="h-3 w-3" />
                          Clientes
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-white/60">
                          Interno
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setReleaseModal({ open: true, edit: rel })}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                      aria-label="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Remover esta versão?')) deleteRelease.mutate(rel.id) }}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {rel.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-white/70">{rel.description}</p>
                )}
                {rel.is_public && (
                  <button
                    onClick={async () => {
                      const ok = await copyToClipboard(buildReleaseSummary(rel))
                      if (ok) toast.success('Resumo copiado! Cole na sua comunidade.')
                      else toast.error('Não foi possível copiar')
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar resumo para a comunidade
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 py-14 text-center text-sm text-gray-400 dark:border-white/10">
              Nenhuma anotação ainda.
            </div>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">{note.title}</p>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setNoteModal({ open: true, edit: note })}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                    aria-label="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Remover esta anotação?')) deleteNote.mutate(note.id) }}
                    className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {note.content && (
                <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-white/70">{note.content}</p>
              )}
              <p className="mt-3 text-[11px] text-gray-400">Atualizado em {formatDate(note.updated_at)}</p>
            </div>
          ))}
        </div>
      )}

      {taskModal.open && (
        <TaskForm
          initial={taskModal.edit}
          saving={saveTask.isPending}
          onCancel={() => setTaskModal({ open: false })}
          onSubmit={(data) => saveTask.mutate({ id: taskModal.edit?.id, data })}
        />
      )}
      {releaseModal.open && (
        <ReleaseForm
          initial={releaseModal.edit}
          saving={saveRelease.isPending}
          onCancel={() => setReleaseModal({ open: false })}
          onSubmit={(data) => saveRelease.mutate({ id: releaseModal.edit?.id, data })}
        />
      )}
      {noteModal.open && (
        <NoteForm
          initial={noteModal.edit}
          saving={saveNote.isPending}
          onCancel={() => setNoteModal({ open: false })}
          onSubmit={(data) => saveNote.mutate({ id: noteModal.edit?.id, data })}
        />
      )}
    </div>
  )
}

function TaskForm({
  initial,
  saving,
  onCancel,
  onSubmit
}: {
  initial?: DevTask
  saving: boolean
  onCancel: () => void
  onSubmit: (data: any) => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status || 'todo')
  const [priority, setPriority] = useState<Priority>(initial?.priority || 'medium')
  const [targetVersion, setTargetVersion] = useState(initial?.target_version || '')

  return (
    <Modal title={initial ? 'Editar tarefa' : 'Nova tarefa'} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return toast.error('Informe um título')
          onSubmit({ title: title.trim(), description, status, priority, target_version: targetVersion || null })
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelCls}>Título</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Adicionar filtro por cor" autoFocus />
        </div>
        <div>
          <label className={labelCls}>Descrição</label>
          <textarea className={`${inputCls} min-h-[80px]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes, contexto, links..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="todo">A Fazer</option>
              <option value="doing">Fazendo</option>
              <option value="done">Feito</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Prioridade</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Versão alvo (opcional)</label>
          <input className={inputCls} value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} placeholder="Ex.: v1.3.0" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ReleaseForm({
  initial,
  saving,
  onCancel,
  onSubmit
}: {
  initial?: DevRelease
  saving: boolean
  onCancel: () => void
  onSubmit: (data: any) => void
}) {
  const [version, setVersion] = useState(initial?.version || '')
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [releasedAt, setReleasedAt] = useState(
    initial?.released_at ? initial.released_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false)

  return (
    <Modal title={initial ? 'Editar versão' : 'Nova versão'} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!version.trim()) return toast.error('Informe a versão')
          onSubmit({ version: version.trim(), title, description, released_at: releasedAt, is_public: isPublic })
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Versão</label>
            <input className={inputCls} value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.2.0" autoFocus />
          </div>
          <div>
            <label className={labelCls}>Data</label>
            <input type="date" className={inputCls} value={releasedAt} onChange={(e) => setReleasedAt(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Título (opcional)</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Melhorias no calendário" />
        </div>
        <div>
          <label className={labelCls}>O que foi entregue</label>
          <textarea className={`${inputCls} min-h-[100px]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="- Corrigido bug X&#10;- Adicionado recurso Y" />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm">
            <span className="font-semibold text-gray-800 dark:text-white/90">Novidade para clientes</span>
            <span className="block text-xs text-gray-500 dark:text-white/60">
              Marque quando a mudança for visível para os usuários. Só versões marcadas geram o resumo para enviar na comunidade (mudanças internas de administração ficam ocultas).
            </span>
          </span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function NoteForm({
  initial,
  saving,
  onCancel,
  onSubmit
}: {
  initial?: DevNote
  saving: boolean
  onCancel: () => void
  onSubmit: (data: any) => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')

  return (
    <Modal title={initial ? 'Editar anotação' : 'Nova anotação'} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return toast.error('Informe um título')
          onSubmit({ title: title.trim(), content })
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelCls}>Título</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Credenciais de teste" autoFocus />
        </div>
        <div>
          <label className={labelCls}>Conteúdo</label>
          <textarea className={`${inputCls} min-h-[140px]`} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ideias, links, comandos, credenciais de teste..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
