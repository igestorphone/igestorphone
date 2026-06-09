import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Clock3,
  LogIn,
  Monitor,
  Radio,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { analyticsApi, type LivePresenceResponse, type LivePresenceSession } from '@/lib/api'
import { usePermissions } from '@/hooks/usePermissions'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const itemFade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  pulse,
}: {
  label: string
  value: string | number
  icon: typeof Users
  accent: 'emerald' | 'cyan' | 'violet'
  pulse?: boolean
}) {
  const ring =
    accent === 'emerald'
      ? 'from-emerald-500/20 via-emerald-400/5 to-transparent'
      : accent === 'cyan'
        ? 'from-cyan-500/20 via-cyan-400/5 to-transparent'
        : 'from-violet-500/20 via-violet-400/5 to-transparent'
  const iconBg =
    accent === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : accent === 'cyan'
        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
        : 'bg-violet-500/15 text-violet-600 dark:text-violet-400'

  return (
    <motion.div
      variants={itemFade}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-gray-950/60"
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${ring} blur-2xl transition-opacity group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-white/45">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {pulse ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-xl bg-emerald-400/30" />
          ) : null}
          <Icon className="relative h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  )
}

function LivePulseBar({ active }: { active: boolean }) {
  return (
    <div className="relative h-1 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        animate={active ? { x: ['-100%', '400%'] } : { opacity: 0.3 }}
        transition={active ? { duration: 2.2, repeat: Infinity, ease: 'linear' } : {}}
      />
    </div>
  )
}

function tipoBadge(tipo: string | null) {
  const t = (tipo || 'user').toLowerCase()
  if (t === 'admin') return { label: 'Admin', cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25' }
  return { label: 'Usuário', cls: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/55 border-gray-200/80 dark:border-white/10' }
}

function LiveEntryCard({ session, index }: { session: LivePresenceSession; index: number }) {
  const initial = (session.userName || session.userEmail || '?').charAt(0).toUpperCase()
  const badge = tipoBadge(session.userTipo)
  const enteredAgo = session.createdAt
    ? formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: ptBR })
    : null
  const activeAgo = session.lastActivityAt
    ? formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true, locale: ptBR })
    : null
  const location = session.geo
    ? [session.geo.city, session.geo.region, session.geo.countryCode].filter(Boolean).join(' · ')
    : session.ip && !session.ipIsPublic
      ? 'IP local'
      : null
  const isFreshEntry =
    session.createdAt &&
    Date.now() - new Date(session.createdAt).getTime() < 3 * 60 * 1000

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.04 }}
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-shadow hover:shadow-lg ${
        isFreshEntry
          ? 'border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent shadow-emerald-500/10'
          : 'border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]'
      }`}
    >
      {isFreshEntry ? (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/8 to-emerald-400/0"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        />
      ) : null}

      <div className="relative flex gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 text-sm font-bold text-white ring-1 ring-white/10">
            {initial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-white">{session.userName || 'Sem nome'}</span>
            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
              {badge.label}
            </span>
            {isFreshEntry ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <Zap className="h-3 w-3" />
                Novo
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-white/45">{session.userEmail}</p>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
            {enteredAgo ? (
              <span className="inline-flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5 text-emerald-400/80" />
                Entrou {enteredAgo}
              </span>
            ) : null}
            {activeAgo ? (
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400/80" />
                Ativo {activeAgo}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-white/60">
              <Smartphone className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1 max-w-[200px]">{session.deviceLabel}</span>
            </span>
            {session.ip ? (
              <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-white/50">{session.ip}</span>
            ) : null}
            {location ? (
              <span className="rounded-lg bg-white/5 px-2 py-1 text-white/45">{location}</span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex animate-pulse gap-4 px-4 py-4">
          <div className="h-10 flex-1 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
          <div className="h-10 w-28 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
          <div className="h-10 w-24 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
        </div>
      ))}
    </div>
  )
}

export default function AdminLiveOverviewPage() {
  const { isAdmin } = usePermissions()
  const [withinMinutes, setWithinMinutes] = useState(10)

  const presenceQuery = useQuery({
    queryKey: ['admin-live-presence', withinMinutes],
    queryFn: async () => {
      const raw = await analyticsApi.livePresence({ minutes: withinMinutes })
      const body = raw as unknown as LivePresenceResponse & { data?: LivePresenceResponse }
      if (body && typeof body === 'object' && 'data' in body && body.data && typeof body.data === 'object' && 'sessions' in body.data) {
        return body.data
      }
      return body as LivePresenceResponse
    },
    enabled: isAdmin,
    refetchInterval: 15_000,
  })

  const payload = presenceQuery.data

  const recentEntries = useMemo(() => {
    if (!payload?.sessions?.length) return 0
    const cutoff = Date.now() - withinMinutes * 60 * 1000
    return payload.sessions.filter((s) => s.createdAt && new Date(s.createdAt).getTime() >= cutoff).length
  }, [payload?.sessions, withinMinutes])

  const sortedSessions = useMemo(() => {
    if (!payload?.sessions?.length) return []
    return [...payload.sessions].sort((a, b) => {
      const aT = new Date(a.createdAt || 0).getTime()
      const bT = new Date(b.createdAt || 0).getTime()
      return bT - aT
    })
  }, [payload?.sessions])

  const deviceBreakdown = useMemo(() => {
    if (!payload?.sessions?.length) return []
    const counts: Record<string, number> = {}
    for (const s of payload.sessions) {
      const label = s.deviceLabel?.split('·')[0]?.trim() || s.deviceLabel || 'Outro'
      const key = label.length > 28 ? `${label.slice(0, 26)}…` : label
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [payload?.sessions])

  const maxDeviceCount = useMemo(() => {
    if (!deviceBreakdown.length) return 1
    return Math.max(...deviceBreakdown.map((d) => d.count), 1)
  }, [deviceBreakdown])

  const hasActiveSessions = (payload?.sessionCount ?? 0) > 0

  if (!isAdmin) {
    return (
      <div className="mx-auto mt-10 max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/15 to-amber-950/40 p-8 text-center shadow-lg shadow-amber-900/20"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-200">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <p className="text-lg font-semibold text-amber-50">Acesso restrito</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/75">Esta área é exclusiva de administradores.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[60vh] space-y-8 pb-12 pt-1 md:pt-2">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-gradient-to-b from-emerald-500/[0.07] via-transparent to-transparent dark:from-emerald-500/10" />

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-gray-200/90 bg-gradient-to-br from-white via-white to-emerald-50/50 p-6 shadow-md shadow-gray-200/40 dark:border-white/[0.07] dark:from-gray-950 dark:via-gray-950 dark:to-emerald-950/25 dark:shadow-none md:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/5" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              {hasActiveSessions ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
                </span>
              ) : null}
              <Activity className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  Monitor ao vivo
                </h1>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Admin
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    presenceQuery.isFetching
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                      : 'border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300/90'
                  }`}
                >
                  <Radio className={`h-3 w-3 ${presenceQuery.isFetching ? 'animate-pulse' : ''}`} />
                  {presenceQuery.isFetching ? 'Atualizando' : 'Ao vivo'}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-white/55">
                Acompanhe em tempo real quem entrou e quem está ativo no sistema. Atualiza automaticamente a cada 15 segundos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200/90 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
              <Clock3 className="h-4 w-4 text-gray-400 dark:text-white/40" />
              <label htmlFor="live-window" className="sr-only">
                Janela de tempo
              </label>
              <select
                id="live-window"
                value={withinMinutes}
                onChange={(e) => setWithinMinutes(Number(e.target.value))}
                className="cursor-pointer bg-transparent text-sm font-medium text-gray-900 focus:outline-none dark:text-white"
              >
                {[5, 10, 15, 30, 60].map((m) => (
                  <option key={m} value={m} className="text-gray-900">
                    Últimos {m} min
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => presenceQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              <RefreshCw className={`h-4 w-4 ${presenceQuery.isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </motion.header>

      {presenceQuery.isError ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.07] px-4 py-4 text-red-900 dark:text-red-100"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold">Não foi possível carregar</p>
            <p className="mt-1 text-sm opacity-90">Confirme se você está logado como administrador e tente novamente.</p>
          </div>
        </motion.div>
      ) : null}

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <StatCard label="Usuários distintos" value={payload?.uniqueUsers ?? '—'} icon={Users} accent="emerald" pulse={hasActiveSessions} />
        <StatCard label="Sessões ativas" value={payload?.sessionCount ?? '—'} icon={Monitor} accent="cyan" />
        <StatCard label="Entradas na janela" value={recentEntries} icon={LogIn} accent="violet" pulse={recentEntries > 0} />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 md:p-8 xl:col-span-2"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(52,211,153,0.18),transparent)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.2]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white md:text-xl">Quem está entrando</h2>
                <p className="mt-1 text-xs text-white/45">
                  Ordenado pela entrada mais recente · badge <span className="text-emerald-400">Novo</span> = entrou há menos de 3 min
                </p>
              </div>
              {payload?.generatedAt ? (
                <span className="text-[10px] text-white/35">
                  Atualizado {formatDistanceToNow(new Date(payload.generatedAt), { addSuffix: true, locale: ptBR })}
                </span>
              ) : null}
            </div>

            <LivePulseBar active={hasActiveSessions} />

            <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {presenceQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : sortedSessions.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {sortedSessions.map((s, i) => (
                    <LiveEntryCard key={s.sessionId} session={s} index={i} />
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center"
                >
                  <div className="relative mb-4">
                    <Monitor className="h-12 w-12 text-white/15" />
                    <motion.span
                      className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white/20"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-sm font-medium text-white/60">Ninguém online nesta janela</p>
                  <p className="mt-1 max-w-xs text-xs text-white/35">
                    Amplie o intervalo de minutos ou aguarde alguém fazer login no sistema.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex flex-col gap-6"
        >
          <div className="rounded-3xl border border-gray-200/90 bg-white/90 p-6 shadow-md dark:border-white/[0.07] dark:bg-gray-950/60 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo rápido</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Números da janela selecionada</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Online', value: payload?.sessionCount ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Entradas', value: recentEntries, color: 'text-violet-600 dark:text-violet-400' },
                { label: 'Usuários', value: payload?.uniqueUsers ?? 0, color: 'text-cyan-600 dark:text-cyan-400' },
                {
                  label: 'Admins',
                  value: payload?.sessions?.filter((s) => (s.userTipo || '').toLowerCase() === 'admin').length ?? 0,
                  color: 'text-amber-600 dark:text-amber-400',
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-center dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-white/40">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-3xl border border-gray-200/90 bg-white/90 p-6 shadow-md dark:border-white/[0.07] dark:bg-gray-950/60 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dispositivos</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Onde as pessoas estão acessando</p>

            <div className="mt-5 flex flex-1 flex-col gap-3">
              {deviceBreakdown.length > 0 ? (
                deviceBreakdown.map((row, idx) => {
                  const pct = Math.round((row.count / maxDeviceCount) * 100)
                  return (
                    <div key={row.device} className="group">
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-gray-800 dark:text-white/85">{row.device}</span>
                        <span className="shrink-0 tabular-nums text-sm font-bold text-cyan-600 dark:text-cyan-400">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.05 + idx * 0.04 }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-10 text-center dark:border-white/10">
                  <Smartphone className="mb-3 h-9 w-9 text-gray-300 dark:text-white/20" />
                  <p className="text-sm text-gray-500 dark:text-white/45">Sem dispositivos nesta janela.</p>
                </div>
              )}
            </div>
          </div>

          {payload?.brazilByState?.length ? (
            <div className="rounded-3xl border border-gray-200/90 bg-white/90 p-6 shadow-md dark:border-white/[0.07] dark:bg-gray-950/60">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Por estado</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {payload.brazilByState.slice(0, 8).map((row) => (
                  <span
                    key={row.state}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"
                  >
                    {row.state} · {row.count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white/95 shadow-lg dark:border-white/[0.07] dark:bg-gray-950/70 dark:shadow-none"
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-transparent px-5 py-4 dark:border-white/[0.06] dark:from-white/[0.03] md:px-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes das sessões</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/45">
            Visão completa com IP, dispositivo e última atividade.
          </p>
        </div>

        <div className="overflow-x-auto">
          {presenceQuery.isLoading ? (
            <TableSkeleton />
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/40">
                  <th className="px-5 py-3 md:px-6">Usuário</th>
                  <th className="px-5 py-3 md:px-6">Entrada</th>
                  <th className="px-5 py-3 md:px-6">Dispositivo</th>
                  <th className="px-5 py-3 md:px-6">IP</th>
                  <th className="px-5 py-3 md:px-6">Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {sortedSessions.map((s) => {
                  const initial = (s.userName || s.userEmail || '?').charAt(0).toUpperCase()
                  return (
                    <tr
                      key={s.sessionId}
                      className="transition-colors hover:bg-emerald-500/[0.04] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-xs font-bold text-gray-700 dark:from-white/15 dark:to-white/5 dark:text-white/90">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white">{s.userName || '—'}</div>
                            <div className="truncate text-xs text-gray-500 dark:text-white/45">{s.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-600 dark:text-white/60 md:px-6">
                        {s.createdAt
                          ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: ptBR })
                          : '—'}
                      </td>
                      <td className="max-w-[200px] px-5 py-3.5 text-xs text-gray-600 dark:text-white/65 md:px-6">
                        <span className="line-clamp-2">{s.deviceLabel}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-gray-700 dark:text-white/70 md:px-6">
                        {s.ip || '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-600 dark:text-white/60 md:px-6">
                        {s.lastActivityAt ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                            {formatDistanceToNow(new Date(s.lastActivityAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {payload?.sessions?.length === 0 && !presenceQuery.isLoading ? (
          <div className="border-t border-gray-100 px-6 py-12 text-center dark:border-white/[0.06]">
            <Monitor className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-white/15" />
            <p className="text-sm font-medium text-gray-700 dark:text-white/70">Nenhuma sessão nesta janela</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Amplie o intervalo de minutos ou aguarde acessos ao sistema.</p>
          </div>
        ) : null}
      </motion.section>
    </div>
  )
}
