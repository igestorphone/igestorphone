import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import SearchStatCard from '@/components/search/SearchStatCard'

type UsdBrl = { bid: string; pctChange: string }

async function fetchUsdBrl(): Promise<UsdBrl> {
  const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL')
  if (!res.ok) throw new Error('Falha ao buscar cotação')
  const data = await res.json()
  return data?.USDBRL as UsdBrl
}

export default function DollarStatCard({ className = '' }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ['usd-brl'],
    queryFn: fetchUsdBrl,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const bid = data ? Number(data.bid) : null
  const pct = data ? Number(data.pctChange) : null
  const up = (pct ?? 0) >= 0

  return (
    <SearchStatCard
      className={className}
      label="Dólar"
      icon={DollarSign}
      iconWrapClass="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      iconClass="text-amber-700 dark:text-amber-300"
      value={bid != null ? `R$ ${bid.toFixed(4).replace('.', ',')}` : '—'}
      trailing={
        pct != null ? (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold sm:text-[11px] ${
              up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {`${pct.toFixed(2).replace('.', ',')}%`}
          </span>
        ) : null
      }
    />
  )
}
