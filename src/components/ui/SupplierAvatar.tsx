/** Avatar circular do fornecedor (foto ou iniciais). */
export function SupplierAvatar({
  name,
  photoUrl,
  size = 'md',
  className = '',
}: {
  name?: string | null
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeCls = size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-10 w-10 text-xs'
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Fornecedor'}
        className={`${sizeCls} shrink-0 rounded-full object-cover border border-gray-200 dark:border-white/15 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeCls} shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white font-bold flex items-center justify-center ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  )
}

/** Badge ★ 5.0 verde (só se houver avaliações). */
export function SupplierRatingBadge({
  avg,
  count,
  className = '',
}: {
  avg?: number | string | null
  count?: number | string | null
  className?: string
}) {
  const n = Number(count || 0)
  if (!n) return null
  const rating = Number(avg || 0).toFixed(1)
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white ${className}`}
      title={`${n} avaliação(ões)`}
    >
      ★ {rating}
    </span>
  )
}
