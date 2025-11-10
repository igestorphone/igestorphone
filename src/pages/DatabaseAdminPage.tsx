import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function DatabaseAdminPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)

  const handleBackup = async () => {
    setIsProcessing(true)
    setSelectedOperation('backup')
    
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Backup criado com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar backup')
    } finally {
      setIsProcessing(false)
      setSelectedOperation(null)
    }
  }

  const handleRestore = async () => {
    setIsProcessing(true)
    setSelectedOperation('restore')
    
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Banco restaurado com sucesso!')
    } catch (error) {
      toast.error('Erro ao restaurar banco')
    } finally {
      setIsProcessing(false)
      setSelectedOperation(null)
    }
  }

  const handleOptimize = async () => {
    setIsProcessing(true)
    setSelectedOperation('optimize')
    
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 4000))
      toast.success('Banco otimizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao otimizar banco')
    } finally {
      setIsProcessing(false)
      setSelectedOperation(null)
    }
  }

  const handleCleanup = async () => {
    setIsProcessing(true)
    setSelectedOperation('cleanup')
    
    try {
      // Simulate cleanup process
      await new Promise(resolve => setTimeout(resolve, 2500))
      toast.success('Limpeza concluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao limpar banco')
    } finally {
      setIsProcessing(false)
      setSelectedOperation(null)
    }
  }

  const databaseStats = [
    {
      title: 'Tamanho Total',
      value: '2.4 GB',
      icon: HardDrive,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Tabelas',
      value: '12',
      icon: Database,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Registros',
      value: '15,847',
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Última Otimização',
      value: '2 dias',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ]

  const operations = [
    {
      id: 'backup',
      title: 'Criar Backup',
      description: 'Crie um backup completo do banco de dados',
      icon: Download,
      color: 'from-blue-500 to-blue-600',
      action: handleBackup
    },
    {
      id: 'restore',
      title: 'Restaurar Backup',
      description: 'Restore o banco a partir de um backup',
      icon: Upload,
      color: 'from-green-500 to-green-600',
      action: handleRestore
    },
    {
      id: 'optimize',
      title: 'Otimizar Banco',
      description: 'Otimize o banco para melhor performance',
      icon: RefreshCw,
      color: 'from-purple-500 to-purple-600',
      action: handleOptimize
    },
    {
      id: 'cleanup',
      title: 'Limpeza',
      description: 'Remova dados antigos e desnecessários',
      icon: Trash2,
      color: 'from-red-500 to-red-600',
      action: handleCleanup
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Administração do Banco de Dados</h1>
        <p className="text-white/70 text-lg">
          Gerencie backups, otimizações e manutenção do banco
        </p>
      </motion.div>

      {/* Database Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {databaseStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            className="card text-center"
          >
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-white/70 text-sm">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Operations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-white">Operações do Banco</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operations.map((operation, index) => (
            <motion.div
              key={operation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              className="card hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${operation.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <operation.icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {operation.title}
                  </h3>
                  <p className="text-white/70 text-sm mb-4">
                    {operation.description}
                  </p>
                  
                  <button
                    onClick={operation.action}
                    disabled={isProcessing}
                    className={`btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedOperation === operation.id ? 'animate-pulse' : ''
                    }`}
                  >
                    {isProcessing && selectedOperation === operation.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processando...</span>
                      </div>
                    ) : (
                      operation.title
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-400" />
          Atividade Recente
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Backup automático realizado</p>
              <p className="text-white/60 text-sm">Backup completo criado com sucesso</p>
            </div>
            <span className="text-white/40 text-sm">2h atrás</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Otimização do banco</p>
              <p className="text-white/60 text-sm">Performance melhorada em 15%</p>
            </div>
            <span className="text-white/40 text-sm">1d atrás</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Limpeza de dados antigos</p>
              <p className="text-white/60 text-sm">1.2 GB de dados removidos</p>
            </div>
            <span className="text-white/40 text-sm">3d atrás</span>
          </div>
        </div>
      </motion.div>

      {/* Warnings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="card bg-yellow-500/10 border-yellow-500/30"
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Avisos Importantes</h4>
            <div className="text-sm text-yellow-300 space-y-2">
              <p>• Sempre faça backup antes de operações críticas</p>
              <p>• Operações de limpeza são irreversíveis</p>
              <p>• Otimizações podem causar lentidão temporária</p>
              <p>• Mantenha backups regulares para segurança</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
