import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Save, Edit, X, Mail, Phone, Shield, Calendar, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: ''
  })

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || user.name || '',
        email: user.email || '',
        telefone: user.telefone || ''
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/users/profile', {
        name: formData.nome,
        email: formData.email,
        telefone: formData.telefone
      })

      // Atualizar dados do usuário
      await refreshUser()
      
      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      toast.error(error.response?.data?.message || 'Erro ao salvar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: user?.nome || user?.name || '',
      email: user?.email || '',
      telefone: user?.telefone || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <User className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Meu Perfil
        </h1>
        <p className="text-white/70 text-lg">
          Gerencie suas informações pessoais e configurações
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Profile Card */}
          <div className="glass rounded-2xl p-8 text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            >
              <User className="w-16 h-16 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {user?.nome || user?.name || 'Usuário'}
            </h2>
            <p className="text-white/70 mb-6">{user?.email}</p>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              user?.tipo === 'admin' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <Shield className="w-4 h-4 mr-2" />
              {user?.tipo === 'admin' ? 'Administrador' : 'Usuário'}
            </div>
          </div>

          {/* Account Info */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-400" />
              Informações da Conta
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Status</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  Ativa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Último Login</span>
                <span className="text-white text-sm">
                  {user?.last_login ? formatDateTime(user.last_login) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Membro desde</span>
                <span className="text-white text-sm">
                  {user?.created_at ? formatDateTime(user.created_at) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-white flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-400" />
                Informações Pessoais
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isEditing 
                    ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400' 
                    : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400'
                }`}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
              </motion.button>
            </div>

            <div className="space-y-6">
              {/* Nome */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-400" />
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 text-lg"
                    placeholder="Digite seu nome completo"
                  />
                ) : (
                  <div className="text-white py-4 px-4 bg-white/5 rounded-xl text-lg">
                    {formData.nome || 'Não informado'}
                  </div>
                )}
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-3 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-green-400" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 text-lg"
                    placeholder="Digite seu email"
                  />
                ) : (
                  <div className="text-white py-4 px-4 bg-white/5 rounded-xl text-lg">
                    {formData.email || 'Não informado'}
                  </div>
                )}
              </motion.div>

              {/* Telefone */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-white/90 mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-purple-400" />
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 text-lg"
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <div className="text-white py-4 px-4 bg-white/5 rounded-xl text-lg">
                    {formData.telefone || 'Não informado'}
                  </div>
                )}
              </motion.div>

              {/* Botões de Ação */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex space-x-4 pt-6"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    <span className="text-lg">{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl"
                  >
                    <X className="w-5 h-5" />
                    <span className="text-lg">Cancelar</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}