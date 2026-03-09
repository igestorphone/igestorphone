import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { asaasApi } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  CreditCard,
  Check,
  Loader2,
  Copy,
  QrCode,
  AlertCircle,
  ChevronLeft,
  Lock
} from 'lucide-react'

type PlanKey = 'mensal' | 'trimestral' | 'anual'

const PLAN_LABELS: Record<PlanKey, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual'
}

const PLAN_VALUES: Record<PlanKey, number> = {
  mensal: 150,
  trimestral: 390,
  anual: 1200
}

// Step 1: Login/Register
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
})

const registerSchema = z.object({
  name: z.string().min(2, 'Nome com pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  cpfCnpj: z.string().min(11, 'CPF inválido').refine(v => /^\d{11}$|^\d{14}$/.test(v.replace(/\D/g, '')), 'CPF ou CNPJ inválido'),
  phone: z.string().optional()
})

const cardSchema = z.object({
  holderName: z.string().min(2, 'Nome no cartão'),
  number: z.string().min(16, 'Número inválido'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  expiryYear: z.string().length(4, 'Ano inválido'),
  ccv: z.string().min(3, 'CVV inválido'),
  postalCode: z.string().min(8, 'CEP inválido'),
  addressNumber: z.string().min(1, 'Número obrigatório')
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type CardForm = z.infer<typeof cardSchema>

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const planParam = (searchParams.get('plan') || 'mensal') as PlanKey
  const [plan, setPlan] = useState<PlanKey>(['mensal', 'trimestral', 'anual'].includes(planParam) ? planParam : 'mensal')
  const [step, setStep] = useState<'auth' | 'payment' | 'card' | 'pix' | 'success'>('auth')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [extraCpf, setExtraCpf] = useState('')
  const [extraPhone, setExtraPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pixData, setPixData] = useState<{ encodedImage?: string; payload?: string } | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success'>('idle')
  const { isAuthenticated, user, login, refreshUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && user && step === 'auth') {
      setStep('payment')
    }
  }, [isAuthenticated, user, step])

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })
  const cardForm = useForm<CardForm>({ resolver: zodResolver(cardSchema) })

  const onLogin = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    try {
      const ok = await login({ email: data.email, password: data.password })
      if (ok) {
        toast.success('Login realizado!')
        setStep('payment')
      } else {
        setError('Email ou senha inválidos')
      }
    } catch {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)
    try {
      const res = await asaasApi.registerCheckout({
        name: data.name,
        email: data.email,
        password: data.password,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
        phone: data.phone?.replace(/\D/g, '') || undefined
      })
      useAuthStore.setState({
        user: { ...res.user, tipo: res.user.role || 'user' },
        token: res.token,
        isAuthenticated: true
      })
      toast.success('Cadastro realizado!')
      setStep('payment')
    } catch (e: any) {
      setError(e.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitPayment = async (billingType: 'PIX' | 'CREDIT_CARD', cardData?: CardForm) => {
    setLoading(true)
    setError(null)
    try {
      const payload: any = { planKey: plan, billingType }
      const cpf = (user?.cpf_cnpj as string) || extraCpf?.replace(/\D/g, '')
      const phone = (user?.phone as string) || extraPhone?.replace(/\D/g, '')
      if (cpf) payload.cpfCnpj = cpf
      if (phone) payload.phone = phone

      if (billingType === 'CREDIT_CARD' && cardData) {
        payload.creditCard = {
          holderName: cardData.holderName,
          number: cardData.number.replace(/\s/g, ''),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv
        }
        payload.creditCardHolderInfo = {
          name: cardData.holderName,
          email: user?.email,
          cpfCnpj: ((user?.cpf_cnpj as string) || extraCpf || '').replace(/\D/g, ''),
          postalCode: cardData.postalCode.replace(/\D/g, ''),
          addressNumber: cardData.addressNumber
        }
      }

      const result = await asaasApi.createSubscription(payload)

      if (result.status === 'active') {
        setPaymentStatus('success')
        toast.success('Assinatura ativada!')
        setTimeout(() => refreshUser(), 500)
        setStep('success')
      } else if (result.pix) {
        setPixData(result.pix)
        setPaymentStatus('pending')
        setStep('pix')
      }
    } catch (e: any) {
      const msg = e.message || 'Erro ao processar pagamento'
      setError(msg)
      if (msg.includes('CPF')) toast.error('Informe o CPF no cadastro')
    } finally {
      setLoading(false)
    }
  }

  const copyPixPayload = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload)
      toast.success('Código copiado!')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="mt-8 mb-10">
          <h1 className="text-2xl font-bold">Finalizar assinatura</h1>
          <p className="mt-1 text-white/60">
            Plano {PLAN_LABELS[plan]} · R$ {PLAN_VALUES[plan].toFixed(2).replace('.', ',')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null) }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null) }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                >
                  Cadastrar
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                      placeholder="seu@email.com"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-400">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Senha</label>
                    <input
                      {...loginForm.register('password')}
                      type="password"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="mt-1 text-xs text-red-400">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-white py-3.5 font-semibold text-black flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
                  </button>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Nome</label>
                    <input
                      {...registerForm.register('name')}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                      placeholder="Seu nome"
                    />
                    {registerForm.formState.errors.name && (
                      <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                    <input
                      {...registerForm.register('email')}
                      type="email"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">CPF *</label>
                    <input
                      {...registerForm.register('cpfCnpj')}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                      placeholder="000.000.000-00"
                    />
                    {registerForm.formState.errors.cpfCnpj && (
                      <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.cpfCnpj.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Telefone (opcional)</label>
                    <input
                      {...registerForm.register('phone')}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Senha</label>
                    <input
                      {...registerForm.register('password')}
                      type="password"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-white py-3.5 font-semibold text-black flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Cadastrar e continuar'}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {!user?.cpf_cnpj && !extraCpf && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/80">Informe seu CPF para continuar o pagamento</p>
                  <input
                    value={extraCpf}
                    onChange={e => setExtraCpf(e.target.value.replace(/\D/g, '').slice(0, 14))}
                    placeholder="000.000.000-00"
                    className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder-white/40"
                  />
                  <input
                    value={extraPhone}
                    onChange={e => setExtraPhone(e.target.value)}
                    placeholder="Telefone (opcional)"
                    className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder-white/40"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(null); onSubmitPayment('PIX') }}
                  disabled={loading || !(user?.cpf_cnpj || extraCpf)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 py-4 flex flex-col items-center gap-2 hover:bg-white/10 disabled:opacity-50"
                >
                  <QrCode className="h-8 w-8 text-white/80" />
                  <span className="font-medium">PIX</span>
                  <span className="text-xs text-white/50">Pagamento instantâneo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('card')}
                  disabled={loading || !(user?.cpf_cnpj || extraCpf)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 py-4 flex flex-col items-center gap-2 hover:bg-white/10 disabled:opacity-50"
                >
                  <CreditCard className="h-8 w-8 text-white/80" />
                  <span className="font-medium">Cartão</span>
                  <span className="text-xs text-white/50">Parcela ou à vista</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Lock className="h-4 w-4" />
                <span>Seus dados estão protegidos com criptografia</span>
              </div>
              <form
                onSubmit={cardForm.handleSubmit(data => onSubmitPayment('CREDIT_CARD', data))}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Nome no cartão</label>
                  <input
                    {...cardForm.register('holderName')}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                    placeholder="Como está no cartão"
                  />
                  {cardForm.formState.errors.holderName && (
                    <p className="mt-1 text-xs text-red-400">{cardForm.formState.errors.holderName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Número do cartão</label>
                  <input
                    {...cardForm.register('number')}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-white/20"
                    placeholder="0000 0000 0000 0000"
                  />
                  {cardForm.formState.errors.number && (
                    <p className="mt-1 text-xs text-red-400">{cardForm.formState.errors.number.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Validade</label>
                    <div className="flex gap-2">
                      <input
                        {...cardForm.register('expiryMonth')}
                        placeholder="MM"
                        maxLength={2}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40"
                      />
                      <input
                        {...cardForm.register('expiryYear')}
                        placeholder="AAAA"
                        maxLength={4}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">CVV</label>
                    <input
                      {...cardForm.register('ccv')}
                      type="password"
                      maxLength={4}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">CEP</label>
                    <input
                      {...cardForm.register('postalCode')}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40"
                      placeholder="00000-000"
                    />
                    {cardForm.formState.errors.postalCode && (
                      <p className="mt-1 text-xs text-red-400">{cardForm.formState.errors.postalCode.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Número</label>
                    <input
                      {...cardForm.register('addressNumber')}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40"
                      placeholder="123"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white py-3.5 font-semibold text-black flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pagar agora'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'pix' && pixData && (
            <motion.div
              key="pix"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-sm text-white/60 mb-4">Escaneie o QR Code com o app do seu banco</p>
                {pixData.encodedImage && (
                  <img
                    src={`data:image/png;base64,${pixData.encodedImage}`}
                    alt="QR Code PIX"
                    className="mx-auto w-48 h-48 rounded-xl bg-white"
                  />
                )}
                {pixData.payload && (
                  <div className="mt-4">
                    <p className="text-xs text-white/50 mb-2">Ou copie o código PIX:</p>
                    <button
                      type="button"
                      onClick={copyPixPayload}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar código
                    </button>
                  </div>
                )}
                <p className="mt-6 text-xs text-white/40">
                  Após o pagamento, seu acesso será liberado automaticamente em segundos.
                </p>
              </div>
              <Link
                to="/login"
                className="block text-center text-sm text-white/60 hover:text-white"
              >
                Já paguei, ir para o sistema
              </Link>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-6">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold">Assinatura ativada!</h2>
              <p className="mt-2 text-white/60">Você já pode acessar todos os recursos do iGestorPhone.</p>
              <button
                onClick={() => navigate('/search-cheapest-iphone', { replace: true })}
                className="mt-8 w-full rounded-xl bg-white py-3.5 font-semibold text-black"
              >
                Acessar o sistema
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
