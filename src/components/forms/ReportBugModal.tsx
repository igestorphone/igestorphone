import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bug, Send, AlertCircle, AlertTriangle, AlertCircle as AlertCircleIcon, Zap } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

interface ReportBugModalProps {
  isOpen: boolean
  onClose: () => void
}

const severityOptions = [
  { value: 'low', label: 'Baixa', icon: AlertCircle, color: 'text-blue-600 dark:text-blue-400' },
  { value: 'medium', label: 'Média', icon: AlertTriangle, color: 'text-amber-600 dark:text-yellow-400' },
  { value: 'high', label: 'Alta', icon: AlertCircleIcon, color: 'text-orange-600 dark:text-orange-400' },
  { value: 'critical', label: 'Crítica', icon: Zap, color: 'text-red-600 dark:text-red-400' }
]

const fieldClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 transition-all'

export default function ReportBugModal({ isOpen, onClose }: ReportBugModalProps) {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    title: '',
    severity: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => {
      setMounted(false)
      clearInterval(timer)
    }
  }, [])

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Título do problema é obrigatório')
      return
    }

    if (!formData.severity) {
      toast.error('Selecione a severidade do problema')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Descrição do problema é obrigatória')
      return
    }

    if (formData.title.length > 100) {
      toast.error('Título deve ter no máximo 100 caracteres')
      return
    }

    if (formData.description.length > 500) {
      toast.error('Descrição deve ter no máximo 500 caracteres')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.post('/bug-reports', {
        title: formData.title.trim(),
        severity: formData.severity,
        description: formData.description.trim(),
        user_name: user?.name || user?.nome || 'Usuário Anônimo'
      })

      toast.success('Bug reportado com sucesso!')
      setFormData({ title: '', severity: '', description: '' })
      onClose()
    } catch (error: any) {
      console.error('Erro ao reportar bug:', error)
      toast.error(error?.response?.data?.message || 'Erro ao reportar bug')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'title' && value.length > 100) return
    if (name === 'description' && value.length > 500) return

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 overflow-hidden max-h-[90vh] overflow-y-auto">
              <motion.div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
                <motion.div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <motion.div className="relative z-10 flex items-center justify-between">
                  <motion.div className="flex items-center gap-3">
                    <motion.div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Bug className="w-6 h-6" />
                    </motion.div>
                    <h2 className="text-xl font-bold">Reportar Bug</h2>
                  </motion.div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
                <p className="relative z-10 mt-2 text-blue-100 text-sm">
                  Descreva o problema encontrado. Seu reporte será enviado para nossa equipe.
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <motion.div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10 space-y-2">
                  <motion.div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80">
                    <span className="font-medium">Reportado por:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {user?.name || user?.nome || 'Usuário Anônimo'}
                    </span>
                  </motion.div>
                  <motion.div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80">
                    <span className="font-medium">Data/Hora:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{formatDateTime(currentTime)}</span>
                  </motion.div>
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Título do Problema <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Botão não funciona na página X"
                    required
                    maxLength={100}
                    className={fieldClass}
                  />
                  <motion.div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Máximo 100 caracteres</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formData.title.length}/100 caracteres</span>
                  </motion.div>
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Severidade <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    required
                    className={fieldClass}
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                      Selecione a gravidade
                    </option>
                    {severityOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Descrição do Problema <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descreva o que aconteceu, onde aconteceu e como reproduzir o problema..."
                    rows={6}
                    required
                    maxLength={500}
                    className={`${fieldClass} resize-none`}
                  />
                  <motion.div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Máximo 500 caracteres</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length}/500 caracteres
                    </span>
                  </motion.div>
                </motion.div>

                <motion.div className="bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-400/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <motion.div className="text-sm text-blue-800 dark:text-blue-100">
                    <p className="font-semibold mb-1">Seu reporte será analisado</p>
                    <p className="text-blue-700/90 dark:text-blue-200/80">
                      Nossa equipe irá revisar o problema e entrar em contato se necessário.
                    </p>
                  </motion.div>
                </motion.div>

                <motion.div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-200 dark:border-white/30 rounded-xl text-gray-800 dark:text-white font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.title.trim() ||
                      !formData.severity ||
                      !formData.description.trim()
                    }
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
