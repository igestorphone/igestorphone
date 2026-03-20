import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Link as LinkIcon, Send, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'

const TARGET_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'mensal', label: 'Mensal' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'anual', label: 'Anual' },
  { id: 'embaixador', label: 'Embaixador' },
]

export default function NotificationsAdminPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [target, setTarget] = useState('all')
  const [sending, setSending] = useState(false)

  const listQuery = useQuery({
    queryKey: ['notifications-admin'],
    queryFn: () => notificationsApi.list(),
    staleTime: 15000,
    refetchOnWindowFocus: true,
  })

  const items = useMemo(() => {
    const raw = (listQuery.data as any)?.data ?? listQuery.data
    return raw?.notifications ?? []
  }, [listQuery.data])

  const send = async () => {
    if (!title.trim()) return toast.error('Título é obrigatório.')
    if (!message.trim()) return toast.error('Mensagem é obrigatória.')
    setSending(true)
    try {
      const payload: any = { title: title.trim(), message: message.trim() }
      if (linkUrl.trim()) payload.link_url = linkUrl.trim()
      if (target === 'all') payload.target = { scope: 'all' }
      else if (target === 'embaixador') payload.target = { scope: 'embaixador' }
      else payload.target = { scope: 'plan', plan_type: target }

      const resp = await notificationsApi.create(payload)
      const raw = (resp as any)?.data ?? resp
      toast.success(`Notificação enviada (${raw?.delivered_to ?? 0} usuários).`)
      setTitle('')
      setMessage('')
      setLinkUrl('')
      setTarget('all')
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Envie avisos para os usuários (ex.: link do grupo WhatsApp).</p>
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
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
            >
              {TARGET_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Enviando…' : 'Enviar notificação'}
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
            {items.map((n: any) => (
              <div key={n.id} className="p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{n.title}</div>
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
                    <div className="mt-1">{Number(n.read_count || 0)}/{Number(n.delivered_count || 0)} lidas</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

