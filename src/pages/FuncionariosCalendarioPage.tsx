import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Calendar, Users, Mail, Loader2, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

interface Funcionario {
  id: number
  name: string
  email: string
  tipo: string
  created_at: string
  is_active: boolean
}

export default function FuncionariosCalendarioPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', senha: '' })

  const loadFuncionarios = async () => {
    try {
      const { data } = await api.get<{ funcionarios: Funcionario[] }>('/users/meus-funcionarios')
      setFuncionarios(data.funcionarios || [])
    } catch (e: any) {
      if (e.response?.status === 403) {
        toast.error('Apenas o assinante pode acessar esta página.')
        return
      }
      toast.error(e.response?.data?.message || 'Erro ao carregar usuários do calendário')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFuncionarios()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.senha) {
      toast.error('Preencha nome, email e senha.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/users/funcionario-calendario', {
        name: form.name.trim(),
        email: form.email.trim(),
        senha: form.senha,
      })
      toast.success('Usuário do calendário criado. O funcionário já pode fazer login e usar só o calendário.')
      setForm({ name: '', email: '', senha: '' })
      loadFuncionarios()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao criar usuário')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExcluir = async (id: number, name: string) => {
    if (!window.confirm(`Excluir o usuário do calendário "${name}"? Ele não poderá mais fazer login.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/users/funcionario-calendario/${id}`)
      toast.success('Usuário do calendário excluído.')
      loadFuncionarios()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-blue-500/20 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Usuário do calendário
        </h1>
        <p className="text-gray-600 dark:text-white/70">
          Crie um login para seu funcionário usar apenas o calendário, sem acesso a fornecedores nem ao restante do sistema.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Criar novo usuário (só calendário)
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
              placeholder="Nome do funcionário"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Email (login)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Senha</label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            Criar usuário do calendário
          </button>
        </form>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Usuários do calendário criados por você
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : funcionarios.length === 0 ? (
          <p className="text-gray-500 dark:text-white/50 text-center py-6">
            Nenhum usuário criado ainda. Use o formulário acima para criar um login para seu funcionário.
          </p>
        ) : (
          <ul className="space-y-3">
            {funcionarios.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-white/50 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                    <p className="text-sm text-gray-500 dark:text-white/60 truncate">{f.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    Criado em {formatDateTime(f.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExcluir(f.id, f.name)}
                    disabled={deletingId === f.id}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Excluir usuário do calendário"
                  >
                    {deletingId === f.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  )
}
