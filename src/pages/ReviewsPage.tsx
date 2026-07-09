import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Star,
  Clock,
  User,
  X,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supplierReviewsApi } from '@/lib/api'
import { SupplierAvatar } from '@/components/ui/SupplierAvatar'

type PendingReview = {
  id?: number | null
  supplier_id: number
  supplier_name: string
  supplier_photo_url?: string | null
  supplier_store_address?: string | null
  contacted_at?: string | null
}

function formatContactDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StarsRow({
  value,
  onChange,
  size = 'md',
}: {
  value: number
  onChange?: (n: number) => void
  size?: 'sm' | 'md'
}) {
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7'
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const Comp = onChange ? 'button' : 'span'
        return (
          <Comp
            key={n}
            type={onChange ? 'button' : undefined}
            onClick={onChange ? () => onChange(n) : undefined}
            className={onChange ? 'rounded p-0.5 transition-transform hover:scale-110' : undefined}
            aria-label={onChange ? `${n} estrela${n > 1 ? 's' : ''}` : undefined}
          >
            <Star
              className={`${cls} ${filled ? 'fill-emerald-500 text-emerald-500' : 'text-gray-300 dark:text-white/25'}`}
            />
          </Comp>
        )
      })}
    </div>
  )
}

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [showMine, setShowMine] = useState(false)
  const [reviewModal, setReviewModal] = useState<PendingReview | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const pendingQuery = useQuery({
    queryKey: ['supplier-reviews', 'pending'],
    queryFn: async () => {
      const res = await supplierReviewsApi.getPending()
      return (res?.reviews || res?.data?.reviews || []) as PendingReview[]
    },
  })

  const mineQuery = useQuery({
    queryKey: ['supplier-reviews', 'mine'],
    queryFn: async () => {
      const res = await supplierReviewsApi.getMine()
      return (res?.reviews || res?.data?.reviews || []) as any[]
    },
    enabled: showMine,
  })

  const submitMutation = useMutation({
    mutationFn: ({
      supplier_id,
      rating,
      comment,
    }: {
      supplier_id: number
      rating: number
      comment?: string
    }) => supplierReviewsApi.submit({ supplier_id, rating, comment }),
    onSuccess: () => {
      toast.success('Avaliação enviada!')
      setReviewModal(null)
      setComment('')
      setRating(5)
      queryClient.invalidateQueries({ queryKey: ['supplier-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao enviar avaliação')
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (supplierId: number) => supplierReviewsApi.dismiss(supplierId),
    onSuccess: () => {
      toast.success('Avaliação dispensada')
      queryClient.invalidateQueries({ queryKey: ['supplier-reviews', 'pending'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao dispensar')
    },
  })

  const pending = pendingQuery.data || []

  const openReview = (item: PendingReview) => {
    setReviewModal(item)
    setRating(5)
    setComment('')
  }

  return (
    <div className="mx-auto max-w-6xl px-1 py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Avaliações</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Avalie fornecedores após o contato e veja a reputação da comunidade
        </p>
      </div>

      {/* Top avaliados — oculto até coletar ~20 avaliações */}
      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fornecedores mais bem avaliados</h2>
            <p className="text-sm text-gray-500 dark:text-white/55">Ranking com base nas avaliações da comunidade</p>
          </div>
          <button
            type="button"
            onClick={() => setShowMine((v) => !v)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-white/10"
          >
            <User className="h-4 w-4" />
            {showMine ? 'Ver ranking' : 'Avaliações enviadas'}
          </button>
        </div>

        {showMine ? (
          <div className="space-y-3">
            {mineQuery.isLoading && (
              <div className="flex justify-center py-10 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!mineQuery.isLoading && (mineQuery.data || []).length === 0 && (
              <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-white/10">
                Você ainda não enviou avaliações.
              </p>
            )}
            {(mineQuery.data || []).map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <SupplierAvatar name={r.supplier_name} photoUrl={r.supplier_photo_url} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{r.supplier_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarsRow value={Number(r.rating || 0)} size="sm" />
                    <span className="text-xs text-gray-400">{formatContactDate(r.submitted_at)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-gray-600 dark:text-white/65">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 px-5 py-10 text-center dark:border-amber-500/25 dark:bg-amber-500/10">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
              <Star className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">Ranking em breve</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-white/70">
              Vamos coletar primeiro umas <span className="font-semibold text-amber-700 dark:text-amber-300">20 avaliações</span> da comunidade para montar o ranking dos fornecedores mais bem avaliados.
            </p>
            <p className="mt-3 text-xs text-gray-500 dark:text-white/50">
              Enquanto isso, use a seção de pendentes abaixo para avaliar.
            </p>
          </div>
        )}
      </section>

      {/* Pendentes */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Avaliações pendentes</h2>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
            {pending.length}
          </span>
        </div>

        {pendingQuery.isLoading ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-white/10">
            Você já avaliou (ou dispensou) todos os fornecedores ativos.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((item) => (
              <div
                key={item.supplier_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SupplierAvatar name={item.supplier_name} photoUrl={item.supplier_photo_url} />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900 dark:text-white">{item.supplier_name}</p>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      {item.contacted_at
                        ? `Contato em ${formatContactDate(item.contacted_at)}`
                        : 'Ainda não avaliado'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => openReview(item)}
                    className="rounded-xl bg-orange-500 px-3.5 py-2 text-sm font-bold text-white hover:bg-orange-600"
                  >
                    Avaliar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Não quer avaliar este fornecedor?')) {
                        dismissMutation.mutate(item.supplier_id)
                      }
                    }}
                    className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
                  >
                    Não quero avaliar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal avaliar */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SupplierAvatar name={reviewModal.supplier_name} photoUrl={reviewModal.supplier_photo_url} size="lg" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Avaliar fornecedor</h3>
                  <p className="text-sm text-gray-500 dark:text-white/60">{reviewModal.supplier_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-white/80">Sua nota</p>
              <StarsRow value={rating} onChange={setRating} />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/80">
                Comentário (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Como foi o atendimento / produto?"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitMutation.isPending}
                onClick={() =>
                  submitMutation.mutate({
                    supplier_id: reviewModal.supplier_id,
                    rating,
                    comment: comment.trim() || undefined,
                  })
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
