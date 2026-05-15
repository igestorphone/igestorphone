import { resolveProductSwatch } from '@/lib/productColorSwatch'

type Props = {
  /** Cor bruta da API */
  rawColor?: string | null
  /** Nome já normalizado (ex.: normalizeColor) */
  normalizedLabel?: string | null
  categoryCode?: string | null
  isAccessory?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** @deprecated use rawColor + normalizedLabel */
  label?: string | null
}

export default function ProductColorSwatch({
  rawColor,
  normalizedLabel,
  categoryCode,
  isAccessory = false,
  size = 'md',
  className = '',
  label,
}: Props) {
  const { hex, title } = resolveProductSwatch({
    rawColor: rawColor ?? label,
    normalizedLabel: normalizedLabel ?? label,
    categoryCode,
    isAccessory,
  })

  const dim =
    size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  const needsRing =
    hex === '#f5f5f7' || hex === '#f5f0e8' || hex === '#e8e6e3' || hex === '#f2f2f7'

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      title={title}
    >
      <span
        className={`${dim} shrink-0 rounded-full border shadow-sm ${
          needsRing
            ? 'border-gray-300 dark:border-white/30'
            : 'border-black/15 dark:border-white/20'
        }`}
        style={{ backgroundColor: hex }}
        role="img"
        aria-label={title}
      />
    </span>
  )
}
