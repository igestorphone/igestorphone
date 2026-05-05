import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, RefreshCw, CheckCircle2, AlertTriangle, Clock3, Send, Trash2 } from 'lucide-react'
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
  const [selectedPhone, setSelectedPhone] = useState<string>('')
  const [draftMessage, setDraftMessage] = useState('')
  const [expandedMessageIds, setExpandedMessageIds] = useState<Record<number, boolean>>({})

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

  const conversationsQuery = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => whatsappApi.conversations({ limit: 200 }),
    refetchInterval: 10000,
  })

  const conversations = useMemo(() => {
    const raw = (conversationsQuery.data as any)?.data ?? conversationsQuery.data
    return raw?.items ?? []
  }, [conversationsQuery.data])

  const messagesQuery = useQuery({
    queryKey: ['whatsapp-conversation-messages', selectedPhone],
    queryFn: () => whatsappApi.conversationMessages(selectedPhone, { limit: 500 }),
    enabled: !!selectedPhone,
    refetchInterval: 5000,
  })

  const conversationMessages = useMemo(() => {
    const raw = (messagesQuery.data as any)?.data ?? messagesQuery.data
    return raw?.items ?? []
  }, [messagesQuery.data])

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
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || 'Erro ao atualizar status'),
  })

  const processMutation = useMutation({
    mutationFn: ({ id, listType }: { id: number; listType?: 'lacrada' | 'seminovo' | 'android' | 'auto' }) =>
      whatsappApi.processInboxItem(id, listType),
    onSuccess: (resp: any) => {
      const raw = resp?.data ?? resp
      const totalSaved = raw?.summary?.total_saved
      toast.success(
        typeof totalSaved === 'number'
          ? `Processado com sucesso (${totalSaved} produtos salvos)`
          : 'Item marcado como processado'
      )
      inboxQuery.refetch()
      statusQuery.refetch()
      conversationsQuery.refetch()
      messagesQuery.refetch()
    },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || 'Erro ao processar item'),
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ phone, message }: { phone: string; message: string }) => whatsappApi.sendMessage(phone, message),
    onSuccess: () => {
      setDraftMessage('')
      toast.success('Mensagem enviada')
      messagesQuery.refetch()
      conversationsQuery.refetch()
      inboxQuery.refetch()
    },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || 'Erro ao enviar mensagem'),
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.deleteInboxItem(id),
    onSuccess: () => {
      toast.success('Mensagem excluída')
      inboxQuery.refetch()
      statusQuery.refetch()
      conversationsQuery.refetch()
      messagesQuery.refetch()
    },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || 'Erro ao excluir mensagem'),
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
              conversationsQuery.refetch()
              messagesQuery.refetch()
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Conversas</h2>
          {conversationsQuery.isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Carregando conversas...</div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conversa ainda.</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {conversations.map((c: any) => {
                const active = selectedPhone === c.from_phone
                return (
                  <button
                    key={c.from_phone}
                    type="button"
                    onClick={() => setSelectedPhone(c.from_phone)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      active
                        ? 'border-green-500/40 bg-green-50 dark:bg-green-500/10'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {c.profile_name || c.from_phone}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {c.from_phone}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
                      {c.last_direction === 'outbound' ? 'Você: ' : ''}{c.last_message_text || '(sem texto)'}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {c.last_received_at ? new Date(c.last_received_at).toLocaleString('pt-BR') : ''}
                      </span>
                      {Number(c.unread_count || 0) > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm lg:col-span-2 flex flex-col">
          <div className="pb-3 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedPhone ? `Conversa: ${selectedPhone}` : 'Selecione uma conversa'}
            </h2>
          </div>

          <div className="flex-1 py-3 max-h-[420px] overflow-y-auto space-y-2">
            {!selectedPhone ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Escolha uma conversa na coluna da esquerda.</div>
            ) : messagesQuery.isLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Carregando mensagens...</div>
            ) : conversationMessages.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Sem mensagens nessa conversa.</div>
            ) : (
              conversationMessages.map((m: any) => {
                const outbound = m.direction === 'outbound'
                return (
                  <div key={m.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 border ${
                        outbound
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{m.message_text || '(sem texto)'}</div>
                      <div className={`text-[11px] mt-1 ${outbound ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {new Date(m.received_at || m.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                placeholder={selectedPhone ? 'Digite uma resposta...' : 'Selecione uma conversa para responder'}
                disabled={!selectedPhone}
                className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-60"
              />
              <button
                type="button"
                disabled={!selectedPhone || !draftMessage.trim() || sendMessageMutation.isPending}
                onClick={() => sendMessageMutation.mutate({ phone: selectedPhone, message: draftMessage.trim() })}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>

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
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words">
                        {(() => {
                          const text = (item.message_text || '(sem texto)').toString()
                          const isExpanded = !!expandedMessageIds[item.id]
                          const needsToggle = text.length > 280
                          const visible = isExpanded || !needsToggle ? text : `${text.slice(0, 280)}...`
                          return (
                            <>
                              <div>{visible}</div>
                              {needsToggle && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMessageIds((prev) => ({
                                      ...prev,
                                      [item.id]: !isExpanded,
                                    }))
                                  }
                                  className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                                </button>
                              )}
                            </>
                          )
                        })()}
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
                      onClick={() => processMutation.mutate({ id: item.id, listType: 'auto' })}
                      disabled={processMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Processar (Auto)
                    </button>
                    <button
                      type="button"
                      onClick={() => processMutation.mutate({ id: item.id, listType: 'lacrada' })}
                      disabled={processMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      Lacrado
                    </button>
                    <button
                      type="button"
                      onClick={() => processMutation.mutate({ id: item.id, listType: 'seminovo' })}
                      disabled={processMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      Seminovo
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
                    <button
                      type="button"
                      onClick={() => {
                        const ok = window.confirm('Excluir esta mensagem do inbox?')
                        if (ok) deleteItemMutation.mutate(item.id)
                      }}
                      disabled={deleteItemMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-black text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
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

