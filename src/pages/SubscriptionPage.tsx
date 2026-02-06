import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { subscriptionsApi } from '@/lib/api'

interface SubscriptionData {
  id: number
  user_id: number
  plan_name: string
  status: string
  stripe_subscription_id?: string
  current_period_start: string
  current_period_end: string
  start_date?: string
  end_date?: string
  price?: number
  payment_method?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  email: string
  name: string
  user_created_at?: string
  last_login?: string
  subscription_status?: string
  subscription_expires_at?: string
}

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await subscriptionsApi.getMySubscription()
        
        if (response.subscription) {
          setSubscription(response.subscription)
        }
      } catch (err: any) {
        console.error('Erro ao buscar assinatura:', err)
        setError(err.message || 'Erro ao carregar dados da assinatura')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Datas “só dia” (ex.: início/fim do período): evita mostrar dia anterior por causa de UTC
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
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'active' || statusLower === 'ativo') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          Ativo
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
    if (statusLower === 'trial' || statusLower === 'trial') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          Trial
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400">
        {status}
      </span>
    )
  }

  const getPlanBadge = (planName?: string) => {
    if (!planName) return null
    
    const planLower = planName.toLowerCase()
    if (planLower.includes('pro') || planLower === 'pro') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
          <Crown className="w-4 h-4" />
          PRO
        </span>
      )
    }
    if (planLower.includes('basic') || planLower === 'basic') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400">
          BASIC
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
        {planName.toUpperCase()}
      </span>
    )
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
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-2">
            Erro ao carregar dados
          </h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Plano & Assinatura
        </h1>
        <p className="text-gray-600 dark:text-white/70">
          Visualize todos os detalhes da sua assinatura e informações de pagamento
        </p>
      </motion.div>

      {subscription ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Informações do Usuário */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-white/[0.12] transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações do Usuário
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Nome</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {subscription.name || user?.nome || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Email</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {subscription.email || user?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Membro desde</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDateOnly(subscription.user_created_at || subscription.created_at)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Plano Atual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-white/[0.12] transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Plano Atual
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Plano</p>
                {getPlanBadge(subscription.plan_name)}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Status</p>
                {getStatusBadge(subscription.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Apelido</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {subscription.name || user?.nome || 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Informações de Pagamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-white/[0.12] transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações de Pagamento
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Valor do Pagamento</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {subscription.price != null && subscription.price > 0
                    ? `R$ ${Number(subscription.price).toFixed(2).replace('.', ',')}`
                    : 'R$ ---'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Método de Pagamento</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {String(subscription.payment_method || (subscription.stripe_subscription_id ? 'Cartão de Crédito' : 'pix')).toLowerCase() === 'pix' ? 'PIX' : (subscription.payment_method || 'Cartão de Crédito')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Status do Pagamento</p>
                {getStatusBadge(subscription.status)}
              </div>
            </div>
          </motion.div>

          {/* Card 4: Datas de Pagamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-white/[0.12] transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Datas de Pagamento
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Último Pagamento</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDateOnly(subscription.start_date || subscription.current_period_start)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Próximo Pagamento</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDateOnly(subscription.end_date || subscription.current_period_end)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Status de Renovação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-white/[0.12] transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status de Renovação
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-2">Status</p>
                {subscription.cancel_at_period_end ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                    Cancelará ao final do período
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Em dia
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white/70 mb-1">Renovação Automática</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {subscription.cancel_at_period_end ? 'Desativada' : 'Ativa'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 6: Atividade recente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-white to-gray-50/80 dark:from-white/10 dark:to-indigo-500/5 border border-gray-200 dark:border-indigo-500/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:shadow-none dark:hover:from-white/[0.12] dark:hover:to-indigo-500/10 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/25 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Atividade recente
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">Último acesso e início da assinatura</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 shrink-0">
                  <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">Último login</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {formatDateTime(subscription.last_login)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">Assinatura criada em</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {formatDateTime(subscription.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-8 text-center"
        >
          <CreditCard className="w-16 h-16 text-gray-400 dark:text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Nenhuma assinatura encontrada
          </h2>
          <p className="text-gray-600 dark:text-white/70">
            Você ainda não possui uma assinatura ativa. Entre em contato para contratar um plano.
          </p>
        </motion.div>
      )}
    </div>
  )
}
