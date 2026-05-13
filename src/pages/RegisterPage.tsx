import { useState, useEffect, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  Phone,
  Building2,
  FileText,
} from 'lucide-react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { registrationApi } from '@/lib/api'
import { useAppStore } from '@/stores/appStore'
import toast from 'react-hot-toast'

const acceptTermsField = z.boolean().refine((v) => v === true, {
  message: 'Você precisa aceitar os termos para continuar',
})

const inviteRegisterSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
    passwordConfirm: z.string().min(1, 'Confirme a senha'),
    endereco: z.string().min(1, 'Endereço é obrigatório'),
    data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
    whatsapp: z.string().min(1, 'WhatsApp é obrigatório').regex(/^[0-9\s()\-+]+$/, 'Formato de WhatsApp inválido'),
    nome_loja: z.string().min(1, 'Nome da loja é obrigatório').min(2, 'Nome da loja deve ter pelo menos 2 caracteres'),
    cnpj: z
      .string()
      .optional()
      .refine((val) => !val || val.replace(/\D/g, '').length === 14, {
        message: 'CNPJ inválido (deve ter 14 dígitos)',
      }),
    acceptTerms: acceptTermsField,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })

const publicRegisterSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
    whatsapp: z.string().min(1, 'WhatsApp é obrigatório').regex(/^[0-9\s()\-+]+$/, 'Formato de WhatsApp inválido'),
    password: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
    passwordConfirm: z.string().min(1, 'Confirme a senha'),
    acceptTerms: acceptTermsField,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })

type InviteRegisterForm = z.infer<typeof inviteRegisterSchema>
type PublicRegisterForm = z.infer<typeof publicRegisterSchema>

function getTokenFromUrl() {
  const pathname = window.location.pathname
  const match = pathname.match(/^\/(register|cadastro|r)\/([a-f0-9]{32,128})$/i)
  if (match?.[2]) return match[2]
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 2 && (parts[0] === 'register' || parts[0] === 'cadastro' || parts[0] === 'r')) {
    return parts[1]
  }
  return null
}

function TermsCheckbox({
  id,
  registerProps,
  error,
  isDark,
}: {
  id: string
  registerProps: UseFormRegisterReturn
  error?: string
  isDark: boolean
}) {
  const linkCls = isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-900'
  return (
    <div className="space-y-2">
      <label className={`flex items-start gap-3 cursor-pointer text-sm ${isDark ? 'text-white/85' : 'text-gray-700'}`}>
        <input id={id} type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-400 text-cyan-600 focus:ring-cyan-500" {...registerProps} />
        <span>
          Li e concordo com os{' '}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className={`font-medium underline underline-offset-2 ${linkCls}`}>
            Termos de Uso
          </Link>
          ,{' '}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={`font-medium underline underline-offset-2 ${linkCls}`}>
            Política de Privacidade
          </Link>{' '}
          e{' '}
          <Link to="/lgpd" target="_blank" rel="noopener noreferrer" className={`font-medium underline underline-offset-2 ${linkCls}`}>
            LGPD
          </Link>
          .
        </span>
      </label>
      {error && (
        <p className={`text-sm flex items-center gap-1.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

function RegisterSuccess({ isDark }: { isDark: boolean }) {
  const cardCls = isDark ? 'text-white/90' : 'text-gray-800'
  return (
    <div className="text-center py-4 space-y-4">
      <CheckCircle2 className={`w-16 h-16 mx-auto ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
      <h2 className={`text-2xl font-bold ${cardCls}`}>Cadastro recebido</h2>
      <p className={`text-sm sm:text-base ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
        Sua conta fica <strong>inativa</strong> até um administrador aprovar em <strong>Gerenciar usuários</strong>. Se você já combinou o pagamento direto com a equipe, aguarde a liberação — depois disso você poderá entrar normalmente.
      </p>
      <Link
        to="/login"
        className={`inline-block mt-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
          isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        Ir para o login
      </Link>
    </div>
  )
}

function PublicRegisterBody({ onRegistered, isDark }: { onRegistered: () => void; isDark: boolean }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const labelCls = isDark ? 'text-white/90' : 'text-gray-900'
  const mutedCls = isDark ? 'text-white/55' : 'text-gray-500'
  const errCls = isDark ? 'text-red-400' : 'text-red-600'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicRegisterForm>({
    resolver: zodResolver(publicRegisterSchema),
    defaultValues: { acceptTerms: false },
  })

  const onSubmit = async (data: PublicRegisterForm) => {
    setLoading(true)
    try {
      await registrationApi.registerPublic({
        name: data.name,
        email: data.email,
        password: data.password,
        whatsapp: data.whatsapp,
      })
      onRegistered()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Erro ao realizar cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
      <div className="text-center mb-2">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Cadastrar</h1>
        <p className={`mt-2 text-sm sm:text-base ${mutedCls}`}>Crie sua conta — a aprovação é feita pela equipe antes do primeiro acesso.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="pub-name" className={`block text-sm font-semibold ${labelCls}`}>
            Nome completo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('name')}
              id="pub-name"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.name ? 'input-error' : ''}`}
              placeholder="Seu nome completo"
              autoComplete="name"
            />
          </div>
          {errors.name && (
            <p className={`text-sm flex items-center gap-1.5 ${errCls}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="pub-email" className={`block text-sm font-semibold ${labelCls}`}>
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('email')}
              type="email"
              id="pub-email"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.email ? 'input-error' : ''}`}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className={`text-sm flex items-center gap-1.5 ${errCls}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="pub-wa" className={`block text-sm font-semibold ${labelCls}`}>
            WhatsApp
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('whatsapp')}
              type="tel"
              id="pub-wa"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.whatsapp ? 'input-error' : ''}`}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
            />
          </div>
          <p className={`text-xs ${mutedCls}`}>Formato: (XX) XXXXX-XXXX</p>
          {errors.whatsapp && (
            <p className={`text-sm flex items-center gap-1.5 ${errCls}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.whatsapp.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="pub-pass" className={`block text-sm font-semibold ${labelCls}`}>
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="pub-pass"
              className={`input-primary w-full pl-11 pr-11 py-3 text-base rounded-xl ${errors.password ? 'input-error' : ''}`}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className={`h-5 w-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              ) : (
                <Eye className={`h-5 w-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className={`text-sm flex items-center gap-1.5 ${errCls}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="pub-pass2" className={`block text-sm font-semibold ${labelCls}`}>
            Confirmar senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('passwordConfirm')}
              type={showPassword ? 'text' : 'password'}
              id="pub-pass2"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.passwordConfirm ? 'input-error' : ''}`}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>
          {errors.passwordConfirm && (
            <p className={`text-sm flex items-center gap-1.5 ${errCls}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.passwordConfirm.message}
            </p>
          )}
        </div>

        <TermsCheckbox id="pub-terms" registerProps={register('acceptTerms')} error={errors.acceptTerms?.message} isDark={isDark} />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-base font-semibold transition-opacity disabled:opacity-50 ${
            isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </span>
          ) : (
            'Cadastrar'
          )}
        </button>

        <p className={`text-center text-sm ${mutedCls}`}>
          Já tem uma conta?{' '}
          <Link to="/login" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            Entrar
          </Link>
        </p>
      </form>
    </motion.div>
  )
}

function InviteRegisterBody({
  token,
  onRegistered,
  isDark,
}: {
  token: string
  onRegistered: () => void
  isDark: boolean
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const labelCls = isDark ? 'text-white/90' : 'text-gray-900'
  const mutedCls = isDark ? 'text-white/55' : 'text-gray-500'
  const errCls = isDark ? 'text-red-400' : 'text-red-600'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteRegisterForm>({
    resolver: zodResolver(inviteRegisterSchema),
    defaultValues: { acceptTerms: false },
  })

  const onSubmit = async (data: InviteRegisterForm) => {
    setLoading(true)
    try {
      await registrationApi.register(token, {
        name: data.name,
        email: data.email,
        password: data.password,
        endereco: data.endereco,
        data_nascimento: data.data_nascimento,
        whatsapp: data.whatsapp,
        nome_loja: data.nome_loja,
        cnpj: data.cnpj || null,
      })
      onRegistered()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Erro ao realizar cadastro')
    } finally {
      setLoading(false)
    }
  }

  const field = (opts: {
    id: string
    label: string
    icon: ReactNode
    children: ReactNode
    error?: string
  }) => (
    <div className="space-y-2">
      <label htmlFor={opts.id} className={`block text-sm font-semibold ${labelCls}`}>
        {opts.label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{opts.icon}</div>
        {opts.children}
      </div>
      {opts.error && (
        <p className={`text-sm flex items-center gap-1.5 ${errCls}`}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {opts.error}
        </p>
      )}
    </div>
  )

  const iconMuted = isDark ? 'text-white/35' : 'text-gray-400'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-5">
      <div className="text-center mb-2">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Criar conta</h1>
        <p className={`mt-2 text-sm sm:text-base ${mutedCls}`}>Cadastro por convite — complete seus dados da loja.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {field({
          id: 'inv-name',
          label: 'Nome completo',
          icon: <User className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.name?.message,
          children: (
            <input
              {...register('name')}
              id="inv-name"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.name ? 'input-error' : ''}`}
              placeholder="Seu nome completo"
            />
          ),
        })}

        {field({
          id: 'inv-email',
          label: 'Email',
          icon: <Mail className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.email?.message,
          children: (
            <input
              {...register('email')}
              type="email"
              id="inv-email"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.email ? 'input-error' : ''}`}
              placeholder="seu@email.com"
            />
          ),
        })}

        {field({
          id: 'inv-end',
          label: 'Endereço',
          icon: <MapPin className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.endereco?.message,
          children: (
            <input
              {...register('endereco')}
              id="inv-end"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.endereco ? 'input-error' : ''}`}
              placeholder="Endereço completo"
            />
          ),
        })}

        {field({
          id: 'inv-dob',
          label: 'Data de nascimento',
          icon: <Calendar className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.data_nascimento?.message,
          children: (
            <input
              {...register('data_nascimento')}
              type="date"
              id="inv-dob"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.data_nascimento ? 'input-error' : ''}`}
            />
          ),
        })}

        {field({
          id: 'inv-wa',
          label: 'WhatsApp',
          icon: <Phone className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.whatsapp?.message,
          children: (
            <input
              {...register('whatsapp')}
              type="tel"
              id="inv-wa"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.whatsapp ? 'input-error' : ''}`}
              placeholder="(11) 99999-9999"
            />
          ),
        })}

        {field({
          id: 'inv-loja',
          label: 'Nome da loja',
          icon: <Building2 className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.nome_loja?.message,
          children: (
            <input
              {...register('nome_loja')}
              id="inv-loja"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.nome_loja ? 'input-error' : ''}`}
              placeholder="Nome da sua loja"
            />
          ),
        })}

        {field({
          id: 'inv-cnpj',
          label: 'CNPJ (opcional)',
          icon: <FileText className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.cnpj?.message,
          children: (
            <input
              {...register('cnpj')}
              id="inv-cnpj"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.cnpj ? 'input-error' : ''}`}
              placeholder="00.000.000/0000-00"
            />
          ),
        })}

        {field({
          id: 'inv-pass',
          label: 'Senha',
          icon: <Lock className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.password?.message,
          children: (
            <>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="inv-pass"
                className={`input-primary w-full pl-11 pr-11 py-3 text-base rounded-xl ${errors.password ? 'input-error' : ''}`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className={`h-5 w-5 ${iconMuted}`} />
                ) : (
                  <Eye className={`h-5 w-5 ${iconMuted}`} />
                )}
              </button>
            </>
          ),
        })}

        {field({
          id: 'inv-pass2',
          label: 'Confirmar senha',
          icon: <Lock className={`h-5 w-5 ${iconMuted}`} />,
          error: errors.passwordConfirm?.message,
          children: (
            <input
              {...register('passwordConfirm')}
              type={showPassword ? 'text' : 'password'}
              id="inv-pass2"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.passwordConfirm ? 'input-error' : ''}`}
              placeholder="Repita a senha"
            />
          ),
        })}

        <TermsCheckbox id="inv-terms" registerProps={register('acceptTerms')} error={errors.acceptTerms?.message} isDark={isDark} />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-base font-semibold transition-opacity disabled:opacity-50 ${
            isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cadastrando...
            </span>
          ) : (
            'Cadastrar'
          )}
        </button>

        <p className={`text-center text-sm ${mutedCls}`}>
          <Link to="/login" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            Voltar ao login
          </Link>
        </p>
      </form>
    </motion.div>
  )
}

export default function RegisterPage() {
  const { token: tokenFromPath } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get('token')
  const tokenFromUrl = getTokenFromUrl()
  const token = tokenFromPath || tokenFromQuery || tokenFromUrl

  const theme = useAppStore((s) => s.theme)
  const isDark = theme === 'dark'

  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenChecking, setTokenChecking] = useState(Boolean(token))
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenValid(null)
      setTokenChecking(false)
      return
    }

    let cancelled = false
    const checkToken = async () => {
      setTokenChecking(true)
      setTokenValid(null)
      try {
        await registrationApi.verifyToken(token)
        if (!cancelled) {
          setTokenValid(true)
          setTokenChecking(false)
        }
      } catch (error: unknown) {
        if (cancelled) return
        const err = error as { response?: { status?: number; data?: { message?: string } } }
        let message = 'Link de cadastro inválido ou expirado'
        if (err.response?.status === 404) message = 'Link inválido. Verifique se copiou o endereço completo.'
        else if (err.response?.data?.message) message = err.response.data.message
        toast.error(message, { duration: 6000 })
        setTokenValid(false)
        setTokenChecking(false)
      }
    }

    void checkToken()
    return () => {
      cancelled = true
    }
  }, [token])

  const mutedCenter = isDark ? 'text-white/70' : 'text-gray-600'

  if (token && tokenChecking) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${mutedCenter}`}>
        <Loader2 className="w-10 h-10 animate-spin opacity-70 mb-3" />
        <p className="text-sm">Verificando link de cadastro...</p>
      </div>
    )
  }

  if (token && tokenValid === false) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className={`w-14 h-14 mx-auto ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Link inválido</h2>
        <p className={`text-sm ${mutedCenter}`}>Este convite expirou, já foi usado ou não existe.</p>
        <Link
          to="/login"
          className={`inline-block px-5 py-2.5 rounded-xl font-medium ${
            isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
          }`}
        >
          Ir para o login
        </Link>
      </div>
    )
  }

  if (registered) {
    return <RegisterSuccess isDark={isDark} />
  }

  if (token && tokenValid) {
    return <InviteRegisterBody token={token} onRegistered={() => setRegistered(true)} isDark={isDark} />
  }

  return <PublicRegisterBody onRegistered={() => setRegistered(true)} isDark={isDark} />
}
