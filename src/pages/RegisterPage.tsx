import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2, Calendar, MapPin, Phone, Building2, FileText } from 'lucide-react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { registrationApi } from '@/lib/api'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  endereco: z
    .string()
    .min(1, 'Endereço é obrigatório'),
  data_nascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória'),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp é obrigatório')
    .regex(/^[0-9\s\(\)\-\+]+$/, 'Formato de WhatsApp inválido'),
  nome_loja: z
    .string()
    .min(1, 'Nome da loja é obrigatório')
    .min(2, 'Nome da loja deve ter pelo menos 2 caracteres'),
  cnpj: z
    .string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length === 14, {
      message: 'CNPJ inválido (deve ter 14 dígitos)'
    })
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  // Tentar pegar token de path parameter primeiro, depois query string
  const { token: tokenFromPath } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get('token')
  const token = tokenFromPath || tokenFromQuery
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenChecking, setTokenChecking] = useState(true)
  const [registered, setRegistered] = useState(false)
  
  // Debug: log para ver qual token está sendo usado
  useEffect(() => {
    console.log('🔑 RegisterPage - Token extraído:', {
      tokenFromPath,
      tokenFromQuery,
      finalToken: token,
      url: window.location.href,
      pathname: window.location.pathname
    })
  }, [tokenFromPath, tokenFromQuery, token])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  // Verificar se token é válido ao carregar
  useEffect(() => {
    let isMounted = true
    
    const checkToken = async () => {
      // Pequeno delay para garantir que o componente está montado
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!isMounted) return
      
      if (!token) {
        console.warn('⚠️ Nenhum token encontrado na URL')
        setTokenValid(false)
        setTokenChecking(false)
        return
      }

      try {
        console.log('🔍 Verificando token:', token)
        console.log('🔍 URL completa:', window.location.href)
        
        // Timeout reduzido para 10 segundos
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: A verificação do token está demorando muito.')), 10000)
        )
        
        const verifyPromise = registrationApi.verifyToken(token)
        const response = await Promise.race([verifyPromise, timeoutPromise]) as any
        
        if (!isMounted) return
        
        console.log('✅ Token válido:', response)
        setTokenValid(true)
        setTokenChecking(false)
      } catch (error: any) {
        if (!isMounted) return
        
        console.error('❌ Erro ao verificar token:', error)
        console.error('❌ Response:', error.response)
        console.error('❌ Status:', error.response?.status)
        console.error('❌ Data:', error.response?.data)
        console.error('❌ Message:', error.message)
        
        let message = 'Token inválido ou expirado'
        
        if (error.message?.includes('Timeout')) {
          message = 'A verificação do link está demorando muito. Tente novamente ou verifique sua conexão.'
        } else if (error.response?.status === 404) {
          message = 'Link de cadastro inválido. Verifique se copiou o link completo.'
        } else if (error.response?.status === 400) {
          message = error.response?.data?.message || 'Este link expirou. Gere um novo link.'
        } else if (error.response?.status === 500) {
          message = 'Erro no servidor. Tente novamente mais tarde ou entre em contato com o suporte.'
        } else if (!error.response) {
          message = 'Não foi possível conectar ao servidor. Verifique sua conexão e a URL da API.'
        } else {
          message = error.response?.data?.message || message
        }
        
        toast.error(message, { duration: 8000 })
        setTokenValid(false)
        setTokenChecking(false)
      }
    }

    checkToken()
    
    return () => {
      isMounted = false
    }
  }, [token])

  const onSubmit = async (data: RegisterForm) => {
    if (!token) return

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
        cnpj: data.cnpj || null
      })
      
      setRegistered(true)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao realizar cadastro'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (tokenChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-primary">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white/70 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Verificando link de cadastro...</p>
          <p className="text-white/50 text-sm mt-2">Se esta tela persistir, verifique se o link está correto</p>
        </div>
      </div>
    )
  }

  if (tokenValid === false && token) {
    // Token inválido ou expirado
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-primary p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Link Inválido</h2>
          <p className="text-white/70 mb-6">
            Este link de cadastro é inválido, expirado ou já foi utilizado.
          </p>
          <Link
            to="/login"
            className="btn-primary inline-block"
          >
            Ir para Login
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!token) {
    // Sem token - mostrar instruções para obter o link
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-primary p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center"
        >
          <User className="w-16 h-16 text-white/70 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Link de Cadastro Necessário</h2>
          <p className="text-white/70 mb-4">
            Para se cadastrar no sistema, você precisa de um link de cadastro fornecido pelo administrador.
          </p>
          <p className="text-white/60 text-sm mb-6">
            Se você já possui o link, copie e cole na barra de endereço do navegador ou clique diretamente nele.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="btn-primary inline-block w-full"
            >
              Voltar para Login
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-primary p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro Concluído com Sucesso!</h2>
          <div className="space-y-3 mb-6">
            <p className="text-white/90 font-medium">
              Seu cadastro foi enviado para aprovação do administrador.
            </p>
            <p className="text-white/70 text-sm">
              Você receberá um e-mail assim que sua conta for aprovada. Aguarde a confirmação para acessar o sistema.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-primary inline-block"
          >
            Voltar para Login
          </Link>
        </motion.div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-white/70 text-base">Preencha seus dados para se cadastrar</p>
        </div>

        {/* Name field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <label htmlFor="name" className="block text-sm font-medium text-white/90">
            Nome Completo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('name')}
              type="text"
              id="name"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.name ? 'input-error' : ''
              }`}
              placeholder="Seu nome completo"
            />
          </div>
          {errors.name && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.name.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Email field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label htmlFor="email" className="block text-sm font-medium text-white/90">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.email ? 'input-error' : ''
              }`}
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.email.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Endereço field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <label htmlFor="endereco" className="block text-sm font-medium text-white/90">
            Endereço
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('endereco')}
              type="text"
              id="endereco"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.endereco ? 'input-error' : ''
              }`}
              placeholder="Seu endereço completo"
            />
          </div>
          {errors.endereco && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.endereco.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Data de nascimento field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <label htmlFor="data_nascimento" className="block text-sm font-medium text-white/90">
            Data de Nascimento
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('data_nascimento')}
              type="date"
              id="data_nascimento"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.data_nascimento ? 'input-error' : ''
              }`}
            />
          </div>
          {errors.data_nascimento && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.data_nascimento.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* WhatsApp field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
        >
          <label htmlFor="whatsapp" className="block text-sm font-medium text-white/90">
            WhatsApp *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('whatsapp')}
              type="tel"
              id="whatsapp"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.whatsapp ? 'input-error' : ''
              }`}
              placeholder="(11) 99999-9999"
            />
          </div>
          {errors.whatsapp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.whatsapp.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Nome da Loja field */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.77, duration: 0.5 }}
        >
          <label htmlFor="nome_loja" className="block text-sm font-medium text-white/90">
            Nome da Loja *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('nome_loja')}
              type="text"
              id="nome_loja"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.nome_loja ? 'input-error' : ''
              }`}
              placeholder="Nome da sua loja"
            />
          </div>
          {errors.nome_loja && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.nome_loja.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* CNPJ field (opcional) */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.79, duration: 0.5 }}
        >
          <label htmlFor="cnpj" className="block text-sm font-medium text-white/90">
            CNPJ <span className="text-white/50">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('cnpj')}
              type="text"
              id="cnpj"
              className={`input-primary w-full pl-11 pr-4 py-3 text-base ${
                errors.cnpj ? 'input-error' : ''
              }`}
              placeholder="00.000.000/0000-00"
            />
          </div>
          {errors.cnpj && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.cnpj.message}</span>
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
          <label htmlFor="password" className="block text-sm font-medium text-white/90">
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/40" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`input-primary w-full pl-11 pr-11 py-3 text-base ${
                errors.password ? 'input-error' : ''
              }`}
              placeholder="Mínimo 6 caracteres"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-white/40 hover:text-white/60 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-white/40 hover:text-white/60 transition-colors" />
              )}
            </motion.button>
          </div>
          {errors.password && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errors.password.message}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Cadastrando...</span>
            </div>
          ) : (
            'Cadastrar'
          )}
        </motion.button>

        <div className="text-center">
          <p className="text-white/60 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  )
}

