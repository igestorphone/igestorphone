import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Crown,
  DollarSign,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn,
  Sparkles,
  QrCode,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { asaasApi, subscriptionsApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { calendarDaysRemainingSaoPaulo, formatExpiryDatePtBrSaoPaulo } from '@/lib/subscriptionExpiryCalendar'
import toast from 'react-hot-toast'

interface SubscriptionData {
  id: number
  user_id: number
  plan_name: string
  status: string
  asaas_subscription_id?: string
  stripe_subscription_id?: string
  current_period_start?: string
  current_period_end?: string
  start_date?: string
  end_date?: string
  price?: number
  payment_method?: string
  cancel_at_period_end?: boolean
  created_at: string
  updated_at?: string
  email: string
  name: string
  user_created_at?: string
  last_login?: string
  subscription_status?: string
  subscription_expires_at?: string
  days_remaining?: number | null
  renew_recommended?: boolean
}

interface ProfileUser {
  id: number
  email: string
  name: string
  user_created_at?: string
  last_login?: string
  subscription_status?: string
  subscription_expires_at?: string
}

type AsaasPaymentRow = {
  id: string
  status: string
  value: number
  dueDate?: string
  paymentDate?: string
  billingType?: string
  description?: string
}

const cardUpdateSchema = z.object({
  holderName: z.string().min(2, 'Nome no cartão'),
  number: z.string().min(16, 'Número inválido'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  expiryYear: z.string().length(4, 'Ano inválido'),
  ccv: z.string().min(3, 'CVV inválido'),
  postalCode: z.string().min(8, 'CEP inválido'),
  addressNumber: z.string().min(1, 'Número obrigatório'),
})

type CardUpdateForm = z.infer<typeof cardUpdateSchema>

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [payments, setPayments] = useState<AsaasPaymentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardSaving, setCardSaving] = useState(false)
  /** Atualiza contador de dias após meia-noite (America/Sao_Paulo) sem F5. */
  const [dayTick, setDayTick] = useState(0)

  const cardForm = useForm<CardUpdateForm>({ resolver: zodResolver(cardUpdateSchema) })

  useEffect(() => {
    const id = window.setInterval(() => setDayTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = (await subscriptionsApi.getMySubscription()) as {
        subscription: SubscriptionData | null
        user?: ProfileUser | null
        days_remaining?: number | null
        renew_recommended?: boolean
      }
      setSubscription(response.subscription ?? null)
      setProfileUser(response.user ?? null)
    } catch (err: unknown) {
      console.error('Erro ao buscar assinatura:', err)
      setError(getErrorMessage(err) || 'Erro ao carregar dados da assinatura')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setPaymentsLoading(true)
      try {
        const res = (await asaasApi.getMyPayments()) as { payments?: AsaasPaymentRow[] }
        if (!cancelled) setPayments(res.payments || [])
      } catch {
        if (!cancelled) setPayments([])
      } finally {
        if (!cancelled) setPaymentsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [subscription?.id])

  const expiresAt = subscription?.subscription_expires_at ?? profileUser?.subscription_expires_at
  const daysRemaining = useMemo(() => calendarDaysRemainingSaoPaulo(expiresAt), [expiresAt, dayTick])
  const accountStatus = subscription?.subscription_status ?? profileUser?.subscription_status
  const renewRecommended =
    ['overdue', 'pending_payment'].includes(String(accountStatus || '').toLowerCase()) ||
    (daysRemaining !== null && daysRemaining <= 30)

  const display = useMemo(
    () => ({
      name: subscription?.name || profileUser?.name || user?.nome || 'N/A',
      email: subscription?.email || profileUser?.email || user?.email || 'N/A',
    }),
    [subscription, profileUser, user]
  )

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    const isMidnightUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCMilliseconds() === 0
    if (isMidnightUTC) {
      return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status?: string) => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower === 'active' || statusLower === 'ativo') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          Ativo
        </span>
      )
    }
    if (statusLower === 'pending' || statusLower === 'pending_payment') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4" />
          {statusLower === 'pending_payment' ? 'Aguardando pagamento' : 'Pendente'}
        </span>
      )
    }
    if (statusLower === 'canceled' || statusLower === 'cancelled' || statusLower === 'cancelado') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
          Cancelado
        </span>
      )
    }
    if (statusLower === 'past_due' || statusLower === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4" />
          Pagamento atrasado
        </span>
      )
    }
    if (statusLower === 'trial') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          Trial
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400">
        {status || '—'}
      </span>
    )
  }

  const paymentMethodLabel = (raw?: string) => {
    const s = String(raw || '').toLowerCase()
    if (s === 'pix') return 'PIX'
    if (s.includes('credit') || s === 'creditcard') return 'Cartão de crédito'
    return raw || '—'
  }

  const onSaveCard = async (data: CardUpdateForm) => {
    setCardSaving(true)
    try {
      await asaasApi.updateSubscriptionPaymentMethod({
        creditCard: {
          holderName: data.holderName,
          number: data.number.replace(/\s/g, ''),
          expiryMonth: data.expiryMonth,
          expiryYear: data.expiryYear,
          ccv: data.ccv,
        },
        creditCardHolderInfo: {
          name: data.holderName,
          email: display.email,
          cpfCnpj: String((user as any)?.cpf_cnpj || '').replace(/\D/g, ''),
          postalCode: data.postalCode.replace(/\D/g, ''),
          addressNumber: data.addressNumber,
          mobilePhone: String((user as any)?.phone || '').replace(/\D/g, ''),
        },
      })
      toast.success('Cartão cadastrado para cobrança automática.')
      await load()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Não foi possível salvar o cartão')
    } finally {
      setCardSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-2">Erro ao carregar dados</h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  const hasRecord = Boolean(subscription || profileUser)
  const memberSinceRaw = subscription?.user_created_at || profileUser?.user_created_at

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Assinatura</h1>
        <p className="text-gray-600 dark:text-white/70">
          Acesso mensal (30 dias). Renove com PIX ou cartão; cada pagamento confirmado libera mais 30 dias.
        </p>
      </motion.div>

      {!hasRecord ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-8 text-center"
        >
          <CreditCard className="w-16 h-16 text-gray-400 dark:text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhum dado de assinatura</h2>
          <p className="text-gray-600 dark:text-white/70 mb-6">Faça sua assinatura para liberar o sistema.</p>
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
          >
            Ir para pagamento
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-black p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-white/60 uppercase tracking-wide">Tempo de acesso</p>
                <p className="mt-1 text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                  {daysRemaining !== null ? `${daysRemaining} dias` : '—'}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
                  {expiresAt ? (
                    <>
                      Válido até{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatExpiryDatePtBrSaoPaulo(expiresAt)}
                      </span>
                    </>
                  ) : (
                    'Data de expiração não definida.'
                  )}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-white/50">Conta:</span>
                  {getStatusBadge(accountStatus)}
                </div>
              </div>
              {(renewRecommended || accountStatus === 'overdue' || accountStatus === 'pending_payment') && (
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    to="/checkout"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold px-5 py-3 border border-gray-900 dark:border-white"
                  >
                    <QrCode className="w-5 h-5" />
                    Renovar (PIX ou cartão)
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conta</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Nome</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{display.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/70 mb-1">E-mail</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{display.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-white/70 mb-1">No sistema desde</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {memberSinceRaw ? formatDateOnly(memberSinceRaw) : 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>

            {subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plano</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Assinatura</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300">
                      Mensal · 30 dias
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Status (Asaas)</p>
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>
              </motion.div>
            )}

            {subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pagamento</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Valor</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {subscription.price != null && subscription.price > 0
                        ? `R$ ${Number(subscription.price).toFixed(2).replace('.', ',')}`
                        : 'R$ ---'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Método</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {paymentMethodLabel(
                        subscription.payment_method || (subscription.stripe_subscription_id ? 'CREDIT_CARD' : undefined)
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Período</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Início (último ciclo)</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatDateOnly(subscription.start_date || subscription.current_period_start)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Fim previsto (registro)</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatDateOnly(subscription.end_date || subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Renovação</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-white/80">
                  Cada pagamento confirmado pelo Asaas adiciona <strong>30 dias</strong> ao seu acesso (a partir do
                  vencimento atual, se ainda estiver ativo).
                </p>
                {subscription?.cancel_at_period_end ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                    Cancelará ao final do período
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Recorrência ativa no Asaas
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-white to-gray-50/80 dark:from-white/10 dark:to-indigo-500/5 border border-gray-200 dark:border-indigo-500/20 rounded-2xl p-6 shadow-sm md:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/25 rounded-xl">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Atividade</h3>
                  <p className="text-xs text-gray-500 dark:text-white/50">Último acesso</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
                  <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">Último login</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {formatDateTime(subscription?.last_login || profileUser?.last_login)}
                  </p>
                </div>
              </div>
              {subscription?.created_at && (
                <p className="mt-3 text-xs text-gray-500 dark:text-white/50">
                  Assinatura registrada em {formatDateTime(subscription.created_at)}
                </p>
              )}
            </motion.div>
          </div>

          {subscription?.asaas_subscription_id && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-gray-600 dark:text-white/60" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cartão para débito automático</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/70 mb-4">
                Cadastre ou atualize o cartão da sua assinatura no Asaas. CPF e telefone precisam estar no seu perfil.
              </p>
              <form onSubmit={cardForm.handleSubmit(onSaveCard)} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">Nome no cartão</label>
                  <input
                    {...cardForm.register('holderName')}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-gray-900 dark:text-white"
                  />
                  {cardForm.formState.errors.holderName && (
                    <p className="text-xs text-red-500 mt-1">{cardForm.formState.errors.holderName.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">Número</label>
                  <input
                    {...cardForm.register('number')}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-gray-900 dark:text-white"
                  />
                  {cardForm.formState.errors.number && (
                    <p className="text-xs text-red-500 mt-1">{cardForm.formState.errors.number.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">Mês</label>
                  <input {...cardForm.register('expiryMonth')} placeholder="MM" className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">Ano</label>
                  <input {...cardForm.register('expiryYear')} placeholder="AAAA" className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">CVV</label>
                  <input type="password" {...cardForm.register('ccv')} className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">CEP</label>
                  <input {...cardForm.register('postalCode')} className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-white/70 mb-1">Número do endereço</label>
                  <input {...cardForm.register('addressNumber')} className="w-full rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-black px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={cardSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 disabled:opacity-60"
                  >
                    {cardSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Salvar cartão no Asaas
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 p-6 overflow-x-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Histórico de cobranças (Asaas)</h3>
            {paymentsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            ) : payments.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-white/60">Nenhuma cobrança listada ou assinatura ainda sem ID Asaas.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 text-left text-gray-500 dark:text-white/50">
                    <th className="py-2 pr-4">Vencimento</th>
                    <th className="py-2 pr-4">Pagamento</th>
                    <th className="py-2 pr-4">Valor</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-white/5">
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{formatDateOnly(p.dueDate)}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{p.paymentDate ? formatDateOnly(p.paymentDate) : '—'}</td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        {p.value != null ? `R$ ${Number(p.value).toFixed(2).replace('.', ',')}` : '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{p.status}</td>
                      <td className="py-2 text-gray-900 dark:text-white">{paymentMethodLabel(p.billingType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
