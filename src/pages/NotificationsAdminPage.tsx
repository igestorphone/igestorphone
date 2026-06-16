import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Link as LinkIcon, Send, User, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi, usersApi } from '@/lib/api'

const TARGET_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'user', label: 'Um usuário específico' },
  { id: 'mensal', label: 'Mensal' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'anual', label: 'Anual' },
  { id: 'embaixador', label: 'Embaixador' },
]

type AppUser = {
  id: number | string
  name?: string
  email?: string
  is_active?: boolean
}

function targetLabel(target: { scope?: string; plan_type?: string; user_id?: number; user_name?: string; user_email?: string } | null | undefined) {
  if (!target?.scope || target.scope === 'all') return 'Todos'
  if (target.scope === 'user') {
    const who = target.user_name || target.user_email
    return who ? `Apenas: ${who}` : `Usuário #${target.user_id}`
  }
  if (target.scope === 'embaixador') return 'Embaixador'
  if (target.scope === 'plan' && target.plan_type) {
    const map: Record<string, string> = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual' }
    return map[target.plan_type] || target.plan_type
  }
  return target.scope
}

export default function NotificationsAdminPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [target, setTarget] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [sending, setSending] = useState(false)

  const usersQuery = useQuery({
    queryKey: ['notifications-admin-users'],
    queryFn: async () => {
      const resp = await usersApi.getAll()
      const raw = (resp as any)?.users ?? (resp as any)?.data?.users ?? []
      return raw as AppUser[]
    },
    staleTime: 60_000,
  })

  const listQuery = useQuery({
    queryKey: ['notifications-admin'],
    queryFn: () => notificationsApi.list(),
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })

  const users = usersQuery.data ?? []

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    const sorted = [...users].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'))
    if (!q) return sorted
    return sorted.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.id).includes(q)
    )
  }, [users, userSearch])

  const selectedUser = useMemo(
    () => users.find((u) => String(u.id) === selectedUserId) ?? null,
    [users, selectedUserId]
  )

  const items = useMemo(() => {
    const raw = (listQuery.data as any)?.data ?? listQuery.data
    return raw?.notifications ?? []
  }, [listQuery.data])

  const send = async () => {
    if (!title.trim()) return toast.error('Título é obrigatório.')
    if (!message.trim()) return toast.error('Mensagem é obrigatória.')

    if (target === 'user') {
      if (!selectedUserId) return toast.error('Selecione o usuário que vai receber.')
      if (!selectedUser) return toast.error('Usuário selecionado não encontrado. Recarregue a página.')
      const ok = window.confirm(
        `Enviar APENAS para:\n\n${selectedUser.name || 'Sem nome'}\n${selectedUser.email || ''}\n\nNinguém mais verá esta notificação.`
      )
      if (!ok) return
    }

    setSending(true)
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
      }
      if (linkUrl.trim()) payload.link_url = linkUrl.trim()

      if (target === 'all') {
        payload.target = { scope: 'all' }
      } else if (target === 'embaixador') {
        payload.target = { scope: 'embaixador' }
      } else if (target === 'user') {
        payload.target = {
          scope: 'user',
          user_id: Number(selectedUserId),
          user_name: selectedUser?.name || null,
          user_email: selectedUser?.email || null,
        }
      } else {
        payload.target = { scope: 'plan', plan_type: target }
      }

      const resp = await notificationsApi.create(payload)
      const raw = (resp as any)?.data ?? resp
      const delivered = raw?.delivered_to ?? 0
      const recipient = raw?.recipient as { name?: string; email?: string } | null

      if (target === 'user') {
        if (delivered === 1 && recipient) {
          toast.success(`Enviado só para ${recipient.name || recipient.email} ✓`)
        } else {
          toast.error('Falha: a notificação não foi entregue ao usuário selecionado.')
          return
        }
      } else {
        toast.success(`Notificação enviada (${delivered} usuários).`)
      }

      setTitle('')
      setMessage('')
      setLinkUrl('')
      setTarget('all')
      setSelectedUserId('')
      setUserSearch('')
      await listQuery.refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao enviar notificação.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Envie avisos para todos ou para <strong>um usuário específico</strong> (mensagem pessoal).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Ex: Entre no grupo do WhatsApp"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[110px] bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Escreva a mensagem…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Link (opcional)</label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-gray-400 dark:text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full pl-9 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
                placeholder="https://chat.whatsapp.com/…"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Enviar para</label>
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value)
                if (e.target.value !== 'user') {
                  setSelectedUserId('')
                  setUserSearch('')
                }
              }}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
            >
              {TARGET_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          {target === 'user' && (
            <div className="md:col-span-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                <User className="w-4 h-4" />
                Escolha quem vai receber (só essa pessoa)
              </div>

              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
                placeholder="Buscar por nome ou e-mail…"
              />

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              >
                <option value="">— Selecione o usuário —</option>
                {filteredUsers.map((u) => (
                  <option key={String(u.id)} value={String(u.id)}>
                    {u.name || 'Sem nome'} · {u.email}
                    {u.is_active === false ? ' (inativo)' : ''}
                  </option>
                ))}
              </select>

              {selectedUser ? (
                <div className="rounded-lg border border-emerald-300/50 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
                  <strong>Destinatário:</strong> {selectedUser.name} ({selectedUser.email})
                  <div className="text-xs mt-1 text-emerald-800/80 dark:text-emerald-300/80">
                    Só esta pessoa verá a notificação no sininho.
                  </div>
                </div>
              ) : (
                <p className="text-xs text-indigo-800/70 dark:text-indigo-300/70">
                  {usersQuery.isLoading ? 'Carregando usuários…' : `${filteredUsers.length} usuário(s) na lista`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={send}
            disabled={sending || (target === 'user' && !selectedUserId)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Enviando…' : target === 'user' ? 'Enviar só para este usuário' : 'Enviar notificação'}
          </button>
        </div>
      </motion.div>

      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico</h2>
        </div>

        {listQuery.isFetching && items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Nenhuma notificação enviada ainda.</div>
        ) : (
          <div className="space-y-3">
            {items.map((n: any) => {
              let tgt = n.target
              if (typeof tgt === 'string') {
                try {
                  tgt = JSON.parse(tgt)
                } catch {
                  tgt = null
                }
              }
              const label = targetLabel(tgt)
              const isPersonal = tgt?.scope === 'user'
              return (
                <div key={n.id} className="p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{n.title}</div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isPersonal
                              ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-1">{n.message}</div>
                      {n.link_url && (
                        <a
                          href={n.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mt-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Abrir link
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right shrink-0">
                      <div>{new Date(n.created_at).toLocaleString('pt-BR')}</div>
                      <div className="mt-1">
                        {Number(n.read_count || 0)}/{Number(n.delivered_count || 0)} lidas
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
