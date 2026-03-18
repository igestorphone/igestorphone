import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

const REQUIRED_PROFILE_VERSION = 1

function onlyDigits(v: string) {
  return (v || '').replace(/\D/g, '')
}

export default function RequiredProfileModal() {
  const { user, updateUser } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = (user?.tipo || '').toString().toLowerCase() === 'admin'
  const needsProfile =
    !!user &&
    !isAdmin &&
    Number((user as any).profile_completion_version || 0) < REQUIRED_PROFILE_VERSION

  const initial = useMemo(
    () => ({
      name: (user?.name || (user as any)?.nome || '').toString(),
      telefone: (user as any)?.telefone?.toString() || '',
      endereco: (user as any)?.endereco?.toString() || '',
      cpf: (user as any)?.cpf?.toString() || '',
      last_payment_amount: (user as any)?.last_payment_amount?.toString() || '',
      last_payment_date: (user as any)?.last_payment_date?.toString()?.slice(0, 10) || '',
      plan_label: (user as any)?.plan_label?.toString() || '',
      closed_with: (user as any)?.closed_with?.toString() || '',
    }),
    [user]
  )

  const [form, setForm] = useState(initial)

  useEffect(() => setForm(initial), [initial])

  useEffect(() => {
    if (!needsProfile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [needsProfile])

  if (!needsProfile) return null

  const submit = async () => {
    const cpfDigits = onlyDigits(form.cpf)
    if (!form.name.trim()) return toast.error('Informe seu nome completo.')
    if (onlyDigits(form.telefone).length < 8) return toast.error('Informe seu telefone.')
    if (!form.endereco.trim()) return toast.error('Informe seu endereço.')
    if (cpfDigits.length !== 11) return toast.error('CPF inválido (11 dígitos).')
    const amount = Number(String(form.last_payment_amount).replace(',', '.'))
    if (!Number.isFinite(amount) || amount < 0) return toast.error('Informe o último valor pago.')
    if (!form.last_payment_date) return toast.error('Informe a data do último pagamento.')
    if (!form.plan_label.trim()) return toast.error('Informe o plano.')
    if (!form.closed_with.trim()) return toast.error('Informe com quem fechou.')

    setIsSaving(true)
    try {
      const res = await api.put('/users/profile/recadastro', {
        name: form.name.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim(),
        cpf: cpfDigits,
        last_payment_amount: amount,
        last_payment_date: form.last_payment_date,
        plan_label: form.plan_label.trim(),
        closed_with: form.closed_with.trim(),
      })
      // Atualizar o usuário no store na hora para o modal sumir (não depender de refreshUser)
      const updated = res?.data?.user
      if (updated) {
        updateUser({
          ...updated,
          tipo: (updated.tipo || (updated as any).role || 'user') as any,
        })
      } else {
        updateUser({ profile_completion_version: REQUIRED_PROFILE_VERSION })
      }
      toast.success('Dados atualizados com sucesso!')
    } catch (e: any) {
      const data = e?.response?.data
      const msg =
        data?.message ||
        (Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors.map((x: { msg?: string }) => x.msg).filter(Boolean).join('. ')
          : null) ||
        'Não foi possível salvar. Verifique os campos e tente novamente.'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl">
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atualização obrigatória de cadastro</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Para continuar usando o sistema, preencha os dados abaixo. Não é possível fechar esta tela sem concluir.
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Nome completo</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Seu nome completo"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Telefone</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">CPF</label>
            <input
              value={form.cpf}
              onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Endereço</label>
            <input
              value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Último valor pago (R$)</label>
            <input
              value={form.last_payment_amount}
              onChange={(e) => setForm((p) => ({ ...p, last_payment_amount: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Ex: 59,90"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Data do último pagamento</label>
            <input
              type="date"
              value={form.last_payment_date}
              onChange={(e) => setForm((p) => ({ ...p, last_payment_date: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Qual plano</label>
            <input
              value={form.plan_label}
              onChange={(e) => setForm((p) => ({ ...p, plan_label: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Ex: Mensal, Trimestral, Anual, Basic..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-1">Com quem fechou</label>
            <input
              value={form.closed_with}
              onChange={(e) => setForm((p) => ({ ...p, closed_with: e.target.value }))}
              className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white"
              placeholder="Nome / canal"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
          >
            {isSaving ? 'Salvando…' : 'Salvar e continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}

