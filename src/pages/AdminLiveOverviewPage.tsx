import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Clock3,
  MapPin,
  Monitor,
  Radio,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { analyticsApi, type LivePresenceResponse, type LivePresenceSession } from '@/lib/api'
import { usePermissions } from '@/hooks/usePermissions'

const BR = { minLat: -33.75, maxLat: 5.27, minLng: -73.99, maxLng: -34.79 }

function latLngToBrazilPercent(lat: number, lng: number) {
  const x = ((lng - BR.minLng) / (BR.maxLng - BR.minLng)) * 100
  const y = ((BR.maxLat - lat) / (BR.maxLat - BR.minLat)) * 100
  return {
    x: Math.min(95, Math.max(5, x)),
    y: Math.min(92, Math.max(8, y)),
  }
}

function BrazilSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="brFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(6 182 212)" stopOpacity="0.12" />
        </linearGradient>
        <filter id="brGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        fill="url(#brFill)"
        stroke="currentColor"
        strokeWidth={0.45}
        strokeOpacity={0.45}
        filter="url(#brGlow)"
        d="M38 18 L52 14 L68 16 L82 22 L94 32 L100 48 L98 62 L102 76 L96 92 L84 108 L68 118 L48 122 L32 114 L22 98 L18 78 L20 58 L26 40 Z"
      />
    </svg>
  )
}

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
}: {
  label: string
  value: string | number
  icon: typeof Users
  accent: 'emerald' | 'cyan' | 'violet'
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
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  )
}

function MapPinDot({ p, i }: { p: LivePresenceSession & { x: number; y: number }; i: number }) {
  const title = `${p.userName || p.userEmail || 'Usuário'} · ${[p.geo?.city, p.geo?.region].filter(Boolean).join(', ')}`
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.12 + i * 0.04 }}
      className="absolute z-20 -ml-2 -mt-2"
      style={{ left: `${p.x}%`, top: `${p.y}%` }}
      title={title}
    >
      <span className="relative flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-4 w-4 rounded-full border border-white/30 bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-[0_0_14px_rgba(52,211,153,0.75)]" />
      </span>
    </motion.span>
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
    refetchInterval: 20_000,
  })

  const payload = presenceQuery.data

  const mapPoints = useMemo(() => {
    if (!payload?.sessions?.length) return []
    const list: Array<LivePresenceSession & { x: number; y: number; br: boolean }> = []
    for (const s of payload.sessions) {
      const g = s.geo
      if (!g || typeof g.lat !== 'number' || typeof g.lng !== 'number') continue
      const br = g.countryCode === 'BR'
      if (!br) continue
      const { x, y } = latLngToBrazilPercent(g.lat, g.lng)
      list.push({ ...s, x, y, br })
    }
    return list
  }, [payload?.sessions])

  const outsideBrazilCount = useMemo(() => {
    if (!payload?.sessions) return 0
    return payload.sessions.filter((s) => s.geo && s.geo.countryCode && s.geo.countryCode !== 'BR').length
  }, [payload?.sessions])

  const maxStateCount = useMemo(() => {
    const rows = payload?.brazilByState
    if (!rows?.length) return 1
    return Math.max(...rows.map((r) => r.count), 1)
  }, [payload?.brazilByState])

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
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
                Quem está com sessão ativa na janela escolhida. A posição no mapa é uma{' '}
                <span className="font-medium text-gray-800 dark:text-white/75">estimativa por IP</span>, não GPS.
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
        <StatCard label="Usuários distintos" value={payload?.uniqueUsers ?? '—'} icon={Users} accent="emerald" />
        <StatCard label="Sessões ativas" value={payload?.sessionCount ?? '—'} icon={Monitor} accent="cyan" />
        <StatCard label="Pontos no mapa (BR)" value={mapPoints.length} icon={MapPin} accent="violet" />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 md:p-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(52,211,153,0.18),transparent)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white md:text-xl">Presença no Brasil</h2>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-white/50">
                  {mapPoints.length === 0
                    ? 'Nenhum IP público geolocalizado no Brasil nesta janela (desenvolvimento local costuma não aparecer).'
                    : `${mapPoints.length} ponto(s) estimado(s) no território nacional.`}
                </p>
              </div>
              <div className="hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300/90 sm:block">
                IP → região
              </div>
            </div>

            <div className="relative mx-auto mt-6 w-full max-w-md">
              <div className="relative aspect-[6/7] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner">
                <BrazilSilhouette className="absolute inset-0 h-full w-full text-emerald-400/90" />
                <div className="absolute inset-[6%] rounded-xl bg-gradient-to-b from-emerald-500/5 to-transparent" />
                {mapPoints.map((p, i) => (
                  <MapPinDot key={`${p.sessionId}-${i}`} p={p} i={i} />
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-white/35">Silhueta ilustrativa · posição dos pontos derivada de lat/lng do IP</p>
            </div>

            {outsideBrazilCount > 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100/90"
              >
                {outsideBrazilCount} sessão(ões) com IP fora do Brasil — detalhes na tabela abaixo.
              </motion.p>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex flex-col rounded-3xl border border-gray-200/90 bg-white/90 p-6 shadow-md dark:border-white/[0.07] dark:bg-gray-950/60 md:p-8"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white md:text-xl">Por estado (BR)</h2>
            {payload?.generatedAt ? (
              <span className="text-[10px] text-gray-400 dark:text-white/35">
                {formatDistanceToNow(new Date(payload.generatedAt), { addSuffix: true, locale: ptBR })}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Volume relativo de sessões com IP associado ao estado.</p>

          <div className="mt-6 flex flex-1 flex-col gap-3">
            {payload?.brazilByState?.length ? (
              payload.brazilByState.slice(0, 12).map((row, idx) => {
                const pct = Math.round((row.count / maxStateCount) * 100)
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null
                return (
                  <div key={row.state} className="group">
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white/85">
                        {medal ? <span className="text-base leading-none">{medal}</span> : null}
                        {row.state}
                      </span>
                      <span className="tabular-nums text-sm font-bold text-emerald-600 dark:text-emerald-400">{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.05 + idx * 0.03 }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center dark:border-white/10">
                <MapPin className="mb-3 h-10 w-10 text-gray-300 dark:text-white/20" />
                <p className="text-sm text-gray-500 dark:text-white/45">Sem dados por estado nesta atualização.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white/95 shadow-lg dark:border-white/[0.07] dark:bg-gray-950/70 dark:shadow-none"
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-transparent px-5 py-4 dark:border-white/[0.06] dark:from-white/[0.03] md:px-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sessões</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/45">
            Dispositivo e IP registrados no login. Geolocalização opcional no servidor (aproximação).
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
                  <th className="px-5 py-3 md:px-6">Dispositivo</th>
                  <th className="px-5 py-3 md:px-6">IP</th>
                  <th className="px-5 py-3 md:px-6">Local (IP)</th>
                  <th className="px-5 py-3 md:px-6">Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {(payload?.sessions || []).map((s) => {
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
                            <span className="mt-0.5 inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-white/10 dark:text-white/50">
                              {s.userTipo}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] px-5 py-3.5 text-xs text-gray-600 dark:text-white/65 md:px-6">
                        <span className="line-clamp-2">{s.deviceLabel}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-gray-700 dark:text-white/70 md:px-6">
                        {s.ip || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs md:px-6">
                        {s.geo ? (
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white/85">
                              {[s.geo.city, s.geo.region].filter(Boolean).join(', ')}
                            </div>
                            <div className="text-gray-400 dark:text-white/35">{s.geo.country}</div>
                          </div>
                        ) : s.ip && !s.ipIsPublic ? (
                          <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-200/90">
                            IP local/privado
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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
