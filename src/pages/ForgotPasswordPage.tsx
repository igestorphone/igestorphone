import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
})

type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { theme } = useAppStore()
  const isDark = theme === 'dark'
  const [sent, setSent] = useState(false)
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

  const onSubmit = async (data: Form) => {
    setSubmitting(true)
    try {
      const res = await api.post<{ message?: string }>('/auth/forgot-password', { email: data.email })
      toast.success(res.data?.message || 'Verifique seu e-mail.')
      setSent(true)
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      const msg = err.response?.data?.message || 'Não foi possível enviar. Tente novamente.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="text-center mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Esqueceu a senha?
        </h1>
        <p className={`mt-2 text-sm sm:text-base ${mutedCls}`}>
          Informe seu e-mail. Se existir uma conta, enviaremos um link para redefinir a senha.
        </p>
      </div>

      {sent ? (
        <div className={`rounded-xl p-4 text-sm ${isDark ? 'bg-white/10 text-white/90' : 'bg-gray-100 text-gray-800'}`}>
          <p className="mb-3">
            Se o e-mail estiver cadastrado, você receberá um link em alguns minutos. Confira também o{' '}
            <strong>spam</strong>.
          </p>
          <Link
            to="/login"
            className={`inline-flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className={`block text-sm font-semibold ${labelCls}`}>
              E-mail
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
                className={`input-primary w-full pl-11 pr-4 py-3 text-base rounded-xl ${errors.email ? 'input-error' : ''}`}
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

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 text-base font-semibold rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {submitting ? 'Enviando…' : 'Enviar link'}
          </button>

          <p className={`text-center text-sm ${mutedCls}`}>
            <Link
              to="/login"
              className={`inline-flex items-center justify-center gap-2 font-semibold ${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </motion.div>
  )
}
