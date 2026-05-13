import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Monitor,
  RefreshCw,
  Smartphone,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi, type UserSessionRow } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

function formatRelative(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export default function DevicesPage() {
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const res = await usersApi.getSessions()
      return res.data
    },
  })

  const maxConcurrent = data?.maxConcurrent ?? 2
  const sessions: UserSessionRow[] = data?.sessions ?? []
  const atCapacity = sessions.length >= maxConcurrent

  const revokeMutation = useMutation({
    mutationFn: ({ sessionId }: { sessionId: string; isCurrent: boolean }) => usersApi.revokeSession(sessionId),
    onSuccess: async (_res, { isCurrent }) => {
      toast.success('Sessão desconectada')
      await queryClient.invalidateQueries({ queryKey: ['user-sessions'] })
      if (isCurrent) {
        logout()
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Não foi possível desconectar')
    },
  })

  const handleRevoke = (s: UserSessionRow) => {
    if (revokeMutation.isPending) return
    const msg = s.isCurrent
      ? 'Esta é a sessão deste navegador. Ao desconectar, você precisará fazer login novamente. Continuar?'
      : 'Desconectar esta sessão?'
    if (!window.confirm(msg)) return
    revokeMutation.mutate({ sessionId: s.id, isCurrent: s.isCurrent })
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dispositivos</h1>
            <p className="text-sm text-gray-600 dark:text-white/65">
              Veja onde sua conta está conectada e encerre acessos que você não reconhece.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
            Sessões ativas
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {sessions.length} de {maxConcurrent}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300/80 dark:border-white/15 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white/85 hover:bg-gray-100/80 dark:hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div
        role="alert"
        className="rounded-2xl border border-amber-300/80 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-400/30 px-4 py-3 flex gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-950 dark:text-amber-100/95 space-y-2">
          <p className="font-semibold">Atenção</p>
          <p>
            Sua conta permite até <strong>{maxConcurrent}</strong> sessões simultâneas. Ao atingir o limite, um novo
            login pode encerrar automaticamente a sessão mais antiga.
          </p>
          <p>
            <strong>Compartilhar senha</strong> com outros lojistas que <strong>não sejam colaboradores</strong>{' '}
            autorizados na sua operação viola as regras de uso e pode resultar em <strong>suspensão ou perda de acesso</strong>{' '}
            à conta.
          </p>
          {atCapacity && (
            <p className="font-medium text-amber-900 dark:text-amber-50">
              Você está no limite de sessões. Para entrar em outro aparelho, desconecte uma sessão abaixo ou use apenas
              os acessos permitidos (ex.: usuário do calendário).
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 dark:text-white/50 py-8">Carregando…</p>
      ) : sessions.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-white/50 py-8">Nenhuma sessão ativa encontrada.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const open = expandedId === s.id
            return (
              <li
                key={s.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  s.isCurrent
                    ? 'border-blue-500/50 bg-blue-500/5 dark:border-blue-400/40 dark:bg-blue-500/10'
                    : 'border-gray-200 dark:border-white/12 bg-white/60 dark:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{s.deviceLabel}</span>
                      {s.isCurrent && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white dark:bg-blue-500">
                          Este dispositivo
                        </span>
                      )}
                    </div>
                    {s.ip && (
                      <p className="text-xs text-gray-500 dark:text-white/55">
                        IP: <span className="font-mono">{s.ip}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-white/55">
                      Última atividade: {formatRelative(s.lastActivityAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : s.id)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      {open ? (
                        <>
                          Ocultar detalhes <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Ver detalhes técnicos <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                    {open && (
                      <pre className="mt-2 text-[11px] leading-relaxed p-3 rounded-xl bg-gray-50 dark:bg-black/40 text-gray-700 dark:text-white/70 overflow-x-auto whitespace-pre-wrap break-all">
                        {s.userAgent || 'User-Agent não registrado nesta sessão.'}
                      </pre>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(s)}
                    disabled={revokeMutation.isPending}
                    title="Desconectar sessão"
                    className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-40"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
