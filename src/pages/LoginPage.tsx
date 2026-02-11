import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const { addNotification } = useAppStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const success = await login({
        email: data.email,
        password: data.senha
      })
      
      if (success) {
        toast.success('Login realizado com sucesso!')
        addNotification({
          type: 'success',
          message: 'Bem-vindo de volta!',
          duration: 3000
        })
        navigate('/search-cheapest-iphone')
      } else {
        toast.error('Email ou senha inválidos')
        setError('email', { message: 'Email ou senha inválidos' })
        setError('senha', { message: 'Email ou senha inválidos' })
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
      addNotification({
        type: 'error',
        message: 'Erro de conexão. Tente novamente.',
        duration: 5000
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <p className="text-slate-600 text-base">Acesse sua conta para continuar</p>
        </div>

        {/* Email field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`w-full pl-11 pr-4 py-3 text-base bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors ${
                errors.email ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''
              }`}
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.email.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Password field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('senha')}
              type={showPassword ? 'text' : 'password'}
              id="senha"
              className={`w-full pl-11 pr-11 py-3 text-base bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors ${
                errors.senha ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''
              }`}
              placeholder="Sua senha"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </motion.button>
          </div>
          {errors.senha && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.senha.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Submit button — neutro, profissional */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3 text-lg font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-md hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Entrando...</span>
            </div>
          ) : (
            'Entrar'
          )}
        </motion.button>

        {/* Link para cadastro */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Não tem conta?{' '}
            <Link 
              to="/register" 
              className="text-slate-700 font-semibold hover:text-slate-900 transition-colors underline underline-offset-2"
            >
              Cadastre-se aqui
            </Link>
          </p>
        </div>

      </form>
    </motion.div>
  )
}
