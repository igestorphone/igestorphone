import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, RefreshCw, CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { whatsappApi } from '@/lib/api'

type InboxStatus = 'new' | 'processed' | 'error' | 'pending_supplier' | 'ignored'

const STATUS_LABEL: Record<InboxStatus, string> = {
  new: 'Novo',
  processed: 'Processado',
  error: 'Erro',
  pending_supplier: 'Pendente fornecedor',
  ignored: 'Ignorado',
}

export default function WhatsAppInboxPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')

  const statusQuery = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => whatsappApi.status(),
    refetchInterval: 15000,
  })

  const inboxQuery = useQuery({
    queryKey: ['whatsapp-inbox', statusFilter],
    queryFn: () => whatsappApi.inbox({ status: statusFilter || undefined, limit: 200 }),
    refetchInterval: 10000,
  })

  const items = useMemo(() => {
    const raw = (inboxQuery.data as any)?.data ?? inboxQuery.data
    return raw?.items ?? []
  }, [inboxQuery.data])

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: InboxStatus }) => whatsappApi.updateInboxStatus(id, status),
    onSuccess: () => {
      inboxQuery.refetch()
      statusQuery.refetch()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao atualizar status'),
  })

  const processMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.processInboxItem(id),
    onSuccess: () => {
      toast.success('Item marcado como processado')
      inboxQuery.refetch()
      statusQuery.refetch()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao processar item'),
  })

  const statusRaw = (statusQuery.data as any)?.data ?? statusQuery.data
  const webhookOk = !!statusRaw?.webhook_configured
  const lastEvent = statusRaw?.last_event

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Inbox</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              MVP da automação: recebe webhook, salva mensagens e permite triagem manual.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              inboxQuery.refetch()
              statusQuery.refetch()
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Webhook</div>
            <div className={`text-sm font-semibold mt-1 ${webhookOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {webhookOk ? 'Configurado' : 'Não configurado'}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Último telefone</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{lastEvent?.from_phone || '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Último evento</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {lastEvent?.received_at ? new Date(lastEvent.received_at).toLocaleString('pt-BR') : '—'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mensagens recebidas</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
            <option value="">Todos status</option>
            <option value="new">Novo</option>
            <option value="pending_supplier">Pendente fornecedor</option>
            <option value="processed">Processado</option>
            <option value="error">Erro</option>
            <option value="ignored">Ignorado</option>
          </select>
        </div>

        {inboxQuery.isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Carregando mensagens...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Nenhuma mensagem recebida ainda.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const status = (item.status || 'new') as InboxStatus
              return (
                <div key={item.id} className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.profile_name || 'Sem nome'} • {item.from_phone || 'Sem telefone'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(item.received_at || item.created_at).toLocaleString('pt-BR')} • tipo: {item.message_type || 'text'}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                        {item.message_text || '(sem texto)'}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20">
                        {STATUS_LABEL[status] || status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => processMutation.mutate(item.id)}
                      disabled={processMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Processar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'pending_supplier' })}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <Clock3 className="w-4 h-4" />
                      Pendente fornecedor
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'error' })}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Marcar erro
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'ignored' })}
                      disabled={updateStatusMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-60"
                    >
                      Ignorar
                    </button>
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

