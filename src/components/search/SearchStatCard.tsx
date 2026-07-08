import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type SearchStatCardProps = {
  label: string
  value: ReactNode
  icon: LucideIcon
  iconWrapClass?: string
  iconClass?: string
  valueClass?: string
  trailing?: ReactNode
  className?: string
}

export default function SearchStatCard({
  label,
  value,
  icon: Icon,
  iconWrapClass = 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  iconClass = 'text-slate-600 dark:text-slate-300',
  valueClass = 'text-slate-900 dark:text-white',
  trailing,
  className = '',
}: SearchStatCardProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white p-2.5 dark:border-white/10 dark:bg-zinc-950 sm:gap-3 sm:p-3 xl:min-h-[72px] ${className}`}
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconWrapClass}`}
      >
        <Icon className={`h-[18px] w-[18px] sm:h-5 sm:w-5 ${iconClass}`} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium text-gray-500 dark:text-white/50 sm:text-[11px]">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <p className={`truncate text-base font-bold leading-none sm:text-lg xl:text-xl ${valueClass}`}>
            {value}
          </p>
          {trailing}
        </div>
      </div>
    </div>
  )
}
