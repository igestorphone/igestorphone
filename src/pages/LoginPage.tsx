import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { requiresCheckoutOnly } from '@/lib/subscriptionAccess'
import toast from 'react-hot-toast'

function getPostLoginPath(): string {
  const u = useAuthStore.getState().user
  if (!u) return '/search-cheapest-iphone'
  if (requiresCheckoutOnly(u)) {
    return '/checkout'
  }
  return '/search-cheapest-iphone'
}

const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const { theme, addNotification } = useAppStore()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accountRemoved = searchParams.get('reason') === 'account_removed'
  const [showPassword, setShowPassword] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const success = await login({
        email: data.email,
        password: data.senha,
      })

      if (success) {
        toast.success('Login realizado com sucesso!')
        addNotification({
          type: 'success',
          message: 'Bem-vindo de volta!',
          duration: 3000,
        })
        const target = getPostLoginPath()
        setLeaving(true)
        window.setTimeout(() => {
          navigate(target, { replace: true })
        }, 280)
      } else {
        const backendMsg = useAuthStore.getState().error
        toast.error(backendMsg || 'Email ou senha inválidos')
        setError('email', { message: backendMsg || 'Email ou senha inválidos' })
        setError('senha', { message: backendMsg || 'Email ou senha inválidos' })
      }
    } catch {
      toast.error('Erro ao fazer login')
      addNotification({
        type: 'error',
        message: 'Erro de conexão. Tente novamente.',
        duration: 5000,
      })
    }
  }

  const labelCls = isDark ? 'text-white/90' : 'text-gray-900'
  const mutedCls = isDark ? 'text-white/55' : 'text-gray-500'
  const errCls = isDark ? 'text-red-400' : 'text-red-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={leaving ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      transition={{ duration: leaving ? 0.28 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="text-center mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Entrar</h1>
        <p className={`mt-2 text-sm sm:text-base ${mutedCls}`}>Entre com suas credenciais para acessar o sistema</p>
      </div>

      {accountRemoved && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          Sua conta foi excluída por falta de pagamento após o prazo de tolerância. Você pode se cadastrar novamente com o
          mesmo e-mail.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className={`block text-sm font-semibold ${labelCls}`}>
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              autoComplete="email"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${
                errors.email ? 'input-error' : ''
              }`}
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && (
            <div className={`flex items-center gap-2 text-sm ${errCls}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="senha" className={`block text-sm font-semibold ${labelCls}`}>
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('senha')}
              type={showPassword ? 'text' : 'password'}
              id="senha"
              autoComplete="current-password"
              className={`input-primary w-full pl-11 pr-11 py-3 text-base rounded-xl ${
                errors.senha ? 'input-error' : ''
              }`}
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className={`text-xs sm:text-sm font-medium transition-colors ${
                isDark ? 'text-white/50 hover:text-cyan-300' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Esqueceu a senha?
            </Link>
          </div>
          {errors.senha && (
            <div className={`flex items-center gap-2 text-sm ${errCls}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.senha.message}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 text-base font-semibold rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-white text-gray-900 hover:bg-white/90'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-80" />
              Entrando…
            </span>
          ) : (
            'Entrar'
          )}
        </button>

        <p className={`text-center text-sm pt-1 ${mutedCls}`}>
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className={`font-semibold transition-colors ${
              isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            Cadastre-se aqui
          </Link>
        </p>
      </form>
    </motion.div>
  )
}
