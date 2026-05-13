import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não coincidem', path: ['confirm'] })

type Form = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { theme } = useAppStore()
  const isDark = theme === 'dark'
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const labelCls = isDark ? 'text-white/90' : 'text-gray-900'
  const mutedCls = isDark ? 'text-white/55' : 'text-gray-500'
  const errCls = isDark ? 'text-red-400' : 'text-red-600'

  useEffect(() => {
    if (!token || token.length < 32) {
      setValid(false)
      setChecking(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get<{ valid?: boolean }>(`/auth/reset-password/${encodeURIComponent(token)}`)
        if (!cancelled) {
          setValid(!!res.data?.valid)
        }
      } catch {
        if (!cancelled) setValid(false)
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const onSubmit = async (data: Form) => {
    if (!token) return
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { token, password: data.password })
      toast.success('Senha atualizada! Faça login.')
      navigate('/login', { replace: true })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Não foi possível alterar a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className={`w-full text-center py-10 text-sm ${mutedCls}`}>Verificando link…</div>
    )
  }

  if (!valid) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center space-y-4">
        <p className={isDark ? 'text-red-400' : 'text-red-600'}>Link inválido ou expirado.</p>
        <p className={mutedCls}>Solicite um novo link na página de recuperação de senha.</p>
        <Link
          to="/forgot-password"
          className={`inline-block font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
        >
          Pedir novo link
        </Link>
        <div>
          <Link to="/login" className={`text-sm ${mutedCls} underline`}>
            Voltar ao login
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-center mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Nova senha
        </h1>
        <p className={`mt-2 text-sm sm:text-base ${mutedCls}`}>Defina uma nova senha para sua conta.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="password" className={`block text-sm font-semibold ${labelCls}`}>
            Nova senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('password')}
              type={show1 ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              className={`input-primary w-full pl-11 pr-11 py-3 text-base rounded-xl ${errors.password ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShow1(!show1)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? 'text-white/40' : 'text-gray-400'}`}
              aria-label="Mostrar senha"
            >
              {show1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <div className={`flex items-center gap-2 text-sm ${errCls}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.password.message}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className={`block text-sm font-semibold ${labelCls}`}>
            Confirmar senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className={`h-5 w-5 ${isDark ? 'text-white/35' : 'text-gray-400'}`} />
            </div>
            <input
              {...register('confirm')}
              type={show2 ? 'text' : 'password'}
              id="confirm"
              autoComplete="new-password"
              className={`input-primary w-full pl-11 pr-11 py-3 text-base rounded-xl ${errors.confirm ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShow2(!show2)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${isDark ? 'text-white/40' : 'text-gray-400'}`}
              aria-label="Mostrar confirmação"
            >
              {show2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirm && (
            <div className={`flex items-center gap-2 text-sm ${errCls}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.confirm.message}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3.5 text-base font-semibold rounded-full shadow-md transition-all disabled:opacity-50 ${
            isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {submitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>

        <p className={`text-center text-sm ${mutedCls}`}>
          <Link to="/login" className="font-semibold underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </motion.div>
  )
}
