import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Phone, Store, Shield } from 'lucide-react'

interface SecurityAlertModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SecurityAlertModal({ isOpen, onClose }: SecurityAlertModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-lg mx-2 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <div className="glass rounded-2xl p-4 sm:p-6 shadow-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">⚠️ Aviso de Segurança</h2>
                    <p className="text-sm text-white/60 mt-1">Proteja-se contra golpes</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">
                    ⚠️ Atenção: Risco de WhatsApp Clonado
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Existe o risco de golpistas clonarem números de WhatsApp de fornecedores legítimos. 
                    Sempre verifique a identidade do vendedor antes de realizar qualquer pagamento.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-white font-semibold text-sm">📋 Recomendações de Segurança:</p>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium text-sm">1. Confirme por Vídeo</p>
                        <p className="text-white/70 text-xs mt-1">
                          Solicite uma ligação de vídeo para confirmar a identidade do vendedor antes de fechar negócio.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Store className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium text-sm">2. Pague com Motoboy em Loja</p>
                        <p className="text-white/70 text-xs mt-1">
                          Se não se sentir confortável, prefira pagar somente quando o motoboy estiver na loja física, 
                          onde você pode verificar o produto pessoalmente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                    <p className="text-white/60 text-xs leading-relaxed">
                      <strong className="text-white/80">Isenção de Responsabilidade:</strong> O iGestorPhone é uma 
                      plataforma de busca e comparação de preços. Não nos responsabilizamos por transações realizadas 
                      entre usuários e fornecedores, pois isso foge do nosso controle. Sempre verifique a identidade 
                      do vendedor e utilize métodos seguros de pagamento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-center sm:justify-end pt-4">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-h-[56px] touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                >
                  Entendi, estou ciente
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

