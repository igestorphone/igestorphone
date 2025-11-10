import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Target,
  Plus,
  StickyNote,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  PauseCircle,
  Rocket
} from 'lucide-react'
import { goalsApi, notesApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

interface GoalFormState {
  id?: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'abandoned' | 'completed'
  priority: 'low' | 'medium' | 'high'
}

interface NoteFormState {
  id?: number
  title: string
  content: string
}

const initialGoalForm: GoalFormState = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium'
}

const initialNoteForm: NoteFormState = {
  title: '',
  content: ''
}

export default function GoalsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState<GoalFormState>(initialGoalForm)
  const [noteForm, setNoteForm] = useState<NoteFormState>(initialNoteForm)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null)

  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-white/70">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll(),
    select: (response: any) => response?.goals || [],
    staleTime: 5000
  })

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.getAll(),
    select: (response: any) => response?.notes || [],
    staleTime: 5000
  })

  const createGoalMutation = useMutation({
    mutationFn: (data: GoalFormState) => goalsApi.create(data),
    onSuccess: () => {
      toast.success('Meta criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      closeGoalModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar meta')
    }
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GoalFormState> }) => goalsApi.update(id, data),
    onSuccess: () => {
      toast.success('Meta atualizada!')
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      closeGoalModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar meta')
    }
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => goalsApi.delete(id),
    onSuccess: () => {
      toast.success('Meta removida!')
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
    onError: () => {
      toast.error('Erro ao remover meta')
    }
  })

  const createNoteMutation = useMutation({
    mutationFn: (data: NoteFormState) => notesApi.create(data),
    onSuccess: () => {
      toast.success('Anotação criada!')
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      closeNoteModal()
    },
    onError: () => {
      toast.error('Erro ao criar anotação')
    }
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NoteFormState> }) => notesApi.update(id, data),
    onSuccess: () => {
      toast.success('Anotação atualizada!')
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      closeNoteModal()
    },
    onError: () => {
      toast.error('Erro ao atualizar anotação')
    }
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => {
      toast.success('Anotação removida!')
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
    onError: () => {
      toast.error('Erro ao remover anotação')
    }
  })

  const openCreateGoalModal = () => {
    setGoalForm(initialGoalForm)
    setIsEditingGoal(false)
    setIsGoalModalOpen(true)
  }

  const openEditGoalModal = (goal: any) => {
    setGoalForm({
      id: goal.id,
      title: goal.title || '',
      description: goal.description || '',
      status: goal.status || 'pending',
      priority: goal.priority || 'medium'
    })
    setIsEditingGoal(true)
    setIsGoalModalOpen(true)
  }

  const closeGoalModal = () => {
    setIsGoalModalOpen(false)
    setGoalForm(initialGoalForm)
    setIsEditingGoal(false)
  }

  const openCreateNoteModal = () => {
    setNoteForm(initialNoteForm)
    setIsEditingNote(false)
    setIsNoteModalOpen(true)
  }

  const openEditNoteModal = (note: any) => {
    setNoteForm({
      id: note.id,
      title: note.title || '',
      content: note.content || ''
    })
    setIsEditingNote(true)
    setIsNoteModalOpen(true)
  }

  const closeNoteModal = () => {
    setIsNoteModalOpen(false)
    setNoteForm(initialNoteForm)
    setIsEditingNote(false)
  }

  const toggleGoalExpand = (id: number) => {
    setExpandedGoalId((prev) => (prev === id ? null : id))
  }

  const handleSubmitGoal = () => {
    if (!goalForm.title) {
      toast.error('Informe um título para a meta')
      return
    }

    if (isEditingGoal && goalForm.id) {
      const { id, ...data } = goalForm
      updateGoalMutation.mutate({ id, data })
    } else {
      createGoalMutation.mutate(goalForm)
    }
  }

  const handleSubmitNote = () => {
    if (!noteForm.title) {
      toast.error('Informe um título para a anotação')
      return
    }

    if (isEditingNote && noteForm.id) {
      const { id, ...data } = noteForm
      updateNoteMutation.mutate({ id, data })
    } else {
      createNoteMutation.mutate(noteForm)
    }
  }

  const groupedGoals = useMemo(() => {
    const goals = Array.isArray(goalsQuery.data) ? goalsQuery.data : []
    return {
      pending: goals.filter((goal: any) => goal.status === 'pending'),
      in_progress: goals.filter((goal: any) => goal.status === 'in_progress'),
      abandoned: goals.filter((goal: any) => goal.status === 'abandoned'),
      completed: goals.filter((goal: any) => goal.status === 'completed')
    }
  }, [goalsQuery.data])

  const notesList = useMemo(() => (Array.isArray(notesQuery.data) ? notesQuery.data : []), [notesQuery.data])

  const statusLabels: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    pending: { label: 'Metas', color: 'border-blue-400/60', icon: <Clock className="w-5 h-5 text-blue-300" /> },
    in_progress: { label: 'Em Processo', color: 'border-purple-400/60', icon: <Rocket className="w-5 h-5 text-purple-300" /> },
    abandoned: { label: 'Desistido', color: 'border-yellow-400/60', icon: <PauseCircle className="w-5 h-5 text-yellow-300" /> },
    completed: { label: 'Finalizados', color: 'border-green-400/60', icon: <CheckCircle className="w-5 h-5 text-green-300" /> }
  }

  const priorityLabel: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden border border-white/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Metas de Melhorias</h1>
            </div>
            <p className="text-blue-100 text-lg">Organize seus objetivos e acompanhe o progresso em um único lugar.</p>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-4 justify-between items-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateGoalModal}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Meta
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateNoteModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg"
          >
            <StickyNote className="w-5 h-5" />
            Nova Anotação
          </motion.button>
        </div>

        {/* Goals Columns */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(groupedGoals) as Array<keyof typeof groupedGoals>).map((statusKey) => {
            const goals = groupedGoals[statusKey]
            const meta = statusLabels[statusKey]

            return (
              <motion.div
                key={statusKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border ${meta.color} p-4 flex flex-col min-h-[360px]`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white">
                    {meta.icon}
                    <h2 className="text-lg font-semibold">{meta.label}</h2>
                  </div>
                  <span className="text-sm text-white/70 bg-white/10 rounded-full px-3 py-1">{goals.length}</span>
                </div>

                <div className="space-y-3 flex-1 overflow-auto pr-1">
                  {goalsQuery.isError ? (
                    <p className="text-red-300 text-sm">Erro ao carregar metas.</p>
                  ) : goalsQuery.isLoading ? (
                    <p className="text-white/50 text-sm">Carregando...</p>
                  ) : goals.length === 0 ? (
                    <p className="text-white/40 text-sm">Nenhuma meta nesta coluna.</p>
                  ) : (
                    goals.map((goal: any) => {
                      const isExpanded = expandedGoalId === goal.id
                      const hasDescription = Boolean(goal.description)
                      const description = !goal.description
                        ? null
                        : isExpanded || goal.description.length <= 160
                        ? goal.description
                        : `${goal.description.slice(0, 160)}...`

                      return (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => toggleGoalExpand(goal.id)}
                          className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:border-white/20 ${
                            isExpanded ? 'bg-white/10 border-purple-400/40 shadow-lg shadow-purple-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-white font-semibold text-base">{goal.title}</h3>
                              {hasDescription && (
                                <p className="text-white/60 text-sm mt-2 leading-relaxed">
                                  {description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                goal.priority === 'high'
                                  ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                                  : goal.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                                  : 'bg-green-500/20 text-green-300 border border-green-400/40'
                              }`}
                            >
                              Prioridade {priorityLabel[goal.priority || 'medium']}
                            </span>
                          </div>

                          {isExpanded && (
                            <>
                              <div className="flex flex-wrap items-center justify-between text-xs text-white/50 mt-4 gap-2">
                                <span>Criado em {new Date(goal.created_at).toLocaleDateString('pt-BR')}</span>
                                {goal.completed_at && <span>Finalizado em {new Date(goal.completed_at).toLocaleDateString('pt-BR')}</span>}
                              </div>

                              <div className="flex items-center gap-2 mt-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditGoalModal(goal)
                                  }}
                                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 text-xs rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteGoalMutation.mutate(goal.id)
                                  }}
                                  className="inline-flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 text-xs rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                {(['pending', 'in_progress', 'abandoned', 'completed'] as const)
                                  .filter((status) => status !== goal.status)
                                  .map((status) => (
                                    <button
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateGoalMutation.mutate({ id: goal.id, data: { status } })
                                      }}
                                      className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/15 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                      Mover para {statusLabels[status].label}
                                    </button>
                                  ))}
                              </div>
                            </>
                          )}

                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleGoalExpand(goal.id)
                              }}
                              className="text-xs text-purple-200 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1 rounded-full transition-colors"
                            >
                              {isExpanded ? 'Ver menos' : 'Ver mais'}
                            </button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Notes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StickyNote className="w-6 h-6 text-yellow-300" />
              <h2 className="text-2xl font-semibold text-white">Anotações</h2>
            </div>
            <span className="text-sm text-white/60">{notesQuery.data?.length || 0} anotação(ões)</span>
          </div>

          {notesQuery.isError ? (
            <div className="text-center py-12 text-red-300">Erro ao carregar anotações.</div>
          ) : notesQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-white/30 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notesList.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              Nenhuma anotação cadastrada ainda.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {notesList.map((note: any) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{note.title}</h3>
                      {note.content && <p className="text-white/60 text-sm mt-2 whitespace-pre-line">{note.content}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditNoteModal(note)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Editar anotação"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
                        title="Excluir anotação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-white/40">
                    Atualizado em {new Date(note.updated_at || note.created_at).toLocaleString('pt-BR')}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {isEditingGoal ? 'Editar Meta' : 'Nova Meta'}
                </h3>
                <button onClick={closeGoalModal} className="text-white/50 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/70 block mb-2">Título</label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                    placeholder="Ex: Automatizar listas via WhatsApp"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 block mb-2">Descrição</label>
                  <textarea
                    value={goalForm.description}
                    onChange={(e) => setGoalForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 min-h-[120px]"
                    placeholder="Detalhe o objetivo, próximos passos, responsáveis..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/70 block mb-2">Status</label>
                    <select
                      value={goalForm.status}
                      onChange={(e) => setGoalForm((prev) => ({ ...prev, status: e.target.value as GoalFormState['status'] }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="pending">Meta</option>
                      <option value="in_progress">Em Processo</option>
                      <option value="abandoned">Desistido</option>
                      <option value="completed">Finalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-white/70 block mb-2">Prioridade</label>
                    <select
                      value={goalForm.priority}
                      onChange={(e) => setGoalForm((prev) => ({ ...prev, priority: e.target.value as GoalFormState['priority'] }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeGoalModal}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitGoal}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg"
                  disabled={createGoalMutation.isLoading || updateGoalMutation.isLoading}
                >
                  {createGoalMutation.isLoading || updateGoalMutation.isLoading ? 'Salvando...' : 'Salvar Meta'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Modal */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {isEditingNote ? 'Editar Anotação' : 'Nova Anotação'}
                </h3>
                <button onClick={closeNoteModal} className="text-white/50 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/70 block mb-2">Título</label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
                    placeholder="Resumo da anotação"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 block mb-2">Conteúdo</label>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 min-h-[160px]"
                    placeholder="Detalhes, ideias, lembretes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeNoteModal}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitNote}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
                  disabled={createNoteMutation.isLoading || updateNoteMutation.isLoading}
                >
                  {createNoteMutation.isLoading || updateNoteMutation.isLoading ? 'Salvando...' : 'Salvar Anotação'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

