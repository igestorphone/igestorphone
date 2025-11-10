import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-9xl font-bold text-white/20 mb-4">404</div>
          <div className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Search className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Página não encontrada
          </h1>
          
          <p className="text-xl text-white/70 mb-8">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center justify-center space-x-2 py-3 px-6"
            >
              <Home className="w-5 h-5" />
              <span>Ir para Dashboard</span>
            </motion.button>

            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-outline flex items-center justify-center space-x-2 py-3 px-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </motion.button>
          </div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-3">
              Precisa de ajuda?
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Se você acredita que esta página deveria existir, entre em contato conosco:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 text-sm">
              <span className="text-blue-400">suporte@igestorphone.com</span>
              <span className="text-white/40 hidden sm:block">•</span>
              <span className="text-green-400">+55 11 99999-9999</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
