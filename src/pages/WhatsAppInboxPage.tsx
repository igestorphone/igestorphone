import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, RefreshCw, CheckCircle2, AlertTriangle, Clock3, Send, Trash2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { whatsappApi } from '@/lib/api'

type InboxStatus = 'new' | 'processed' | 'error' | 'pending_supplier' | 'ignored'
type ListType = 'lacrada' | 'seminovo' | 'android' | 'auto'
type ConversationThreadType = 'lacrada' | 'seminovo' | 'android' | 'geral'

const STATUS_LABEL: Record<InboxStatus, string> = {
  new: 'Novo',
  processed: 'Processado',
  error: 'Erro',
  pending_supplier: 'Pendente fornecedor',
  ignored: 'Ignorado',
}

export default function WhatsAppInboxPage() {
  const [statusFilter, setStatusFilter] = useState<string>('new')
  const [selectedThreadKey, setSelectedThreadKey] = useState<string>('')
  const [draftMessage, setDraftMessage] = useState('')
  const [expandedMessageIds, setExpandedMessageIds] = useState<Record<number, boolean>>({})
  const [selectedBatchIds, setSelectedBatchIds] = useState<Record<number, boolean>>({})
  const [listTypeByItemId, setListTypeByItemId] = useState<Record<number, ListType>>({})
  const [currentPage, setCurrentPage] = useState(1)

  const PAGE_SIZE = 10

  function inferListType(text: string): ListType {
    const t = (text || '').toLowerCase()
    const hasSeminovo = ['seminovo', 'semi-novo', 'usado', 'swap', 'vitrine'].some((k) => t.includes(k))
    const hasLacrado = ['lacrado', 'novo', 'selado', 'seal', 'cpo'].some((k) => t.includes(k))
    if (hasSeminovo && !hasLacrado) return 'seminovo'
    if (hasLacrado) return 'lacrada'
    return 'auto'
  }

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

  const selectedConversation = useMemo(
    () => conversations.find((c: any) => c.thread_key === selectedThreadKey) || null,
    [conversations, selectedThreadKey]
  )

  const messagesQuery = useQuery({
    queryKey: ['whatsapp-conversation-messages', selectedConversation?.from_phone, selectedConversation?.thread_type],
    queryFn: () =>
      whatsappApi.conversationMessages(selectedConversation?.from_phone, {
        limit: 500,
        list_type: (selectedConversation?.thread_type as ConversationThreadType) || undefined,
      }),
    enabled: !!selectedConversation?.from_phone,
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

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return items.slice(start, start + PAGE_SIZE)
  }, [items, currentPage])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  useEffect(() => {
    setSelectedBatchIds((prev) => {
      const next = { ...prev }
      for (const item of pagedItems) {
        if (next[item.id] === undefined && (item.status === 'new' || item.status === 'pending_supplier')) {
          next[item.id] = true
        }
      }
      return next
    })

    setListTypeByItemId((prev) => {
      const next = { ...prev }
      for (const item of pagedItems) {
        if (!next[item.id]) {
          next[item.id] = inferListType((item.message_text || '').toString())
        }
      }
      return next
    })
  }, [pagedItems])

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
    onError: async (e: any, variables) => {
      const message = e?.message || e?.response?.data?.message || 'Erro ao processar item'
      const isTimeout = /timeout|ECONNABORTED/i.test(String(message))

      if (isTimeout) {
        const refreshed = await inboxQuery.refetch()
        const raw = (refreshed.data as any)?.data ?? refreshed.data
        const updatedItem = raw?.items?.find((item: any) => Number(item.id) === Number(variables.id))

        if (updatedItem?.status === 'processed') {
          toast.success('Processado com sucesso (finalizou após timeout do navegador)')
          statusQuery.refetch()
          conversationsQuery.refetch()
          messagesQuery.refetch()
          return
        }

        toast('Processamento em andamento. Aguarde e clique em Atualizar.', { icon: '⏳' })
        return
      }

      toast.error(message)
    },
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

  const processBatchMutation = useMutation({
    mutationFn: async () => {
      const targetItems = pagedItems.filter((item: any) => !!selectedBatchIds[item.id])
      let success = 0
      let failed = 0

      for (const item of targetItems) {
        try {
          await whatsappApi.processInboxItem(item.id, listTypeByItemId[item.id] || 'auto')
          success += 1
        } catch (_e) {
          failed += 1
        }
      }

      return { success, failed, total: targetItems.length }
    },
    onSuccess: ({ success, failed, total }) => {
      if (total === 0) {
        toast('Selecione ao menos 1 mensagem', { icon: 'ℹ️' })
        return
      }
      if (failed === 0) {
        toast.success(`Processamento em lote concluído (${success}/${total})`)
      } else {
        toast(`Lote concluído: ${success} sucesso, ${failed} falha`, { icon: '⚠️' })
      }
      inboxQuery.refetch()
      statusQuery.refetch()
      conversationsQuery.refetch()
      messagesQuery.refetch()
    },
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
                const active = selectedThreadKey === c.thread_key
                const threadLabel =
                  c.thread_type === 'lacrada'
                    ? 'Lacrado'
                    : c.thread_type === 'seminovo'
                    ? 'Seminovo'
                    : c.thread_type === 'android'
                    ? 'Android'
                    : 'Geral'
                return (
                  <button
                    key={c.thread_key || `${c.from_phone}:${c.thread_type || 'geral'}`}
                    type="button"
                    onClick={() => setSelectedThreadKey(c.thread_key || `${c.from_phone}:${c.thread_type || 'geral'}`)}
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
                    <div className="text-[11px] inline-flex mt-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                      {threadLabel}
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
              {selectedConversation
                ? `Conversa: ${selectedConversation.from_phone} (${selectedConversation.thread_type || 'geral'})`
                : 'Selecione uma conversa'}
            </h2>
          </div>

          <div className="flex-1 py-3 max-h-[420px] overflow-y-auto space-y-2">
            {!selectedConversation?.from_phone ? (
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
                placeholder={selectedConversation?.from_phone ? 'Digite uma resposta...' : 'Selecione uma conversa para responder'}
                disabled={!selectedConversation?.from_phone}
                className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-60"
              />
              <button
                type="button"
                disabled={!selectedConversation?.from_phone || !draftMessage.trim() || sendMessageMutation.isPending}
                onClick={() =>
                  sendMessageMutation.mutate({
                    phone: selectedConversation.from_phone,
                    message: draftMessage.trim(),
                  })
                }
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => processBatchMutation.mutate()}
              disabled={processBatchMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              Processar selecionadas
            </button>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
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
        </div>

        {inboxQuery.isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Carregando mensagens...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Nenhuma mensagem recebida ainda.</div>
        ) : (
          <div className="space-y-3">
            {pagedItems.map((item: any) => {
              const status = (item.status || 'new') as InboxStatus
              return (
                <div key={item.id} className="rounded-lg border border-gray-200 dark:border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedBatchIds[item.id]}
                          onChange={(e) =>
                            setSelectedBatchIds((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                        />
                        <select
                          value={listTypeByItemId[item.id] || 'auto'}
                          onChange={(e) =>
                            setListTypeByItemId((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as ListType,
                            }))
                          }
                          className="rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-2 py-1 text-xs text-gray-900 dark:text-white"
                        >
                          <option value="auto">Auto</option>
                          <option value="lacrada">Lacrado</option>
                          <option value="seminovo">Seminovo</option>
                          <option value="android">Android</option>
                        </select>
                      </div>
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
                      Processar auto
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
                      onClick={() => processMutation.mutate({ id: item.id, listType: 'android' })}
                      disabled={processMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      Android
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
        {items.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Página {currentPage} de {totalPages} • mostrando {pagedItems.length} de {items.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 text-xs disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 text-xs disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

